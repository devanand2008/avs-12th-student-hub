import { getSession } from "@/lib/auth";
import { getStudentByUserId } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const student =
    session.role === "student"
      ? await getStudentByUserId(session.userId)
      : null;

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      role: session.role,
      email: session.email,
      studentId: student?.studentId || session.studentId,
      studentName: student?.studentName || session.studentName,
      stream: student?.stream || session.stream,
      schoolName: student?.schoolName,
      registerNumber: student?.registerNumber,
      medium: student?.medium,
      academicYear: student?.academicYear,
      mustChangePassword: session.mustChangePassword,
      canSetInitialPassword:
        session.role === "student" &&
        session.mustChangePassword &&
        (session.initialPasswordSetupUntil || 0) > Date.now(),
    },
  });
}
