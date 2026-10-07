import { getSession } from "@/lib/auth";
import { getStudentProgress, getStudentQuizHistory } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const studentId = session.studentId || session.userId;

  const progress = await getStudentProgress(studentId);
  const history = await getStudentQuizHistory(studentId);

  return NextResponse.json({
    progress,
    recentSessions: history.slice(0, 10),
  });
}
