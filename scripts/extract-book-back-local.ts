import { readFile, writeFile, mkdir, readdir, rename } from "node:fs/promises";
import path from "node:path";
import catalog from "../src/lib/textbooks-catalog.json";
import type { Textbook } from "../src/lib/textbooks";
import type { Question } from "../src/types";
import { extractText } from "./lib/textbook-pdf-text";
import { extractBookMcqs } from "./lib/textbook-question-parser";
import {
  heldExtractionRecord,
  inventoryBookBackSections,
  mergeHeldRecords,
  recoverSectionCandidates,
} from "./lib/book-back-inventory";
import { selectPracticeQuestions } from "../src/lib/textbook-practice-selection";
import { csvCell } from "../src/lib/csv";
import {
  extractSourceBoundedCandidates,
  combineExtractionProposals,
} from "./lib/source-bounded-extraction";

// Local-only: no environment loading, database client, import or publication.
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 2)
  if (!["--book-id", "--snapshot"].includes(args[i]) || !args[i + 1])
    throw new Error(
      "Use --book-id <catalog ID> and/or --snapshot <local read-only snapshot>.",
    );
const option = (name: string) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const selectedId = option("--book-id");
if (selectedId && !catalog.books.some((b) => b.id === selectedId))
  throw new Error("Unknown catalog book.");
