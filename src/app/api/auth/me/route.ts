import { getSessionContext } from "@/lib/auth";
import { after, NextResponse } from "next/server";
import { engagementRpc } from "@/lib/engagement";

export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const { session, student } = context;
  if (student) {
    // Optional last-seen bookkeeping must not delay the authenticated UI.
    after(async () => {
      await engagementRpc("avs_touch_engagement", {
        p_user_id: session.userId,
      }).catch(() => undefined);
    });
  }

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
