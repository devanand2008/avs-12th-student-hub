import { getSession } from "@/lib/auth";
import {
  getChapterById,
  getQuizQuestions,
  getQuizSessionById,
  submitQuizSession,
  saveQuizAnswers,
} from "@/lib/db";
import { savedAnswers } from "@/lib/practice";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user)
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
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
      body.answers !== undefined &&
      !quiz.isCompleted &&
      (!quiz.expiresAt || Date.now() < Date.parse(quiz.expiresAt))
    ) {
      const parsed = savedAnswers.safeParse(body.answers);
      if (
        !parsed.success ||
        Object.keys(parsed.data).some((id) => !quiz.questionIds.includes(id))
      )
        return NextResponse.json(
          { error: "Invalid practice answers." },
          { status: 400 },
        );
      const saved = await saveQuizAnswers(sessionId, parsed.data);
      if (
        !saved &&
        (!quiz.expiresAt || Date.now() < Date.parse(quiz.expiresAt))
      )
        return NextResponse.json(
          {
            error:
              "Could not save your final answers. Please retry submission.",
          },
          { status: 409 },
        );
    }
    const completedSession = await submitQuizSession(sessionId);
    if (!completedSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Build enriched results with full question review details
    const reviewDetails = [];
    const questions = await getQuizQuestions(sessionId);
    for (const qId of completedSession.questionIds) {
      const ansRecord = completedSession.answers[qId] || {
        selectedAnswer: null,
        isCorrect: false,
      };
      const q = questions.find((q) => q.id === qId);
      if (q) {
        reviewDetails.push({
          questionId: q.id,
          questionText: q.questionText,
          questionTextTamil: q.questionTextTamil,
          options: {
            A: q.optionA,
            B: q.optionB,
            C: q.optionC,
            D: q.optionD,
          },
          selectedAnswer: ansRecord.selectedAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect: ansRecord.isCorrect,
          explanation: q.explanation,
          explanationTamil: q.explanationTamil,
          sourceType: q.sourceType,
          difficulty: q.difficulty,
        });
      }
    }

    const accuracy =
      completedSession.totalQuestions > 0
        ? Math.round(
            (completedSession.correctCount / completedSession.totalQuestions) *
              100,
          )
        : 0;

    let recommendation =
      "Great attempt! Keep practicing to maintain consistency.";
    if (accuracy < 60) {
      const ch = completedSession.chapterId
        ? await getChapterById(completedSession.chapterId)
        : null;
      recommendation = ch
        ? `Revise ${ch.title} — review handwritten notes and textbook Book-In questions.`
        : "Revise fundamental chapter concepts before retrying.";
    } else if (accuracy >= 90) {
      recommendation =
        "Excellent mastery! Try Book-Out high-difficulty questions next.";
    }

    return NextResponse.json({
      success: true,
      session: completedSession,
      accuracy,
      recommendation,
      reviewDetails,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : undefined) ||
          "Failed to submit quiz session",
      },
      { status: 500 },
    );
  }
}
