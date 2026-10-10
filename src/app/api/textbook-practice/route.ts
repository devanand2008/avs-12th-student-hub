import { getSession } from "@/lib/auth";
import { requireSupabase } from "@/lib/supabase/server";
import type { TextbookMcqCoverage } from "@/lib/textbook-question-types";
import { NextResponse } from "next/server";

export async function GET() {
  if (!(await getSession()))
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { data, error } = await requireSupabase().rpc(
    "avs_textbook_mcq_catalog",
  );
  if (error)
    return NextResponse.json(
      {
        error:
          "Textbook practice is temporarily unavailable. Please try again.",
      },
      { status: 503 },
    );
  return NextResponse.json(
    { coverage: data as TextbookMcqCoverage[] },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
