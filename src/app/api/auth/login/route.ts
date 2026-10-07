import { authenticateUser, createSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { BackendUnavailableError } from "@/lib/supabase/server";
import { phoneLoginPath } from "@/lib/auth/phone";
import {
  requiresStudentActivation,
  studentActivationMode,
} from "@/lib/auth/activation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local";
    const rl = await checkRateLimit(`login_${ip}`, 20, 60);
    if (!rl.success) {
      return NextResponse.json(
        {
          error:
            "Too many login attempts. Please wait 1 minute before trying again.",
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { loginId, password } = body;

    if (
      typeof loginId !== "string" ||
      typeof password !== "string" ||
      !loginId ||
      !password ||
      loginId.length > 200 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return NextResponse.json(
        { error: "Please enter your Student ID / Email and password." },
        { status: 400 },
      );
    }

    const authResult = await authenticateUser(loginId, password);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Student ID or password is incorrect." },
        { status: 401 },
      );
    }

    if (authResult.student && requiresStudentActivation(authResult.student))
      return NextResponse.json(
        studentActivationMode() === "admin"
          ? {
              error:
                "Your account is waiting for administrator approval. Ask your administrator to approve it and give you a temporary password.",
              code: "ADMIN_APPROVAL_REQUIRED",
            }
          : {
              error: "Verify your mobile number once before your first login.",
              code: "PHONE_VERIFICATION_REQUIRED",
              redirectTo: phoneLoginPath(authResult.student.studentPhone),
            },
        { status: 403 },
      );
    const session = await createSession(authResult.user, authResult.student);

    return NextResponse.json({
      success: true,
      user: {
        id: authResult.user.id,
        role: authResult.user.role,
        email: authResult.user.email,
        studentId: authResult.student?.studentId,
        studentName: authResult.student?.studentName,
        stream: authResult.student?.stream,
        mustChangePassword: session.mustChangePassword,
      },
      redirectTo: session.mustChangePassword
        ? "/change-password"
        : authResult.user.role === "admin"
          ? "/admin"
          : authResult.student?.mustChangePassword
            ? "/change-password"
            : "/dashboard",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : undefined) ||
          "An unexpected authentication error occurred.",
      },
      { status: error instanceof BackendUnavailableError ? 503 : 500 },
    );
  }
}
