import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import definitions from "../data/source-bounded-sections.json";
import sharedDefinitions from "../data/shared-source-sections.json";
import type { Textbook } from "../../src/lib/textbooks";
import type { TextbookMcqCandidate } from "../../src/lib/textbook-question-types";
import type { ExtractedBook } from "./textbook-question-parser";
import type { BookBackSection } from "./book-back-inventory";
import { parsePrintedAnswerKey } from "./textbook-answer-keys";
import { extractReadableMcqText } from "./textbook-question-text";
import { twoColumnPdfText } from "./pdf-column-text";
import { extractComputerSourceSections } from "./computer-source-extraction";
import { extractCommerceSourceSection } from "./commerce-source-extraction";

export type BoundedSectionDefinition =
  (typeof definitions)[number]["sections"][number];
export interface BoundedPage {
  page: number;
  originalText: string;
  columnOrderedText: string;
}

/** Source-bounded recovery takes precedence over generic recovery for the same
 * printed occurrence; saved inactive records are preserved by the caller. */
export function combineExtractionProposals(
  existing: TextbookMcqCandidate[],
  recovered: TextbookMcqCandidate[],
  bounded: TextbookMcqCandidate[],
) {
  const identity = (c: TextbookMcqCandidate) =>
    `${c.bookId}:${c.chapterId}:${c.page}:${c.number}`;
  const scoped = new Set(bounded.map(identity));
  assert.equal(
    new Set(
      bounded.map((c) =>
        c.sourceOccurrence
          ? `${identity(c)}:${c.sourceOccurrence.section}:${c.sourceOccurrence.ordinal}`
          : identity(c),
      ),
    ).size,
    bounded.length,
    "Conflicting source-bounded physical question identities",
  );
  return [
    ...new Map(
      [
        ...existing,
        ...recovered.filter((c) => !scoped.has(identity(c))),
        ...bounded,
      ].map((c) => [c.id, c]),
    ).values(),
  ];
}

