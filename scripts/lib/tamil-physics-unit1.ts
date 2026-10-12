import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { Textbook } from "../../src/lib/textbooks";
import type { TextbookMcqCandidate } from "../../src/lib/textbook-question-types";
import { parsePrintedAnswerKey } from "./textbook-answer-keys";
import {
  extractReadableMcqText,
  textPresentationFlags,
} from "./textbook-question-text";

export interface Unit1Transcription {
  bookId: string;
  sourceSha256: string;
  sourceFile: string;
  chapterTitle: string;
  chapterStartPdfPage: number;
  chapterEndPdfPage: number;
  exerciseHeading: string;
  keyHeading: string;
  keyPdfPage: number;
  keyPrintedPage: number;
  visualKeyText: string;
  method: string;
  questions: {
    number: number;
    page: number;
    endPage: number;
    printedPage: number;
    questionText: string;
    options: string[];
    requiresDiagram: boolean;
    diagramEvidence?: string;
    warnings: string[];
  }[];
}
export interface Unit1SourcePage {
  page: number;
  text: string;
}
export type Unit1Candidate = TextbookMcqCandidate & {
  extractionEvidence: {
    sourceFile: string;
    localPdf: string;
    pdfPageIndex: number;
    printedPages: number[];
    originalRawSpan: string;
    proposedTranscription: { questionText: string; options: string[] };
    transcriptionMethod: string;
    requiresDiagram: boolean;
    completeTextOptions: boolean;
    diagramEvidence: string | null;
    printedKeyEntry: string;
    keyPrintedPage: number;
    reusedExistingId: boolean;
    originalMapping: { chapterTitle: string; section: string } | null;
  };
};

