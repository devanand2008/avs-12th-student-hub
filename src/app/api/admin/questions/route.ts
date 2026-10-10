import { getSession } from "@/lib/auth";
import {
  createQuestion,
  getQuestions,
  updateQuestionStatus,
  getChapterById,
  getSubjectById,
  getQuestionById,
} from "@/lib/db";
import { Question } from "@/types";
import { NextResponse } from "next/server";
import { questionInput } from "@/lib/question-publishing";
import { isTextPracticeQuestion } from "@/lib/practice-question-text";

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

  const subjectId = searchParams.get("subjectId") || undefined;
  const page = Math.max(
    1,
    Math.min(10000, Math.trunc(Number(searchParams.get("page")) || 1)),
  );
  const pageSize = 50;
  const questions = await getQuestions({
    chapterId,
    subjectId,
    sourceType,
    status,
  });
  return NextResponse.json(
    {
      questions: questions.slice((page - 1) * pageSize, page * pageSize),
      total: questions.length,
      page,
      pageSize,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
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
      if (newStatus === "Published") {
        const question = await getQuestionById(questionId);
        if (!question)
          return NextResponse.json(
            { error: "Question not found." },
            { status: 404 },
          );
        if (
          question.questionOrigin === "Legacy Sample" &&
          body.humanConfirmed !== true
        )
          return NextResponse.json(
            {
              error:
                "Explicitly verify this legacy question and answer before approval.",
            },
            { status: 400 },
          );
        if (!isTextPracticeQuestion(question))
          return NextResponse.json(
            {
              error:
                "Correct the question text and answer choices before publishing.",
            },
            { status: 400 },
          );
      }
      const ok = await updateQuestionStatus(
        questionId,
        newStatus,
        session.userId,
      );
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
