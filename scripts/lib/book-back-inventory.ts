import type { ExtractedBook } from "./textbook-question-parser";
import { createHash } from "node:crypto";
import type { Textbook } from "../../src/lib/textbooks";
import { extractReadableMcqText } from "./textbook-question-text";
import sourceOverrides from "./book-back-source-overrides.json";
import type {
  TextbookMcqCandidate,
  TextbookMcqChapter,
} from "../../src/lib/textbook-question-types";

export interface BookBackSection {
  chapterId: string;
  startPdfPage: number;
  endPdfPage: number;
  heading: string;
  questionNumbers: number[];
  sourceText: string;
  questionSpans: {
    number: number;
    pdfPage: number;
    pdfEndPage: number;
    raw: string;
  }[];
  mappingStatus: "provisional-needs-source-review";
  terminationReason:
    "section-heading" | "question-number-reset" | "chapter-boundary";
}
/** Resolve repeated printed numbers on a visually inventoried two-column page.
 * Four parsed choices distinguish the MCQ from the short-answer occurrence.
 * This selects source text only; it never verifies wording or an answer.
 */
export function scopedMcqSourceSpan(
  pageText: string,
  number: number,
  subject: string,
) {
  const starts = [...pageText.matchAll(/^[ \t]*(\d{1,3})[ \t]*[.)][ \t]+/gm)];
  const choices = starts.flatMap((start, index) => {
    if (Number(start[1]) !== number) return [];
    const raw = pageText
      .slice(
        start.index! + start[0].length,
        starts[index + 1]?.index ?? pageText.length,
      )
      .split(/^[ \t]*(?:II\b|III\b|IV\b|பகுதி)/mu)[0];
    return extractReadableMcqText(raw, subject).text?.options.length === 4
      ? [raw]
      : [];
  });
  if (choices.length !== 1)
    throw new Error(
      `Question ${number} has ${choices.length} distinct four-option source spans; manual reconciliation required`,
    );
  return choices[0];
}
/** Conservative section inventory. Identifies headings; never claims visual/OCR completeness. */
export function inventoryBookBackSections(
  extracted: ExtractedBook,
  chapters: TextbookMcqChapter[],
  book?: Textbook,
): BookBackSection[] {
  const offsets: { start: number; end: number; page: number }[] = [];
  let text = "";
  for (const page of extracted.pages) {
    const start = text.length;
    text += page.text + "\n";
    offsets.push({ start, end: text.length, page: page.page });
  }
  const pageAt = (offset: number) =>
    offsets.find((p) => p.start <= offset && p.end > offset)?.page ||
    offsets.at(-1)?.page ||
    1;
  const headings = [
    ...text.matchAll(
      /^(?:[ \t]*I[.)][ \t]+[^\n]{3,160}|[ \t]*(?:Choose\s+the\s+(?:correct|best|most\s+suitable)|Multiple\s+Choice|Objective\s+Questions)[^\n]{0,100})$/gim,
    ),
  ];
  const sections: BookBackSection[] = [];
  for (const heading of headings) {
    const offset = heading.index!;
    const page = pageAt(offset);
    if (page <= 7) continue;
    const label = heading[0].trim();
    const context = text.slice(Math.max(0, offset - 300), offset);
    if (
      !/choose|multiple\s+choice|objective/i.test(label) &&
      !/பகுதி[^\n]{0,25}[அ]|மதிப்பீடு|EVALUATION|EXERCISE/iu.test(context)
    )
      continue;
    const chapter = chapters.findLast((ch) => ch.page <= page);
    if (!chapter) continue;
    const nextChapter = chapters.find((ch) => ch.page > page);
    const boundary = nextChapter
      ? (offsets.find((p) => p.page === nextChapter.page)?.start ?? text.length)
      : text.length;
    const remainder = text.slice(offset + heading[0].length, boundary);
    const ending = remainder.search(
      /^[ \t]*(?:II\b|III\b|IV\b|PART\s*(?:II|[BCD])\b|(?:Very\s+)?Short\s+answers?|Answers?(?:\s*key)?\b|Answer\s+the\s+following|பகுதி\s*[–—-]?\s*[ஆஇஈ])/gimu,
    );
    const end =
      offset + heading[0].length + (ending < 0 ? remainder.length : ending);
    let sourceText = text.slice(offset, end);
    let starts = [...sourceText.matchAll(/^[ \t]*(\d{1,3})[ \t]*[.)][ \t]+/gm)];
    // Subsequent parts and printed keys often restart at 1 even when OCR loses their headings.
    const reset = starts.findIndex(
      (m, index) => index > 0 && Number(m[1]) <= Number(starts[index - 1][1]),
    );
    if (reset >= 0) {
      sourceText = sourceText.slice(0, starts[reset].index);
      starts = starts.slice(0, reset);
    }
    const numbers = starts.map((m) => Number(m[1]));
    if (!numbers.length) continue;
    sections.push({
      chapterId: chapter.id,
      startPdfPage: page,
      endPdfPage: pageAt(Math.max(offset, offset + sourceText.length - 1)),
      heading: label,
      questionNumbers: numbers,
      sourceText,
      questionSpans: starts.map((start, i) => {
        const from = start.index! + start[0].length;
        const to = starts[i + 1]?.index ?? sourceText.length;
        return {
          number: Number(start[1]),
          pdfPage: pageAt(offset + start.index!),
          pdfEndPage: pageAt(offset + Math.max(from, to - 1)),
          raw: sourceText.slice(from, to),
        };
      }),
      mappingStatus: "provisional-needs-source-review",
      terminationReason:
        reset >= 0
          ? "question-number-reset"
          : ending >= 0
            ? "section-heading"
            : "chapter-boundary",
    });
  }
  const override = sourceOverrides.find((o) => o.bookId === book?.id);
  if (override) {
    if (book?.sha256 !== override.sourceSha256)
      throw new Error(
        "Visual inventory source hash changed; repeat source inspection.",
      );
    const chapter = chapters.find((c) => c.number === override.chapterNumber);
    if (!chapter)
      throw new Error(
        "Visually inventoried chapter is absent; reconcile mapping before extraction.",
      );
    const spans = override.questionNumbers.map((number) => {
      const pdfPage = number <= 5 ? override.pdfPages[0] : override.pdfPages[1];
      const pageText = extracted.pages.find((p) => p.page === pdfPage)?.text;
      if (pageText === undefined)
        throw new Error("Missing visually inventoried source page");
      // Q5's matching table contains its own numbered rows, so retain the full
      // source tail separately from the explicitly labelled proposed transcription.
      if (number !== 5) {
        // The first page's visually identified Q5 matching table also has a
        // row numbered 4; keep it outside the Q1–4 source search.
        const tableStart = pageText.search(/^[ \t]*5[ \t]*[.)][ \t]+/m);
        const scopedPage =
          number < 5 && tableStart >= 0
            ? pageText.slice(0, tableStart)
            : pageText;
        return {
          number,
          pdfPage,
          pdfEndPage: pdfPage,
          raw: scopedMcqSourceSpan(scopedPage, number, book!.subject),
        };
      }
      const start = [
        ...pageText.matchAll(/^[ \t]*(\d{1,3})[ \t]*[.)][ \t]+/gm),
      ].find((m) => Number(m[1]) === number);
      if (!start)
        throw new Error(
          `Visually inventoried question ${number} not found in raw text; manual reconciliation required`,
        );
      return {
        number,
        pdfPage,
        pdfEndPage: pdfPage,
        raw: pageText.slice(start.index! + start[0].length),
      };
    });
    return [
      ...sections.filter((s) => s.chapterId !== chapter.id),
      {
        chapterId: chapter.id,
        startPdfPage: override.pdfPages[0],
        endPdfPage: override.pdfPages[1],
        heading:
          "I. சரியான விடையைத் தேர்ந்தெடுத்து எழுதுக (visual section inventory)",
        questionNumbers: override.questionNumbers,
        sourceText: override.pdfPages
          .map((p) => extracted.pages.find((page) => page.page === p)!.text)
          .join("\n"),
        questionSpans: spans,
        mappingStatus: "provisional-needs-source-review",
        terminationReason: "section-heading",
      },
    ];
  }
  return sections;
}
export function recoverSectionCandidates(
  book: Textbook,
  sections: BookBackSection[],
  existing: TextbookMcqCandidate[],
) {
  const recovered: TextbookMcqCandidate[] = [];
  const ambiguous: { number: number; page: number; existingIds: string[] }[] =
    [];
  for (const section of sections)
    for (const span of section.questionSpans) {
      const possible = existing.filter(
        (c) => c.number === span.number && c.page === span.pdfPage,
      );
      // Existing identities take precedence. Ambiguous matches stay visible without duplicate insertion.
      if (possible.length) {
        if (possible.length > 1)
          ambiguous.push({
            number: span.number,
            page: span.pdfPage,
            existingIds: possible.map((c) => c.id),
          });
        continue;
      }
      const parsed = extractReadableMcqText(span.raw, book.subject);
      const override = sourceOverrides.find(
        (o) =>
          o.bookId === book.id &&
          span.number === 5 &&
          span.pdfPage === o.pdfPages[0],
      );
      if (override) parsed.text = override.question5ProposedTranscription;
      const questionText = parsed.text?.questionText || span.raw.trim();
      if (!questionText) continue;
      const suffix = createHash("sha256")
        .update(`${book.sha256}:${span.pdfPage}:${span.number}:${span.raw}`)
        .digest("hex")
        .slice(0, 16);
      recovered.push({
        id: `textbook-section-${book.id}-${suffix}`,
        bookId: book.id,
        subjectId: `tb-${book.id}`,
        chapterId: section.chapterId,
        chapterTitle: section.chapterId,
        number: span.number,
        page: span.pdfPage,
        endPage: span.pdfEndPage,
        section: "Book-back",
        questionText,
        options: parsed.text?.options || [],
        correctAnswer: null,
        status: "Needs Review",
        reviewStatus: "needs_teacher_review",
        practicePublished: false,
        qualityFlags: [
          ...parsed.flags,
          "Verify scoped book-back question and chapter against source",
          "Printed answer evidence required",
          ...(override
            ? [
                override.issue,
                "Proposed visual transcription is separate from the raw source; teacher verification required",
              ]
            : []),
        ],
        sourceSha256: book.sha256!,
        originalExtraction: {
          questionText: span.raw,
          options: override ? [] : parsed.text?.options || [],
          correctAnswer: null,
        },
      });
    }
  return {
    recovered: [...new Map(recovered.map((c) => [c.id, c])).values()],
    ambiguous,
  };
}
export function heldExtractionRecord(
  candidate: TextbookMcqCandidate,
  pages: ExtractedBook["pages"],
  sections: BookBackSection[],
) {
  const sectionEvidence = sections.filter(
    (section) =>
      section.chapterId === candidate.chapterId &&
      section.questionSpans.some(
        (span) =>
          span.pdfPage === candidate.page && span.number === candidate.number,
      ),
  );
  const stages = [
    "Extracted",
    ...(candidate.qualityFlags.length ? ["Needs OCR correction"] : []),
    ...(!candidate.correctAnswer ? ["Needs answer verification"] : []),
    "Needs teacher review",
  ];
  const sourcePageText =
    pages.find((p) => p.page === candidate.page)?.text || "";
  const labels = [
    ...new Set(
      [...sourcePageText.matchAll(/\.indd\s+(\d{1,4})\b/gi)].map((m) =>
        Number(m[1]),
      ),
    ),
  ];
  return {
    ...candidate,
    originalExtraction: candidate.originalExtraction || {
      questionText: candidate.questionText,
      options: [...candidate.options],
      correctAnswer: candidate.correctAnswer,
    },
    parserEligibility: candidate.status === "Published",
    status: "Needs Review" as const,
    reviewStatus: "needs_teacher_review" as const,
    practicePublished: false,
    extractionStages: stages,
    sectionEvidence: sectionEvidence.map((s) => ({
      chapterId: s.chapterId,
      startPdfPage: s.startPdfPage,
      endPdfPage: s.endPdfPage,
      heading: s.heading,
      questionNumbers: s.questionNumbers,
      mappingStatus: s.mappingStatus,
    })),
    sourceRawQuestionSpans: sectionEvidence.flatMap((s) =>
      s.questionSpans.filter(
        (span) =>
          span.number === candidate.number && span.pdfPage === candidate.page,
      ),
    ),
    sourcePageText,
    printedPage: labels.length === 1 ? labels[0] : null,
    printedPageStatus:
      labels.length === 1
        ? "Proposed from original .indd footer; teacher confirmation required"
        : "Unknown; needs source verification",
    keyPageText: pages.find((p) => p.page === candidate.keyPage)?.text || "",
    optionsOrigin: "Printed extraction; ordering requires source verification",
    chapterMappingStatus: "Needs source verification",
  };
}
/** Re-extraction never overwrites edited candidates, histories or decisions with the same stable ID. */
export function mergeHeldRecords<T extends { id: string }>(
  previous: T[],
  extracted: T[],
) {
  const map = new Map(previous.map((row) => [row.id, row]));
  if (map.size !== previous.length)
    throw new Error(
      "Duplicate saved candidate IDs; preserve and reconcile before resuming.",
    );
  let added = 0;
  for (const row of extracted)
    if (!map.has(row.id)) {
      map.set(row.id, row);
      added++;
    }
  return { records: [...map.values()], added };
}
