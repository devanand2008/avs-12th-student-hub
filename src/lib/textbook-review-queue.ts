import type { SupabaseClient } from "@supabase/supabase-js";
import type { TextbookMcqCandidate } from "./textbook-question-types";

export interface ReviewTextbook {
  id: string;
  title: string;
  subject: string;
  source_medium: "Tamil" | "English";
  volume: string | null;
  local_path: string | null;
  sha256: string | null;
}
export interface ReviewQueueEntry {
  book: ReviewTextbook;
  candidate: TextbookMcqCandidate;
  reviewState: string;
  updatedAt: string;
}

export async function reviewTextbooks(client: SupabaseClient) {
  const { data, error } = await client
    .from("textbooks")
    .select("id,title,subject,source_medium,volume,local_path,sha256")
    .order("id");
  if (error) throw new Error("Could not load textbook metadata.");
  return data as ReviewTextbook[];
}

// Read-only reference queue. Medium is selected from the database catalog,
// never inferred from IDs, filenames, extracted language or answer-key matches.
export async function preparedReviewQueue(
  client: SupabaseClient,
  filters: {
    medium?: string | null;
    bookId?: string | null;
    chapterId?: string | null;
    batchId?: string | null;
  },
) {
  const books = (await reviewTextbooks(client)).filter(
    (book) =>
      (!filters.medium || book.source_medium === filters.medium) &&
      (!filters.bookId || book.id === filters.bookId),
  );
  const entries: ReviewQueueEntry[] = [];
  for (const book of books) {
    for (let offset = 0; ; offset += 250) {
      let query = client
        .from("textbook_mcq_candidates")
        .select("data,review_state,updated_at")
        .eq("book_id", book.id)
        .not("review_batch_id", "is", null)
        .order("id")
        .range(offset, offset + 249);
      if (filters.chapterId) query = query.eq("chapter_id", filters.chapterId);
      if (filters.batchId) query = query.eq("review_batch_id", filters.batchId);
      const { data, error } = await query;
      if (error) throw new Error("Could not export the complete review queue.");
      for (const row of data || [])
        entries.push({
          book,
          candidate: row.data as TextbookMcqCandidate,
          reviewState: row.review_state,
          updatedAt: row.updated_at,
        });
      if ((data?.length || 0) < 250) break;
    }
  }
  return entries;
}

export function reviewIssues(candidate: TextbookMcqCandidate) {
  const prep = candidate.reviewPreparation;
  return [
    ...new Set([
      ...candidate.qualityFlags,
      ...(prep?.warnings || []),
      ...(prep?.keyCheck === "uncertain"
        ? [
            "Printed key mapping is ambiguous; verify the chapter/exercise and answer manually.",
          ]
        : []),
      ...(prep?.keyCheck === "mismatch"
        ? ["Printed key disagrees with the proposed answer."]
        : []),
      ...(!prep?.printedPage ? ["Printed page label needs confirmation."] : []),
      ...(!candidate.keyPage
        ? ["Printed answer-key page is unavailable."]
        : []),
    ]),
  ];
}

export function csvReference(
  rows: Record<string, unknown>[],
  columns: string[],
) {
  const cell = (value: unknown) => {
    let text = String(value ?? "");
    // CSV is reference-only. Protect Excel from interpreting source text as a
    // formula while leaving the stored textbook text completely unchanged.
    if (/^[\s\u0000-\u001f]*[=+@-]/u.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return (
    "\uFEFF" +
    [
      columns.map(cell).join(","),
      ...rows.map((row) => columns.map((key) => cell(row[key])).join(",")),
    ].join("\r\n") +
    "\r\n"
  );
}

export function reviewQueueCsv(entries: ReviewQueueEntry[]) {
  const columns = [
    "candidateId",
    "bookId",
    "subject",
    "title",
    "medium",
    "volume",
    "chapterId",
    "chapter",
    "batchId",
    "questionNumber",
    "pdfPage",
    "endPdfPage",
    "printedPage",
    "keyPdfPage",
    "questionLink",
    "keyLink",
    "pdfPath",
    "sourceSha256",
    "reviewState",
    "reviewedBy",
    "reviewedAt",
    "updatedAt",
    "sourceCheck",
    "keyCheck",
    "proposedAnswer",
    "pageWideParsedAnswer",
    "question",
    "optionA",
    "optionB",
    "optionC",
    "optionD",
    "originalQuestion",
    "originalOptions",
    "unresolvedIssues",
    "duplicateIds",
    "reviewHistory",
    "referenceOnly",
  ];
  return csvReference(
    entries.map(({ book, candidate: c, reviewState, updatedAt }) => {
      const prep = c.reviewPreparation;
      return {
        candidateId: c.id,
        bookId: book.id,
        subject: book.subject,
        title: book.title,
        medium: book.source_medium,
        volume: book.volume,
        chapterId: c.chapterId,
        chapter: c.chapterTitle,
        batchId: prep?.batchId,
        questionNumber: c.number,
        pdfPage: c.page,
        endPdfPage: c.endPage,
        printedPage: prep?.printedPage,
        keyPdfPage: c.keyPage,
        questionLink: `/textbooks/${book.id}?page=${c.page}`,
        keyLink: c.keyPage ? `/textbooks/${book.id}?page=${c.keyPage}` : "",
        pdfPath: book.local_path,
        sourceSha256: c.sourceSha256,
        reviewState,
        reviewedBy: c.reviewedBy,
        reviewedAt: c.reviewedAt,
        updatedAt,
        sourceCheck: prep?.sourceCheck,
        keyCheck: prep?.keyCheck,
        proposedAnswer: c.correctAnswer,
        pageWideParsedAnswer: prep?.parsedAnswer,
        question: c.questionText,
        optionA: c.options[0],
        optionB: c.options[1],
        optionC: c.options[2],
        optionD: c.options[3],
        originalQuestion:
          c.originalExtraction?.questionText || prep?.sourceQuestionText,
        originalOptions: JSON.stringify(
          c.originalExtraction?.options || prep?.sourceOptions,
        ),
        unresolvedIssues: reviewIssues(c).join("; "),
        duplicateIds: prep?.duplicateIds.join("; "),
        reviewHistory: JSON.stringify(c.reviewHistory || []),
        referenceOnly:
          "No decisions imported. Record individual decisions in the authenticated admin queue.",
      };
    }),
    columns,
  );
}
