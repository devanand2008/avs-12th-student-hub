import { loadEnvConfig } from "@next/env";
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import catalogJson from "../src/lib/textbooks-catalog.json";
import type { TextbookCatalog } from "../src/lib/textbooks";
import type { Question } from "../src/types";
import { requireSupabase } from "../src/lib/supabase/server";
import { isTextPracticeQuestion } from "../src/lib/practice-question-text";
import {
  extractBookMcqs,
  type ExtractedBook,
} from "./lib/textbook-question-parser";
import { CS_QUESTIONS } from "../src/lib/data/questions/cs";
import { BOTANY_QUESTIONS } from "../src/lib/data/questions/botany";
import { ZOOLOGY_QUESTIONS } from "../src/lib/data/questions/zoology";
import { MATHS_QUESTIONS } from "../src/lib/data/questions/maths";
import { ORIGINAL_PRACTICE_QUESTIONS } from "../src/lib/data/questions/original";
import { ALL_PRACTICE_QUESTIONS } from "../src/lib/data/questions";

type Row = {
  id?: string;
  kind?: string;
  book_id?: string;
  data: Record<string, unknown>;
};
type Snapshot = {
  checkedAt: string;
  projectHost: string;
  tables: Record<string, Row[]>;
  coverage: {
    bookId: string;
    published: number;
    review: number;
    total: number;
    chapters: { id: string; published: number }[];
  }[];
};
interface BookCoverage {
  id: string;
  subject: string;
  medium: string;
  volume: string | null;
  actualPages: number;
  pdfBytes: number;
  pdfHash?: string;
  cacheMatches: boolean;
  failure: string | null;
  identifiedChapters: number;
  chapters: Record<string, unknown>[];
  extractedCandidates: number;
  bookBackCandidates: number;
  autoEligible: number;
  published: number | null;
  publishedBookBack: number | null;
  publishedOther: number | null;
  printedKeyKnownAwaitingReview: number | null;
  pending: number | null;
  sparseTextPages: number[];
  damagedQuestionPages: number[];
  unprocessedPages: number;
  noBookBackChapters: number[];
  noReadyChapters: number[] | null;
  complete: boolean;
  invalidPublishedReferences: string[];
  legacyPrintedKeyChecks: { id: string; keyPage: number; matched: boolean }[];
  printedChapterChecks: {
    id: string;
    storedChapter: number;
    printedChapter: number | null;
    matched: boolean | null;
  }[];
  liveImportMatches: boolean | null;
}
const normal = (value: string) =>
  value.trim().toLocaleLowerCase().replace(/\s+/gu, " ");
function duplicates<T>(items: T[], key: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = key(item);
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  const groups = [...counts.values()].filter((n) => n > 1);
  return {
    groups: groups.length,
    extraRows: groups.reduce((n, count) => n + count - 1, 0),
  };
}
const csv = (value: unknown) =>
  '"' + String(value ?? "").replaceAll('"', '""') + '"';
