import {
  changeUserPassword,
  setInitialStudentPassword,
  createSession,
  getSession,
} from "@/lib/auth";
import { getStudentByUserId, getUserById } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    const { currentPassword, newPassword } = await request.json();
    if (
      session.initialPasswordSetupUntil &&
      session.initialPasswordSetupUntil <= Date.now()
    )
      return NextResponse.json(
        {
          error:
            "Your initial password session expired. Verify your mobile again to continue.",
          code: "INITIAL_SETUP_EXPIRED",
        },
        { status: 400 },
      );
    const initialSetup =
      session.role === "student" &&
      session.mustChangePassword &&
      typeof session.initialPasswordSetupUntil === "number" &&
      session.initialPasswordSetupUntil > Date.now();
    if (
      (!initialSetup &&
        (typeof currentPassword !== "string" || !currentPassword)) ||
      typeof newPassword !== "string" ||
      !newPassword ||
      newPassword.length > 200
    ) {
      return NextResponse.json(
        { error: "Current password and new password are required." },
        { status: 400 },
      );
    }

    const res = initialSetup
      ? await setInitialStudentPassword(session.userId, newPassword)
      : await changeUserPassword(session.userId, currentPassword, newPassword);
    if (!res.success) {
      return NextResponse.json(
        { error: res.error || "Password change failed." },
        { status: 400 },
      );
    }

    const user = await getUserById(session.userId);
    const student = await getStudentByUserId(session.userId);
    if (user) await createSession(user, student || undefined);
    return NextResponse.json({
      success: true,
      redirectTo: user?.role === "admin" ? "/admin" : "/dashboard",
      message:
        "Password changed successfully! You can now use your new password.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : undefined) ||
          "Failed to change password.",
      },
      { status: 500 },
    );
  }
}
