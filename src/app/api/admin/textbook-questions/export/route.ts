import { getSession } from "@/lib/auth";
import { requireSupabase } from "@/lib/supabase/server";
import {
  preparedReviewQueue,
  reviewQueueCsv,
} from "@/lib/textbook-review-queue";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if ((await getSession())?.role !== "admin")
    return Response.json(
      { error: "Admin authorization required" },
      { status: 403, headers },
    );
  const params = new URL(request.url).searchParams;
  const medium = params.get("medium");
  const ids = ["bookId", "chapterId", "batchId"];
  if (
    (medium && !["Tamil", "English"].includes(medium)) ||
    ids.some(
      (id) => params.has(id) && !/^[a-z0-9-]{1,180}$/.test(params.get(id)!),
    )
  )
    return Response.json(
      { error: "Choose valid review filters." },
      { status: 400, headers },
    );
  if (!medium && !params.get("bookId"))
    return Response.json(
      { error: "Choose a medium or textbook." },
      { status: 400, headers },
    );
  try {
    const entries = await preparedReviewQueue(requireSupabase(), {
      medium,
      bookId: params.get("bookId"),
      chapterId: params.get("chapterId"),
      batchId: params.get("batchId"),
    });
    return new Response(reviewQueueCsv(entries), {
      headers: {
        ...headers,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="teacher-review-${medium || "book"}.csv"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "Could not export the complete review queue. Please retry." },
      { status: 503, headers },
    );
  }
}
