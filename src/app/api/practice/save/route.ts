import { getSession } from "@/lib/auth";
import { getQuizSessionById, saveQuizAnswers } from "@/lib/db";
import { savedAnswers } from "@/lib/practice";
import { NextResponse } from "next/server";
import { z } from "zod";
const input = z.object({ sessionId: z.string().min(1), answers: savedAnswers });
export async function PUT(request: Request) {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    const parsed = input.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid practice answers." },
        { status: 400 },
      );
    const quiz = await getQuizSessionById(parsed.data.sessionId);
    if (!quiz || quiz.studentId !== (user.studentId || user.userId))
      return NextResponse.json(
        { error: "Practice session not found." },
        { status: 404 },
      );
    const saved = await saveQuizAnswers(quiz.id, parsed.data.answers);
    if (!saved)
      return NextResponse.json(
        {
          error:
            "Answers cannot be saved after submission or the test deadline.",
        },
        { status: 409 },
      );
    return NextResponse.json({ saved: true, sessionId: quiz.id });
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not save answers. Your local draft is retained; please retry.",
      },
      { status: 503 },
    );
  }
}
