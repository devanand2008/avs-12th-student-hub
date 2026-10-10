import { getSession } from "@/lib/auth";
import { getAllChapters, getSubjects } from "@/lib/db";
import { questionImportSchema } from "@/lib/question-import";
import { requireSupabase } from "@/lib/supabase/server";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "admin")
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  try {
    const parsed = z
      .object({ rows: z.array(questionImportSchema).min(1).max(100) })
      .safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    const [chapters, subjects] = await Promise.all([
      getAllChapters(),
      getSubjects(),
    ]);
    const rows = parsed.data.rows.map((row) => {
      const chapter = chapters.find(
        (ch) => ch.id === row.chapter_id && ch.isActive,
      );
      const subject = subjects.find((s) => s.id === chapter?.subjectId);
      if (!chapter || !subject)
        throw new Error(`Choose an active chapter: ${row.chapter_id}`);
      const suffix = createHash("sha256")
        .update(`${chapter.id}:${row.question}`)
        .digest("hex")
        .slice(0, 32);
      return {
        id: `import-q-${suffix}`,
        chapterId: chapter.id,
        subjectId: subject.id,
        stream: subject.streamId,
        questionText: row.question,
        questionTextTamil: "",
        optionA: row.option_a,
        optionB: row.option_b,
        optionC: row.option_c,
        optionD: row.option_d,
        correctAnswer: row.correct_answer,
        explanation: row.explanation,
        explanationTamil: "",
        difficulty: row.difficulty,
        sourceType: row.source_type,
        status: "Published",
        createdAt: new Date().toISOString(),
        answerVerification: "Teacher Review",
        ...(chapter.bookId ? { sourceTextbookId: chapter.bookId } : {}),
      };
    });
    const { data, error } = await requireSupabase().rpc(
      "avs_import_questions",
      { p_rows: rows, p_actor_id: session.userId },
    );
    if (error)
      throw new Error(
        "The question import could not be saved. Check the chapters and try again.",
      );
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Send a valid question spreadsheet.",
      },
      { status: 400 },
    );
  }
}
