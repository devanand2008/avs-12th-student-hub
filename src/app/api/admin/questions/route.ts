import { getSession } from "@/lib/auth";
import {
  createQuestion,
  getQuestions,
  updateQuestionStatus,
  getChapterById,
  getSubjectById,
} from "@/lib/db";
import { Question } from "@/types";
import { NextResponse } from "next/server";
import { z } from "zod";
const questionInput = z.object({
  chapterId: z.string().min(1),
  questionText: z.string().trim().min(3).max(3000),
  questionTextTamil: z.string().max(3000).default(""),
  optionA: z.string().trim().min(1).max(1000),
  optionB: z.string().trim().min(1).max(1000),
  optionC: z.string().trim().min(1).max(1000),
  optionD: z.string().trim().min(1).max(1000),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().max(4000).default(""),
  explanationTamil: z.string().max(4000).default(""),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Medium"),
  sourceType: z.enum(["Book-In", "Book-Out"]).default("Book-In"),
  status: z
    .enum(["Draft", "Teacher Review", "Approved", "Published"])
    .default("Draft"),
});

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const chapterId = searchParams.get("chapterId") || undefined;
  const sourceType =
    (searchParams.get("sourceType") as Question["sourceType"]) || undefined;
  const status = searchParams.get("status") || undefined;

  const questions = await getQuestions({ chapterId, sourceType, status });
  return NextResponse.json({ questions });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "update-status") {
      const { questionId, newStatus } = body;
      if (
        typeof questionId !== "string" ||
        !["Draft", "Teacher Review", "Approved", "Published"].includes(
          newStatus,
        )
      )
        return NextResponse.json(
          { error: "Invalid question status." },
          { status: 400 },
        );
      const ok = await updateQuestionStatus(questionId, newStatus);
      return NextResponse.json({ success: ok });
    }

    const parsed = questionInput.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    const chapter = await getChapterById(parsed.data.chapterId);
    const subject = chapter ? await getSubjectById(chapter.subjectId) : null;
    if (!chapter?.isActive || !subject)
      return NextResponse.json(
        { error: "Choose an active chapter." },
        { status: 400 },
      );
    // Derive academic mapping from the selected chapter.
    const {
      chapterId,
      questionText,
      questionTextTamil = "",
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation = "",
      explanationTamil = "",
      difficulty = "Medium",
      sourceType = "Book-In",
      status = "Approved",
    } = parsed.data;

    if (
      !chapterId ||
      !questionText ||
      !optionA ||
      !optionB ||
      !optionC ||
      !optionD ||
      !correctAnswer
    ) {
      return NextResponse.json(
        { error: "Missing required question fields" },
        { status: 400 },
      );
    }

    const created = await createQuestion({
      chapterId,
      questionText,
      questionTextTamil,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
      explanationTamil,
      difficulty,
      sourceType,
      status,
      stream: subject.streamId,
      subjectId: subject.id,
    });

    return NextResponse.json({ success: true, question: created });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : undefined) ||
          "Failed to manage question",
      },
      { status: 500 },
    );
  }
}
