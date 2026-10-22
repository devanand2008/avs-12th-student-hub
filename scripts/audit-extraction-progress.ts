import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import catalog from "../src/lib/textbooks-catalog.json";
import { selectPracticeQuestions } from "../src/lib/textbook-practice-selection";
import type { Question } from "../src/types";
import {
  extractionProgress,
  type ProgressCandidate,
} from "./lib/extraction-progress";
import { loadComputerReviewBatches } from "./lib/computer-review-batches";
import {
  loadAdditionalPhysicsBatches,
  type PhysicsReviewCandidate,
} from "./lib/physics-review-batches";
import { loadCommerceReviewBatches } from "./lib/commerce-review-batches";
import { loadSharedSourceReviewBatches } from "./lib/shared-source-review";
import {
  readOptionalJson,
  type LocalReviewer,
  type LocalReviewManifest,
} from "./lib/local-physics-review";
import { auditTeacherManifest } from "./lib/teacher-decision-audit";
import { localTranscriptionProposals } from "./lib/tamil-transcription-proposals";
import sourceInspections from "./data/coverage-source-inspections.json";

// Read-only local audit. Never loads .env, connects to a database or saves decisions.
const json = async (file: string) => JSON.parse(await readFile(file, "utf8"));
const sha = (value: Buffer) => createHash("sha256").update(value).digest("hex");
async function main() {
  const coverage = await json("docs/book-back-extraction-coverage.json");
  const packets: {
    book: {
      id: string;
      medium: string;
      subject: string;
      volume: string | null;
      sourceSha256: string;
    };
    pages: number;
    candidates: ProgressCandidate[];
    sourceBoundedProposals: ProgressCandidate[];
    activeExtractionIds: string[];
  }[] = [];
  for (const book of catalog.books) {
    const packet = await json(
      `.local/teacher-review/extracted-books/${book.id}.json`,
    );
    assert.equal(packet.book.id, book.id);
    assert.equal(packet.book.medium, book.sourceMedium);
    assert.equal(packet.book.sourceSha256, book.sha256);
    // Recheck all physical files, including those reused from complete text caches.
    assert.equal(
      sha(await readFile(path.join("public", book.localPath!))),
      book.sha256,
    );
    for (const c of packet.sourceBoundedProposals) {
      assert.equal(c.bookId, book.id);
      assert(c.chapterId.startsWith(`tb-${book.id}-ch-`));
      assert(c.page >= 1 && c.endPage >= c.page && c.endPage <= packet.pages);
      assert.equal(c.sourceSha256, book.sha256);
    }
    packets.push(packet);
  }
  const summary = extractionProgress(
    packets.flatMap((p) => p.candidates),
    packets.flatMap((p) => p.activeExtractionIds),
    packets.flatMap((p) => p.sourceBoundedProposals),
  );
  assert.deepEqual(summary.errors, []);
  const directory = path.resolve(
    ".local/teacher-review/physics-unit1-workflow",
  );
  const reviewers =
    (await readOptionalJson<LocalReviewer[]>(
      path.join(directory, "reviewers.json"),
    )) ?? [];
  const batches = [
    {
      id: "unit-1",
      candidates: (await json(
        ".local/teacher-review/tamil-physics-unit1.json",
      )) as PhysicsReviewCandidate[],
    },
    ...(await loadAdditionalPhysicsBatches(process.cwd())),
    ...(await loadComputerReviewBatches(process.cwd())),
    ...(await loadCommerceReviewBatches(process.cwd())),
    ...(await loadSharedSourceReviewBatches(process.cwd())),
  ];
  const reviews = [];
  for (const batch of batches) {
    const file = path.join(
      directory,
      batch.id === "unit-1" ? "" : batch.id,
      "decisions.json",
    );
    const saved = await readOptionalJson<LocalReviewManifest>(file);
    if (!saved) {
      reviews.push({
        batchId: batch.id,
        candidates: batch.candidates.length,
        savedStore: false,
        counts: {
          approved: 0,
          needs_correction: 0,
          rejected: 0,
          pending: batch.candidates.length,
          invalid: 0,
        },
        reviewed: 0,
        historyEvents: 0,
      });
      continue;
    }
    const audit = auditTeacherManifest(saved, {
      candidates: batch.candidates,
      persisted: saved,
      reviewers,
      requireExport: false,
    });
    assert(audit.valid, JSON.stringify(audit.issues));
    reviews.push({
      batchId: batch.id,
      candidates: batch.candidates.length,
      savedStore: true,
      counts: audit.validatedCounts,
      reviewed: audit.reviewed,
      historyEvents: audit.historyEvents,
    });
  }
  const snapshotFile = ".local/independent-live-content.json";
  const snapshot = await json(snapshotFile);
  const eligible = selectPracticeQuestions(
    snapshot.tables.avs_questions.map((r: { data: Question }) => r.data),
    {},
  );
  const bookRows = packets.map((p) => ({
    ...p.book,
    pages: p.pages,
    ...extractionProgress(
      p.candidates,
      p.activeExtractionIds,
      p.sourceBoundedProposals,
    ),
    published: eligible.filter((q) => q.sourceTextbookId === p.book.id).length,
  }));
  const report = {
    schemaVersion: 1,
    sourceTranscriptionProposals: {
      inspectedCandidates: localTranscriptionProposals(
        batches.flatMap((b) => b.candidates),
      ).length,
      proposedCompleteTranscriptions: localTranscriptionProposals(
        batches.flatMap((b) => b.candidates),
      ).filter((e) => e.proposedQuestionText).length,
      teacherVerified: 0,
      source: "scripts/data/tamil-computer-transcription-proposals.json",
      meaning:
        "Separate source-backed proposals; raw extraction, authoritative candidate digests and saved teacher decisions remain unchanged",
    },
    checkedAt: new Date().toISOString(),
    scope:
      "Local files, source checksums and saved publication/decision snapshots only; no live database measurement or writes",
    definitions: {
      activeOccurrences:
        "Active stable IDs, preferring a separate source-bounded proposal for text diagnostics only; original candidates remain unchanged",
      uniqueContentSignatures:
        "Exact whitespace-normalized stems and ordered choices; not semantic deduplication or proof of global content novelty",
      sourceBoundedPrintedKeyMatches:
        "Explicit bounded-source key comparison; never teacher approval",
      processedPages:
        "Text-extracted/cache-provenance checked pages; not all visually inspected exercise pages",
    },
    discoveredPdfs: coverage.discoveredPdfs,
    checksumVerifiedPdfs: packets.length,
    processedPages: coverage.processedPages,
    detectedChapterEntries: coverage.books.reduce(
      (n: number, b: { chapters: unknown[] }) => n + b.chapters.length,
      0,
    ),
    zeroPublishedDetectedEntries: coverage.books
      .flatMap((b: { book: { id: string }; chapters: { id: string }[] }) =>
        b.chapters.map((c) => ({ bookId: b.book.id, chapterId: c.id })),
      )
      .filter(
        (c: { bookId: string; chapterId: string }) =>
          !eligible.some(
            (q) =>
              q.sourceTextbookId === c.bookId && q.chapterId === c.chapterId,
          ),
      ).length,
    summary,
    failures: coverage.failures,
    sparseOrUnreadablePages: coverage.books
      .filter((b: { sparsePages: number[] }) => b.sparsePages.length)
      .map((b: { book: { id: string }; sparsePages: number[] }) => ({
        bookId: b.book.id,
        pages: b.sparsePages,
        action:
          "Inspect source images; sparse text alone does not prove an unreadable exercise",
      })),
    sourceQualifiedChapters: coverage.books.flatMap(
      (b: {
        book: { id: string };
        sourceBoundedQuestionInventory: unknown[];
      }) =>
        b.sourceBoundedQuestionInventory.map((section) => ({
          bookId: b.book.id,
          section,
        })),
    ),
    sourceInspectionBacklog: coverage.books.flatMap((book: {
      book: { id: string; subject: string; medium: string; volume: string | null };
      chapters: { id: string; number: number; title: string; startPdfPage: number; exercisePdfPages: number[]; authenticSourceQuestionTotal: number | null; published: number }[];
    }) => book.chapters.filter((chapter) => chapter.authenticSourceQuestionTotal == null).map((chapter) => ({
      ...book.book,
      chapterId: chapter.id,
      chapterNumber: chapter.number,
      provisionalChapterTitle: chapter.title,
      provisionalStartPdfPage: chapter.startPdfPage,
      provisionalExercisePdfPages: [...new Set(chapter.exercisePdfPages)],
      eligiblePublished: chapter.published,
      separateLocalReviewItems: batches.filter((batch) => batch.candidates[0].bookId === book.book.id && batch.candidates[0].chapterId === chapter.id).reduce((n, batch) => n + batch.candidates.length, 0),
      earlierInspectionFindings: sourceInspections.filter((inspection) => inspection.bookId === book.book.id && inspection.detectedChapter === chapter.number).map((inspection) => inspection.finding),
      priority: chapter.published === 0 ? 1 : 2,
      state: "No general source-bounded section in this inventory. Check separate local review items and earlier inspection findings before treating this provisional entry as uninspected or missing.",
    }))).sort((a: {priority: number; id: string; chapterNumber: number}, b: {priority: number; id: string; chapterNumber: number}) => a.priority - b.priority || a.id.localeCompare(b.id) || a.chapterNumber - b.chapterNumber),
    reviewBatches: reviews.map((review, index) => ({
      ...review,
      bookId: batches[index].candidates[0].bookId,
      chapterId: batches[index].candidates[0].chapterId,
    })),
    teacherDecisionCounts: reviews.reduce(
      (n, r) => ({
        pending: n.pending + (r.counts?.pending ?? 0),
        approved: n.approved + (r.counts?.approved ?? 0),
        needsCorrection: n.needsCorrection + (r.counts?.needs_correction ?? 0),
        rejected: n.rejected + (r.counts?.rejected ?? 0),
        reviewed: n.reviewed + (r.reviewed ?? 0),
        historyEvents: n.historyEvents + (r.historyEvents ?? 0),
      }),
      {
        pending: 0,
        approved: 0,
        needsCorrection: 0,
        rejected: 0,
        reviewed: 0,
        historyEvents: 0,
      },
    ),
    studentReady: {
      count: eligible.length,
      snapshotAt: snapshot.checkedAt,
      snapshotSha256: sha(await readFile(snapshotFile)),
      byMedium: Object.fromEntries(
        ["English", "Tamil"].map((medium) => [
          medium,
          eligible.filter(
            (q) =>
              catalog.books.find((b) => b.id === q.sourceTextbookId)
                ?.sourceMedium === medium,
          ).length,
        ]),
      ),
    },
    books: bookRows,
    complete: false,
    unresolved: [
      "Detected zero-publication chapter entries are not confirmed missing MCQ sections",
      "Parser candidates include lesson/open-response material and damaged text; only source-bounded rows have inspected section boundaries",
      "All new candidates remain held. Existing 995 exact publication rows retain the user-authorised exception",
      "Chapter 13 repeats printed 9 and omits 8: distinct physical occurrences are now reviewable without renumbering; Q2 lost C option boundary remains held",
    ],
  };
  await writeFile(
    "docs/textbook-processing-manifest.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      pdfs: packets.length,
      pages: report.processedPages,
      ...Object.fromEntries(
        Object.entries(summary).filter(([, v]) => typeof v === "number"),
      ),
      decisions: report.teacherDecisionCounts,
      bank: report.studentReady,
    }),
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
