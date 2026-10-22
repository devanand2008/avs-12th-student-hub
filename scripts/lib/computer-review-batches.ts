import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import definitions from "../data/computer-source-sections.json";
import figureRegions from "../data/shared-review-source-regions.json";
import { sourceFigureFile } from "./source-figure-file";
import type {
  PhysicsReviewBatch,
  PhysicsReviewCandidate,
} from "./physics-review-batches";
import type { TextbookMcqCandidate } from "../../src/lib/textbook-question-types";

export async function loadComputerReviewBatches(
  root: string,
): Promise<PhysicsReviewBatch[]> {
  return loadConfiguredReviewBatches(root, definitions);
}

export async function loadConfiguredReviewBatches(
  root: string,
  configurations: {
    bookId: string;
    subject: string;
    medium: string;
    volume: string | null;
    sourceFile: string;
    sourceSha256: string;
    chapterNumber: number;
    chapterTitle: string;
    pages: {
      page: number;
      printedPage: number;
      first: number;
      last: number;
      numbers?: number[];
    }[];
    choiceCounts?: Record<string, number | undefined>;
    sourceOccurrences?: { printedNumber:number }[];
  }[],
  idPrefix = "computer",
) {
  const batches: PhysicsReviewBatch[] = [];
  for (const definition of configurations) {
    let packet;
    try {
      packet = JSON.parse(
        await readFile(
          path.join(
            root,
            `.local/teacher-review/extracted-books/${definition.bookId}.json`,
          ),
          "utf8",
        ),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw error;
    }
    const proposals = packet.sourceBoundedProposals as (TextbookMcqCandidate & {
      extractionEvidence: Record<string, unknown>;
    })[];
    if (!proposals?.length) continue;
    const selected = proposals.filter(
      (c) =>
        c.chapterId ===
        `tb-${definition.bookId}-ch-${definition.chapterNumber}`,
    );
    assert.deepEqual(
      selected.map((c) => c.number),
      definition.sourceOccurrences?.map(o=>o.printedNumber) ?? definition.pages.flatMap(
        (p) =>
          p.numbers ??
          Array.from({ length: p.last - p.first + 1 }, (_, i) => p.first + i),
      ),
    );
    assert.equal(new Set(selected.map((c) => c.id)).size, selected.length);
    assert.equal(packet.book.medium, definition.medium);
    assert.equal(packet.book.subject, definition.subject);
    assert.equal(packet.book.sourceSha256, definition.sourceSha256);
    const candidates = selected.map((source): PhysicsReviewCandidate => {
      const c = structuredClone(source),
        e = c.extractionEvidence;
      assert.equal(c.sourceSha256, definition.sourceSha256);
      assert.equal(c.status, "Needs Review");
      assert.equal(c.reviewStatus, "needs_teacher_review");
      assert.equal(c.practicePublished, false);
      assert.equal(e.keyPdfPage ?? null, c.keyPage ?? null);
      assert.equal(e.keyMatched, Boolean(c.keyPage && c.correctAnswer));
      assert.equal(
        c.options.length,
        definition.choiceCounts?.[String(c.number)] ?? 4,
      );
      const rawPages = e.originalPageText as { page: number; text: string }[];
      const figures = figureRegions.filter(r => r.bookId === definition.bookId && r.chapterNumber === definition.chapterNumber && r.question === c.number && (!("sourceOrdinal" in r) || r.sourceOrdinal === c.sourceOccurrence?.ordinal)).map(r => ({
        file: sourceFigureFile(r), page: r.page, rect: r.rect, label: r.label,
      }));
      return {
        ...c,
        reviewPreparation: {
          batchId: e.batchId as string,
          preparedAt: "",
          sourceSha256: c.sourceSha256,
          subject: definition.subject,
          title: definition.subject,
          medium: definition.medium,
          volume: definition.volume,
          printedPage: (e.printedPages as number[])[0],
          printedPageEvidence:
            "Original printed footer compared with page rendering",
          sourceCheck: "uncertain",
          keyCheck: c.correctAnswer ? "matched" : "uncertain",
          sourceQuestionText: c.originalExtraction!.questionText,
          sourceOptions: c.originalExtraction!.options,
          englishText: null,
          tamilText: null,
          sourcePageText: rawPages
            .map((p) => `PDF ${p.page}\n${p.text}`)
            .join("\n\n"),
          keyPageText: e.keyText as string,
          parsedAnswer: c.correctAnswer,
          warnings: c.qualityFlags,
          duplicateIds: [],
        },
        extractionEvidence: {
          ...(e.sourcePageReferences ? { sourcePageReferences: e.sourcePageReferences as { pdfPage:number; printedPage:number }[] } : {}),
          ...(e.sharedSourceOptions ? { sharedSourceOptions: e.sharedSourceOptions as NonNullable<PhysicsReviewCandidate["extractionEvidence"]["sharedSourceOptions"]> } : {}),
          sourceFile: definition.sourceFile,
          localPdf: `/textbooks/${definition.bookId}.pdf`,
          pdfPageIndex: c.page - 1,
          printedPages: e.printedPages as number[],
          originalRawSpan: rawPages
            .map((p) => `PDF ${p.page}\n${p.text}`)
            .join("\n\n"),
          proposedTranscription: e.proposedTranscription as {
            questionText: string;
            options: string[];
          },
          transcriptionMethod: e.method as string,
          requiresDiagram: Boolean(e.requiresDiagram),
          completeTextOptions: Boolean(e.completeTextOptions),
          diagramEvidence: figures.length ? "Literal original source figure crop attached; attachment is not teacher verification." : null,
          printedKeyEntry:
            (e.printedKeyEntry as string) || "Not located; answer unknown",
          keyPrintedPage: e.keyPrintedPage as number | null,
          reusedExistingId: Boolean(e.reusedExistingId),
          originalMapping:
            e.originalMapping as PhysicsReviewCandidate["extractionEvidence"]["originalMapping"],
        },
        localReviewRequirements: {
          correctedTranscriptionRequired: true,
          sourceMappingConfirmationRequired: true,
          proposedPrintedAnswer: c.correctAnswer,
          answerEvidenceUnavailable: !c.correctAnswer,
          figures,
          optionRecovery: null,
          originalProposalSha256: createHash("sha256")
            .update(JSON.stringify(source))
            .digest("hex"),
        },
      };
    });
    const directory = path.join(
      root,
      ".local/teacher-review/source-evidence/systematic-computer-batch",
    );
    const receipt = JSON.parse(
      await readFile(path.join(directory, "source-pages.json"), "utf8"),
    );
    assert.equal(
      createHash("sha256")
        .update(
          await readFile(
            path.join(root, "public/textbooks", `${definition.bookId}.pdf`),
          ),
        )
        .digest("hex"),
      definition.sourceSha256,
    );
    for (const page of definition.pages) {
      const file = `${definition.bookId}-pdf-${page.page}.png`;
      const evidence = receipt.pages.find(
        (p: { file: string }) => p.file === file,
      );
      assert.equal(evidence?.sourceSha256, definition.sourceSha256);
      assert.equal(
        evidence?.sha256,
        createHash("sha256")
          .update(await readFile(path.join(directory, file)))
          .digest("hex"),
      );
    }
    const attached = candidates.flatMap(c => c.localReviewRequirements!.figures);
    if (attached.length) {
      const figures = JSON.parse(await readFile(path.join(directory, "source-figures.json"), "utf8")) as { file: string; sourceSha256: string; sha256: string; rect: number[] }[];
      for (const asset of attached) {
        const receipt = figures.find(f => f.file === asset.file);
        assert.equal(receipt?.sourceSha256, definition.sourceSha256);
        assert.deepEqual(receipt?.rect, asset.rect);
        assert.equal(receipt?.sha256, createHash("sha256").update(await readFile(path.join(directory, asset.file))).digest("hex"));
      }
    }
    batches.push({
      id: `${idPrefix}-${definition.bookId}-ch-${definition.chapterNumber}`,
      unit: definition.chapterNumber,
      title: `${definition.subject} · ${definition.medium} · Chapter ${definition.chapterNumber}: ${definition.chapterTitle}`,
      candidates,
      sourcePages: { directory, prefix: `${definition.bookId}-pdf-` },
      ...(attached.length ? { figureDirectory: directory } : {}),
      printedOptionLabels: Object.fromEntries(selected.flatMap(c => {
        const labels = c.extractionEvidence.printedOptionLabels;
        return Array.isArray(labels) ? [[c.id, labels as string[]]] : [];
      })),
    });
  }
  return batches;
}