const range = (values: number[]) => values.join(", ") || "none";
async function readLive(): Promise<Snapshot> {
  loadEnvConfig(process.cwd());
  const client = requireSupabase();
  async function read(table: string) {
    const order = table === "textbook_mcq_imports" ? "book_id" : "id";
    const first = await client
      .from(table)
      .select("*", { count: "exact" })
      .order(order)
      .range(0, 999);
    if (first.error) throw new Error(table + ": " + first.error.code);
    const rows = first.data || [];
    for (let offset = 1000; offset < (first.count || 0); offset += 1000) {
      const page = await client
        .from(table)
        .select("*")
        .order(order)
        .range(offset, offset + 999);
      if (page.error) throw new Error(table + ": " + page.error.code);
      rows.push(...(page.data || []));
    }
    if (rows.length !== first.count)
      throw new Error("Incomplete live read: " + table);
    return rows as Row[];
  }
  const tables = Object.fromEntries(
    await Promise.all(
      [
        "avs_questions",
        "textbook_mcq_candidates",
        "textbook_mcq_imports",
        "avs_curriculum",
      ].map(async (table) => [table, await read(table)]),
    ),
  );
  const coverage = await client.rpc("avs_textbook_mcq_catalog");
  if (coverage.error) throw new Error("Coverage RPC: " + coverage.error.code);
  const snapshot = {
    checkedAt: new Date().toISOString(),
    projectHost: new URL(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    ).hostname,
    tables,
    coverage: coverage.data,
  };
  await mkdir(".local", { recursive: true });
  await writeFile(
    ".local/independent-live-content.json",
    JSON.stringify(snapshot),
  );
  return snapshot;
}
async function main() {
  const catalog = catalogJson as TextbookCatalog;
  const live = process.argv.includes("--live") ? await readLive() : undefined;
  const published = (live?.tables.avs_questions || [])
    .map((row) => row.data as unknown as Question)
    .filter((question) => question.status === "Published");
  const ready = published.filter(isTextPracticeQuestion);
  const dbCandidates = (live?.tables.textbook_mcq_candidates || []).map(
    (row) => row.data,
  );
  const rawGenerated = [
    ...CS_QUESTIONS,
    ...BOTANY_QUESTIONS,
    ...ZOOLOGY_QUESTIONS,
    ...MATHS_QUESTIONS,
  ];
  const originalIds = new Set(
    ORIGINAL_PRACTICE_QUESTIONS.map((question) => question.id),
  );
  const generatedIds = new Set(rawGenerated.map((question) => question.id));
  const pdfFiles = (await readdir("public/textbooks")).filter((file) =>
    file.endsWith(".pdf"),
  );
  const books: BookCoverage[] = [];
  const sourceCandidates = [];
  const chapterRows: Record<string, unknown>[] = [];
  for (const book of catalog.books) {
    let pdfHash: string | undefined,
      actualPages = 0,
      pdfBytes = 0,
      failure: string | undefined;
    try {
      const bytes = await readFile("public" + book.localPath);
      pdfBytes = bytes.length;
      pdfHash = createHash("sha256").update(bytes).digest("hex");
      const task = getDocument({
        data: new Uint8Array(bytes),
        verbosity: 0,
        useSystemFonts: true,
      });
      try {
        actualPages = (await task.promise).numPages;
      } finally {
        await task.destroy();
      }
      if (pdfHash !== book.sha256)
        failure = "PDF checksum does not match catalog";
    } catch (error) {
      failure = error instanceof Error ? error.message : "PDF unreadable";
    }
    let extracted: ExtractedBook | undefined;
    try {
      extracted = JSON.parse(
        await readFile(`.local/textbook-text/${book.id}.json`, "utf8"),
      );
    } catch {
      failure ||= "Text cache missing or unreadable";
    }
    const cacheMatches =
      !!extracted &&
      extracted.id === book.id &&
      extracted.sha256 === pdfHash &&
      extracted.pages.length === actualPages &&
      extracted.pages.every((page, index) => page.page === index + 1);
    if (!cacheMatches)
      failure ||= "Extraction cache does not match verified PDF/pages";
    const parsed = extracted
      ? extractBookMcqs(book, extracted)
      : { candidates: [], chapters: [] };
    const { candidates, chapters } = parsed;
    sourceCandidates.push(...candidates);
    const bookReady = ready.filter(
      (question) => question.sourceTextbookId === book.id,
    );
    const readyIds = new Set(bookReady.map((question) => question.id));
    const invalidPublishedReferences = bookReady
      .filter(
        (question) =>
          !Number.isInteger(question.sourcePage) ||
          !question.sourcePage ||
          question.sourcePage > actualPages ||
          !Number.isInteger(question.sourceAnswerPage) ||
          !question.sourceAnswerPage ||
          question.sourceAnswerPage > actualPages,
      )
      .map((question) => question.id);
    const candidateMap = new Map(
      candidates.map((candidate) => [candidate.id, candidate]),
    );
    const legacyPrintedKeyChecks = bookReady
      .filter((question) => !candidateMap.get(question.id)?.correctAnswer)
      .map((question) => {
        const keyText =
          extracted?.pages.find(
            (page) => page.page === question.sourceAnswerPage,
          )?.text || "";
        const match = keyText.match(
          new RegExp(
            `(?:^|\\s)${question.sourceQuestionNumber}\\.\\s*\\(([a-d])\\)`,
            "i",
          ),
        );
        return {
          id: question.id,
          keyPage: question.sourceAnswerPage || 0,
          matched: match?.[1].toUpperCase() === question.correctAnswer,
        };
      });
    const liveImport = live?.tables.textbook_mcq_imports.find(
      (row) => row.book_id === book.id,
    )?.data;
    const printedChapterChecks = bookReady.map((question) => {
      const text =
        extracted?.pages.find((page) => page.page === question.sourcePage)
          ?.text || "";
      const headingAndFooter = text.slice(0, 250) + "\n" + text.slice(-400);
      const numbers = [
        ...new Set(
          [...headingAndFooter.matchAll(/\bCHAPTER[ _-]*0*(\d{1,2})\b/gi)].map(
            (match) => Number(match[1]),
          ),
        ),
      ];
      const storedChapter = Number(question.chapterId.match(/-ch-(\d+)$/)?.[1]);
      const printedChapter = numbers.length === 1 ? numbers[0] : null;
      return {
        id: question.id,
        storedChapter,
        printedChapter,
        matched:
          printedChapter === null ? null : printedChapter === storedChapter,
      };
    });
    const liveImportMatches = live
      ? liveImport?.sourceSha256 === book.sha256 &&
        liveImport?.pages === actualPages &&
        liveImport?.extractionVersion === 3
      : null;
    const held = candidates.filter((candidate) => !readyIds.has(candidate.id));
    const sparsePages = (extracted?.pages || [])
      .filter((page) => page.text.trim().length < 40)
      .map((page) => page.page);
    const damagedPages = [
      ...new Set(
        candidates
          .filter((candidate) =>
            candidate.qualityFlags.some((flag) =>
              /glyph|fragmented Tamil|separated Tamil|Transcribe mathematical|figure-dependent|original question|boundaries|original choices/i.test(
                flag,
              ),
            ),
          )
          .map((candidate) => candidate.page),
      ),
    ].sort((a, b) => a - b);
    const emptyChapters = chapters
      .filter(
        (chapter) =>
          !candidates.some(
            (candidate) =>
              candidate.chapterId === chapter.id &&
              candidate.section === "Book-back",
          ),
      )
      .map((chapter) => chapter.number);
    const zeroReadyChapters = chapters
      .filter(
        (chapter) =>
          !bookReady.some((question) => question.chapterId === chapter.id),
      )
      .map((chapter) => chapter.number);
    for (const chapter of chapters) {
      const chapterCandidates = candidates.filter(
        (candidate) => candidate.chapterId === chapter.id,
      );
      const chapterReady = bookReady.filter(
        (question) => question.chapterId === chapter.id,
      );
      const chapterHeld = chapterCandidates.filter(
        (candidate) => !readyIds.has(candidate.id),
      );
      chapterRows.push({
        bookId: book.id,
        subject: book.subject,
        medium: book.sourceMedium,
        volume: book.volume,
        chapterId: chapter.id,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        sourceStartPage: chapter.page,
        exercisePage: chapter.exercisePage ?? "",
        candidates: chapterCandidates.length,
        bookBackCandidates: chapterCandidates.filter(
          (candidate) => candidate.section === "Book-back",
        ).length,
        autoEligible: chapterCandidates.filter(
          (candidate) => candidate.status === "Published",
        ).length,
        published: live ? chapterReady.length : "not checked",
        publishedBookBack: live
          ? chapterReady.filter(
              (question) =>
                candidateMap.get(question.id)?.section === "Book-back",
            ).length
          : "not checked",
        publishedOther: live
          ? chapterReady.filter(
              (question) =>
                candidateMap.get(question.id)?.section !== "Book-back",
            ).length
          : "not checked",
        printedKeyKnownAwaitingReview: live
          ? chapterHeld.filter((candidate) => candidate.correctAnswer).length
          : "not checked",
        pending: live ? chapterHeld.length : "not checked",
        bookBackIdentified: chapterCandidates.some(
          (candidate) => candidate.section === "Book-back",
        ),
        coverageStatus: !live
          ? "Live publication not checked"
          : !chapterCandidates.some(
                (candidate) => candidate.section === "Book-back",
              )
            ? "No book-back candidates identified; inspect original exercise"
            : !chapterReady.length
              ? "No student-ready questions; review/extraction needed"
              : "Partial coverage; completeness not independently established",
      });
    }
    books.push({
      id: book.id,
      subject: book.subject,
      medium: book.sourceMedium,
      volume: book.volume,
      actualPages,
      pdfBytes,
      pdfHash,
      cacheMatches,
      failure: failure ?? null,
      identifiedChapters: chapters.length,
      chapters: chapterRows.filter((chapter) => chapter.bookId === book.id),
      extractedCandidates: candidates.length,
      bookBackCandidates: candidates.filter(
        (candidate) => candidate.section === "Book-back",
      ).length,
      autoEligible: candidates.filter(
        (candidate) => candidate.status === "Published",
      ).length,
      published: live ? bookReady.length : null,
      publishedBookBack: live
        ? bookReady.filter(
            (question) =>
              candidateMap.get(question.id)?.section === "Book-back",
          ).length
        : null,
      publishedOther: live
        ? bookReady.filter(
            (question) =>
              candidateMap.get(question.id)?.section !== "Book-back",
          ).length
        : null,
      printedKeyKnownAwaitingReview: live
        ? held.filter((candidate) => candidate.correctAnswer).length
        : null,
      pending: live ? held.length : null,
      sparseTextPages: sparsePages,
      damagedQuestionPages: damagedPages,
      unprocessedPages: actualPages - (extracted?.pages.length || 0),
      noBookBackChapters: emptyChapters,
      noReadyChapters: live ? zeroReadyChapters : null,
      complete: false,
      invalidPublishedReferences,
      legacyPrintedKeyChecks,
      printedChapterChecks,
      liveImportMatches,
    });
  }
  const sourceIds = new Set(sourceCandidates.map((candidate) => candidate.id));
  const candidateIds = new Set(
    dbCandidates.map((candidate) => candidate.id as string),
  );
  const textbookReady = ready.filter((question) => question.sourceTextbookId);
  const unmappedTextbookReady = textbookReady.filter(
    (question) => !sourceIds.has(question.id),
  );
  const publishedIds = new Set(ready.map((question) => question.id));
  const knownHeld = sourceCandidates.filter(
    (candidate) => candidate.correctAnswer && !publishedIds.has(candidate.id),
  );
  const candidateMap = new Map(
    sourceCandidates.map((candidate) => [candidate.id, candidate]),
  );
  const answerMismatches = textbookReady
    .filter((question) => {
      const candidate = candidateMap.get(question.id);
      return (
        question.answerVerification === "Textbook Answer Key" &&
        candidate?.correctAnswer &&
        candidate.correctAnswer !== question.correctAnswer
      );
    })
    .map((question) => question.id);
  const automaticTextMismatches = textbookReady
    .filter((question) => {
      const candidate = candidateMap.get(question.id);
      return (
        question.answerVerification === "Textbook Answer Key" &&
        candidate?.status === "Published" &&
        [
          question.questionText,
          question.optionA,
          question.optionB,
          question.optionC,
          question.optionD,
        ]
          .map(normal)
          .join("\n") !==
          [candidate.questionText, ...candidate.options].map(normal).join("\n")
      );
    })
    .map((question) => question.id);
  const duplicateCandidateMap = new Map<string, typeof sourceCandidates>();
  for (const candidate of sourceCandidates) {
    const key = JSON.stringify([
      candidate.bookId,
      candidate.chapterId,
      normal(candidate.questionText),
      ...candidate.options.map(normal),
    ]);
    duplicateCandidateMap.set(key, [
      ...(duplicateCandidateMap.get(key) || []),
      candidate,
    ]);
  }
  const duplicateCandidateGroups = [...duplicateCandidateMap.values()]
    .filter((group) => group.length > 1)
    .map((group) =>
      group.map((candidate) => ({
        id: candidate.id,
        bookId: candidate.bookId,
        chapterId: candidate.chapterId,
        number: candidate.number,
        page: candidate.page,
        status: candidate.status,
      })),
    );
  const catalogCountMismatches = live
    ? books.flatMap((book) => {
        const entry = live.coverage.find((item) => item.bookId === book.id);
        const problems: string[] = [];
        if (!entry || entry.published !== book.published)
          problems.push(
            `${book.id}: published book total disagrees with question rows`,
          );
        for (const chapter of book.chapters) {
          if (
            entry?.chapters.find((item) => item.id === chapter.chapterId)
              ?.published !== chapter.published
          )
            problems.push(
              `${chapter.chapterId}: published chapter total disagrees with question rows`,
            );
        }
        return problems;
      })
    : [];
  const sum = (
    field:
      | "autoEligible"
      | "extractedCandidates"
      | "bookBackCandidates"
      | "actualPages"
      | "identifiedChapters",
  ) => books.reduce((sum, book) => sum + book[field], 0);
  const readyDuplicate = duplicates(ready, (question) =>
    JSON.stringify([
      question.chapterId,
      ...[
        question.questionText,
        question.optionA,
        question.optionB,
        question.optionC,
        question.optionD,
      ].map(normal),
    ]),
  );
  const report = {
    checkedAt: new Date().toISOString(),
    liveReadAt: live?.checkedAt ?? null,
    liveProjectHost: live?.projectHost ?? null,
    readOnly: true,
    catalogRecords: catalog.books.length,
    physicalPdfFiles: pdfFiles.length,
    uniquePdfHashes: new Set(books.map((book) => book.pdfHash).filter(Boolean))
      .size,
    pdfFailures: books.filter((book) => book.failure).length,
    pdfBytes: books.reduce((sum, book) => sum + book.pdfBytes, 0),
    liveImportMismatches: live
      ? books.filter((book) => !book.liveImportMatches).length
      : null,
    invalidPublishedReferences: books.flatMap(
      (book) => book.invalidPublishedReferences,
    ),
    legacyPrintedKeyChecks: books.flatMap(
      (book) => book.legacyPrintedKeyChecks,
    ),
    printedChapterSupported: books
      .flatMap((book) => book.printedChapterChecks)
      .filter((check) => check.matched === true).length,
    printedChapterNotCorroborated: books
      .flatMap((book) => book.printedChapterChecks)
      .filter((check) => check.matched === null).length,
    printedChapterMismatches: books
      .flatMap((book) => book.printedChapterChecks)
      .filter((check) => check.matched === false),
    pages: sum("actualPages"),
    identifiedChapterUnitEntries: sum("identifiedChapters"),
    booksWithBookBackCandidates: books.filter(
      (book) => book.bookBackCandidates > 0,
    ).length,
    booksWithStudentReadyQuestions: live
      ? books.filter((book) => book.published! > 0).length
      : null,
    autoEligible: sum("autoEligible"),
    sourceCandidates: sourceCandidates.length,
    sourceCandidatesPending: sourceCandidates.filter(
      (candidate) => candidate.status !== "Published",
    ).length,
    sourceCandidatesWithKnownKey: sourceCandidates.filter(
      (candidate) => candidate.correctAnswer,
    ).length,
    bookBackCandidates: sum("bookBackCandidates"),
    livePublishedRows: live ? published.length : null,
    studentReady: live ? ready.length : null,
    studentReadyTextbook: live ? textbookReady.length : null,
    studentReadyBookBackByParser: live
      ? textbookReady.filter(
          (question) => candidateMap.get(question.id)?.section === "Book-back",
        ).length
      : null,
    studentReadyOtherTextbookSections: live
      ? textbookReady.filter(
          (question) => candidateMap.get(question.id)?.section !== "Book-back",
        ).length
      : null,
    studentReadyOther: live ? ready.length - textbookReady.length : null,
    studentReadyWithFourChoices: live
      ? ready.filter((question) =>
          [
            question.optionA,
            question.optionB,
            question.optionC,
            question.optionD,
          ].every((option) => option?.trim()),
        ).length
      : null,
    invalidPublishedAnswers: ready
      .filter(
        (question) => !["A", "B", "C", "D"].includes(question.correctAnswer),
      )
      .map((question) => question.id),
    publishedUnreadable: live ? published.length - ready.length : null,
    liveCandidates: live ? dbCandidates.length : null,
    liveCandidatesMarkedPublished: live
      ? dbCandidates.filter((candidate) => candidate.status === "Published")
          .length
      : null,
    liveCandidatesMarkedReview: live
      ? dbCandidates.filter((candidate) => candidate.status === "Needs Review")
          .length
      : null,
    liveCandidatesExcludedFromPractice: live
      ? dbCandidates.filter(
          (candidate) => !publishedIds.has(candidate.id as string),
        ).length
      : null,
    printedKeyKnownExcludedFromPractice: live ? knownHeld.length : null,
    livePreparedForTeacherReview: live
      ? dbCandidates.filter(
          (c) =>
            c.reviewPreparation && c.reviewStatus === "needs_teacher_review",
        ).length
      : null,
    liveRejectedCandidates: live
      ? dbCandidates.filter((c) => c.reviewStatus === "rejected").length
      : null,
    livePendingCandidates: live
      ? dbCandidates.filter(
          (c) =>
            !publishedIds.has(c.id as string) && c.reviewStatus !== "rejected",
        ).length
      : null,
    liveLegacySamplesHeld: live
      ? live.tables.avs_questions.filter(
          (row) =>
            row.data.questionOrigin === "Legacy Sample" &&
            row.data.status !== "Published",
        ).length
      : null,
    rawOriginalSamples: ORIGINAL_PRACTICE_QUESTIONS.length,
    seedOriginalSamplesHeld: ALL_PRACTICE_QUESTIONS.filter(
      (q) =>
        q.questionOrigin === "Legacy Sample" && q.status === "Teacher Review",
    ).length,
    sourceIdsMissingLive: live
      ? sourceCandidates.filter((candidate) => !candidateIds.has(candidate.id))
          .length
      : null,
    unmappedTextbookReady: unmappedTextbookReady.map((question) => question.id),
    answerMismatches,
    automaticTextMismatches,
    catalogCountMismatches,
    duplicateCandidateGroups,
    sourceIdDuplicates: duplicates(
      sourceCandidates,
      (candidate) => candidate.id,
    ),
    sourceContentDuplicatesWithinChapter: duplicates(
      sourceCandidates,
      (candidate) =>
        JSON.stringify([
          candidate.bookId,
          candidate.chapterId,
          normal(candidate.questionText),
          ...candidate.options.map(normal),
        ]),
    ),
    readyContentDuplicatesWithinChapter: readyDuplicate,
    generatedDataset: {
      rawRows: rawGenerated.length,
      uniqueRawIds: generatedIds.size,
      overlapWithOriginalIds: rawGenerated.filter((question) =>
        originalIds.has(question.id),
      ).length,
      exportedGeneratedPublished: ALL_PRACTICE_QUESTIONS.filter(
        (question) =>
          question.id.startsWith("review-generated-") &&
          question.status === "Published",
      ).length,
      liveGeneratedNamespaceRows: live
        ? live.tables.avs_questions.filter(
            (row) =>
              generatedIds.has(row.id!) ||
              String(row.id).startsWith("review-generated-"),
          ).length
        : null,
      livePublishedGeneratedDraftIds: ready.filter((question) =>
        question.id.startsWith("review-generated-"),
      ).length,
      livePublishedLegacyGeneratedIds: ready.filter(
        (question) =>
          generatedIds.has(question.id) && !originalIds.has(question.id),
      ).length,
      liveUnverifiedLegacyDrafts: live
        ? live.tables.avs_questions.filter(
            (row) =>
              generatedIds.has(row.id!) &&
              !originalIds.has(row.id!) &&
              row.data.status === "Teacher Review",
          ).length
        : null,
    },
    books,
  };
  await writeFile(
    "docs/independent-textbook-coverage.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  const columns = Object.keys(chapterRows[0] || {});
  await writeFile(
    "docs/independent-chapter-coverage.csv",
    [
      columns.map(csv).join(","),
      ...chapterRows.map((row) =>
        columns.map((column) => csv(row[column])).join(","),
      ),
    ].join("\n") + "\n",
  );
  const table = [
    "# Independently measured textbook coverage",
    "",
    `Measured ${report.checkedAt}. Live database: ${live ? live.projectHost : "not checked"}. Physical PDFs were opened and hashed; cached page counts and source hashes were checked.`,
    "",
    "Detected chapter/unit entries are parser findings, not a teacher-approved chapter inventory. No book is marked complete. Zero candidates can mean unsupported extraction or a book without structured MCQs; inspect the original exercises before deciding.",
    "Prepared source-review packets are listed in [teacher review batches](TEACHER_REVIEW_BATCHES.md); the [prioritized chapter backlog](TEXTBOOK_COVERAGE_BACKLOG.md) separates extraction, answer verification, teacher review, partial publication and manual/OCR work. Preparation is not approval.",
    "",
    "| Textbook record | Medium | Volume | Detected chapters/units | Book-back candidates | Auto-eligible | Student-ready | Known printed key, held | No book-back candidates (chapter nos.) | No ready questions (chapter nos.) | Unprocessed pages | Sparse text pages | Damaged question pages |",
    "|---|---|---|---:|---:|---:|---:|---:|---|---|---:|---:|---:|",
    ...books.map(
      (book) =>
        `| ${book.subject}<br><small>${book.id}</small> | ${book.medium} | ${book.volume || "—"} | ${book.identifiedChapters} | ${book.bookBackCandidates} | ${book.autoEligible} | ${book.published ?? "not checked"} | ${book.printedKeyKnownAwaitingReview ?? "not checked"} | ${range(book.noBookBackChapters)} | ${book.noReadyChapters ? range(book.noReadyChapters) : "not checked"} | ${book.unprocessedPages} | ${book.sparseTextPages.length} | ${book.damagedQuestionPages.length} |`,
    ),
    "",
    "Sparse pages contain fewer than 40 extracted characters and may be blank/front matter, not necessarily scanned. Damaged question pages are identified from parser review flags; this is not an exhaustive OCR quality assessment. Exact page lists, failure reasons and all chapter rows are in [the JSON evidence](independent-textbook-coverage.json). The complete chapter table is [the CSV](independent-chapter-coverage.csv).",
    "",
  ];
  await writeFile("docs/INDEPENDENT_COVERAGE.md", table.join("\n"));
  const { books: omitBooks, ...summary } = report;
  void omitBooks;
  console.log(JSON.stringify(summary));
  if (
    report.pdfFailures ||
    report.sourceIdDuplicates.extraRows ||
    (live &&
      (report.publishedUnreadable ||
        report.sourceIdsMissingLive ||
        unmappedTextbookReady.length ||
        report.liveImportMismatches ||
        report.invalidPublishedReferences.length ||
        report.legacyPrintedKeyChecks.some((check) => !check.matched) ||
        report.answerMismatches.length ||
        report.automaticTextMismatches.length ||
        report.catalogCountMismatches.length ||
        report.printedChapterMismatches.length ||
        report.invalidPublishedAnswers.length ||
        report.studentReadyWithFourChoices !== ready.length))
  )
    process.exitCode = 1;
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
