import { getSession } from "@/lib/auth";
import { suppliedQuestions } from "@/lib/supplied-practice/bank";
import { NextResponse } from "next/server";
function cell(value: unknown) {
  let s = typeof value === "string" ? value : JSON.stringify(value);
  if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export async function GET(request: Request) {
  const session = await getSession();
  if (session?.role !== "admin")
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: session ? 403 : 401 },
    );
  const params = new URL(request.url).searchParams,
    collection = params.get("collection"),
    section = params.get("section");
  const questions = suppliedQuestions.filter(
    (q) =>
      (!collection || q.collectionId === collection) &&
      (!section || section === "all" || q.section === section),
  );
  const csv = params.get("format") === "csv";
  const columns = [
    "candidate_id",
    "fingerprint",
    "subject",
    "collection_id",
    "source_context",
    "volume",
    "section",
    "question_en",
    "question_ta",
    "options_en",
    "options_ta",
    "proposed_answer_index_zero_based",
    "source_references",
    "warnings",
    "status",
  ];
  const body = csv
    ? "\uFEFF" +
      [
        columns.join(","),
        ...questions.map((q) =>
          [
            q.id,
            q.fingerprint,
            q.subject,
            q.collectionId,
            q.sourceContext || "",
            q.volume,
            q.section,
            q.questionEn,
            q.questionTa,
            q.optionsEn,
            q.optionsTa,
            q.proposedAnswer,
            q.sources,
            q.warnings,
            q.reviewStatus,
          ]
            .map(cell)
            .join(","),
        ),
      ].join("\r\n")
    : JSON.stringify(
        {
          schemaVersion: 1,
          purpose:
            "Source reference only; no teacher decisions or publication authorization",
          questions,
        },
        null,
        2,
      );
  return new Response(body, {
    headers: {
      "Content-Type": csv
        ? "text/csv; charset=utf-8"
        : "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="supplied-question-reference.${csv ? "csv" : "json"}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
