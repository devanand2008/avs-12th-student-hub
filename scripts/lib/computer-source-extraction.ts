import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import definitions from "../data/computer-source-sections.json";
import type { Textbook } from "../../src/lib/textbooks";
import type { TextbookMcqCandidate } from "../../src/lib/textbook-question-types";
import type { ExtractedBook } from "./textbook-question-parser";
import type { BookBackSection } from "./book-back-inventory";
import { twoColumnPdfText } from "./pdf-column-text";
import { expandSharedOptionSubitems, type SharedOptionGroup } from "./shared-option-subitems";
import {
  extractReadableMcqText,
  textPresentationFlags,
} from "./textbook-question-text";

export interface ComputerSectionDefinition {
  bookId: string;
  subject: string;
  medium: string;
  volume: string | null;
  sourceFile: string;
  sourceSha256: string;
  chapterNumber: number;
  chapterTitle: string;
  chapterStartPdfPage: number;
  chapterEndPdfPage: number;
  pages: {
    page: number;
    printedPage: number;
    first: number;
    last: number;
    contentTopFraction: number;
    layout?: string;
    numbers?: number[];
    contentLeftFraction?: number;
    contentBottomPoints?: number;
  }[];
  inspectedEndingPages: number[];
  stopBeforeQuestion: number | null;
  excludedItems: { numbers: number[]; page: number; kind: string }[];
  keyEvidence: string;
  diagramQuestions: number[];
  sourceWarnings: string[];
  choiceCounts?: Record<string, number | undefined>;
  incompleteQuestions?: number[];
  questionWarnings?: Record<string, string[] | undefined>;
  embeddedNumberedListQuestions?: number[];
  /** Visually inventoried numbered premises inside a matching MCQ. */
  numberedPremises?: { question: number; count: number }[];
  excludedExistingIds?: { id: string; reason: string }[];
  englishOptionQuestions?: number[];
  preserveLineBreakQuestions?: number[];
  sectionEndPattern?: string;
  parenthesizedTamilOptions?: boolean;
  dotlessQuestionNumbers?: number[];
  printedOptionLabels?: Record<string, string[] | undefined>;
  /** Explicit, visually inventoried layouts for any subject; legacy definitions stay unchanged. */
  subjectNeutral?: boolean;
  optionLabelPattern?: string;
  optionLabelSkip?: Record<string, number | undefined>;
  endAtLastPage?: boolean;
  sectionHeading?: string;
  sharedOptionSubitems?: SharedOptionGroup[];
  /** Literal numbered assertion/reason items following an inventoried common rubric. */
  sharedNumberedOptions?: {
    afterQuestion: number;
    rubricStartPattern: string;
    optionLabelPattern: string;
    labels: string[];
    items: { number: number; answerPattern: string; expectedLabel: string; keyPage: number }[];
  };
  sourceOccurrences?: {
    ordinal: number;
    printedNumber: number;
    pdfPage: number;
    existingId?: string;
    section: string;
    reason: string;
  }[];
}
export interface ComputerSourcePage {
  page: number;
  originalText: string;
  columnOrderedText: string;
}
export function prepareComputerSection(
  book: Textbook,
  definition: ComputerSectionDefinition,
  pages: ComputerSourcePage[],
  existing: TextbookMcqCandidate[],
) {
  assert.equal(book.id, definition.bookId);
  assert.equal(book.subject, definition.subject);
  assert.equal(book.sourceMedium, definition.medium);
  assert.equal(book.volume, definition.volume);
  assert.equal(book.sha256, definition.sourceSha256);
  assert.equal(book.sourceFile, definition.sourceFile);
  const ordered = definition.pages.map((p) => {
    const source = pages.find((s) => s.page === p.page);
    assert.ok(source, `Missing original PDF page ${p.page}`);
    assert.ok(
      source.originalText.match(new RegExp(`\\.indd\\s+${p.printedPage}\\b`)),
      "Printed footer mapping differs from visual inventory",
    );
    return source;
  });
  const text = ordered.map((p) => p.columnOrderedText).join("\n");
  const anchors = [
    ...text.matchAll(
      definition.dotlessQuestionNumbers?.length
        ? new RegExp(
            `^[ \\t]*([1-9]\\d?)[ \\t]*[.][ \\t]*|^[ \\t]*(${definition.dotlessQuestionNumbers.join("|")})[ \\t]+`,
            "gm",
          )
        : /^[ \t]*([1-9]\d?)[ \t]*[.][ \t]*/gm,
    ),
  ].map((anchor) => {
    if (!anchor[1]) anchor[1] = anchor[2];
    return anchor;
  });
  const first = anchors.findIndex((a) => Number(a[1]) === 1);
  assert.ok(first >= 0, "Missing first exercise question");
  const stop = anchors.findIndex(
    (a, i) => i > first && Number(a[1]) === definition.stopBeforeQuestion,
  );
  const sectionEnd = text.search(
    new RegExp(definition.sectionEndPattern ?? "^[ \\t]*II\\s*[.]", "m"),
  );
  const stopOffset =
    definition.stopBeforeQuestion === null
      ? sectionEnd >= 0
        ? sectionEnd
        : definition.endAtLastPage
          ? text.length
          : sectionEnd
      : anchors[stop]?.index;
  assert.ok(
    stopOffset !== undefined && stopOffset > anchors[first].index!,
    `Missing explicit non-MCQ boundary: ${book.id} chapter ${definition.chapterNumber}; first=${anchors[first].index}, end=${stopOffset}`,
  );
  const premiseAnchors = new Set<RegExpMatchArray>();
  for (const premise of definition.numberedPremises ?? []) {
    const parent = anchors.findIndex(
      (a, i) => i >= first && Number(a[1]) === premise.question,
    );
    assert.ok(parent >= first, "Missing matching-question parent");
    const children = anchors.slice(parent + 1, parent + 1 + premise.count);
    assert.deepEqual(
      children.map((a) => Number(a[1])),
      Array.from({ length: premise.count }, (_, i) => i + 1),
      "Matching premises differ from the visually inspected source",
    );
    children.forEach((a) => premiseAnchors.add(a));
  }
  const starts = anchors
    .slice(first)
    .filter((a) => a.index! < stopOffset)
    .filter((a) => !premiseAnchors.has(a))
    .filter((a, index, list) => {
      if (!definition.embeddedNumberedListQuestions?.length) return true;
      const previous = list
        .slice(0, index)
        .findLast((v) =>
          definition.embeddedNumberedListQuestions!.includes(Number(v[1])),
        );
      return !(previous && Number(a[1]) < Number(previous[1]));
    });
  const expected = definition.pages.flatMap(
    (p) =>
      p.numbers ??
      Array.from({ length: p.last - p.first + 1 }, (_, i) => p.first + i),
  );
  assert.deepEqual(
    starts.map((a) => Number(a[1])),
    expected,
    `Source question order/numbering changed: ${book.id} chapter ${definition.chapterNumber}`,
  );
  const offsets = ordered.map((p, i) => ({
    page: p.page,
    start: ordered
      .slice(0, i)
      .reduce((n, v) => n + v.columnOrderedText.length + 1, 0),
    end: ordered
      .slice(0, i + 1)
      .reduce((n, v) => n + v.columnOrderedText.length + 1, 0),
  }));
  const chapterId = `tb-${book.id}-ch-${definition.chapterNumber}`;
  const groupedSpans = starts.map((anchor, index) => {
    const number = Number(anchor[1]),
      start = anchor.index! + anchor[0].length;
    const end = starts[index + 1]?.index ?? stopOffset;
    const page = offsets.find(
      (p) => anchor.index! >= p.start && anchor.index! < p.end,
    )!.page;
    const endPage = offsets.find(
      (p) => end - 1 >= p.start && end - 1 < p.end,
    )!.page;
    const occurrence = definition.sharedOptionSubitems?.length ? undefined : definition.sourceOccurrences?.[index];
    if (occurrence) {
      assert.equal(occurrence.ordinal, index + 1);
      assert.equal(occurrence.printedNumber, number);
      assert.equal(occurrence.pdfPage, page);
    } else {
      assert.equal(
        page,
        definition.pages.find((p) => number >= p.first && number <= p.last)
          ?.page,
      );
    }
    return {
      number,
      pdfPage: page,
      pdfEndPage: endPage,
      raw: text.slice(start, end).trim(),
      ...(occurrence ? { occurrence } : {}),
    };
  });
  const numbered = definition.sharedNumberedOptions;
  let numberedRubric: { originalRubric: string; labels: string[]; options: string[]; page: number } | undefined;
  if (numbered) {
    const previous = groupedSpans.find(s => s.number === numbered.afterQuestion)!;
    assert(previous, "Missing source question before shared rubric");
    const starts = [...previous.raw.matchAll(new RegExp(numbered.rubricStartPattern, "gm"))];
    assert.equal(starts.length, 1, "Shared numbered rubric boundary changed");
    const originalRubric = previous.raw.slice(starts[0].index).trim();
    previous.raw = previous.raw.slice(0, starts[0].index).trim();
    const labels = [...originalRubric.matchAll(new RegExp(numbered.optionLabelPattern, "gmu"))];
    assert.deepEqual(labels.map(m => m[1]), numbered.labels);
    const options = labels.map((m,i) => originalRubric.slice(m.index!+m[0].length, labels[i+1]?.index ?? originalRubric.length).trim().replace(/\s+/gu," "));
    assert(options.length === 4 && options.every(Boolean));
    numberedRubric = { originalRubric, labels:numbered.labels, options, page:previous.pdfEndPage };
  }
  const spans = expandSharedOptionSubitems(groupedSpans, definition.sharedOptionSubitems, definition.sourceOccurrences, ordered);
  const candidates = spans.map((span) => {
    const numberedItem = numbered?.items.find(i => i.number === span.number);
    let printedAnswer: { answer: "A" | "B" | "C" | "D"; text: string; page: number } | undefined;
    if (numberedItem) {
      assert(numberedRubric);
      const matches = [...span.raw.matchAll(new RegExp(numberedItem.answerPattern,"gmu"))];
      assert.equal(matches.length,1,"Explicit printed answer boundary changed");
      assert.equal(matches[0][1],numberedItem.expectedLabel,"Explicit printed answer label changed");
      assert.equal(span.raw.slice(matches[0].index!+matches[0][0].length).trim(),"","Uninventoried text after printed answer");
      assert.equal(span.pdfEndPage,numberedItem.keyPage);
      const index = numberedRubric.labels.indexOf(numberedItem.expectedLabel);
      assert(index >= 0 && index < 4);
      printedAnswer = {answer:(["A","B","C","D"] as const)[index],text:matches[0][0].trim(),page:numberedItem.keyPage};
      const originalGroupSpan=span.raw;
      span.raw=span.raw.slice(0,matches[0].index).trim();
      span.sharedRubric={label:String(span.number),originalRubric:numberedRubric.originalRubric,originalGroupSpan,labels:numberedRubric.labels,options:numberedRubric.options,responseRow:printedAnswer.text};
      span.sourceEvidencePages=[...new Set([numberedRubric.page,...Array.from({length:span.pdfEndPage-span.pdfPage+1},(_,i)=>span.pdfPage+i)])];
    }
    const matches = [
      ...new Map(
        existing
          .filter(
            (c) =>
              c.bookId === book.id &&
              c.chapterId === chapterId &&
              c.number === span.number &&
              c.page === span.pdfPage,
          )
          .filter(
            (c) => !span.occurrence || c.id === span.occurrence.existingId,
          )
          .filter(
            (c) => !definition.excludedExistingIds?.some((e) => e.id === c.id),
          )
          .map((c) => [c.id, c]),
      ).values(),
    ];
    assert.ok(
      matches.length <= 1,
      `Ambiguous existing IDs for ${chapterId} Q${span.number}; reconcile without insertion`,
    );
    const recoveredId = `textbook-bounded-${book.id}-${createHash("sha256")
      .update(
        `${book.sha256}:${definition.chapterNumber}:${span.number}:${span.pdfPage}${span.occurrence ? `:${span.occurrence.section}:${span.occurrence.ordinal}` : ""}`,
      )
      .digest("hex")
      .slice(0, 16)}`;
    // A source recovery stays a recovery on reruns. Its separately saved record
    // must not become a new original extraction or change the evidence digest.
    const old = matches[0]?.id === recoveredId ? undefined : matches[0];
    const choiceCount = definition.choiceCounts?.[String(span.number)] ?? 4;
    const parsed = span.sharedRubric
      ? { text: { questionText: span.raw, options: span.sharedRubric.options }, flags: textPresentationFlags(span.raw, span.sharedRubric.options, book.subject) }
      : definition.subjectNeutral || definition.chapterNumber >= 3 || definition.parenthesizedTamilOptions
        ? (() => {
            const body = span.raw
              .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/gu, " ")
              .split(/\n\s*பகுதி\s*[–-]\s*ஆ/u)[0];
            const english = definition.englishOptionQuestions?.includes(
              span.number,
            );
            const allLabels = [
              ...body.matchAll(
                definition.optionLabelPattern
                  ? new RegExp(definition.optionLabelPattern, "gu")
                  : definition.parenthesizedTamilOptions
                  ? /(?:^|\s)\(\s*([அஆஇஈ])\s*\)/gu
                  : english
                    ? /(?:^|\s)([a-d])\s*\)/gu
                    : /(?:^|\s)([அஆஇஈ])\s*\)/gu,
              ),
            ];
            const labels = allLabels.slice(definition.optionLabelSkip?.[String(span.number)] ?? 0);
            assert.deepEqual(
              labels.map((l) => definition.subjectNeutral ? l[1].toLowerCase() : l[1]),
              definition.printedOptionLabels?.[String(span.number)] ??
                [...(english || (definition.subjectNeutral && book.sourceMedium === "English") ? "abcd" : "அஆஇஈ")].slice(0, choiceCount),
              `Visually inventoried printed option labels changed: ${book.id} chapter ${definition.chapterNumber} Q${span.number} PDF ${span.pdfPage}`,
            );
            const questionText = body
              .slice(0, labels[0].index)
              .trim()
              .replace(
                definition.preserveLineBreakQuestions?.includes(span.number)
                  ? /[^\S\n]+/gu
                  : /\s+/gu,
                " ",
              );
            const options = labels.map((l, i) =>
              body
                .slice(
                  l.index! + l[0].length,
                  labels[i + 1]?.index ?? body.length,
                )
                .trim()
                .replace(/\s+/gu, " "),
            );
            return {
              text: { questionText, options },
              flags: [
                ...textPresentationFlags(questionText, options, book.subject),
                ...(choiceCount === 2
                  ? [
                      "Printed binary true/false item has only two choices; do not fabricate C/D or approve for four-choice practice",
                    ]
                  : []),
              ],
            };
          })()
        : extractReadableMcqText(span.raw, book.subject);
    const options = parsed.text?.options || [];
    assert.equal(
      options.length,
      choiceCount,
      `Question ${span.number} requires manual option-boundary reconciliation`,
    );
    assert.ok(
      options.every((o) => o.trim()),
      `Question ${span.number} contains an empty option`,
    );
    const id = old?.id || recoveredId;
    return {
      id,
      ...(span.occurrence
        ? {
            sourceOccurrence: {
              section: span.occurrence.section,
              ordinal: span.occurrence.ordinal,
              printedNumber: span.number,
              pdfPage: span.pdfPage,
              reason: span.occurrence.reason,
            },
          }
        : {}),
      bookId: book.id,
      subjectId: `tb-${book.id}`,
      chapterId,
      chapterTitle: definition.chapterTitle,
      number: span.number,
      page: span.pdfPage,
      endPage: span.pdfEndPage,
      section: "Book-back" as const,
      questionText: parsed.text!.questionText,
      options,
      correctAnswer: printedAnswer?.answer ?? null,
      ...(printedAnswer ? {keyPage:printedAnswer.page} : {}),
      status: "Needs Review" as const,
      reviewStatus: "needs_teacher_review" as const,
      practicePublished: false,
      sourceSha256: book.sha256!,
      qualityFlags: [
        ...new Set([
          "Held: explicit individual authenticated teacher review required",
          printedAnswer ? "Explicit printed answer retained as evidence only; transcription and individual teacher verification remain required" : "Answer unknown: no printed key located in inspected exercise pages; do not infer from prose or subject knowledge",
          ...(definition.subjectNeutral && book.sourceMedium !== "Tamil"
            ? ["Source transcription, punctuation, statements, matching tables and all options require individual teacher verification"]
            : ["Tamil extraction contains damaged/fragmented characters; visually faithful teacher correction required"]),
          ...parsed.flags,
          ...definition.sourceWarnings,
          ...(span.sharedRubric ? [`Printed Q${span.number}${numberedItem ? "" : "."+span.sharedRubric.label} uses the literal shared assertion/reason rubric, not generated distractors. Original rubric, response row and source pages are preserved. No answer is inferred.`] : []),
          ...(definition.questionWarnings?.[String(span.number)] ?? []),
          ...(old
            ? [
                "Retained ID is a provisional page/number match; reconcile the saved extraction with the source question",
              ]
            : []),
        ]),
      ],
      originalExtraction: structuredClone(
        old?.originalExtraction || {
          questionText: old?.questionText || span.raw,
          options: old?.options || options,
          correctAnswer: old?.correctAnswer || null,
        },
      ),
      extractionEvidence: {
        ...(span.sharedRubric ? { sharedSourceOptions: span.sharedRubric, sourcePageReferences: definition.pages.filter(p => span.sourceEvidencePages!.includes(p.page)).map(p => ({ pdfPage:p.page, printedPage:p.printedPage })) } : {}),
        ...(definition.subjectNeutral
          ? {
              printedOptionLabels: [
                ...span.raw.matchAll(new RegExp(definition.optionLabelPattern!, "gu")),
              ].slice(definition.optionLabelSkip?.[String(span.number)] ?? 0).map((label) => label[1]),
            }
          : {}),
        ...(span.sharedRubric ? { printedOptionLabels:span.sharedRubric.labels } : {}),
        ...(definition.printedOptionLabels?.[String(span.number)]
          ? {
              printedOptionLabels:
                definition.printedOptionLabels[String(span.number)],
            }
          : {}),
        sourceFile: book.sourceFile,
        medium: book.sourceMedium,
        volume: book.volume,
        pdfPageIndex: span.pdfPage - 1,
        printedPages: definition.pages
          .filter((p) => span.sourceEvidencePages ? span.sourceEvidencePages.includes(p.page) : p.page >= span.pdfPage && p.page <= span.pdfEndPage)
          .map((p) => p.printedPage),
        batchId: `${chapterId}-source-bounded-01`,
        reusedExistingId: Boolean(old),
        originalMapping: old
          ? { section: old.section, chapterTitle: old.chapterTitle }
          : null,
        originalPageText: ordered
          .filter((p) => span.sourceEvidencePages ? span.sourceEvidencePages.includes(p.page) : p.page >= span.pdfPage && p.page <= span.pdfEndPage)
          .map((p) => ({ page: p.page, text: p.originalText })),
        proposedColumnOrderedSpan: span.raw,
        proposedTranscription: parsed.text,
        method: definition.subjectNeutral
          ? "Visually bounded PDF text with configured column layout and original option labels; raw source retained; no inferred answers or choices"
          : "Visually bounded two-column PDF text; original Tamil glyph damage retained; no guessed answers or reconstructed choices",
        sourceInventoryVerified: true,
        wordingTeacherVerified: false,
        requiresDiagram: (definition.diagramQuestions as number[]).includes(
          span.number,
        ),
        completeTextOptions:
          choiceCount === 4 &&
          !definition.incompleteQuestions?.includes(span.number),
        approvalBlocked: true,
        approvalBlockReason: printedAnswer ? "Printed answer is evidence only; source transcription and explicit individual teacher verification required" : definition.subjectNeutral
          ? "Unknown answer and unverified source transcription require separately evidenced individual teacher verification"
          : "Unknown answer and damaged Tamil require source correction and separately evidenced teacher verification",
        proposedPrintedAnswer: printedAnswer?.answer ?? null,
        printedKeyEntry: printedAnswer?.text ?? null,
        keyPdfPage: printedAnswer?.page ?? null,
        keyPrintedPage: printedAnswer ? definition.pages.find(p=>p.page===printedAnswer.page)!.printedPage : null,
        keyText: printedAnswer ? `${definition.keyEvidence}\nQ${span.number}: ${printedAnswer.text} (PDF ${printedAnswer.page})` : definition.keyEvidence,
        visualKeyText: printedAnswer?.text ?? null,
        keyMatched: Boolean(printedAnswer),
      },
    };
  });
  assert.equal(new Set(candidates.map((c) => c.id)).size, candidates.length);
  const section: BookBackSection = {
    chapterId,
    startPdfPage: definition.pages[0].page,
    endPdfPage: definition.pages.at(-1)!.page,
    heading: definition.sectionHeading ??
      "I. சரியான விடையைத் தேர்ந்தெடுத்து எழுதுக — visually bounded four-option subset only",
    questionNumbers: spans.map(s => s.number),
    sourceText: ordered.map((p) => p.originalText).join("\n"),
    questionSpans: spans,
    mappingStatus: "provisional-needs-source-review",
    terminationReason: "question-number-reset",
  };
  return {
    candidates,
    section,
    summary: {
      chapterId,
      chapterNumber: definition.chapterNumber,
      chapterTitle: definition.chapterTitle,
      batchId: `${chapterId}-source-bounded-01`,
      sourceInventoriedQuestions: candidates.length,
      pdfPages: definition.pages.map((p) => p.page),
      printedPages: definition.pages.map((p) => p.printedPage),
      keyPdfPage: null,
      keyMatched: candidates.filter((c) => c.extractionEvidence.keyMatched)
        .length,
      completeTextOptionMappings: candidates.filter(
        (c) => c.extractionEvidence.completeTextOptions,
      ).length,
      fourNonemptyChoicePositions: candidates.filter(
        (c) => c.options.length === 4 && c.options.every((o) => o.trim()),
      ).length,
      diagramDependent: candidates.filter(
        (c) => c.extractionEvidence.requiresDiagram,
      ).length,
      incompleteGraphQuestions: [] as number[],
      reusedIds: candidates.filter((c) => c.extractionEvidence.reusedExistingId)
        .length,
      newIds: candidates.filter((c) => !c.extractionEvidence.reusedExistingId)
        .length,
      teacherApproved: 0,
      published: 0,
      complete: false,
      excludedItems: definition.excludedItems,
      inspectedEndingPages: definition.inspectedEndingPages,
      answerEvidenceStatus:
        numbered ? "Explicit printed answers below numbered shared-rubric items; other answers unknown. Evidence does not grant approval." : "Not located in inspected exercise/ending pages; no whole-book absence claim",
    },
  };
}

