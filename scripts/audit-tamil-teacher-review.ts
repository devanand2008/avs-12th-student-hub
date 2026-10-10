import { loadEnvConfig } from "@next/env";
import { readFile, writeFile } from "node:fs/promises";
import { requireSupabase } from "../src/lib/supabase/server";
import {
  preparedReviewQueue,
  reviewTextbooks,
  reviewIssues,
  csvReference,
  reviewQueueCsv,
} from "../src/lib/textbook-review-queue";
import catalog from "../src/lib/textbooks-catalog.json";

loadEnvConfig(process.cwd());
const client = requireSupabase();

async function rows<T>(
  table: string,
  select: string,
  filter?: [string, string],
) {
  const all: T[] = [];
  for (let offset = 0; ; offset += 500) {
    let query = client
      .from(table)
      .select(select)
      .order("id")
      .range(offset, offset + 499);
    if (filter) query = query.eq(...filter);
    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
    all.push(...(data as T[]));
    if ((data?.length || 0) < 500) return all;
  }
}

async function main() {
  const startedAt = new Date().toISOString();
  const [
    books,
    entries,
    candidates,
    questions,
    moderationAudits,
    compatibilityAudits,
  ] = await Promise.all([
    reviewTextbooks(client),
    preparedReviewQueue(client, { medium: "Tamil" }),
    rows<{
      id: string;
      book_id: string;
      chapter_id: string;
      review_batch_id: string | null;
      review_state: string;
    }>(
      "textbook_mcq_candidates",
      "id,book_id,chapter_id,review_batch_id,review_state",
    ),
    rows<{
      id: string;
      data: {
        status: string;
        sourceTextbookId?: string;
        questionOrigin?: string;
        reviewedBy?: string;
        reviewStatus?: string;
        answerVerification?: string;
      };
    }>("avs_questions", "id,data"),
    rows<{
      id: string;
      data: {
        entityId: string;
        userId: string;
        review?: { action: string; actorId: string; at: string };
        before?: unknown;
        after?: unknown;
      };
    }>("avs_audit_logs", "id,data", ["data->>action", "MODERATE_TEXTBOOK_MCQ"]),
    rows<{
      id: string;
      data: {
        entityId: string;
        userId: string;
        review?: { action: string; actorId: string; at: string };
        before?: unknown;
        after?: unknown;
      };
    }>("avs_audit_logs", "id,data", ["data->>action", "REVIEW_TEXTBOOK_MCQ"]),
  ]);
  const checkedAt = new Date().toISOString();
  const published = questions.filter((q) => q.data.status === "Published");
  const publishedIds = new Set(published.map((q) => q.id));
  const tamilBooks = books.filter((b) => b.source_medium === "Tamil");
  const tamilIds = new Set(tamilBooks.map((b) => b.id));
  const tamilCandidates = candidates.filter((c) => tamilIds.has(c.book_id));
  const audits = [...moderationAudits, ...compatibilityAudits];
  const coverage = JSON.parse(
    await readFile("docs/independent-textbook-coverage.json", "utf8"),
  ) as {
    checkedAt: string;
    books: {
      id: string;
      chapters: {
        chapterId: string;
        chapterNumber: number;
        title: string;
        bookBackCandidates: number;
        published: number;
      }[];
    }[];
  };
  const metadataMismatches = books
    .filter((b) => {
      const local = catalog.books.find((c) => c.id === b.id);
      return (
        !local ||
        local.sourceMedium !== b.source_medium ||
        local.volume !== b.volume ||
        local.sha256 !== b.sha256
      );
    })
    .map((b) => b.id);
  const packetMismatches = entries
    .filter(({ book, candidate: c }) => {
      const p = c.reviewPreparation!;
      return (
        p.medium !== book.source_medium ||
        p.volume !== book.volume ||
        p.sourceSha256 !== book.sha256
      );
    })
    .map(({ candidate }) => candidate.id);
  const decisionAuditIssues = entries.flatMap(({ candidate: c }) =>
    (c.reviewHistory || [])
      .filter(
        (event) =>
          !audits.some(
            ({ data: a }) =>
              a.entityId === c.id &&
              a.userId === event.actorId &&
              a.review?.at === event.at &&
              a.review.action === event.action &&
              a.before &&
              a.after,
          ),
      )
      .map((event) => ({
        candidateId: c.id,
        action: event.action,
        at: event.at,
      })),
  );
  const evidenceMissing = entries
    .filter(
      ({ candidate: c }) =>
        !c.reviewPreparation?.sourcePageText ||
        !c.reviewPreparation.keyPageText ||
        !c.keyPage ||
        !c.sourceSha256 ||
        !c.originalExtraction,
    )
    .map(({ candidate }) => candidate.id);
  const unsafePublished = entries
    .filter(
      ({ candidate: c, reviewState }) =>
        publishedIds.has(c.id) &&
        (reviewState !== "approved" ||
          !c.reviewedBy ||
          !c.reviewHistory?.some((e) => e.action === "approve")),
    )
    .map(({ candidate }) => candidate.id);
  const legacy = questions.filter(
    (q) => q.data.questionOrigin === "Legacy Sample",
  );
  const legacyPublished = legacy
    .filter((q) => publishedIds.has(q.id))
    .map((q) => q.id);
  const batches = [
    ...new Set(entries.map((e) => e.candidate.reviewPreparation!.batchId)),
  ]
    .sort()
    .map((batchId) => {
      const items = entries.filter(
        (e) => e.candidate.reviewPreparation!.batchId === batchId,
      );
      const { book, candidate } = items[0];
      const pending = items.filter(
        (e) => e.reviewState === "needs_teacher_review",
      );
      return {
        bookId: book.id,
        textbook: book.subject,
        volume: book.volume,
        medium: book.source_medium,
        chapterId: candidate.chapterId,
        chapter: candidate.chapterTitle,
        batchId,
        total: items.length,
        pending: pending.length,
        reviewed: items.filter((e) => e.candidate.reviewHistory?.length).length,
        approved: items.filter((e) => e.reviewState === "approved").length,
        rejected: items.filter((e) => e.reviewState === "rejected").length,
        keyMatched: items.filter(
          (e) => e.candidate.reviewPreparation?.keyCheck === "matched",
        ).length,
        ambiguous: items.filter(
          (e) => e.candidate.reviewPreparation?.keyCheck === "uncertain",
        ).length,
        unresolved: pending.filter((e) => reviewIssues(e.candidate).length)
          .length,
        issues: [...new Set(pending.flatMap((e) => reviewIssues(e.candidate)))],
        candidateIds: items.map((e) => e.candidate.id),
      };
    });
  const bookSummary = tamilBooks.map((book) => {
    const items = batches.filter((b) => b.bookId === book.id);
    const allCandidates = tamilCandidates.filter((c) => c.book_id === book.id);
    const unprepared = allCandidates.filter(
      (c) =>
        !c.review_batch_id &&
        !publishedIds.has(c.id) &&
        c.review_state !== "rejected",
    );
    const detected =
      coverage.books.find((b) => b.id === book.id)?.chapters || [];
    const sum = (
      key:
        | "total"
        | "pending"
        | "reviewed"
        | "approved"
        | "rejected"
        | "keyMatched"
        | "ambiguous",
    ) => items.reduce((n, b) => n + b[key], 0);
    return {
      ...book,
      batches: items.length,
      preparedChapters: new Set(items.map((b) => b.chapterId)).size,
      prepared: sum("total"),
      pending: sum("pending"),
      reviewed: sum("reviewed"),
      approved: sum("approved"),
      rejected: sum("rejected"),
      keyMatched: sum("keyMatched"),
      ambiguous: sum("ambiguous"),
      candidates: allCandidates.length,
      unpreparedPending: unprepared.length,
      published: published.filter((q) => q.data.sourceTextbookId === book.id)
        .length,
      detectedChapters: detected.length,
      noDetectedBookBack: detected
        .filter((c) => !c.bookBackCandidates)
        .map((c) => c.chapterNumber),
      chaptersWithoutPreparedPackets: detected
        .filter((c) => !items.some((b) => b.chapterId === c.chapterId))
        .map((c) => c.chapterNumber),
    };
  });
  const report = {
    startedAt,
    checkedAt,
    readOnly: true,
    mediumSource: "public.textbooks.source_medium",
    coverageBaselineAt: coverage.checkedAt,
    summary: {
      tamilBooks: tamilBooks.length,
      preparedBooks: bookSummary.filter((b) => b.prepared).length,
      batches: batches.length,
      chapters: new Set(batches.map((b) => b.chapterId)).size,
      prepared: entries.length,
      pending: batches.reduce((n, b) => n + b.pending, 0),
      reviewed: batches.reduce((n, b) => n + b.reviewed, 0),
      approved: batches.reduce((n, b) => n + b.approved, 0),
      rejected: batches.reduce((n, b) => n + b.rejected, 0),
      keyMatched: batches.reduce((n, b) => n + b.keyMatched, 0),
      ambiguous: batches.reduce((n, b) => n + b.ambiguous, 0),
      unknownPrintedPages: entries.filter(
        (e) => !e.candidate.reviewPreparation?.printedPage,
      ).length,
      allTamilCandidates: tamilCandidates.length,
      unpreparedTamilPending: bookSummary.reduce(
        (n, b) => n + b.unpreparedPending,
        0,
      ),
      publishedAllTextbooks: published.filter((q) => q.data.sourceTextbookId)
        .length,
      publishedTamil: bookSummary.reduce((n, b) => n + b.published, 0),
      legacyHeld: legacy.length - legacyPublished.length,
      legacyPublished: legacyPublished.length,
    },
    checks: {
      metadataMismatches,
      packetMismatches,
      evidenceMissing,
      decisionAuditIssues,
      unsafePublished,
      legacyPublished,
    },
    books: bookSummary,
    batches,
    candidates: entries.map(({ book, candidate: c, reviewState }) => ({
      id: c.id,
      bookId: book.id,
      medium: book.source_medium,
      volume: book.volume,
      chapterId: c.chapterId,
      batchId: c.reviewPreparation!.batchId,
      pdfPage: c.page,
      printedPage: c.reviewPreparation!.printedPage,
      keyPdfPage: c.keyPage,
      sourceSha256: c.sourceSha256,
      reviewState,
      keyCheck: c.reviewPreparation!.keyCheck,
      unresolvedIssues: reviewIssues(c),
    })),
  };
  await writeFile(
    "docs/tamil-teacher-review.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  const batchColumns = [
    "bookId",
    "textbook",
    "volume",
    "medium",
    "chapterId",
    "chapter",
    "batchId",
    "total",
    "pending",
    "reviewed",
    "approved",
    "rejected",
    "keyMatched",
    "ambiguous",
    "unresolved",
    "issues",
    "candidateIds",
  ];
  await writeFile(
    "docs/tamil-teacher-review-batches.csv",
    csvReference(
      batches.map((b) => ({
        ...b,
        issues: b.issues.join("; "),
        candidateIds: b.candidateIds.join("; "),
      })),
      batchColumns,
    ),
  );
  await writeFile(
    "docs/tamil-teacher-review-queue.csv",
    reviewQueueCsv(entries),
  );
  const clean = (value: unknown) =>
    String(value ?? "—")
      .replaceAll("|", "\\|")
      .replaceAll("\n", " ");
  const s = report.summary;
  const accountancyChapterOne = batches.filter(
    (b) => b.textbook === "Accountancy" && b.chapterId.endsWith("-ch-1"),
  );
  const accountancyIds = new Set(
    accountancyChapterOne.flatMap((b) => b.candidateIds),
  );
  const accountancyCounts = {
    pending: accountancyChapterOne.reduce((n, b) => n + b.pending, 0),
    reviewed: accountancyChapterOne.reduce((n, b) => n + b.reviewed, 0),
    approved: accountancyChapterOne.reduce((n, b) => n + b.approved, 0),
    rejected: accountancyChapterOne.reduce((n, b) => n + b.rejected, 0),
    published: published.filter((q) => accountancyIds.has(q.id)).length,
    audits: audits.filter((a) => accountancyIds.has(a.data.entityId)).length,
  };
  const nextBatch =
    batches.find(
      (b) =>
        b.textbook === "Accountancy" &&
        b.chapterId.endsWith("-ch-1") &&
        b.pending,
    ) || batches.find((b) => b.pending);
  const lines = [
    "# Tamil-medium teacher verification queue",
    "",
    `Read-only live database audit: ${checkedAt}. Medium is joined from **public.textbooks.source_medium**, not inferred from filenames. Catalog/packet inconsistencies: ${metadataMismatches.length}/${packetMismatches.length}.`,
    "",
    `**${s.prepared} prepared questions / ${s.batches} batches / ${s.chapters} detected chapters / ${s.preparedBooks} textbooks.** Pending ${s.pending}; reviewed ${s.reviewed}; approved ${s.approved}; rejected ${s.rejected}. Page-wide key matches ${s.keyMatched}; ambiguous ${s.ambiguous}. No automated match constitutes teacher approval.`,
    "",
    `All ${s.tamilBooks} Tamil PDF records have ${s.allTamilCandidates} extraction candidates; ${s.unpreparedTamilPending} unpublished, non-rejected candidates have no prepared packet. Tamil student-ready count ${s.publishedTamil}. All textbooks combined: ${s.publishedAllTextbooks} existing published questions. Legacy samples held ${s.legacyHeld}; published legacy samples ${s.legacyPublished}.`,
    "",
    "Reviewed counts mean candidate IDs with at least one authenticated edit/approve/reject event; approved/rejected are current states. A saved draft can therefore be both reviewed and pending. Counts are not summed as unique questions. Only explicit individual approval publishes a prepared question. Existing English printed-key publications predate this teacher-review milestone.",
    "",
    "## How to record a teacher decision",
    "",
    "Run `npm run dev`, sign in with an authorised admin email/password, and open `/admin/textbook-questions`. Select **Textbook medium → Tamil medium**, then the textbook, chapter and **Teacher review batch**. Keep **Question status → Needs review** to see held questions. Click **Review MCQ** for one row.",
    "",
    "Read the original question/options, PDF source link, PDF and printed-page labels, printed-key link/text and each warning. Page-wide key matches need chapter/exercise confirmation too. Edit only against the original source. Choose the verified answer. Enter a review note identifying the evidence and how any ambiguity was resolved. **Save edits for review** keeps the question held. **Reject question** requires a reason and records rejection. To approve, tick the source/options/answer confirmation and click **Publish reviewed MCQ**. This uses your authenticated admin identity, saves before/after history and makes only that question available. Reload to confirm; use Published/Rejected filters and Review history to inspect the saved decision. Stale simultaneous changes require reopening the row.",
    "",
    "Teachers currently require an authorised admin account; the app has no separate teacher role. Each reviewer should use their own authorised account for attribution. Do not share credentials in a CSV or report. CSV exports are reference-only; there is no decision importer. A teacher's spreadsheet entry does not change database state.",
    "",
    "The updated filter/export UI is local and **has not been deployed to production**. Admin evidence may open the PDF; student practice displays text MCQs only.",
    "",
    "## All Tamil textbooks",
    "",
    "Coverage chapter detection is from the independent parser snapshot dated " +
      coverage.checkedAt +
      "; it is not a teacher-approved contents inventory. Prepared queue and publication counts were reread live above.",
    "",
    "| Textbook | Volume | PDF ID | Batches | Prepared | Pending | Reviewed | Approved | Rejected | Key matches / ambiguous | Unprepared pending | No detected book-back chapters |",
    "|---|---|---|---:|---:|---:|---:|---:|---:|---|---:|---|",
  ];
  for (const b of bookSummary)
    lines.push(
      `| ${clean(b.subject)} | ${clean(b.volume)} | ${b.id} | ${b.batches} | ${b.prepared} | ${b.pending} | ${b.reviewed} | ${b.approved} | ${b.rejected} | ${b.keyMatched} / ${b.ambiguous} | ${b.unpreparedPending} | ${b.noDetectedBookBack.join(", ") || "—"} |`,
    );
  lines.push(
    "",
    "## Chapter and batch register",
    "",
    "| Textbook / volume | Chapter | Batch ID | Pending | Reviewed | Approved | Rejected | Key matches | Ambiguous | Pending with unresolved flags |",
    "|---|---|---|---:|---:|---:|---:|---:|---:|---:|",
  );
  for (const b of batches)
    lines.push(
      `| ${clean(b.textbook)} ${clean(b.volume || "")} | ${clean(b.chapter)} (${b.chapterId.split("-ch-")[1]}) | ${b.batchId} | ${b.pending} | ${b.reviewed} | ${b.approved} | ${b.rejected} | ${b.keyMatched} | ${b.ambiguous} | ${b.unresolved} |`,
    );
  lines.push(
    "",
    "## Accountancy Chapter 1 follow-up",
    "",
    `Actual live outcome: pending ${accountancyCounts.pending}; reviewed ${accountancyCounts.reviewed}; approved ${accountancyCounts.approved}; rejected ${accountancyCounts.rejected}; published ${accountancyCounts.published}; decision audit rows ${accountancyCounts.audits}. Reviewed means a candidate has a recorded teacher-action history, not a source-key match.`,
    "",
    "[The independent per-candidate source/decision audit](TAMIL_ACCOUNTANCY_FOLLOWUP.md) checks original PDF pages 9, 38 and 39, chapter mapping, preserved wording/options, scoped printed-key evidence and matching persisted audit events. It has its own explicit read timestamp; rerun `npm run mcqs:accountancy-followup` after teachers act. A printed-key correspondence never changes the held status automatically.",
    "",
    "[Next Tamil extraction inventory](TAMIL_NEXT_EXTRACTION.md) and [its chapter CSV](tamil-next-extraction-inventory.csv) locate missing book-back sections in Physics Volume 1 and the two Computer Applications / two Computer Technology PDF records. Its 53 academic chapter records exclude practical/front/back matter; the existing parser's Physics chapters 7 and 10 are practicals and acknowledgement bookmarks, not academic units. No live mapping was changed by the inventory.",
    "",
    "## Evidence and unresolved work",
    "",
    `Missing source/key packets: ${evidenceMissing.length}; unmatched recorded decision audits: ${decisionAuditIssues.length}; prepared questions published without recorded approval: ${unsafePublished.length}; published legacy samples: ${legacyPublished.length}.`,
    "",
    "Every candidate's ambiguity/quality reason, immutable ID, source hash and page references are in [the JSON report](tamil-teacher-review.json) and [the teacher queue CSV](tamil-teacher-review-queue.csv). Group counts and IDs are in [the batch CSV](tamil-teacher-review-batches.csv). The UI exports the selected prepared chapter/batch or all Tamil prepared batches, including previously reviewed records; it does not export only the visible 25-row page.",
    "",
    nextBatch
      ? `**Highest-priority next task:** an authorised ${nextBatch.textbook} teacher should verify ${nextBatch.chapter} batch \`${nextBatch.batchId}\` (${nextBatch.pending} held questions), including chapter-specific printed-key scope and OCR/options, and record each decision individually. Continue the remaining prepared batches; no question was approved by this audit.`
      : "All prepared Tamil batches have recorded decisions. Continue source preparation and chapter inventory for the remaining unpublished books. This audit approved no questions.",
    "",
    "Next extraction priorities are Tamil Physics Vol 1 and the Tamil Computer Applications / Computer Technology PDF records that have no detected book-back sections. Locate exercises and verify the chapter inventory before transcription; the absence of parser candidates is not proof that a book has no MCQs. Tamil mathematics also needs source-confirmed notation before the prepared volume 1/2 candidates can be published. The table above gives exact detected missing chapter numbers; [the full chapter backlog](textbook-coverage-backlog.csv) contains all 856 detected entries, including 733 without published questions. None is claimed complete.",
    "",
    "Verification results and limits are recorded in PROJECT_STATUS.md. This script executes SELECT requests only; it creates local reports and never approves, rejects, deletes or imports a candidate.",
    "",
  );
  await writeFile("docs/TAMIL_TEACHER_REVIEW.md", lines.join("\n"));
  console.log(
    JSON.stringify({ checkedAt, ...s, checks: report.checks }, null, 2),
  );
  if (
    [
      metadataMismatches,
      packetMismatches,
      evidenceMissing,
      decisionAuditIssues,
      unsafePublished,
      legacyPublished,
    ].some((list) => list.length)
  )
    process.exitCode = 1;
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
