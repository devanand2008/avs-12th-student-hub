import { getSession } from "@/lib/auth";
import { getQuizQuestions, getQuizSessionById } from "@/lib/db";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const quiz = await getQuizSessionById(
    new URL(request.url).searchParams.get("id") || "",
  );
  if (!quiz || quiz.studentId !== (user.studentId || user.userId))
    return NextResponse.json(
      { error: "Practice session not found." },
      { status: 404 },
    );
  const questions = await getQuizQuestions(quiz.id);
  const safe = questions
    .filter((q) => q !== null)
    .map((q) => {
      if (quiz.mode !== "timed" || quiz.isCompleted) return q;
      return {
        id: q.id,
        chapterId: q.chapterId,
        questionText: q.questionText,
        questionTextTamil: q.questionTextTamil,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        difficulty: q.difficulty,
        sourceType: q.sourceType,
      };
    });
  const answers = Object.fromEntries(
    Object.entries(quiz.answers).map(([id, answer]) => [
      id,
      {
        selectedAnswer: answer.selectedAnswer,
        markedForReview: answer.markedForReview,
      },
    ]),
  );
  return NextResponse.json({ session: { ...quiz, answers }, questions: safe });
}