export async function extractComputerSourceSections(
  book: Textbook,
  original: ExtractedBook,
  existing: TextbookMcqCandidate[],
  configurations: ComputerSectionDefinition[] = definitions,
) {
  const selectedDefinitions: ComputerSectionDefinition[] = configurations.filter(
    (d) => d.bookId === book.id,
  );
  if (!selectedDefinitions.length)
    return { candidates: [], sections: [], summaries: [] };
  const definition = selectedDefinitions[0];
  const bytes = await readFile("public" + book.localPath);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    definition.sourceSha256,
  );
  assert.equal(original.sha256, definition.sourceSha256);
  const task = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
    verbosity: 0,
  });
  const results: ReturnType<typeof prepareComputerSection>[] = [];
  try {
    const pdf = await task.promise;
    assert.equal(pdf.numPages, original.pages.length);
    for (const sectionDefinition of selectedDefinitions) {
      const pages: ComputerSourcePage[] = [];
      for (const group of sectionDefinition.pages) {
        const page = await pdf.getPage(group.page),
          content = await page.getTextContent(),
          viewport = page.getViewport({ scale: 1 });
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
          original.pages.find((p) => p.page === group.page)?.text,
          "Fresh source/cache mismatch",
        );
        const items = content.items
          .filter(
            (i) =>
              "str" in i &&
              i.transform[5] > (group.contentBottomPoints ?? 85) &&
              i.transform[4] >= viewport.width * (group.contentLeftFraction ?? 0) &&
              i.transform[5] < viewport.height * (1 - group.contentTopFraction),
          )
          .map((i) => {
            assert.ok("str" in i);
            return { str: i.str, transform: [...i.transform], width: i.width };
          });
        pages.push({
          page: group.page,
          originalText,
          columnOrderedText: twoColumnPdfText(
            items,
            group.layout === "single-column"
              ? viewport.width * 3
              : viewport.width,
          ),
        });
        page.cleanup();
      }
      results.push(
        prepareComputerSection(book, sectionDefinition, pages, existing),
      );
    }
  } finally {
    await task.destroy();
  }
  return {
    candidates: results.flatMap((r) => r.candidates),
    sections: results.map((r) => r.section),
    summaries: results.map((r) => r.summary),
  };
}
