import { getSession } from "@/lib/auth";
import { getQuizQuestions, getQuizSessionById } from "@/lib/db";
import { NextResponse } from "next/server";
import { isTextPracticeQuestion } from "@/lib/practice-question-text";
import { practiceQuestionResponse } from "@/lib/practice-question-response";
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
  if (
    !quiz.isCompleted &&
    questions.some((q) => !q || !isTextPracticeQuestion(q))
  )
    return NextResponse.json(
      {
        error:
          "This earlier attempt used textbook page images. Start a new attempt to practise with text questions and separate answer choices. Your previous activity is preserved.",
      },
      { status: 409 },
    );
  const safe = questions
    .filter((q) => q !== null)
    .map((q) => {
      return practiceQuestionResponse(q, quiz.isCompleted || (quiz.mode !== "timed" && Boolean(quiz.answers[q.id]?.selectedAnswer)));
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
