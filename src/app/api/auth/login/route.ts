import { authenticateUser, createSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { BackendUnavailableError } from "@/lib/supabase/server";
import { phoneLoginPath } from "@/lib/auth/phone";
import {
  requiresStudentActivation,
  studentActivationMode,
} from "@/lib/auth/activation";
import { loginMessages, safeLoginRedirect } from "@/lib/auth/login-form";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = request.headers
    .get("content-type")
    ?.startsWith("application/x-www-form-urlencoded");
  let redirect: string | undefined;
  const headers = { "Cache-Control": "no-store" };
  const go = (path: string) =>
    new NextResponse(null, {
      status: 303,
      headers: { ...headers, Location: path },
    });
  const fail = (
    reason: keyof typeof loginMessages,
    status: number,
    code?: string,
  ) => {
    if (!form)
      return NextResponse.json(
        { error: loginMessages[reason], ...(code ? { code } : {}) },
        { status, headers },
      );
    const params = new URLSearchParams({ error: reason });
    if (redirect) params.set("redirect", redirect);
    return go("/login?" + params);
  };

  try {
    const ip = request.headers.get("x-forwarded-for") || "local";
    const rl = await checkRateLimit(`login_${ip}`, 20, 60);
    if (!rl.success) return fail("limited", 429);

    const body = form
      ? Object.fromEntries(await request.formData())
      : await request.json();
    redirect = safeLoginRedirect(body.redirect);
    const loginId = typeof body.loginId === "string" ? body.loginId.trim() : "";
    const { password } = body;
    if (
      !loginId ||
      loginId.length > 254 ||
      typeof password !== "string" ||
      !password ||
      Buffer.byteLength(password, "utf8") > 72
    )
      return fail("required", 400);

    const authResult = await authenticateUser(loginId, password);
    if (!authResult.success || !authResult.user) {
      const reason =
        authResult.error === loginMessages.inactive
          ? "inactive"
          : authResult.error === loginMessages.profile
            ? "profile"
            : "invalid";
      return fail(reason, 401);
    }

    if (authResult.student && requiresStudentActivation(authResult.student)) {
      if (studentActivationMode() === "admin")
        return fail("approval", 403, "ADMIN_APPROVAL_REQUIRED");
      const redirectTo = phoneLoginPath(authResult.student.studentPhone);
      if (form) return go(redirectTo);
      return NextResponse.json(
        {
          error: "Verify your mobile number once before your first login.",
          code: "PHONE_VERIFICATION_REQUIRED",
          redirectTo,
        },
        { status: 403, headers },
      );
    }
    const session = await createSession(authResult.user, authResult.student);

    const destination = session.mustChangePassword
      ? "/change-password"
      : authResult.user.role === "admin"
        ? "/admin"
        : "/dashboard";
    if (form)
      return go(
        session.mustChangePassword ? destination : redirect || destination,
      );

    return NextResponse.json(
      {
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
        redirectTo: destination,
      },
      { headers },
    );
  } catch (error) {
    return fail(
      "unavailable",
      error instanceof BackendUnavailableError ? 503 : 500,
    );
  }
}
