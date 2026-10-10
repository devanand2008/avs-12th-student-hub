import { loadEnvConfig } from "@next/env";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import catalog from "../src/lib/textbooks-catalog.json";
import { requireSupabase } from "../src/lib/supabase/server";
import {
  preparedReviewQueue,
  reviewTextbooks,
  csvReference,
  reviewIssues,
} from "../src/lib/textbook-review-queue";
import { isTextPracticeQuestion } from "../src/lib/practice-question-text";
import type { Question } from "../src/types";
import type { Textbook } from "../src/lib/textbooks";
import {
  extractBookMcqs,
  type ExtractedBook,
} from "./lib/textbook-question-parser";
import { parsePrintedAnswerKey } from "./lib/textbook-answer-keys";
import {
  reviewAuditMatches,
  type ReviewDecisionAudit,
} from "./lib/textbook-review-audit";

// SELECT requests and local evidence reports only. No moderation/import RPCs.
loadEnvConfig(process.cwd());
const client = requireSupabase();
const chapterNumber = 1;
async function rows<T>(
  table: string,
  select: string,
  filter?: [string, string],
) {
  const result: T[] = [];
  for (let offset = 0; ; offset += 500) {
    let query = client
      .from(table)
      .select(select)
      .order("id")
      .range(offset, offset + 499);
    if (filter) query = query.eq(...filter);
    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
    result.push(...(data as T[]));
    if ((data?.length || 0) < 500) return result;
  }
}
type Audit = {
  id: string;
  data: ReviewDecisionAudit;
};
const clean = (value: unknown) =>
  String(value ?? "—")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");

