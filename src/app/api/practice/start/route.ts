import { getSession } from "@/lib/auth";
import { startQuizSession } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
const input = z.object({
  subjectId: z.string().min(1),
  chapterId: z.string().optional(),
  testId: z.string().optional(),
  mode: z
    .enum([
      "quick",
      "chapter",
      "book",
      "weak",
      "timed",
      "random",
      "daily10",
      "daily25",
      "revision",
    ])
    .default("quick"),
  sourceFilter: z.enum(["All", "Book-In", "Book-Out"]).default("All"),
  limit: z.number().int().min(1).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    const studentId = session.studentId || session.userId;

    const body = await request.json();
    const parsed = input.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Choose a valid subject, practice mode, and question count." },
        { status: 400 },
      );
    const { subjectId, chapterId, testId, mode, sourceFilter, limit } =
      parsed.data;

    if (!subjectId) {
      return NextResponse.json(
        { error: "subjectId is required" },
        { status: 400 },
      );
    }

    const { session: quizSession, questions } = await startQuizSession({
      studentId,
      subjectId,
      chapterId,
      testId,
      mode,
      sourceFilter,
      limit,
    });

    // In timed test or exam mode, we do NOT send the correct answers to the client ahead of time!
    // In practice mode, we can include explanations after each selection or on request.
    const isExamMode = mode === "timed";
    const sanitizedQuestions = questions.map((q) => ({
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
      // For practice mode, send correct answer and explanation for instant feedback
      ...(isExamMode
        ? {}
        : {
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            explanationTamil: q.explanationTamil,
          }),
    }));

    return NextResponse.json({
      session: quizSession,
      questions: sanitizedQuestions,
      isExamMode,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : undefined) ||
          "Failed to start quiz session",
      },
      { status: 500 },
    );
  }
}