/** Bounded local evidence preparation. No database client or publication path. */
export function preparePhysicsUnit1(
  book: Textbook,
  metadata: {
    id: string;
    subject: string;
    source_medium: string;
    volume: string;
    sha256: string;
  },
  pages: Unit1SourcePage[],
  baseline: TextbookMcqCandidate[],
  transcription: Unit1Transcription,
  preparedAt = new Date().toISOString(),
): Unit1Candidate[] {
  assert.equal(book.id, "12-physics-tamil-v1-c1623725");
  assert.equal(metadata.id, book.id);
  assert.equal(metadata.subject, "Physics");
  assert.equal(metadata.source_medium, "Tamil");
  assert.equal(metadata.volume, "1");
  assert.equal(metadata.sha256, transcription.sourceSha256);
  assert.equal(book.sha256, metadata.sha256);
  assert.equal(book.sourceFile, transcription.sourceFile);
  assert.equal(transcription.bookId, book.id);
  assert.equal(transcription.keyPdfPage, 81);
  const keyPage = pages.find((p) => p.page === 81)!;
  assert.ok(keyPage, "Original key page must be present");
  const keyStart = keyPage.text.search(/\n1\)\s+[a-d]\b/i);
  const keyEnd = keyPage.text.indexOf("\nII", keyStart);
  assert.ok(
    keyStart >= 0 && keyEnd > keyStart,
    "Bound the numbered key before section II",
  );
  const keyText = keyPage.text.slice(keyStart + 1, keyEnd).trim();
  const key = parsePrintedAnswerKey(keyText);
  const visualKey = parsePrintedAnswerKey(transcription.visualKeyText);
  assert.ok(
    key.complete && !key.conflict && visualKey.complete && !visualKey.conflict,
  );
  assert.deepEqual(
    [...key.answers],
    [...visualKey.answers],
    "Rendered key comparison must match fresh PDF evidence",
  );
  const chapterId = `tb-${book.id}-ch-1`;
  const originalPages = [79, 80, 81].map((number) => {
    const page = pages.find((p) => p.page === number);
    assert.ok(page && page.text, `Original PDF ${number} must be present`);
    const printed = Number(page.text.match(/^\s*(\d+)\b/)?.[1]);
    assert.equal(
      printed,
      number - 8,
      "Printed page label must agree with the visual transcription",
    );
    return page;
  });
  const raw = originalPages.map((p) => p.text).join("\n");
  const rawKeyStart = raw.indexOf(keyText);
  assert.ok(rawKeyStart > 0);
  const exercise = raw.slice(0, rawKeyStart);
  const starts = [...exercise.matchAll(/(?:^|\n)\s*(1\s+4|[1-9]\d?)\s*\.\s*/g)];
  const questionNumbers = starts.map((start) =>
    Number(start[1].replace(/\s/g, "")),
  );
  assert.deepEqual(
    questionNumbers,
    [...key.answers.keys()],
    "Source question boundaries must match the scoped key exactly",
  );
  assert.deepEqual(
    transcription.questions.map((q) => q.number),
    questionNumbers,
  );
  assert.equal(
    new Set(transcription.questions.map((q) => `${q.page}|${q.number}`)).size,
    questionNumbers.length,
  );
  const result = transcription.questions.map((q, index): Unit1Candidate => {
    assert.ok(q.page >= 79 && q.endPage >= q.page && q.endPage <= 81);
    assert.ok(
      q.page >= transcription.chapterStartPdfPage &&
        q.endPage <= transcription.chapterEndPdfPage,
    );
    assert.equal(q.printedPage, q.page - 8);
    const matches = baseline.filter(
      (c) => c.bookId === book.id && c.page === q.page && c.number === q.number,
    );
    assert.ok(
      matches.length <= 1,
      "Do not duplicate or arbitrarily choose overlapping source IDs",
    );
    const old = matches[0];
    if (old) {
      assert.equal(old.sourceSha256, book.sha256);
      assert.equal(old.chapterId, chapterId);
      assert.equal(
        old.status,
        "Needs Review",
        "Do not overwrite published records",
      );
      assert.ok(
        !old.reviewedBy &&
          !old.reviewHistory?.length &&
          !old.reviewPreparation &&
          !old.reviewStatus,
      );
    }
    const originalRawSpan = exercise
      .slice(
        starts[index].index! + starts[index][0].length,
        starts[index + 1]?.index ?? exercise.length,
      )
      .trim();
    let pageOffset = 0;
    const boundaryPage = originalPages.find((p) => {
      const here =
        starts[index].index! >= pageOffset &&
        starts[index].index! < pageOffset + p.text.length;
      pageOffset += p.text.length + 1;
      return here;
    });
    assert.equal(
      q.page,
      boundaryPage?.page,
      "Candidate page must match its fresh source question boundary",
    );
    const recovered = extractReadableMcqText(originalRawSpan, "Physics");
    const original = old
      ? structuredClone(old)
      : {
          questionText: recovered.text?.questionText ?? originalRawSpan,
          options: recovered.text?.options ?? [],
          correctAnswer: null,
        };
    const answer = key.answers.get(q.number)!;
    assert.equal(
      q.options.length,
      4,
      "Preserve four printed choice positions, including graph labels",
    );
    assert.ok(q.options.every((o) => o.trim().length > 0));
    assert.ok("ABCD".indexOf(answer) < q.options.length);
    const completeTextOptions = q.number !== 10;
    const warnings = [
      ...new Set([
        "Pending individual authenticated teacher review; visual transcription and printed-key agreement are not approval.",
        "Original PDF Tamil extraction is damaged; compare every proposed Tamil character and option against the original page.",
        "Existing chapter title points to front matter; proposed Unit 1 mapping is confirmed by PDF 9–87. Live mapping was not changed.",
        ...textPresentationFlags(
          original.questionText,
          original.options,
          "Physics",
        ),
        ...textPresentationFlags(q.questionText, q.options, "Physics"),
        ...q.warnings,
        ...(q.requiresDiagram
          ? [
              "Diagram-dependent: hold until the original geometry/graph is faithfully represented and teacher-verified.",
            ]
          : []),
      ]),
    ];
    const printedKeyEntry = `${q.number}) ${answer.toLowerCase()}`;
    return {
      id:
        old?.id ??
        `textbook-q-${book.id}-${createHash("sha256").update(`${book.sha256}|${chapterId}|${q.page}|${q.number}|Book-back`).digest("hex").slice(0, 16)}`,
      bookId: book.id,
      subjectId: `tb-${book.id}`,
      chapterId,
      chapterTitle: transcription.chapterTitle,
      number: q.number,
      page: q.page,
      endPage: q.endPage,
      section: "Book-back",
      exercise: transcription.exerciseHeading,
      questionText: q.questionText,
      options: [...q.options],
      correctAnswer: answer,
      keyPage: 81,
      presentation: "Text",
      status: "Needs Review",
      reviewStatus: "needs_teacher_review",
      practicePublished: false,
      qualityFlags: warnings,
      sourceSha256: book.sha256!,
      originalExtraction: original,
      reviewHistory: [],
      reviewPreparation: {
        batchId: `${chapterId}-review-01`,
        preparedAt,
        sourceSha256: book.sha256!,
        subject: "Physics",
        title: book.title,
        medium: metadata.source_medium,
        volume: metadata.volume,
        printedPage: q.printedPage,
        printedPageEvidence: `Visible footer in fresh rendered PDF ${q.page}; fresh extracted page header also contains ${q.printedPage}. End page printed label: ${q.endPage - 8}.`,
        sourceCheck: "uncertain",
        keyCheck: "matched",
        sourceQuestionText: original.questionText,
        sourceOptions: [...original.options],
        englishText: null,
        tamilText: original.questionText,
        sourcePageText: originalPages
          .filter((p) => p.page >= q.page && p.page <= q.endPage)
          .map((p) => `PDF ${p.page}\n${p.text}`)
          .join("\n\n"),
        keyPageText: keyText,
        parsedAnswer: answer,
        warnings,
        duplicateIds: [],
      },
      extractionEvidence: {
        sourceFile: transcription.sourceFile,
        localPdf: book.localPath!,
        pdfPageIndex: q.page - 1,
        printedPages: Array.from(
          { length: q.endPage - q.page + 1 },
          (_, i) => q.printedPage + i,
        ),
        originalRawSpan,
        proposedTranscription: {
          questionText: q.questionText,
          options: [...q.options],
        },
        transcriptionMethod: transcription.method,
        requiresDiagram: q.requiresDiagram,
        completeTextOptions,
        diagramEvidence: q.diagramEvidence ?? null,
        printedKeyEntry,
        keyPrintedPage: 73,
        reusedExistingId: !!old,
        originalMapping: old
          ? { chapterTitle: old.chapterTitle, section: old.section }
          : null,
      },
    };
  });
  assert.equal(new Set(result.map((c) => c.id)).size, result.length);
  return result;
}

/** Insert missing IDs only. Reruns cannot replace local edits or review history. */
export function mergeLocalReviewQueue(
  existing: Unit1Candidate[],
  incoming: Unit1Candidate[],
) {
  const result = new Map(existing.map((c) => [c.id, c]));
  assert.equal(
    result.size,
    existing.length,
    "Existing queue has duplicate IDs",
  );
  for (const c of incoming) {
    const overlap = [...result.values()].find(
      (r) =>
        r.bookId === c.bookId &&
        r.sourceSha256 === c.sourceSha256 &&
        r.page === c.page &&
        r.number === c.number,
    );
    assert.ok(
      !overlap || overlap.id === c.id,
      "Source overlap must retain its existing ID",
    );
    if (!result.has(c.id)) result.set(c.id, structuredClone(c));
  }
  return [...result.values()];
}