async function main() {
  const startedAt = new Date().toISOString();
  const [books, questions, moderation, compatibility] = await Promise.all([
    reviewTextbooks(client),
    rows<{ id: string; data: Question }>("avs_questions", "id,data"),
    rows<Audit>("avs_audit_logs", "id,data", [
      "data->>action",
      "MODERATE_TEXTBOOK_MCQ",
    ]),
    rows<Audit>("avs_audit_logs", "id,data", [
      "data->>action",
      "REVIEW_TEXTBOOK_MCQ",
    ]),
  ]);
  const book = books.find(
    (b) => b.subject === "Accountancy" && b.source_medium === "Tamil",
  );
  if (!book) throw new Error("Actual Tamil Accountancy metadata is missing");
  const chapterId = `tb-${book.id}-ch-${chapterNumber}`;
  const entries = (
    await preparedReviewQueue(client, { bookId: book.id, chapterId })
  ).sort((a, b) => a.candidate.number - b.candidate.number);
  const audits = [...moderation, ...compatibility].filter((a) =>
    entries.some((e) => e.candidate.id === a.data.entityId),
  );
  const liveReadAt = new Date().toISOString();
  const questionsById = new Map(questions.map((q) => [q.id, q.data]));
  const issues: string[] = [];
  // Actor roles are checked privately; user profiles/passwords are never exported.
  const actorIds = [
    ...new Set(
      entries.flatMap((e) =>
        (e.candidate.reviewHistory || []).map((h) => h.actorId),
      ),
    ),
  ];
  const actors = new Map<string, string>();
  if (actorIds.length) {
    const { data, error } = await client
      .from("avs_users")
      .select("id,data")
      .in("id", actorIds);
    if (error) throw new Error(error.message);
    for (const actor of data || []) actors.set(actor.id, actor.data.role);
  }

  const targets = books.filter(
    (b) =>
      b.source_medium === "Tamil" &&
      (b.subject === "Computer Applications" ||
        b.subject === "Computer Technology" ||
        (b.subject === "Physics" && b.volume === "1")),
  );
  const sourcePages = new Map<number, string>();
  const measured: {
    bookId: string;
    pages: number;
    sha256: string;
    hashMatches: boolean;
    cacheMismatches: number[];
    unprocessedPages: number[];
    sparsePages: number[];
  }[] = [];
  const inventory: {
    bookId: string;
    textbook: string;
    volume: string | null;
    chapter: number;
    chapterId: string;
    bookmark: string;
    startPage: number;
    endPage: number;
    oneMarkStartPages: number[];
    oneMarkPages: number[];
    keyEvidencePages: number[];
    markerEvidence: { page: number; line: string }[];
    candidates: number;
    bookBackCandidates: number;
    published: number;
    issues: string[];
  }[] = [];
  const excludedBookmarks: {
    bookId: string;
    title: string;
    page: number;
    existingParserChapter: number | null;
  }[] = [];
  const coverage = JSON.parse(
    await readFile("docs/independent-textbook-coverage.json", "utf8"),
  );
  const sourceCandidateById = new Map<
    string,
    ReturnType<typeof extractBookMcqs>["candidates"][number]
  >();
  for (const actualBook of [book, ...targets]) {
    const metadata = catalog.books.find((b) => b.id === actualBook.id);
    if (!metadata) throw new Error(`Catalog missing ${actualBook.id}`);
    const bytes = await readFile("public" + actualBook.local_path);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const hashMatches =
      sha256 === actualBook.sha256 && sha256 === metadata.sha256;
    if (!hashMatches) issues.push(`Source hash mismatch: ${actualBook.id}`);
    const cache = JSON.parse(
      await readFile(`.local/textbook-text/${actualBook.id}.json`, "utf8"),
    ) as ExtractedBook;
    const freshPages: ExtractedBook["pages"] = [];
    const cacheMismatches: number[] = [],
      unprocessedPages: number[] = [],
      sparsePages: number[] = [];
    const task = getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: true,
      verbosity: 0,
    });
    try {
      const document = await task.promise;
      const outlineEntries: { title: string; page: number }[] = [];
      async function collectOutline(
        items: Awaited<ReturnType<typeof document.getOutline>>,
      ) {
        for (const item of items || []) {
          const dest =
            typeof item.dest === "string"
              ? await document.getDestination(item.dest)
              : item.dest;
          if (dest?.[0] !== undefined) {
            const page =
              (typeof dest[0] === "number"
                ? dest[0]
                : await document.getPageIndex(dest[0])) + 1;
            outlineEntries.push({ title: item.title, page });
          }
          await collectOutline(item.items);
        }
      }
      await collectOutline(await document.getOutline());
      outlineEntries.sort((a, b) => a.page - b.page);
      const pagesToCheck =
        actualBook.id === book.id
          ? [
              ...new Set([
                9,
                ...entries.map((e) => e.candidate.page),
                ...entries.flatMap((e) =>
                  e.candidate.keyPage ? [e.candidate.keyPage] : [],
                ),
              ]),
            ].sort((a, b) => a - b)
          : Array.from({ length: document.numPages }, (_, i) => i + 1);
      for (const pageNumber of pagesToCheck) {
        try {
          const page = await document.getPage(pageNumber);
          const content = await page.getTextContent();
          const text = content.items
            .filter((item) => "str" in item)
            .map((item) =>
              "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "",
            )
            .join("")
            .toWellFormed()
            .replaceAll("\u0000", " ")
            .replace(/[^\S\n]+/g, " ")
            .replace(/ *\n */g, "\n")
            .trim();
          freshPages.push({ page: pageNumber, text });
          if (text !== cache.pages.find((p) => p.page === pageNumber)?.text)
            cacheMismatches.push(pageNumber);
          if (text.replace(/\s/g, "").length < 80) sparsePages.push(pageNumber);
          if (actualBook.id === book.id) sourcePages.set(pageNumber, text);
          page.cleanup();
        } catch {
          unprocessedPages.push(pageNumber);
        }
      }
      measured.push({
        bookId: actualBook.id,
        pages: document.numPages,
        sha256,
        hashMatches,
        cacheMismatches,
        unprocessedPages,
        sparsePages,
      });
      if (actualBook.id === book.id) {
        // Re-run the existing parser using freshly extracted candidate/key pages.
        const extracted = {
          ...cache,
          pages: cache.pages.map((p) => ({
            ...p,
            text: sourcePages.get(p.page) ?? p.text,
          })),
        };
        for (const c of extractBookMcqs(metadata as Textbook, extracted)
          .candidates)
          sourceCandidateById.set(c.id, c);
        continue;
      }
      const chapters = outlineEntries.filter((o) =>
        /(?:CHAPTER|UNIT)[\s_-]*\d+/i.test(o.title),
      );
      const existing = coverage.books.find(
        (b: { id: string }) => b.id === actualBook.id,
      );
      for (const outline of outlineEntries.filter(
        (o) => !chapters.includes(o),
      )) {
        const parsed = existing.chapters.find(
          (c: { sourceStartPage: number }) =>
            c.sourceStartPage === outline.page,
        );
        excludedBookmarks.push({
          bookId: actualBook.id,
          title: outline.title,
          page: outline.page,
          existingParserChapter: parsed?.chapterNumber ?? null,
        });
      }
      for (const outline of chapters) {
        const chapter = Number(
          outline.title.match(/(?:CHAPTER|UNIT)[\s_-]*(\d+)/i)![1],
        );
        const nextBookmark = outlineEntries.find((o) => o.page > outline.page);
        const endPage = (nextBookmark?.page ?? document.numPages + 1) - 1;
        const pages = freshPages.filter(
          (p) => p.page >= outline.page && p.page <= endPage,
        );
        // Roman section I and the source's Tamil heading, never body option letters.
        const markerEvidence = pages.flatMap((p) =>
          p.text
            .split("\n")
            .filter((line) => {
              const heading = line.replace(/[\u0000-\u001f]/g, " ").trim();
              const compact = heading.replace(/\s/g, "");
              const answerWord = compact.indexOf("வி");
              // Source fonts damage சரியான differently across these books.
              // Require its retained ரி before the answer word, close to I;
              // equations such as I = ... must not become exercise headings.
              return (
                /^I[.\s)]/.test(heading) &&
                answerWord > 0 &&
                answerWord < 20 &&
                compact.slice(0, answerWord).includes("ரி")
              );
            })
            .map((line) => ({ page: p.page, line })),
        );
        const start = markerEvidence[0]?.page;
        const sectionEnd =
          start === undefined
            ? undefined
            : pages.find(
                (p) =>
                  p.page >= start &&
                  p.text
                    .split("\n")
                    .some((line) =>
                      /^II[.\s)]/.test(
                        line.replace(/[\u0000-\u001f]/g, " ").trim(),
                      ),
                    ),
              );
        const oneMarkPages = start
          ? pages
              .filter(
                (p) =>
                  p.page >= start && p.page <= (sectionEnd?.page ?? endPage),
              )
              .map((p) => p.page)
          : [];
        const keyEvidencePages = pages
          .filter((p) => {
            const pairs = [
              ...p.text.matchAll(
                /(?<!\d)\d{1,2}\s*[.)]\s*\(?\s*[abcdஅஆஇஈ](?=[\s).]|$)/giu,
              ),
            ];
            return pairs.length >= 5;
          })
          .map((p) => p.page);
        const actualChapterId = `tb-${actualBook.id}-ch-${chapter}`;
        const prior = existing.chapters.find(
          (c: { chapterNumber: number }) => c.chapterNumber === chapter,
        );
        const published = questions.filter(
          (q) =>
            q.data.status === "Published" &&
            q.data.chapterId === actualChapterId &&
            isTextPracticeQuestion(q.data),
        ).length;
        inventory.push({
          bookId: actualBook.id,
          textbook: actualBook.subject,
          volume: actualBook.volume,
          chapter,
          chapterId: actualChapterId,
          bookmark: outline.title,
          startPage: outline.page,
          endPage,
          oneMarkStartPages: markerEvidence.map((m) => m.page),
          oneMarkPages,
          keyEvidencePages,
          markerEvidence,
          candidates: prior?.candidates ?? 0,
          bookBackCandidates: prior?.bookBackCandidates ?? 0,
          published,
          issues: [
            "No source-approved book-back questions are published for this chapter; existing candidates require section mapping and individual teacher review.",
            ...(!start
              ? [
                  "No section-I Tamil exercise heading detected; inspect the original chapter ending manually.",
                ]
              : []),
            ...(!keyEvidencePages.length
              ? [
                  "No numbered option-key line detected; do not infer an official answer.",
                ]
              : [
                  "Numbered key evidence is provisional and must be scoped to the exact exercise; no answer was approved.",
                ]),
            ...(unprocessedPages.some((p) => p >= outline.page && p <= endPage)
              ? ["Page extraction failed in this chapter."]
              : []),
          ],
        });
      }
    } finally {
      await task.destroy();
    }
    console.log(
      JSON.stringify({
        sourceChecked: actualBook.id,
        pagesChecked: freshPages.length,
        failures: unprocessedPages.length,
        cacheMismatches: cacheMismatches.length,
      }),
    );
  }

  // Restrict the printed key to the actual numbered line, avoiding adjacent exercises.
  // This is evidence only: neither review state nor stored answers are changed.
  const keyText = sourcePages.get(39) || "";
  const keyLines = keyText
    .split("\n")
    .filter(
      (line) =>
        [...line.matchAll(/\d+\s*[.)]\s*\(\s*[அஆஇஈ]\s*\)/gu)].length >= 5,
    );
  const scopedKey = parsePrintedAnswerKey(keyLines.join("\n"));
  const wholePageKey = parsePrintedAnswerKey(keyText);
  const outcomes = entries.map((entry) => {
    const c = entry.candidate,
      q = questionsById.get(c.id),
      history = c.reviewHistory || [];
    const linkedAudits = audits.filter((a) => a.data.entityId === c.id);
    const candidateIssues: string[] = [];
    for (const event of history) {
      if (!linkedAudits.some((a) => reviewAuditMatches(c.id, event, a.data)))
        candidateIssues.push(
          `Decision audit missing or differs: ${event.action} ${event.at}`,
        );
      if (!actors.has(event.actorId))
        candidateIssues.push(`Recorded actor is missing: ${event.actorId}`);
      // Current roles may differ from the role at the historical decision.
      if (actors.get(event.actorId) !== "admin")
        candidateIssues.push(
          `Actor is not currently admin; check historical authorization: ${event.actorId}`,
        );
    }
    const original = c.originalExtraction || c;
    const fresh = sourceCandidateById.get(c.id);
    const originalMatched =
      !!fresh &&
      fresh.questionText === original.questionText &&
      JSON.stringify(fresh.options) === JSON.stringify(original.options);
    const packetMatched =
      c.reviewPreparation?.sourcePageText === sourcePages.get(c.page) &&
      c.reviewPreparation?.keyPageText === sourcePages.get(c.keyPage || 0);
    const mapped =
      c.chapterId === chapterId &&
      c.page >= 9 &&
      c.page < 47 &&
      q?.chapterId === chapterId;
    if (!originalMatched || !packetMatched || !mapped)
      candidateIssues.push(
        "Original source/packet/chapter correspondence failed",
      );
    const keyAnswer = scopedKey.answers.get(c.number) ?? null;
    const lastEvent = history.at(-1);
    const approvalRecorded =
      entry.reviewState === "approved" &&
      lastEvent?.action === "approve" &&
      !!c.reviewedBy &&
      c.reviewedBy === lastEvent.actorId &&
      linkedAudits.some(
        (a) =>
          a.data.review?.action === "approve" &&
          a.data.userId === lastEvent.actorId &&
          a.data.review?.at === lastEvent.at,
      );
    const valid =
      !!q &&
      isTextPracticeQuestion(q) &&
      [q.optionA, q.optionB, q.optionC, q.optionD].every((v) => !!v?.trim()) &&
      ["A", "B", "C", "D"].includes(q.correctAnswer) &&
      q.questionText === c.questionText &&
      JSON.stringify([q.optionA, q.optionB, q.optionC, q.optionD]) ===
        JSON.stringify(c.options) &&
      q.correctAnswer === c.correctAnswer;
    const published = q?.status === "Published";
    if (
      published &&
      (!approvalRecorded ||
        !valid ||
        !mapped ||
        candidateIssues.length ||
        q.correctAnswer !== keyAnswer)
    )
      candidateIssues.push(
        "Published question does not pass the recorded-approval/source/key/validity checks",
      );
    if (!published && entry.reviewState === "approved")
      candidateIssues.push(
        "Approved record is not published; inspect the recorded decision and bank state",
      );
    return {
      id: c.id,
      number: c.number,
      batchId: c.reviewPreparation?.batchId,
      reviewState: entry.reviewState,
      reviewed: history.length > 0,
      historyEvents: history.length,
      decisionAuditIds: linkedAudits.map((a) => a.id),
      history,
      sourcePage: c.page,
      printedPage: c.reviewPreparation?.printedPage,
      keyPage: c.keyPage,
      proposedAnswer: c.correctAnswer,
      scopedPrintedKeyEvidence: keyAnswer,
      storedKeyCheck: c.reviewPreparation?.keyCheck,
      originalMatched,
      packetMatched,
      chapterMatched: mapped,
      published,
      approvalRecorded,
      validBankText: valid,
      eligibleAfterRecordedApproval: !!(
        published &&
        approvalRecorded &&
        valid &&
        mapped &&
        !candidateIssues.length
      ),
      unresolved: reviewIssues(c),
      integrityIssues: candidateIssues,
    };
  });
  for (const outcome of outcomes)
    issues.push(...outcome.integrityIssues.map((i) => `${outcome.id}: ${i}`));
  for (const m of measured)
    if (m.cacheMismatches.length || m.unprocessedPages.length)
      issues.push(`Original extraction/cache failures: ${m.bookId}`);
  if (outcomes.length !== 10 || outcomes.some((o, i) => o.number !== i + 1))
    issues.push(
      "Expected Chapter 1 questions 1–10 are incomplete or duplicated",
    );
  const published = questions.filter(
    (q) => q.data.status === "Published" && isTextPracticeQuestion(q.data),
  );
  const summary = {
    candidates: outcomes.length,
    reviewed: outcomes.filter((o) => o.reviewed).length,
    pending: outcomes.filter((o) => o.reviewState === "needs_teacher_review")
      .length,
    approved: outcomes.filter((o) => o.reviewState === "approved").length,
    rejected: outcomes.filter((o) => o.reviewState === "rejected").length,
    decisionAudits: audits.length,
    chapterStudentReady: outcomes.filter((o) => o.eligibleAfterRecordedApproval)
      .length,
    publishedAllTextbooks: published.filter((q) => q.data.sourceTextbookId)
      .length,
    publishedTamil: published.filter((q) =>
      books.some(
        (b) => b.source_medium === "Tamil" && b.id === q.data.sourceTextbookId,
      ),
    ).length,
    heldLegacySamples: questions.filter(
      (q) =>
        q.data.questionOrigin === "Legacy Sample" &&
        q.data.status === "Teacher Review",
    ).length,
    targetBooks: targets.length,
    targetAcademicChapterRecords: inventory.length,
    targetChapterRecordsWithoutPublished: inventory.filter((c) => !c.published)
      .length,
    targetPagesChecked: measured
      .filter((m) => m.bookId !== book.id)
      .reduce((n, m) => n + m.pages, 0),
    targetUnprocessedPages: measured
      .filter((m) => m.bookId !== book.id)
      .reduce((n, m) => n + m.unprocessedPages.length, 0),
  };
  const checkedAt = new Date().toISOString();
  const report = {
    startedAt,
    liveReadAt,
    checkedAt,
    readOnly: true,
    method:
      "Fresh live records, decision audits, metadata and original PDF page extraction. Target PDFs checked on every page. Bookmarks explicitly labelled UNIT/CHAPTER define academic ranges; Roman section-I Tamil headings locate provisional one-mark exercise spans. No teacher decision or official answer is inferred.",
    book,
    chapterId,
    summary,
    scopedPrintedKey: {
      sourcePdfPage: 39,
      sourcePrintedPage: 31,
      lines: keyLines,
      conflict: scopedKey.conflict,
      wholePageConflict: wholePageKey.conflict,
      scopeWarning:
        "A source-key correspondence is evidence, not a teacher decision. Damaged Tamil text/options still need manual transcription.",
    },
    outcomes,
    measured,
    inventory,
    excludedBookmarks,
    issues,
  };
  await writeFile(
    "docs/tamil-accountancy-followup.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  const md = [
    "# Tamil Accountancy Chapter 1 — persisted decision audit",
    "",
    `Checked ${checkedAt}; live SELECT reads completed ${liveReadAt}. No approvals, edits, rejections or production deployment were performed.`,
    "",
    `**Reviewed ${summary.reviewed}; pending ${summary.pending}; approved ${summary.approved}; rejected ${summary.rejected}; decision audits ${summary.decisionAudits}; student-ready in this chapter ${summary.chapterStudentReady}.**`,
    "",
    `Textbook: ${book.title}; database medium ${book.source_medium}; volume ${book.volume || "not split"}; ID \`${book.id}\`; SHA-256 \`${book.sha256}\`. Chapter ID \`${chapterId}\`. Chapter 1 starts at PDF page 9; Chapter 2 starts at 47. Original unit-01 footer and numbered exercise on pages 38–39 corroborate this mapping.`,
    "",
    "PDF page 38 (printed 30) contains questions 1–9; PDF page 39 (printed 31) contains question 10 and its numbered key. Fresh source text matches the saved packets and original extracted wording/options; that match does **not** mean the OCR is suitable for publication. Tamil glyph substitutions, broken words and stray option parentheses remain flagged for teacher correction.",
    "",
    `Scoped printed key: ${outcomes.map((o) => `${o.number}: ${o.scopedPrintedKeyEvidence || "unknown"}`).join("; ")}. These are source observations, **not approved answers**. Whole-page key conflict: ${wholePageKey.conflict}; scoped-line conflict: ${scopedKey.conflict}. Existing ambiguous packet checks remain unchanged.`,
    "",
    "| No. | Candidate ID | PDF / printed page | Key page | Review state | Events / audits | Original / packet / chapter matches | Student-ready |",
    "|---:|---|---|---:|---|---|---|---|",
    ...outcomes.map(
      (o) =>
        `| ${o.number} | ${o.id} | ${o.sourcePage} / ${o.printedPage} | ${o.keyPage} | ${o.reviewState} | ${o.historyEvents} / ${o.decisionAuditIds.length} | ${o.originalMatched} / ${o.packetMatched} / ${o.chapterMatched} | ${o.eligibleAfterRecordedApproval} |`,
    ),
    "",
    `Integrity failures: ${issues.length}. ${issues.join("; ") || "No inconsistent live decisions or publications were found."}`,
    "",
    "No recorded teacher decision means zero reviewed questions. Source checking by a coding agent is not teacher verification. After a teacher acts, rerun `npm run mcqs:coverage -- --live`, `npm run mcqs:tamil-review` and `npm run mcqs:accountancy-followup` to check the newly persisted events and publication state. Reports never change candidate state.",
    "",
    "Open `/admin/textbook-questions` after admin login. Choose Textbook medium → Tamil medium, Accountancy, Chapter 1, batch `tb-12-accountancy-tamil-6e7f5476-ch-1-review-01`, and Needs review. Open one Review MCQ row, compare the original PDF/options and scoped key, correct the text, select the verified answer, and enter the teacher's evidence note. Save edits keeps it held; Reject requires a reason; Publish reviewed MCQ requires the explicit source/answer confirmation. Use an individually authorised account, reload, and inspect Review history and Published/Rejected filters. The CSV is reference-only and cannot approve a question.",
    "",
    "See [the complete Tamil queue](TAMIL_TEACHER_REVIEW.md), [candidate-level audit JSON](tamil-accountancy-followup.json), and [next extraction inventory](TAMIL_NEXT_EXTRACTION.md).",
    "",
  ];
  await writeFile("docs/TAMIL_ACCOUNTANCY_FOLLOWUP.md", md.join("\n"));
  await writeFile(
    "docs/tamil-next-extraction-inventory.csv",
    csvReference(
      inventory.map((i) => ({
        ...i,
        oneMarkStartPages: i.oneMarkStartPages.join(";"),
        oneMarkPages: i.oneMarkPages.join(";"),
        keyEvidencePages: i.keyEvidencePages.join(";"),
        issues: i.issues.join("; "),
      })),
      [
        "bookId",
        "textbook",
        "volume",
        "chapter",
        "chapterId",
        "bookmark",
        "startPage",
        "endPage",
        "oneMarkStartPages",
        "oneMarkPages",
        "keyEvidencePages",
        "candidates",
        "bookBackCandidates",
        "published",
        "issues",
      ],
    ),
  );
  const inv = [
    "# Next Tamil extraction inventory",
    "",
    `Original PDFs checked ${checkedAt}; live publication snapshot ${liveReadAt}. Selection uses actual database subject, volume and source_medium metadata. Each distinct PDF ID/hash is preserved, including optimised/full computer-book editions.`,
    "",
    `**${targets.length} PDF records; ${inventory.length} academic chapter records; ${summary.targetPagesChecked} freshly extracted pages; ${summary.targetUnprocessedPages} failed/unprocessed pages; ${summary.targetChapterRecordsWithoutPublished} chapter records with zero published questions.** Text extraction is not a claim of complete/readable MCQ transcription. Sparse/diagram pages and cache checks are listed per book in the JSON.`,
    "",
    "Section-I headings and source page spans below identify book-back one-mark sections provisionally. A span includes its ending page even when section II starts midway. Numbered answer-line detections are potential key evidence, not verified answers. Existing parser candidates in these PDFs are classified In-text, so book-back coverage remains missing. Locate each source section, preserve/reconcile existing IDs, transcribe Tamil/options/notation, scope any key, then submit to individual teacher review. Never duplicate optimised/full editions into a shared student chapter silently.",
    "",
    "| Textbook / volume | PDF ID | Chapter | PDF range | Section-I start | One-mark page span | Potential numbered key pages | Existing candidates / book-back | Published |",
    "|---|---|---:|---|---|---|---|---|---:|",
    ...inventory.map(
      (i) =>
        `| ${i.textbook} ${i.volume || ""} | ${i.bookId} | ${i.chapter} | ${i.startPage}–${i.endPage} | ${i.oneMarkStartPages.join(", ") || "not detected"} | ${i.oneMarkPages.join(", ") || "manual inspection needed"} | ${i.keyEvidencePages.join(", ") || "not detected"} | ${i.candidates} / ${i.bookBackCandidates} | ${i.published} |`,
    ),
    "",
    "## Back matter and parser discrepancies",
    "",
    "The inventory excludes front matter, practicals, appendices, glossary and acknowledgement bookmarks from academic chapters. No live chapter or candidate was deleted or remapped. Existing coverage counts are parser entries, not a confirmed academic contents inventory.",
    "",
    ...excludedBookmarks.map(
      (o) =>
        `- \`${o.bookId}\`: PDF page ${o.page}, ${clean(o.title)}${o.existingParserChapter === null ? "" : `; currently appears as parser chapter ${o.existingParserChapter} and needs a separate mapping repair`}.`,
    ),
    "",
    "## Priority",
    "",
    "Start Tamil Physics Volume 1 Unit 1 at the section-I pages listed above: preserve mathematical symbols/diagrams, delimit the printed key, and prepare held text candidates. Follow with Units 2–5, Computer Applications chapters 1–18 in each PDF record, and Computer Technology chapters 1–6 in each record. None currently has published questions. This inventory adds no questions or approvals.",
    "",
    "[Machine-readable candidate/source checks](tamil-accountancy-followup.json) · [chapter CSV](tamil-next-extraction-inventory.csv)",
    "",
  ];
  await writeFile("docs/TAMIL_NEXT_EXTRACTION.md", inv.join("\n"));
  console.log(
    JSON.stringify({ checkedAt, ...summary, integrityIssues: issues }, null, 2),
  );
  if (issues.length) process.exitCode = 1;
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