const directory = ".local/teacher-review/extracted-books";
async function atomic(file: string, value: unknown) {
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(value, null, 2) + "\n");
  await rename(tmp, file);
}
async function optionalJson(file: string) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    return null;
  }
}
async function main() {
  await mkdir(directory, { recursive: true });
  const snapshotFile =
    option("--snapshot") || ".local/independent-live-content.json";
  const snapshot = await optionalJson(snapshotFile);
  const published = snapshot
    ? selectPracticeQuestions(
        snapshot.tables.avs_questions.map((r: { data: Question }) => r.data),
        {},
      )
    : [];
  const inventory: { file: string; catalogId: string | null }[] = [];
  async function scan(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await scan(file);
      else if (entry.isFile() && /\.pdf$/i.test(entry.name))
        inventory.push({
          file,
          catalogId:
            catalog.books.find(
              (b) =>
                b.localPath ===
                "/" + file.replaceAll("\\", "/").replace(/^public\//, ""),
            )?.id || null,
        });
    }
  }
  await scan("public/textbooks");
  const failures: { bookId: string; error: string }[] = [];
  for (const book of catalog.books.filter(
    (b) => !selectedId || b.id === selectedId,
  )) {
    try {
      const text = await extractText(book as Textbook);
      const parsed = extractBookMcqs(book as Textbook, text);
      const file = path.join(directory, `${book.id}.json`);
      const old = await optionalJson(file);
      const detectedSections = inventoryBookBackSections(
        text,
        parsed.chapters,
        book as Textbook,
      );
      const bounded = await extractSourceBoundedCandidates(
        book as Textbook,
        text,
        parsed.candidates,
        old?.candidates || [],
      );
      const boundedChapters = new Set(bounded.sections.map((s) => s.chapterId));
      const sections = [
        ...detectedSections.filter((s) => !boundedChapters.has(s.chapterId)),
        ...bounded.sections,
      ];
      const recovered = recoverSectionCandidates(
        book as Textbook,
        sections.filter((s) => !boundedChapters.has(s.chapterId)),
        parsed.candidates,
      );
      const extractionCandidates = combineExtractionProposals(
        parsed.candidates,
        recovered.recovered,
        bounded.candidates,
      );
      const parsedIds = new Set(parsed.candidates.map((c) => c.id));
      const next = extractionCandidates.map((c) =>
        heldExtractionRecord(c, text.pages, sections),
      );
      const merged = mergeHeldRecords(old?.candidates || [], next);
      const activeIds = new Set(next.map((c) => c.id));
      const active = merged.records.filter((c) => activeIds.has(c.id));
      const bank = published.filter((q) => q.sourceTextbookId === book.id);
      const progress = await optionalJson(
        `.local/textbook-text/${book.id}.progress.json`,
      );
      const report = {
        schemaVersion: 1,
        checkedAt: new Date().toISOString(),
        parserVersion: 3,
        book: {
          id: book.id,
          subject: book.subject,
          title: book.title,
          medium: book.sourceMedium,
          class: book.class,
          volume: book.volume,
          edition: book.edition,
          sourceFile: book.sourceFile,
          sourceSha256: book.sha256,
        },
        pages: text.pages.length,
        completedPages: progress.completedPages,
        failedPages: progress.failedPages,
        sparsePages: progress.unreadableOrSparsePages,
        sectionInventory: sections,
        recoveredSectionCandidates: extractionCandidates.filter(
          (c) => !parsedIds.has(c.id),
        ).length,
        sourceBoundedQuestionInventory: bounded.summaries,
        sourceBoundedProposals: bounded.candidates,
        ambiguousIdentityMatches: recovered.ambiguous,
        extractedCandidates: active.length,
        preservedCandidateRecords: merged.records.length,
        activeExtractionIds: [...activeIds],
        // Refresh derived source boundaries separately. Saved candidate edits,
        // original extraction and decision history remain byte-for-byte intact.
        currentSourceEvidence: next.map((c) => ({
          candidateId: c.id,
          sourceSha256: c.sourceSha256,
          sectionEvidence: c.sectionEvidence,
          sourceRawQuestionSpans: c.sourceRawQuestionSpans,
          printedPage: c.printedPage,
          printedPageStatus: c.printedPageStatus,
          chapterMappingStatus: c.chapterMappingStatus,
        })),
        quarantinedCandidateIds: merged.records
          .filter((c) => !activeIds.has(c.id))
          .map((c) => c.id),
        newStableIds: merged.added,
        parserBookBackCandidates: parsed.candidates.filter(
          (c) => c.section === "Book-back",
        ).length,
        parserTextAndKeyEligible: parsed.candidates.filter(
          (c) => c.status === "Published",
        ).length,
        localStatus: "Held; individual teacher review required",
        practicePublished: false,
        publicationSnapshot: snapshot
          ? {
              file: snapshotFile,
              checkedAt: snapshot.checkedAt,
              published: bank.length,
            }
          : null,
        chapters: parsed.chapters.map((ch) => {
          const candidates = extractionCandidates.filter(
            (c) => c.chapterId === ch.id,
          );
          const scoped = sections.filter((s) => s.chapterId === ch.id);
          const boundedSummary = bounded.summaries.find(
            (s) => s.chapterId === ch.id,
          );
          return {
            id: ch.id,
            number: ch.number,
            title: boundedSummary?.chapterTitle ?? ch.title,
            startPdfPage: ch.page,
            exercisePdfPages: scoped.flatMap((s) => [
              s.startPdfPage,
              s.endPdfPage,
            ]),
            sectionCount: scoped.length,
            extractedCandidates: candidates.length,
            bookBackCandidates: candidates.filter(
              (c) => c.section === "Book-back",
            ).length,
            sourceSectionAssociatedCandidates: candidates.filter((c) =>
              scoped.some((s) =>
                s.questionSpans.some(
                  (span) => span.pdfPage === c.page && span.number === c.number,
                ),
              ),
            ).length,
            textAndKeyEligible: candidates.filter(
              (c) => c.status === "Published",
            ).length,
            answerKnown: candidates.filter((c) => c.correctAnswer).length,
            damagedOrAmbiguous: candidates.filter((c) => c.qualityFlags.length)
              .length,
            published: snapshot
              ? bank.filter((q) => q.chapterId === ch.id).length
              : null,
            authenticSourceQuestionTotal:
              boundedSummary?.sourceInventoriedQuestions ?? null,
            printedKeyMatchedSourceQuestions:
              boundedSummary?.keyMatched ?? null,
            sourceBoundedCandidateIds: bounded.candidates
              .filter((c) => c.chapterId === ch.id)
              .map((c) => c.id),
            complete: false,
            warnings: [
              boundedSummary
                ? `Source exercise numbering/pages and available key evidence were inspected; ${book.sourceMedium} wording, options, notation and figures still require teacher verification`
                : "Chapter and section boundaries require source verification",
              ...(!scoped.length
                ? [
                    "No scoped one-mark heading detected; inspect the original exercise",
                  ]
                : []),
              ...(!candidates.length
                ? ["No MCQ options extracted; manual/OCR inventory needed"]
                : []),
            ],
          };
        }),
        candidates: merged.records,
      };
      await atomic(file, report);
      console.log(
        JSON.stringify({
          bookId: book.id,
          pages: text.pages.length,
          candidates: merged.records.length,
          added: merged.added,
          sections: sections.length,
          held: true,
        }),
      );
    } catch (error) {
      const failure = {
        bookId: book.id,
        error: error instanceof Error ? error.message : "Extraction failed",
      };
      failures.push(failure);
      console.error(JSON.stringify(failure));
    }
  }
  const reports = [];
  for (const book of catalog.books) {
    const report = await optionalJson(path.join(directory, `${book.id}.json`));
    if (report) reports.push(report);
  }
  const ids = reports.flatMap(
    (r) =>
      r.activeExtractionIds || r.candidates.map((c: { id: string }) => c.id),
  );
  const report = {
    checkedAt: new Date().toISOString(),
    pdfInventory: inventory,
    discoveredPdfs: inventory.length,
    catalogPdfs: catalog.books.length,
    processedReports: reports.length,
    processedPages: reports.reduce((n, r) => n + r.pages, 0),
    uniqueCandidateIds: new Set(ids).size,
    duplicateCandidateIds: ids.length - new Set(ids).size,
    preservedCandidateRecords: reports.reduce(
      (n, r) => n + r.candidates.length,
      0,
    ),
    quarantinedCandidateRecords: reports.reduce(
      (n, r) => n + (r.quarantinedCandidateIds?.length || 0),
      0,
    ),
    parserBookBackCandidates: reports.reduce(
      (n, r) => n + r.parserBookBackCandidates,
      0,
    ),
    textAndKeyEligibleCandidates: reports.reduce(
      (n, r) => n + r.parserTextAndKeyEligible,
      0,
    ),
    approvedNewCandidates: 0,
    sourceBoundedInventoriedQuestions: reports.reduce(
      (n, r) =>
        n +
        (r.sourceBoundedQuestionInventory || []).reduce(
          (s: number, b: { sourceInventoriedQuestions: number }) =>
            s + b.sourceInventoriedQuestions,
          0,
        ),
      0,
    ),
    recoveredSectionCandidates: reports.reduce(
      (n, r) => n + (r.recoveredSectionCandidates || 0),
      0,
    ),
    publishedNewCandidates: 0,
    sourceCollectionComplete: false,
    failures,
    publicationSnapshot: snapshot
      ? { file: snapshotFile, checkedAt: snapshot.checkedAt }
      : null,
    studentReady: published.length,
    studentReadyByMedium: Object.fromEntries(
      ["English", "Tamil"].map((m) => [
        m,
        published.filter((q) => q.language === m).length,
      ]),
    ),
    books: reports.map((r) => ({
      book: r.book,
      pages: r.pages,
      completedPages: r.completedPages,
      failedPages: r.failedPages,
      sparsePages: r.sparsePages,
      extractedCandidates: r.extractedCandidates,
      parserBookBackCandidates: r.parserBookBackCandidates,
      recoveredSectionCandidates: r.recoveredSectionCandidates,
      sourceBoundedQuestionInventory: r.sourceBoundedQuestionInventory || [],
      ambiguousIdentityMatches: r.ambiguousIdentityMatches,
      parserTextAndKeyEligible: r.parserTextAndKeyEligible,
      publicationSnapshot: r.publicationSnapshot,
      chapters: r.chapters,
      sectionInventory: r.sectionInventory.map(
        (s: { sourceText: string; [key: string]: unknown }) => ({
          chapterId: s.chapterId,
          startPdfPage: s.startPdfPage,
          endPdfPage: s.endPdfPage,
          heading: s.heading,
          questionNumbers: s.questionNumbers,
          mappingStatus: s.mappingStatus,
        }),
      ),
      complete: false,
    })),
    limits:
      "Parser candidates include in-text material and damaged extraction. Section associations are provisional; authentic source totals, printed-page mappings, figures and final approvals remain unverified. No record is automatically imported or published.",
  };
  await atomic("docs/book-back-extraction-coverage.json", report);
  const columns = [
    "bookId",
    "subject",
    "medium",
    "volume",
    "chapterId",
    "number",
    "title",
    "startPdfPage",
    "sectionCount",
    "extractedCandidates",
    "bookBackCandidates",
    "sourceSectionAssociatedCandidates",
    "authenticSourceQuestionTotal",
    "printedKeyMatchedSourceQuestions",
    "textAndKeyEligible",
    "damagedOrAmbiguous",
    "published",
    "complete",
  ];
  const csv = (v: unknown) => csvCell(String(v ?? ""));
  const rows = reports.flatMap((r) =>
    r.chapters.map((ch: Record<string, unknown>) => ({
      bookId: r.book.id,
      subject: r.book.subject,
      medium: r.book.medium,
      volume: r.book.volume,
      chapterId: ch.id,
      ...ch,
    })),
  );
  await writeFile(
    "docs/book-back-chapter-coverage.csv",
    [
      columns.map(csv).join(","),
      ...rows.map((r) => columns.map((c) => csv(r[c])).join(",")),
    ].join("\n") + "\n",
  );
  console.log(
    JSON.stringify({
      discovered: inventory.length,
      processed: reports.length,
      pages: report.processedPages,
      uniqueCandidates: report.uniqueCandidateIds,
      bookBackCandidates: report.parserBookBackCandidates,
      chapters: rows.length,
      failures: failures.length,
      publishedNew: 0,
    }),
  );
  if (failures.length || report.duplicateCandidateIds) process.exitCode = 1;
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
