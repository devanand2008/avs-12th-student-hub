import { getSession } from "@/lib/auth";
import { getQuizSessionById, saveQuizAnswer } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user)
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    const body = await request.json();
    const {
      sessionId,
      questionId,
      selectedAnswer,
      timeSpentSeconds = 0,
      markedForReview = false,
    } = body;

    if (!sessionId || !questionId) {
      return NextResponse.json(
        { error: "sessionId and questionId are required" },
        { status: 400 },
      );
    }
    const quiz = await getQuizSessionById(sessionId);
    if (!quiz || quiz.studentId !== (user.studentId || user.userId))
      return NextResponse.json(
        { error: "Practice session not found" },
        { status: 404 },
      );
    if (
      !quiz.questionIds.includes(questionId) ||
      (selectedAnswer !== null &&
        !["A", "B", "C", "D"].includes(selectedAnswer))
    )
      return NextResponse.json(
        { error: "Invalid question or answer" },
        { status: 400 },
      );

    const updated = await saveQuizAnswer(
      sessionId,
      questionId,
      selectedAnswer,
      timeSpentSeconds,
      markedForReview,
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Session not found or already completed" },
        { status: 404 },
      );
    }

    const answer = updated.answers[questionId];
    return NextResponse.json({
      success: true,
      savedAnswer:
        quiz.mode === "timed"
          ? {
              questionId: answer.questionId,
              selectedAnswer: answer.selectedAnswer,
              markedForReview: answer.markedForReview,
            }
          : answer,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : undefined) ||
          "Failed to save answer",
      },
      { status: 500 },
    );
  }
}
