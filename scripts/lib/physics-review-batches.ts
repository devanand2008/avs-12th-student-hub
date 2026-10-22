import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import regions from "../data/physics-review-source-regions.json";
import definitions from "../data/source-bounded-sections.json";
import type { Unit1Candidate } from "./tamil-physics-unit1";
import type { TextbookMcqCandidate } from "../../src/lib/textbook-question-types";
import type { SharedOptionSpan } from "./shared-option-subitems";

export interface ReviewAsset {
  file: string;
  page: number;
  rect: number[];
  label: string;
  option?: string;
}
export type PhysicsReviewCandidate = Omit<
  Unit1Candidate,
  "extractionEvidence"
> & {
  extractionEvidence: Omit<
    Unit1Candidate["extractionEvidence"],
    "keyPrintedPage"
  > & { keyPrintedPage: number | null; sourcePageReferences?: { pdfPage:number; printedPage:number }[]; sharedSourceOptions?: SharedOptionSpan["sharedRubric"] };
  localReviewRequirements?: {
    correctedTranscriptionRequired: true;
    sourceMappingConfirmationRequired: true;
    proposedPrintedAnswer: string | null;
    answerEvidenceUnavailable?: boolean;
    figures: ReviewAsset[];
    optionRecovery: (ReviewAsset & { options: string[] }) | null;
    originalProposalSha256: string;
  };
};
export interface PhysicsReviewBatch {
  id: string;
  unit: number;
  title: string;
  candidates: PhysicsReviewCandidate[];
  sourcePages?: { directory: string; prefix: string };
  figureDirectory?: string;
  printedOptionLabels?: Record<string, string[]>;
}
export const reviewAssetFile = (
  unit: number,
  question: number,
  suffix: string,
) => `unit-${unit}-q-${question}-${suffix}.png`;

/** Adapt immutable extraction evidence to the existing reviewer schema. No saved
 * extraction or teacher decision is modified. Corrections remain separate proposals. */
