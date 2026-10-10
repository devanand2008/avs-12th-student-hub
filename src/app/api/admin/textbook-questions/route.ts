import { getSession } from "@/lib/auth";
import { requireSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { textbookModerationInput } from "@/lib/question-publishing";
import { reviewTextbooks } from "@/lib/textbook-review-queue";

export async function GET(request: Request) {
  if ((await getSession())?.role !== "admin")
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  const params = new URL(request.url).searchParams;
  if (params.get("books") === "true") {
    try {
      return NextResponse.json(
        { books: await reviewTextbooks(requireSupabase()) },
        {
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    } catch {
      return NextResponse.json(
        { error: "Could not load textbook metadata." },
        { status: 503 },
      );
    }
  }
  const bookId = params.get("bookId");
  if (!bookId)
    return NextResponse.json({ error: "Choose a textbook." }, { status: 400 });
  const page = Math.max(
    1,
    Math.min(10000, Math.trunc(Number(params.get("page")) || 1)),
  );
  const client = requireSupabase();
  if (params.get("batches") === "true") {
    const { data, error } = await client.rpc("avs_textbook_review_batches", {
      p_book_id: bookId,
    });
    return NextResponse.json(
      error ? { error: "Could not load review batches." } : { batches: data },
      {
        status: error ? 503 : 200,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
  const { data, error } = await client.rpc("avs_textbook_review_page", {
    p_book_id: bookId,
    p_chapter_id: params.get("chapterId"),
    p_filter: params.get("status") || "review",
    p_batch_id: params.get("batchId"),
    p_page: page,
  });
  if (error)
    return NextResponse.json(
      { error: "Could not load the textbook question bank." },
      { status: 503 },
    );
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "admin")
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  const limit = await checkRateLimit(`review-mcq-${session.userId}`, 100, 60);
  if (!limit.success)
    return NextResponse.json(
      { error: "Please wait a moment before reviewing more questions." },
      { status: 429 },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Send valid question data." },
      { status: 400 },
    );
  }
  const parsed = textbookModerationInput.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  const input = parsed.data;
  const { data, error } = await requireSupabase().rpc(
    "avs_moderate_textbook_mcq",
    {
      p_id: input.id,
      p_actor_id: session.userId,
      p_action: input.action,
      p_question: "questionText" in input ? input.questionText : null,
      p_options: "options" in input ? input.options : null,
      p_answer: "correctAnswer" in input ? input.correctAnswer : null,
      p_human_confirmed: "humanConfirmed" in input && input.humanConfirmed,
      p_reason: input.reason,
      p_expected_updated_at: input.expectedUpdatedAt,
    },
  );
  if (error)
    return NextResponse.json(
      {
        error: error.message.includes("reload")
          ? "Another reviewer changed this question. Close and reopen it before saving."
          : "Check the question, options, answer and review confirmation before saving.",
      },
      { status: error.message.includes("reload") ? 409 : 400 },
    );
  return NextResponse.json({ success: true, question: data });
}
