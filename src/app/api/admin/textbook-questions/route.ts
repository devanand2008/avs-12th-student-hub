import { getSession } from "@/lib/auth";
import { requireSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  if ((await getSession())?.role !== "admin")
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  const params = new URL(request.url).searchParams;
  const bookId = params.get("bookId");
  if (!bookId)
    return NextResponse.json({ error: "Choose a textbook." }, { status: 400 });
  const page = Math.max(
    1,
    Math.min(10000, Math.trunc(Number(params.get("page")) || 1)),
  );
  const pageSize = 25;
  let query = requireSupabase()
    .from("textbook_mcq_candidates")
    .select("data", { count: "exact" })
    .eq("book_id", bookId);
  if (params.get("chapterId"))
    query = query.eq("chapter_id", params.get("chapterId"));
  if (params.get("status") === "review")
    query = query.eq("status", "Needs Review");
  if (params.get("status") === "published")
    query = query.eq("status", "Published");
  const { data, error, count } = await query
    .order("id")
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error)
    return NextResponse.json(
      { error: "Could not load the textbook question bank." },
      { status: 503 },
    );
  return NextResponse.json(
    {
      questions: (data || []).map((row) => row.data),
      total: count || 0,
      page,
      pageSize,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

const reviewInput = z
  .object({
    id: z.string().min(1).max(180),
    questionText: z.string().trim().min(8).max(2500),
    options: z.array(z.string().trim().min(1).max(1000)).min(2).max(4),
    correctAnswer: z.enum(["A", "B", "C", "D"]),
  })
  .refine(
    (value) => "ABCD".indexOf(value.correctAnswer) < value.options.length,
    { message: "Choose one of the provided options as the answer." },
  );

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
  const parsed = reviewInput.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  const input = parsed.data;
  const { data, error } = await requireSupabase().rpc(
    "avs_review_textbook_mcq",
    {
      p_id: input.id,
      p_actor_id: session.userId,
      p_question: input.questionText,
      p_options: input.options,
      p_answer: input.correctAnswer,
    },
  );
  if (error)
    return NextResponse.json(
      {
        error:
          "Correct the question, options and answer before publishing. The original textbook page is available for checking.",
      },
      { status: 400 },
    );
  return NextResponse.json({ success: true, question: data });
}
