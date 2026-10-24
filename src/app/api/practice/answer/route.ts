import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getQuizQuestions, getQuizSessionById, saveQuizAnswer } from "@/lib/db";
import { isTextPracticeQuestion } from "@/lib/practice-question-text";

const input = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  answer: z.enum(["A", "B", "C", "D"]).optional(),
  selectedAnswer: z.enum(["A", "B", "C", "D"]).nullable().optional(),
  timeSpentSeconds: z.number().min(0).default(0),
  markedForReview: z.boolean().default(false),
}).refine((body) => body.answer !== undefined || body.selectedAnswer !== undefined, {
  message: "Choose an answer or explicitly clear the saved answer.",
});

/** Preserve the existing individual-save API; explicit practice submission also returns feedback. */
export async function POST(request: Request) {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    const parsed = input.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Choose a valid answer." }, { status: 400 });
    const { sessionId, questionId, timeSpentSeconds, markedForReview } = parsed.data;
    const wantsFeedback = parsed.data.answer !== undefined;
    const selectedAnswer = wantsFeedback ? parsed.data.answer! : parsed.data.selectedAnswer!;
    const quiz = await getQuizSessionById(sessionId);
    if (!quiz || quiz.studentId !== (user.studentId || user.userId))
      return NextResponse.json({ error: "Practice question not found." }, { status: 404 });
    if (!quiz.questionIds.includes(questionId))
      return NextResponse.json({ error: "Invalid question or answer." }, { status: 400 });
    if ((wantsFeedback && quiz.mode === "timed") || quiz.isCompleted || (quiz.expiresAt && Date.now() >= Date.parse(quiz.expiresAt)))
      return NextResponse.json({ error: "Individual feedback is unavailable for this session." }, { status: wantsFeedback ? 409 : 404 });
    const question = wantsFeedback ? (await getQuizQuestions(quiz.id)).find((q) => q?.id === questionId) : undefined;
    if (wantsFeedback && (!question || !isTextPracticeQuestion(question) || !/^[ABCD]$/.test(question.correctAnswer)))
      return NextResponse.json({ error: "This question has no valid scoring answer." }, { status: 409 });
    const updated = await saveQuizAnswer(sessionId, questionId, selectedAnswer, timeSpentSeconds, markedForReview);
    if (!updated)
      return NextResponse.json({ error: "Session not found or already completed." }, { status: 404 });
    const saved = updated.answers[questionId];
    return NextResponse.json({
      success: true,
      savedAnswer: quiz.mode === "timed"
        ? { questionId: saved.questionId, selectedAnswer: saved.selectedAnswer, markedForReview: saved.markedForReview }
        : saved,
      ...(question ? {
        questionId,
        selectedAnswer: saved.selectedAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        explanationTamil: question.explanationTamil,
        sourceAnswerPage: question.sourceAnswerPage,
        isCorrect: saved.isCorrect,
      } : {}),
    });
  } catch {
    return NextResponse.json({ error: "Could not check the answer. Please retry." }, { status: 503 });
  }
}