/** Strict source boundaries; damaged glyphs remain in evidence and never grant approval. */
export function prepareBoundedSection(
  book: Textbook,
  definition: BoundedSectionDefinition,
  pages: BoundedPage[],
  existing: TextbookMcqCandidate[],
) {
  const selected = definition.pageGroups.map((group) => {
    const page = pages.find((p) => p.page === group.page);
    assert(page, `Missing source PDF page ${group.page}`);
    assert.equal(
      group.printedPage,
      group.page - 8,
      "Printed source mapping changed",
    );
    return page;
  });
  const ordered = selected.map((p) => p.columnOrderedText).join("\n");
  const keyPage = selected.find((p) => p.page === definition.keyPdfPage)!;
  const keyStart = keyPage.columnOrderedText.search(/^\s*1\s*\)\s*[a-d]\b/im);
  const keyEnd = keyPage.columnOrderedText.indexOf("\nII", keyStart);
  assert(
    keyStart >= 0 && keyEnd > keyStart,
    "Printed key must be bounded before section II",
  );
  const keyText = keyPage.columnOrderedText.slice(keyStart, keyEnd).trim();
  const key = parsePrintedAnswerKey(keyText);
  const visualKey = parsePrintedAnswerKey(definition.visualKeyText);
  assert(
    key.complete && !key.conflict && visualKey.complete && !visualKey.conflict,
  );
  assert.deepEqual(
    [...key.answers].sort(([a], [b]) => a - b),
    [...visualKey.answers].sort(([a], [b]) => a - b),
    "Printed key differs from inspected source evidence",
  );
  const first = ordered.search(/^[ \t]*1[ \t]*\.[ \t]+/m);
  const last =
    selected
      .slice(0, -1)
      .reduce((n, p) => n + p.columnOrderedText.length + 1, 0) + keyStart;
  assert(first >= 0 && last > first, "Exercise boundaries not found");
  const exercise = ordered.slice(first, last).replace(/\n[^\n]*:\s*$/u, "");
  const starts = [...exercise.matchAll(/^[ \t]*(\d{1,2})[ \t]*\.[ \t]+/gm)];
  const numbers = definition.pageGroups.flatMap((g) =>
    Array.from({ length: g.last - g.first + 1 }, (_, i) => g.first + i),
  );
  assert.deepEqual(
    starts.map((m) => Number(m[1])),
    numbers,
    "Question order differs from visual section inventory",
  );
  assert.equal(
    key.answers.size,
    numbers.length,
    "Printed key count differs from question count",
  );
  const offsets: { page: number; start: number; end: number }[] = [];
  let cursor = 0;
  for (const p of selected) {
    offsets.push({
      page: p.page,
      start: cursor,
      end: cursor + p.columnOrderedText.length,
    });
    cursor += p.columnOrderedText.length + 1;
  }
  const pageAt = (offset: number) =>
    offsets.find((p) => p.start <= offset && p.end >= offset)?.page;
  const chapterId = `tb-${book.id}-ch-${definition.chapterNumber}`;
  const candidates = starts.map((start, index) => {
    const number = Number(start[1]);
    const from = start.index! + start[0].length;
    const to = starts[index + 1]?.index ?? exercise.length;
    const raw = exercise.slice(from, to).trim();
    const page = pageAt(first + start.index!)!;
    const endPage = pageAt(first + Math.max(from, to - 2))!;
    assert.equal(
      page,
      definition.pageGroups.find((g) => number >= g.first && number <= g.last)
        ?.page,
      "Printed question page differs from inventory",
    );
    assert(
      page >= definition.chapterStartPdfPage &&
        endPage <= definition.chapterEndPdfPage,
    );
    const matches = existing.filter(
      (c) => c.number === number && c.page === page,
    );
    assert(
      matches.length <= 1,
      "Conflicting candidate identities require manual reconciliation",
    );
    const old = matches[0];
    if (old) {
      assert.equal(old.sourceSha256, book.sha256);
      assert.equal(old.chapterId, chapterId);
    }
    const extracted = extractReadableMcqText(raw, book.subject);
    const graphIncomplete =
      definition.incompleteGraphQuestions.includes(number);
    const requiresDiagram = definition.diagramQuestions.includes(number);
    const printedAnswer = key.answers.get(number)!;
    const options = extracted.text?.options || [];
    const optionMappingComplete =
      !graphIncomplete &&
      options.length === 4 &&
      options.every((o) => o.trim());
    const correctAnswer = optionMappingComplete ? printedAnswer : null;
    const warnings = [
      ...new Set([
        "Held: individual authenticated teacher verification required; printed-key agreement is not approval",
        "Proposed reading order only: Tamil characters, words and all mathematical layout require source correction",
        ...extracted.flags,
        ...(old
          ? [
              "Existing ID is a page/number match; reconcile its saved In-text extraction with this source proposal before import",
            ]
          : []),
        ...(requiresDiagram
          ? [
              "Essential source diagram/graph requires faithful separate representation and teacher inspection",
            ]
          : []),
        ...(graphIncomplete
          ? [
              "Approval blocked: graph-only choices are incomplete; extracted axis labels are not complete options",
            ]
          : []),
        ...(!optionMappingComplete
          ? [
              "Printed answer is retained as evidence only; complete text/figure options are required before answer assignment",
            ]
          : []),
      ]),
    ];
    const id =
      old?.id ||
      `textbook-bounded-${book.id}-${createHash("sha256").update(`${book.sha256}:${definition.chapterNumber}:${number}:${page}`).digest("hex").slice(0, 16)}`;
    return {
      id,
      bookId: book.id,
      subjectId: `tb-${book.id}`,
      chapterId,
      chapterTitle: definition.chapterTitle,
      number,
      page,
      endPage,
      section: "Book-back" as const,
      questionText: extracted.text?.questionText || raw,
      options,
      correctAnswer,
      keyPage: definition.keyPdfPage,
      status: "Needs Review" as const,
      reviewStatus: "needs_teacher_review" as const,
      practicePublished: false,
      qualityFlags: warnings,
      sourceSha256: book.sha256!,
      originalExtraction: old?.originalExtraction || {
        questionText: old?.questionText || raw,
        options: old?.options || [],
        correctAnswer: old?.correctAnswer || null,
      },
      extractionEvidence: {
        sourceFile: book.sourceFile,
        medium: book.sourceMedium,
        volume: book.volume,
        pdfPageIndex: page - 1,
        printedPages: definition.pageGroups
          .filter((g) => g.page >= page && g.page <= endPage)
          .map((g) => g.printedPage),
        batchId: `${chapterId}-source-bounded-01`,
        reusedExistingId: Boolean(old),
        originalMapping: old
          ? { section: old.section, chapterTitle: old.chapterTitle }
          : null,
        originalPageText: selected
          .filter((p) => p.page >= page && p.page <= endPage)
          .map((p) => ({ page: p.page, text: p.originalText })),
        proposedColumnOrderedSpan: raw,
        proposedTranscription: extracted.text || null,
        method:
          "Coordinate-ordered PDF text; no Tamil character repair, OCR invention or mathematical reconstruction",
        sourceInventoryVerified: true,
        wordingTeacherVerified: false,
        requiresDiagram,
        completeTextOptions: Boolean(optionMappingComplete),
        approvalBlocked: graphIncomplete,
        proposedPrintedAnswer: printedAnswer,
        printedKeyEntry: `${number}) ${printedAnswer.toLowerCase()}`,
        keyPdfPage: definition.keyPdfPage,
        keyPrintedPage: definition.pageGroups.find(
          (g) => g.page === definition.keyPdfPage,
        )!.printedPage,
        keyText,
        visualKeyText: definition.visualKeyText,
        keyMatched: true,
      },
    };
  });
  const section: BookBackSection = {
    chapterId,
    startPdfPage: selected[0].page,
    endPdfPage: selected.at(-1)!.page,
    heading:
      "Source-inspected section I; Tamil transcription and diagrams await teacher verification",
    questionNumbers: numbers,
    sourceText: exercise,
    questionSpans: candidates.map((c) => ({
      number: c.number,
      pdfPage: c.page,
      pdfEndPage: c.endPage,
      raw: c.extractionEvidence.proposedColumnOrderedSpan,
    })),
    mappingStatus: "provisional-needs-source-review",
    terminationReason: "section-heading",
  };
  return {
    candidates,
    section,
    summary: {
      chapterId,
      chapterNumber: definition.chapterNumber,
      chapterTitle: definition.chapterTitle,
      batchId: `${chapterId}-source-bounded-01`,
      sourceInventoriedQuestions: numbers.length,
      pdfPages: definition.pageGroups.map((g) => g.page),
      printedPages: definition.pageGroups.map((g) => g.printedPage),
      keyPdfPage: definition.keyPdfPage,
      keyMatched: candidates.length,
      completeTextOptionMappings: candidates.filter(
        (c) => c.extractionEvidence.completeTextOptions,
      ).length,
      diagramDependent: candidates.filter(
        (c) => c.extractionEvidence.requiresDiagram,
      ).length,
      incompleteGraphQuestions: definition.incompleteGraphQuestions,
      reusedIds: candidates.filter((c) => c.extractionEvidence.reusedExistingId)
        .length,
      newIds: candidates.filter((c) => !c.extractionEvidence.reusedExistingId)
        .length,
      teacherApproved: 0,
      published: 0,
      complete: false,
    },
  };
}

