import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import catalog from "../src/lib/textbooks-catalog.json";
import definitions from "./data/computer-source-sections.json";
import { readySourceDefinitions as sharedDefinitions } from "./lib/shared-source-definitions";
import { loadSharedSourceReviewBatches } from "./lib/shared-source-review";
import {
  commerceReviewDefinition,
  loadCommerceReviewBatches,
} from "./lib/commerce-review-batches";
import inspections from "./data/coverage-source-inspections.json";
import { selectPracticeQuestions } from "../src/lib/textbook-practice-selection";
import { loadComputerReviewBatches } from "./lib/computer-review-batches";
import {
  reconcileManifest,
  readOptionalJson,
  type LocalReviewer,
  type LocalReviewManifest,
} from "./lib/local-physics-review";
import { auditTeacherManifest } from "./lib/teacher-decision-audit";
import type { Question } from "../src/types";

const hash = (bytes: Buffer | string) =>
  createHash("sha256").update(bytes).digest("hex");
async function main() {
  const args = process.argv.slice(2);
  assert.ok(
    !args.length || (args.length === 2 && args[0] === "--manifest"),
    "Use --manifest <actual source-batch JSON export>; no import is available",
  );
  const root = process.cwd(),
    directory = path.resolve(".local/teacher-review/physics-unit1-workflow");
  const reviewers = (
    (await readOptionalJson<LocalReviewer[]>(
      path.join(directory, "reviewers.json"),
    )) || []
  ).map(({ id, name, email }) => ({ id, name, email }));
  const configurations = [...definitions, commerceReviewDefinition, ...sharedDefinitions];
  const batches = [
    ...(await loadComputerReviewBatches(root)),
    ...(await loadCommerceReviewBatches(root)),
    ...(await loadSharedSourceReviewBatches(root)),
  ];
  assert.equal(
    batches.length,
    configurations.length,
    "Prepare all actual source batches and images first",
  );
  const snapshot = JSON.parse(
    await readFile(".local/independent-live-content.json", "utf8"),
  );
  const published = selectPracticeQuestions(
    snapshot.tables.avs_questions.map((r: { data: Question }) => r.data),
    {},
  );
  const reports: {
    book: { id: string };
    chapters: {
      id: string;
      number: number;
      published: number;
      startPdfPage: number;
      exercisePdfPages: number[];
    }[];
  }[] = [];
  for (const book of catalog.books) {
    const report = JSON.parse(
      await readFile(
        `.local/teacher-review/extracted-books/${book.id}.json`,
        "utf8",
      ),
    );
    assert.equal(report.book.id, book.id);
    reports.push(report);
  }
  const chapterRows = reports.flatMap((r) =>
    r.chapters.map((c: { id: string; published: number }) => ({
      ...c,
      bookId: r.book.id,
    })),
  );
  const zeroPublished = chapterRows.filter(
    (c) =>
      !published.some(
        (q) => q.sourceTextbookId === c.bookId && q.chapterId === c.id,
      ),
  );
  const selected = [];
  for (const batch of batches) {
    const manifestFile = path.join(directory, batch.id, "decisions.json");
    const saved = await readOptionalJson<LocalReviewManifest>(manifestFile);
    const manifest = reconcileManifest(batch.candidates, saved);
    const audit = auditTeacherManifest(manifest, {
      candidates: batch.candidates,
      persisted: manifest,
      reviewers,
      requireExport: false,
    });
    assert.ok(audit.valid, JSON.stringify(audit.issues));
    const definition = configurations.find(
      (d) =>
        batch.candidates[0].bookId === d.bookId &&
        batch.unit === d.chapterNumber,
    )!;
    assert.ok(!published.some((q) => q.sourceTextbookId === definition.bookId));
    selected.push({
      bookId: definition.bookId,
      subject: definition.subject,
      medium: definition.medium,
      volume: definition.volume,
      sourceFile: definition.sourceFile,
      sourceSha256: definition.sourceSha256,
      chapterNumber: definition.chapterNumber,
      chapterTitle: definition.chapterTitle,
      batchId: batch.id,
      sourceBatchId: batch.candidates[0].reviewPreparation!.batchId,
      sourcePdfPages: definition.pages.map((p) => p.page),
      printedPages: definition.pages.map((p) => p.printedPage),
      additionalInspectedPages: [
        definition.chapterStartPdfPage,
        ...definition.inspectedEndingPages,
      ],
      inventoried: batch.candidates.length,
      answerEvidence: definition.keyEvidence,
      knownAnswers: batch.candidates.filter((c) => c.correctAnswer !== null)
        .length,
      printedKeyMatches: batch.candidates.filter((c) =>
        Boolean(c.keyPage && c.correctAnswer),
      ).length,
      nonemptyFourOptionPositions: batch.candidates.filter(
        (c) => c.options.length === 4 && c.options.every((o) => o.trim()),
      ).length,
      incompleteRequiredContent: batch.candidates
        .filter((c) => !c.extractionEvidence.completeTextOptions)
        .map((c) => c.number),
      duplicateOptionQuestions: batch.candidates
        .filter((c) => new Set(c.options).size !== c.options.length)
        .map((c) => c.number),
      reusedCandidateIds: batch.candidates.filter(
        (c) => c.extractionEvidence.reusedExistingId,
      ).length,
      newlyRecoveredCandidateIds: batch.candidates.filter(
        (c) => !c.extractionEvidence.reusedExistingId,
      ).length,
      requiresTamilCorrection: batch.candidates.filter((c) =>
        c.qualityFlags.some((w) => w.includes("Tamil")),
      ).length,
      diagramDependent: batch.candidates.filter(
        (c) => c.extractionEvidence.requiresDiagram,
      ).length,
      excludedItems: definition.excludedItems,
      manifestPath: saved ? manifestFile : null,
      decisions: audit.validatedCounts,
      reviewed: audit.reviewed,
      historyEvents: audit.historyEvents,
      held: batch.candidates.length,
      published: published.filter(
        (q) => q.sourceTextbookId === definition.bookId,
      ).length,
      candidates: batch.candidates.map((c) => ({
        id: c.id,
        number: c.number,
        pdfPage: c.page,
        pdfEndPage: c.endPage,
        printedPages: c.extractionEvidence.printedPages,
        answer: c.correctAnswer,
        reusedId: c.extractionEvidence.reusedExistingId,
        options: c.options,
        proposedText: c.questionText,
        originalExtraction: c.originalExtraction,
        proposedSourceSpan: c.extractionEvidence.proposedTranscription,
        reviewDecision: manifest.entries.find((e) => e.id === c.id)!.decision,
        sourceSha256: c.sourceSha256,
        evidenceSha256: hash(JSON.stringify(c)),
        warnings: c.qualityFlags,
        completeRequiredTextOptions: c.extractionEvidence.completeTextOptions,
        status: c.status,
        practicePublished: c.practicePublished,
      })),
    });
  }
  const inspectionEvidence = [];
  for (const inspection of inspections) {
    const book = catalog.books.find((b) => b.id === inspection.bookId)!;
    assert.equal(hash(await readFile("public" + book.localPath)), book.sha256);
    const imageFiles = [];
    for (const page of inspection.pdfPages) {
      const image = `.local/teacher-review/source-evidence/systematic-computer-batch/${book.id}-pdf-${page}.png`;
      imageFiles.push({
        pdfPage: page,
        file: image,
        sha256: hash(await readFile(image)),
      });
    }
    inspectionEvidence.push({
      ...inspection,
      sourceFile: book.sourceFile,
      sourceSha256: book.sha256,
      imageFiles,
    });
  }
  const physicalPdfs = (await readdir("public/textbooks")).filter((file) =>
    file.toLowerCase().endsWith(".pdf"),
  );
  const perSubject = [...new Set(catalog.books.map((b) => b.subject))]
    .sort()
    .flatMap((subject) =>
      ["English", "Tamil"].map((medium) => {
        const books = catalog.books.filter(
          (b) => b.subject === subject && b.sourceMedium === medium,
        );
        const ids = new Set(books.map((b) => b.id));
        return {
          subject,
          medium,
          books: books.length,
          published: published.filter(
            (q) => q.sourceTextbookId && ids.has(q.sourceTextbookId),
          ).length,
        };
      }),
    )
    .filter((s) => s.books);
  const allCandidates = selected.flatMap((b) => b.candidates);
  const ids = new Set(allCandidates.map((c) => c.id));
  assert.equal(ids.size, allCandidates.length);
  const previousInventory = JSON.parse(
    await readFile("docs/book-back-extraction-coverage.json", "utf8"),
  );
  let exportAudit = null;
  if (args.length) {
    const manifestPath = path.resolve(args[1]);
    const exported = JSON.parse(
      (await readFile(manifestPath, "utf8")).replace(/^\uFEFF/, ""),
    );
    const batch = batches.find((b) =>
      b.candidates.some(
        (c) =>
          Array.isArray(exported.entries) &&
          exported.entries.some((e: { id: string }) => e.id === c.id),
      ),
    );
    assert.ok(batch, "Export does not match an actual computer review batch");
    const persisted = await readOptionalJson<LocalReviewManifest>(
      path.join(directory, batch.id, "decisions.json"),
    );
    exportAudit = {
      manifestPath,
      batchId: batch.id,
      ...auditTeacherManifest(exported, {
        candidates: batch.candidates,
        persisted,
        reviewers,
        requireExport: true,
      }),
    };
  }
  const report = {
    checkedAt: new Date().toISOString(),
    scope:
      "Local extraction and saved authoritative snapshots; no production connection, publication or deployment",
    publicationSnapshotAt: snapshot.checkedAt,
    publicationSnapshotSha256: hash(
      await readFile(".local/independent-live-content.json"),
    ),
    physicalPdfCount: physicalPdfs.length,
    catalogPdfCount: catalog.books.length,
    detectedChapterEntries: chapterRows.length,
    zeroPublishedDetectedEntries: zeroPublished.length,
    zeroPublishedMeaning:
      "Not a count of confirmed missing book-back sections. Includes source-inspected practical/non-MCQ units and at least one production-credits parser artifact.",
    published: published.length,
    publishedByMedium: Object.fromEntries(
      ["English", "Tamil"].map((m) => [
        m,
        published.filter((q) => q.language === m).length,
      ]),
    ),
    publishedBySubjectAndMedium: perSubject,
    activeCandidateIds: previousInventory.uniqueCandidateIds,
    preservedCandidateRecords: previousInventory.preservedCandidateRecords,
    inactiveRecords: previousInventory.quarantinedCandidateRecords,
    batchUniqueIds: ids.size,
    batchDuplicateIds: allCandidates.length - ids.size,
    currentBatchNewStableIds: allCandidates.filter((c) => !c.reusedId).length,
    batches: selected,
    sourceInspections: inspectionEvidence,
    exportAudit,
    nextBatch: [...new Set(definitions.map((d) => d.bookId))].flatMap(
      (bookId) => {
        const prepared = definitions.filter((d) => d.bookId === bookId);
        const lastPrepared = Math.max(...prepared.map((d) => d.chapterNumber));
        const inventory = reports.find((r) => r.book.id === bookId)!;
        const remaining = inventory.chapters
          .filter(
            (c: { number: number; published: number }) =>
              !c.published &&
              !prepared.some((d) => d.chapterNumber === c.number),
          )
          .sort(
            (a: { number: number }, b: { number: number }) =>
              a.number - b.number,
          );
        const next =
          remaining.find((c: { number: number }) => c.number > lastPrepared) ||
          remaining[0];
        return next
          ? [
              {
                bookId,
                subject: prepared[0].subject,
                medium: prepared[0].medium,
                chapterNumber: next.number,
                startPdfPage: next.startPdfPage,
                provisionalExercisePdfPages: next.exercisePdfPages,
                requirement:
                  "Detected inventory entry, not confirmed MCQ coverage. Inspect actual section boundary, non-MCQ formats and scoped answer evidence before extraction; keep edition/hash separate",
              },
            ]
          : [];
      },
    ),
    limitations: [
      "No fresh live bank/session count was read; retained publication counts come from the hash-preserved local authoritative snapshot",
      `${allCandidates.length} source proposals need Tamil correction; ${allCandidates.filter((c) => !c.answer).length} still have no answer evidence. Parsed option positions and printed keys are not teacher verification`,
      "Only the specified exercises/ending pages were visually checked for keys; whole-book answer-key absence is not claimed",
      "Only the stated subset of detected zero-publication entries has a source-qualified classification; genuine full-collection MCQ shortfall remains unknown",
    ],
  };
  await writeFile(
    "docs/systematic-coverage-audit.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      pdfs: report.physicalPdfCount,
      chapters: report.detectedChapterEntries,
      zeroPublished: zeroPublished.length,
      bank: report.publishedByMedium,
      batch: ids.size,
      knownAnswers: selected.reduce((n, b) => n + b.knownAnswers, 0),
      decisions: selected.map((b) => ({ subject: b.subject, ...b.decisions })),
      exportValid: exportAudit?.valid ?? null,
    }),
  );
  if (exportAudit && !exportAudit.valid) process.exitCode = 1;
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
