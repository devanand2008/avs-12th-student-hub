import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import catalog from "../src/lib/textbooks-catalog.json";
import {
  readySourceDefinitions as definitions,
  draftSourceDefinitions,
} from "./lib/shared-source-definitions";
import { learningModels } from "../src/lib/models";
import {
  modelChapters,
  chapterBook,
  proceduralModelAttribution,
} from "../src/lib/model-curriculum";
import { selectPracticeQuestions } from "../src/lib/textbook-practice-selection";
import { questionContentSignature } from "./lib/extraction-progress";
import { csvCell } from "../src/lib/csv";
import type { TextbookMcqCandidate } from "../src/lib/textbook-question-types";
import type { Question } from "../src/types";

// Local-only: all publication counts refer to the protected dated snapshot.
const json = async (file: string) => JSON.parse(await readFile(file, "utf8"));
async function pdfFiles(dir: string): Promise<string[]> {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory()
          ? pdfFiles(path.join(dir, e.name))
          : /\.pdf$/i.test(e.name)
            ? [path.join(dir, e.name)]
            : [],
      ),
    )
  ).flat();
}
async function main() {
  const snapshotFile = ".local/independent-live-content.json";
  const snapshot = await json(snapshotFile);
  const eligible = selectPracticeQuestions(
    snapshot.tables.avs_questions.map((r: { data: Question }) => r.data),
    {},
  );
  const physical = await pdfFiles("public/textbooks");
  const sourceFiles = [...physical, ...(await pdfFiles("book's"))];
  const sourceInventory = [];
  for (const file of sourceFiles) {
    const bytes = await readFile(file),
      sha256 = createHash("sha256").update(bytes).digest("hex");
    const books = catalog.books.filter((b) => b.sha256 === sha256);
    sourceInventory.push({
      file,
      bytes: bytes.length,
      sha256,
      catalogIds: books.map((b) => b.id),
      state: books.length ? "catalogued" : "not_started",
      note: books.length
        ? "Same source hash; separate physical occurrence retained"
        : "Not registered as a textbook source; inspect identity, provenance, item types and rights before extraction",
    });
  }
  const decisions: { id: string; decision: string; history: number }[] = [];
  for (const entry of await readdir(
    ".local/teacher-review/physics-unit1-workflow",
    { withFileTypes: true },
  )) {
    if (!entry.isDirectory()) continue;
    try {
      const m = await json(
        `.local/teacher-review/physics-unit1-workflow/${entry.name}/decisions.json`,
      );
      decisions.push(
        ...m.entries.map(
          (e: {
            candidateId: string;
            decision: string;
            history: unknown[];
          }) => ({
            id: e.candidateId,
            decision: e.decision,
            history: e.history.length,
          }),
        ),
      );
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
  }
  const books = [];
  const allIds = new Set<string>();
  for (const b of catalog.books) {
    const p = await json(`.local/teacher-review/extracted-books/${b.id}.json`);
    const candidates = p.candidates as TextbookMcqCandidate[];
    const proposals = p.sourceBoundedProposals as TextbookMcqCandidate[];
    for (const c of candidates) {
      assert(!allIds.has(c.id), `Duplicate candidate ID ${c.id}`);
      allIds.add(c.id);
    }
    const rawSignatures = new Map<string, string[]>();
    for (const c of proposals) {
      const sig = questionContentSignature(c);
      rawSignatures.set(sig, [...(rawSignatures.get(sig) || []), c.id]);
    }
    const ready = eligible.filter((q) => q.sourceTextbookId === b.id);
    const chapters = p.chapters.map(
      (ch: {
        id: string;
        number: number;
        title: string;
        startPdfPage: number;
      }) => {
        const rows = proposals.filter((c) => c.chapterId === ch.id);
        const draft = draftSourceDefinitions.find(
          (d) => d.bookId === b.id && d.chapterNumber === ch.number,
        );
        const d = definitions.find(
          (d) => d.bookId === b.id && d.chapterNumber === ch.number,
        );
        const pubs = ready.filter((q) => q.chapterId === ch.id);
        return {
          ...ch,
          inventoryKind: d ? "source_bounded" : "provisional_parser_entry",
          title: d?.chapterTitle || ch.title,
          verifiedChapterTitle: d?.chapterTitle ?? null,
          chapterExistence: d
            ? "source_opening_and_exercise_inspected"
            : "parser_detection_only",
          exercisePages:
            d?.pages.map((p) => ({
              pdfPage: p.page,
              printedPage: p.printedPage,
            })) || [],
          inspectedEndingPages: d?.inspectedEndingPages || [],
          sourceQuestionCount: d ? rows.length : null,
          uniqueContentSignatures: new Set(rows.map(questionContentSignature))
            .size,
          missingQuestionCount: null,
          missingQuestionNote:
            "Not inferred from parser totals; manual source reconciliation required before declaring zero missing.",
          candidateRecords: candidates.filter((c) => c.chapterId === ch.id)
            .length,
          incompleteOptionMappings: rows.filter(
            (c) =>
              (
                c as TextbookMcqCandidate & {
                  extractionEvidence?: { completeTextOptions?: boolean };
                }
              ).extractionEvidence?.completeTextOptions === false,
          ).length,
          sourceWarnings: [...new Set(rows.flatMap((c) => c.qualityFlags))],
          proposalIds: rows.map((c) => c.id),
          knownPrintedAnswers: rows.filter((c) => c.correctAnswer).length,
          unknownAnswers: rows.filter((c) => !c.correctAnswer).length,
          held: rows.length,
          reviewed: decisions.filter(
            (e) => rows.some((c) => c.id === e.id) && e.decision !== "pending",
          ).length,
          approved: decisions.filter(
            (e) => rows.some((c) => c.id === e.id) && e.decision === "approved",
          ).length,
          rejected: decisions.filter(
            (e) => rows.some((c) => c.id === e.id) && e.decision === "rejected",
          ).length,
          published: pubs.length,
          draftDefinition: draft ?? null,
          state: rows.length
            ? "awaiting_teacher_review"
            : pubs.length
              ? "approved_published"
              : draft
                ? "in_progress"
                : "not_started",
          completeAfterVerification: false,
          blockers: rows.length
            ? [
                "Individual authenticated teacher verification required",
                ...(rows.some((c) => !c.correctAnswer)
                  ? ["Unknown answers remain unknown"]
                  : []),
              ]
            : [
                "Contents/exercise inspection and source reconciliation pending",
              ],
          models: modelChapters
            .filter((m) => m.bookId === b.id && m.chapter === ch.number)
            .map((m) => m.modelId),
        };
      },
    );
    const source = sourceInventory.find(
      (s) => s.file.replaceAll("\\", "/") === `public${b.localPath}`,
    );
    assert(
      source && source.sha256 === b.sha256,
      `Missing or changed source ${b.id}`,
    );
    books.push({
      id: b.id,
      subject: b.subject,
      medium: b.sourceMedium,
      volume: b.volume,
      sourceFile: b.sourceFile,
      localPath: b.localPath,
      sha256: b.sha256,
      pages: p.pages,
      cachedCompletedPages: p.completedPages,
      saved: candidates.length,
      active: p.activeExtractionIds.length,
      proposals: proposals.length,
      published: ready.length,
      state: proposals.length ? "extracted_held" : "in_progress",
      chapters,
      exactProposalOverlapGroups: [...rawSignatures.values()].filter(
        (g) => g.length > 1,
      ),
      candidateEvidence: proposals.map((c) => ({
        id: c.id,
        origin: "textbook_bookback_one_mark",
        chapterId: c.chapterId,
        printedQuestionNumber: c.number,
        pdfPage: c.page,
        pdfEndPage: c.endPage,
        signature: questionContentSignature(c),
        originalExtractionSha256: createHash("sha256")
          .update(JSON.stringify(c.originalExtraction ?? null))
          .digest("hex"),
        sourceSha256: c.sourceSha256,
        optionCount: c.options.length,
        answer: c.correctAnswer,
        reviewStatus: c.reviewStatus,
        practicePublished: c.practicePublished,
        warnings: c.qualityFlags,
      })),
    });
  }
  const chapterRows = books.flatMap((b) =>
    b.chapters.map((c: Record<string, unknown>) => ({
      bookId: b.id,
      subject: b.subject,
      medium: b.medium,
      volume: b.volume,
      ...c,
    })),
  );
  const report = {
    checkedAt: new Date().toISOString(),
    scope:
      "Local files and protected dated snapshots only; not a live production assertion",
    snapshotSha256: createHash("sha256")
      .update(await readFile(snapshotFile))
      .digest("hex"),
    counts: {
      registeredPdfs: books.length,
      subjects: new Set(books.map((b) => b.subject)).size,
      englishPdfs: books.filter((b) => b.medium === "English").length,
      tamilPdfs: books.filter((b) => b.medium === "Tamil").length,
      physicalTextbookPdfs: physical.length,
      otherSourcePdfs: sourceFiles.length - physical.length,
      pages: books.reduce((n, b) => n + b.pages, 0),
      saved: allIds.size,
      active: books.reduce((n, b) => n + b.active, 0),
      proposals: books.reduce((n, b) => n + b.proposals, 0),
      provisionalChapters: chapterRows.length,
      eligibleSnapshot: eligible.length,
      teacherReviewed: decisions.filter((e) => e.decision !== "pending").length,
      historyEvents: decisions.reduce((n, e) => n + e.history, 0),
    },
    publicationNote:
      "Existing 995 English publications are protected legacy printed-key publications, not newly teacher-approved. Tamil eligible count is zero. All new source proposals remain held.",
    originContract: {
      textbook_bookback_one_mark:
        "Local bounded Book-back proposals; kept separate from question-paper resources",
      previous_year_exam_one_mark:
        "Not imported into this MCQ bank; resources have their own provenance registry",
      model_exam_one_mark: "Not imported into this MCQ bank",
    },
    sourceInventory,
    draftSourceSections: draftSourceDefinitions,
    books,
    models: learningModels.map((m) => ({
      id: m.id,
      title: m.title,
      subject: m.subject,
      geometry: "procedural",
      externalAssetBytes: 0,
      originalAssetUrl: null,
      assetNote:
        "Generated from project TypeScript at runtime; no model file download or hotlink",
      attribution: proceduralModelAttribution,
      mappings: modelChapters
        .filter((c) => c.modelId === m.id)
        .map((c) => ({
          ...c,
          sourceFile: chapterBook(c).sourceFile,
          sha256: chapterBook(c).sha256,
        })),
      coverage: modelChapters.some((c) => c.modelId === m.id)
        ? "source_context_checked"
        : "general_concept",
    })),
    nextBatch: books
      .filter((b) =>
        /bio-zoology|basic-electrical-engineering-tamil/.test(b.id),
      )
      .flatMap((b) =>
        b.chapters
          .filter(
            (c: { number: number; proposalIds: string[] }) =>
              c.number >= 4 && !c.proposalIds.length,
          )
          .slice(0, 1)
          .map((c: object) => ({ bookId: b.id, ...c })),
      ),
  };
  await writeFile(
    "docs/portal-coverage.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  const columns = [
    "bookId",
    "subject",
    "medium",
    "volume",
    "id",
    "number",
    "title",
    "verifiedChapterTitle",
    "chapterExistence",
    "inventoryKind",
    "state",
    "sourceQuestionCount",
    "exercisePages",
    "candidateRecords",
    "uniqueContentSignatures",
    "missingQuestionCount",
    "missingQuestionNote",
    "unknownAnswers",
    "incompleteOptionMappings",
    "reviewed",
    "approved",
    "rejected",
    "held",
    "published",
    "models",
    "blockers",
    "sourceWarnings",
  ];
  await writeFile(
    "docs/portal-chapter-coverage.csv",
    [
      columns.join(","),
      ...chapterRows.map((r) =>
        columns
          .map((k) =>
            csvCell(
              Array.isArray(r[k]) ? JSON.stringify(r[k]) : String(r[k] ?? ""),
            ),
          )
          .join(","),
      ),
    ].join("\n") + "\n",
  );
  console.log(JSON.stringify(report.counts));
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
