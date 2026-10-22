import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import definition from "../data/commerce-source-section.json";
import type { Textbook } from "../../src/lib/textbooks";
import type { TextbookMcqCandidate } from "../../src/lib/textbook-question-types";
import type { ExtractedBook } from "./textbook-question-parser";
import type { BookBackSection } from "./book-back-inventory";
import { twoColumnPdfText } from "./pdf-column-text";
import { extractReadableMcqText } from "./textbook-question-text";
import { parsePrintedAnswerKey } from "./textbook-answer-keys";

export async function extractCommerceSourceSection(
  book: Textbook,
  original: ExtractedBook,
  existing: TextbookMcqCandidate[],
) {
  assert.equal(book.id, definition.bookId);
  assert.equal(book.subject, definition.subject);
  assert.equal(book.sourceMedium, definition.medium);
  assert.equal(book.volume, definition.volume);
  assert.equal(book.sourceFile, definition.sourceFile);
  assert.equal(book.sha256, definition.sourceSha256);
  assert.equal(original.sha256, definition.sourceSha256);
  const bytes = await readFile("public" + book.localPath);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    definition.sourceSha256,
  );
  const task = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
    verbosity: 0,
  });
  let originalText = "",
    ordered = "";
  try {
    const pdf = await task.promise,
      page = await pdf.getPage(272),
      content = await page.getTextContent();
    originalText = content.items
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
      original.pages.find((p) => p.page === 272)?.text,
    );
    assert.ok(/\.indd\s+258\b/.test(originalText));
    // The exercise occupies the right-hand column; the left-hand CEO table and
    // prose are explicitly excluded, while full immutable page text is retained.
    const width = page.getViewport({ scale: 1 }).width;
    const items = content.items
      .filter(
        (i) => "str" in i && i.transform[4] > width / 2 && i.transform[5] > 70,
      )
      .map((i) => {
        assert.ok("str" in i);
        return { str: i.str, transform: [...i.transform], width: i.width };
      });
    ordered = twoColumnPdfText(items, width);
    page.cleanup();
  } finally {
    await task.destroy();
  }
  const section2 = ordered.search(/^\s*II\./m);
  assert.ok(section2 > 0, "Missing Section II boundary");
  const section1 = ordered.slice(0, section2);
  // Tamil letters are not ASCII word characters: a whitespace/EOF lookahead is required.
  const keyMatch = section1.match(
    /(?:^|\n)\s*(1\s+இ\s+2\s+ஈ\s+3\s+இ\s+4\s+ஈ\s+5\s+இ)(?=\s|$)/u,
  );
  assert.ok(
    keyMatch,
    "The visually inspected Tamil numbered key must be identifiable",
  );
  const keyText = keyMatch[1].trim();
  const key = parsePrintedAnswerKey(keyText),
    visual = parsePrintedAnswerKey(definition.visualKeyText);
  assert.ok(key.complete && !key.conflict);
  assert.deepEqual([...key.answers], [...visual.answers]);
  const body = section1.slice(0, keyMatch.index!);
  const anchors = [...body.matchAll(/^\s*([1-5])\s+(?=[^\d\s])/gm)];
  assert.deepEqual(
    anchors.map((a) => Number(a[1])),
    [1, 2, 3, 4, 5],
  );
  const chapterId = `tb-${book.id}-ch-27`;
  const spans = anchors.map((anchor, i) => ({
    number: Number(anchor[1]),
    pdfPage: 272,
    pdfEndPage: 272,
    raw: body
      .slice(
        anchor.index! + anchor[0].length,
        anchors[i + 1]?.index ?? body.length,
      )
      .replace(/\n[^\n]*:\s*$/u, "")
      .trim(),
  }));
  const candidates = spans.map((span) => {
    const stableId = `textbook-bounded-${book.id}-${createHash("sha256").update(`${book.sha256}:27:${span.number}:272`).digest("hex").slice(0, 16)}`;
    const matches = [
      ...new Map(
        existing
          .filter(
            (c) =>
              c.bookId === book.id &&
              c.chapterId === chapterId &&
              c.page === 272 &&
              c.number === span.number,
          )
          .map((c) => [c.id, c]),
      ).values(),
    ];
    assert.ok(
      matches.length <= 1,
      "Ambiguous Commerce identity; reconcile before recovery",
    );
    const old = matches[0],
      reused = Boolean(old && old.id !== stableId);
    const parsed = extractReadableMcqText(
      span.raw.replaceAll("\u0007", " "),
      book.subject,
    );
    assert.equal(
      parsed.text?.options.length,
      4,
      `Question ${span.number} requires four printed options`,
    );
    const options = parsed.text!.options;
    assert.ok(options.every((o) => o.trim()));
    const answer = key.answers.get(span.number)!;
    assert.ok(options["ABCD".indexOf(answer)]);
    return {
      id: old?.id || stableId,
      bookId: book.id,
      subjectId: `tb-${book.id}`,
      chapterId,
      chapterTitle: definition.chapterTitle,
      number: span.number,
      page: 272,
      endPage: 272,
      section: "Book-back" as const,
      questionText: parsed.text!.questionText,
      options,
      correctAnswer: answer,
      keyPage: 272,
      status: "Needs Review" as const,
      reviewStatus: "needs_teacher_review" as const,
      practicePublished: false,
      sourceSha256: book.sha256!,
      qualityFlags: [
        "Held: individual teacher correction and verification required; printed-key agreement is not approval",
        "Original Tamil contains control characters, replacement glyphs and fragmented words; proposed extraction is not a verified transcription",
        ...parsed.flags,
        ...(reused
          ? [
              "Reconcile provisional retained ID with source question before review",
            ]
          : []),
      ],
      originalExtraction: structuredClone(
        old?.originalExtraction || {
          questionText: span.raw,
          options: [...options],
          correctAnswer: null,
        },
      ),
      extractionEvidence: {
        sourceFile: book.sourceFile,
        medium: book.sourceMedium,
        volume: book.volume,
        pdfPageIndex: 271,
        printedPages: [258],
        batchId: `${chapterId}-source-bounded-01`,
        reusedExistingId: reused,
        originalMapping: reused
          ? { section: old.section, chapterTitle: old.chapterTitle }
          : null,
        originalPageText: [{ page: 272, text: originalText }],
        proposedColumnOrderedSpan: span.raw,
        proposedTranscription: parsed.text,
        method:
          "Right-column bounded PDF extraction; U+0007 replaced with whitespace in proposed text only, raw extraction retained",
        sourceInventoryVerified: true,
        wordingTeacherVerified: false,
        requiresDiagram: false,
        completeTextOptions: true,
        approvalBlocked: false,
        proposedPrintedAnswer: answer,
        printedKeyEntry: `${span.number} ${["அ", "ஆ", "இ", "ஈ"]["ABCD".indexOf(answer)]}`,
        keyPdfPage: 272,
        keyPrintedPage: 258,
        keyText,
        visualKeyText: definition.visualKeyText,
        keyMatched: true,
      },
    };
  });
  const section: BookBackSection = {
    chapterId,
    startPdfPage: 272,
    endPdfPage: 272,
    heading: "I. சரியான விடையைத் தேர்ந்தெடு — original Section I, right column",
    questionNumbers: spans.map((s) => s.number),
    questionSpans: spans,
    sourceText: originalText,
    mappingStatus: "provisional-needs-source-review",
    terminationReason: "section-heading",
  };
  return {
    candidates,
    sections: [section],
    summaries: [
      {
        chapterId,
        chapterNumber: 27,
        chapterTitle: definition.chapterTitle,
        batchId: `${chapterId}-source-bounded-01`,
        sourceInventoriedQuestions: candidates.length,
        pdfPages: [272],
        printedPages: [258],
        keyPdfPage: 272,
        keyMatched: candidates.filter((c) => c.extractionEvidence.keyMatched)
          .length,
        completeTextOptionMappings: candidates.filter(
          (c) => c.options.length === 4,
        ).length,
        diagramDependent: 0,
        incompleteGraphQuestions: [] as number[],
        reusedIds: candidates.filter(
          (c) => c.extractionEvidence.reusedExistingId,
        ).length,
        newIds: candidates.filter((c) => !c.extractionEvidence.reusedExistingId)
          .length,
        teacherApproved: 0,
        published: 0,
        complete: false,
      },
    ],
  };
}