export async function extractSourceBoundedCandidates(
  book: Textbook,
  original: ExtractedBook,
  existing: TextbookMcqCandidate[],
  saved: TextbookMcqCandidate[] = [],
) {
  const definition = definitions.find((d) => d.bookId === book.id);
  if (sharedDefinitions.some((d) => d.bookId === book.id))
    return extractComputerSourceSections(book, original, [
      ...new Map([...existing, ...saved].map((c) => [c.id, c])).values(),
    ], sharedDefinitions);
  if (book.id === "12-commerce-tamil-d9e013d8")
    return extractCommerceSourceSection(book, original, [
      ...new Map([...existing, ...saved].map((c) => [c.id, c])).values(),
    ]);
  if (!definition)
    return extractComputerSourceSections(book, original, [
      ...new Map([...existing, ...saved].map((c) => [c.id, c])).values(),
    ]);
  assert.equal(book.subject, definition.subject);
  assert.equal(book.sourceMedium, definition.medium);
  assert.equal(book.volume, definition.volume);
  assert.equal(book.sourceFile, definition.sourceFile);
  assert.equal(book.sha256, definition.sourceSha256);
  assert.equal(original.sha256, book.sha256);
  const bytes = await readFile("public" + book.localPath);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), book.sha256);
  const task = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
    verbosity: 0,
  });
  const pages: BoundedPage[] = [];
  try {
    const doc = await task.promise;
    assert.equal(doc.numPages, book.pages);
    for (const number of [
      ...new Set(
        definition.sections.flatMap((s) => s.pageGroups.map((g) => g.page)),
      ),
    ]) {
      const page = await doc.getPage(number),
        content = await page.getTextContent();
      const originalText = content.items
        .filter((i) => "str" in i)
        .map((i) => ("str" in i ? i.str + (i.hasEOL ? "\n" : " ") : ""))
        .join("")
        .toWellFormed()
        .replaceAll("\u0000", " ")
        .replace(/[^\S\n]+/g, " ")
        .replace(/ *\n */g, "\n")
        .trim();
      assert.equal(
        originalText,
        original.pages.find((p) => p.page === number)?.text,
        `Fresh PDF ${number} differs from saved original text`,
      );
      const items = content.items
        .filter((i) => "str" in i && i.transform[5] > 45)
        .map((i) => {
          assert("str" in i);
          return { str: i.str, transform: [...i.transform], width: i.width };
        });
      pages.push({
        page: number,
        originalText,
        columnOrderedText: twoColumnPdfText(
          items,
          page.getViewport({ scale: 1 }).width,
        ),
      });
      page.cleanup();
    }
  } finally {
    await task.destroy();
  }
  const prepared = definition.sections.map((d) =>
    prepareBoundedSection(book, d, pages, existing),
  );
  return {
    candidates: prepared.flatMap((p) => p.candidates),
    sections: prepared.map((p) => p.section),
    summaries: prepared.map((p) => p.summary),
  };
}
