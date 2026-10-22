import { getSession } from "@/lib/auth";
import { requireSupabase } from "@/lib/supabase/server";
import type { TextbookMcqCoverage } from "@/lib/textbook-question-types";
import { NextResponse } from "next/server";
import { getQuestions } from "@/lib/db";
import { eligiblePracticeCoverage } from "@/lib/textbook-practice-selection";

export async function GET() {
  if (!(await getSession()))
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    const [{ data, error }, questions] = await Promise.all([
      requireSupabase().rpc("avs_textbook_mcq_catalog"),
      getQuestions({ status: "Published", sourceType: "Book-In" }),
    ]);
    if (error || !Array.isArray(data)) throw new Error("Coverage read failed");
    return NextResponse.json(
      {
        coverage: eligiblePracticeCoverage(
          data as TextbookMcqCoverage[],
          questions,
        ),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Textbook practice is temporarily unavailable. Please try again.",
      },
      { status: 503 },
    );
  }
}