export function adaptBoundedReviewCandidates(
  proposals: (TextbookMcqCandidate & {
    extractionEvidence: Record<string, unknown>;
  })[],
): PhysicsReviewBatch[] {
  assert.equal(
    proposals.length,
    60,
    "Expected the actual 60 bounded proposals",
  );
  assert.equal(
    new Set(proposals.map((c) => c.id)).size,
    60,
    "Duplicate candidate IDs",
  );
  return definitions[0].sections.map((section) => {
    const unit = section.chapterNumber;
    const selected = proposals
      .filter((c) => c.chapterId === `tb-${regions.bookId}-ch-${unit}`)
      .sort((a, b) => a.number - b.number);
    assert.deepEqual(
      selected.map((c) => c.number),
      Array.from({ length: 15 }, (_, i) => i + 1),
    );
    const candidates = selected.map((original): PhysicsReviewCandidate => {
      const c = structuredClone(original),
        e = c.extractionEvidence;
      assert.equal(c.bookId, regions.bookId);
      assert.equal(c.sourceSha256, regions.sourceSha256);
      assert.equal(e.medium, "Tamil");
      assert.equal(e.volume, "1");
      assert.equal(c.status, "Needs Review");
      assert.equal(c.reviewStatus, "needs_teacher_review");
      assert.equal(c.practicePublished, false);
      assert.equal(
        c.page,
        section.pageGroups.find(
          (g) => c.number >= g.first && c.number <= g.last,
        )?.page,
      );
      assert.equal(c.keyPage, section.keyPdfPage);
      assert.equal(e.keyMatched, true);
      const recovery = regions.optionRecoveries.find(
        (r) => r.unit === unit && r.question === c.number,
      );
      const figures = regions.figures
        .filter((r) => r.unit === unit && r.question === c.number)
        .map((r, index) => ({
          ...r,
          file: reviewAssetFile(unit, c.number, `figure-${index + 1}`),
        }));
      assert.equal(Boolean(figures.length), e.requiresDiagram);
      const optionRecovery = recovery
        ? {
            ...recovery,
            file: reviewAssetFile(unit, c.number, "options"),
            label:
              "Original printed options used for the separate proposed mathematical transcription; teacher verification required",
          }
        : null;
      const options = recovery?.options ?? c.options;
      const proposedAnswer = e.proposedPrintedAnswer as "A" | "B" | "C" | "D";
      assert.ok(["A", "B", "C", "D"].includes(proposedAnswer));
      const complete =
        !e.approvalBlocked &&
        options.length === 4 &&
        options.every((o) => o.trim());
      if (complete) assert.ok(options["ABCD".indexOf(proposedAnswer)]);
      const proposed = { questionText: c.questionText, options };
      const originalPages = e.originalPageText as {
        page: number;
        text: string;
      }[];
      const warnings = [
        ...c.qualityFlags,
        "Approval requires an explicit teacher-authored complete Tamil transcription and source mapping confirmation; the current extracted wording is damaged",
        ...(recovery
          ? [
              "Separate proposed option recovery from the original printed mathematics; original extraction and incomplete-option warnings are preserved",
            ]
          : []),
      ];
      return {
        ...c,
        options: [...options],
        correctAnswer: complete ? proposedAnswer : null,
        qualityFlags: warnings,
        reviewPreparation: {
          batchId: e.batchId as string,
          preparedAt: "",
          sourceSha256: c.sourceSha256,
          subject: "Physics",
          title: "Physics Volume 1",
          medium: "Tamil",
          volume: "1",
          printedPage: c.page - 8,
          printedPageEvidence:
            "Original printed page label, PDF page minus eight",
          sourceCheck: "uncertain",
          keyCheck: "matched",
          sourceQuestionText: c.originalExtraction!.questionText,
          sourceOptions: c.originalExtraction!.options,
          englishText: null,
          tamilText: null,
          sourcePageText: originalPages
            .map((p) => `PDF ${p.page}\n${p.text}`)
            .join("\n\n"),
          keyPageText: e.keyText as string,
          parsedAnswer: complete ? proposedAnswer : null,
          warnings,
          duplicateIds: [],
        },
        extractionEvidence: {
          sourceFile: e.sourceFile as string,
          localPdf: `/textbooks/${regions.bookId}.pdf`,
          pdfPageIndex: c.page - 1,
          printedPages: e.printedPages as number[],
          originalRawSpan: originalPages
            .map((p) => `Original PDF ${p.page}\n${p.text}`)
            .join("\n\n"),
          proposedTranscription: proposed,
          transcriptionMethod: `${e.method}; optional separate visually compared mathematics recovery`,
          requiresDiagram: Boolean(e.requiresDiagram),
          completeTextOptions: Boolean(complete),
          diagramEvidence: figures.length
            ? "Original figure crops are attached below. Their attachment does not establish teacher verification."
            : null,
          printedKeyEntry: e.printedKeyEntry as string,
          keyPrintedPage: e.keyPrintedPage as number,
          reusedExistingId: Boolean(e.reusedExistingId),
          originalMapping:
            e.originalMapping as Unit1Candidate["extractionEvidence"]["originalMapping"],
        },
        localReviewRequirements: {
          correctedTranscriptionRequired: true,
          sourceMappingConfirmationRequired: true,
          proposedPrintedAnswer: proposedAnswer,
          figures,
          optionRecovery,
          originalProposalSha256: createHash("sha256")
            .update(JSON.stringify(original))
            .digest("hex"),
        },
      };
    });
    return {
      id: `unit-${unit}`,
      unit,
      title: `Unit ${unit} · ${section.chapterTitle}`,
      candidates,
    };
  });
}

export async function loadAdditionalPhysicsBatches(
  root: string,
): Promise<PhysicsReviewBatch[]> {
  let bytes: string;
  try {
    bytes = await readFile(
      path.join(
        root,
        `.local/teacher-review/extracted-books/${regions.bookId}.json`,
      ),
      "utf8",
    );
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
  const batches = adaptBoundedReviewCandidates(
    JSON.parse(bytes).sourceBoundedProposals,
  );
  return batches;
}
