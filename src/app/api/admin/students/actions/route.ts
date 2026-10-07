import { getSession } from "@/lib/auth";
import {
  approveStudent,
  resetStudentPassword,
  toggleStudentActive,
} from "@/lib/db";
import { studentActivationMode } from "@/lib/auth/activation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  }

  try {
    const { studentId, action } = await request.json();
    if (typeof studentId !== "string" || !studentId || studentId.length > 100) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 },
      );
    }

    if (action === "approve") {
      if (studentActivationMode() !== "admin")
        return NextResponse.json(
          {
            error:
              "Administrator approval is not the configured activation method.",
          },
          { status: 409 },
        );
      const result = await approveStudent(studentId, session.userId);
      if (!result)
        return NextResponse.json(
          {
            error:
              "Student is already approved, inactive or unavailable. Refresh the directory.",
          },
          { status: 409 },
        );
      return NextResponse.json(
        {
          success: true,
          temporaryPassword: result.temporaryPassword,
          message:
            "Student approved. Share the temporary password privately; a password change is required at first sign-in.",
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    if (action === "toggle-status") {
      const ok = await toggleStudentActive(studentId, session.userId);
      if (!ok)
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 },
        );
      return NextResponse.json({
        success: true,
        message: "Student account status updated.",
      });
    }

    if (action === "reset-password") {
      const newPassword = await resetStudentPassword(studentId, session.userId);
      if (!newPassword)
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 },
        );
      return NextResponse.json({
        success: true,
        temporaryPassword: newPassword,
        message:
          "Student password reset. Student must change password on next login.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : undefined) ||
          "Action failed",
      },
      { status: 500 },
    );
  }
}
