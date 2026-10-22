import { getSession } from "@/lib/auth";
import { startQuizSession } from "@/lib/db";
import { NextResponse } from "next/server";
import { practiceQuestionResponse } from "@/lib/practice-question-response";
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
  limit: z.number().int().min(1).max(500).optional(),
  bookId: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  search: z.string().trim().max(200).optional(),
  allAvailable: z.boolean().optional(),
  retrySessionId: z.string().min(1).max(200).optional(),
  retryIncorrect: z.boolean().optional(),
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
    const {
      subjectId,
      chapterId,
      testId,
      mode,
      sourceFilter,
      limit,
      bookId,
      search,
      allAvailable,
      retrySessionId,
      retryIncorrect,
    } = parsed.data;

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
      bookId,
      search,
      allAvailable,
      retrySessionId,
      retryIncorrect,
    });

    const isExamMode = mode === "timed";
    const sanitizedQuestions = questions.map((q) => practiceQuestionResponse(q));

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
