import assert from "node:assert/strict";
import test from "node:test";
import { completedTextPages } from "../scripts/lib/textbook-pdf-text";
import {
  heldExtractionRecord,
  inventoryBookBackSections,
  mergeHeldRecords,
  scopedMcqSourceSpan,
} from "../scripts/lib/book-back-inventory";
import type { ExtractedBook } from "../scripts/lib/textbook-question-parser";
import type {
  TextbookMcqCandidate,
  TextbookMcqChapter,
} from "../src/lib/textbook-question-types";

test("source evidence cannot attach a short-answer restart from a different PDF page", () => {
  const extracted: ExtractedBook = {
    id: "book",
    sha256: "a".repeat(64),
    outline: [],
    pages: [
      {
        page: 9,
        text: "EVALUATION\nChoose the correct answer\n1. Original MCQ?\na) One b) Two c) Three d) Four\n2. Continued MCQ",
      },
      {
        page: 10,
        text: "a) One b) Two c) Three d) Four\nII Short answers\n1. Explain something else.",
      },
    ],
  };
  const chapter = {
    id: "chapter",
    number: 1,
    title: "Chapter",
    page: 8,
    published: 0,
    review: 0,
  };
  const sections = inventoryBookBackSections(extracted, [chapter]);
  assert.equal(sections[0].endPdfPage, 10);
  const candidate = {
    id: "short-answer",
    bookId: "book",
    chapterId: "chapter",
    number: 1,
    page: 10,
    questionText: "Explain something else",
    options: [],
    correctAnswer: null,
    qualityFlags: [],
    status: "Needs Review",
    sourceSha256: extracted.sha256,
  } as unknown as TextbookMcqCandidate;
  const held = heldExtractionRecord(candidate, extracted.pages, sections);
  assert.deepEqual(held.sectionEvidence, []);
  assert.deepEqual(held.sourceRawQuestionSpans, []);
});

test("two-column source spans distinguish repeated short-answer and MCQ numbers", () => {
  const page =
    "6. Explain the lesson.\n7. Describe the format.\n6. Select the format?\na) TIFF b) BMP c) RTF d) JPEG\n7. Select the next value?\na) One b) Two c) Three d) Four\nII. Short answers\n1. Explain more.";
  assert.match(
    scopedMcqSourceSpan(page, 6, "Computer Applications"),
    /Select the format/,
  );
  assert.ok(
    !scopedMcqSourceSpan(page, 6, "Computer Applications").includes("Explain"),
  );
  assert.ok(
    !scopedMcqSourceSpan(page, 7, "Computer Applications").includes(
      "Short answers",
    ),
  );
  assert.throws(
    () => scopedMcqSourceSpan(page, 8, "Computer Applications"),
    /manual reconciliation/,
  );
});

test("resuming text extraction fills missing pages and rejects duplicate/out-of-range caches", () => {
  const book = { id: "test-book", sha256: "a".repeat(64) };
  const cache: ExtractedBook = {
    ...book,
    pages: [
      { page: 1, text: "Original source" },
      { page: 3, text: "" },
    ],
    outline: [],
  };
  assert.deepEqual([...completedTextPages(cache, book, 3).keys()], [1, 3]);
  assert.equal(
    completedTextPages(cache, { ...book, sha256: "b".repeat(64) }, 3).size,
    0,
  );
  assert.throws(
    () =>
      completedTextPages(
        { ...cache, pages: [...cache.pages, cache.pages[0]] },
        book,
        3,
      ),
    /duplicate/,
  );
  assert.throws(() => completedTextPages(cache, book, 2), /cached PDF page/);
});
test("scoped exercise inventory stops before short answers and ignores ordinary lesson numbering", () => {
  const chapter: TextbookMcqChapter = {
    id: "chapter-1",
    number: 1,
    title: "Chapter 1",
    page: 8,
    published: 0,
    review: 0,
  };
  const text: ExtractedBook = {
    id: "test",
    sha256: "a".repeat(64),
    outline: [],
    pages: [
      { page: 8, text: "Lesson\n1. Worked example with no choices." },
      {
        page: 9,
        text: "EVALUATION\nI. Choose the correct answer\n1. Select the first value?\n(a) One (b) Two (c) Three (d) Four\nII. Short answers\n2. Explain the lesson.",
      },
    ],
  };
  const sections = inventoryBookBackSections(text, [chapter]);
  assert.equal(sections.length, 1);
  assert.deepEqual(sections[0].questionNumbers, [1]);
  assert.equal(sections[0].startPdfPage, 9);
  assert.ok(!sections[0].sourceText.includes("Explain the lesson"));
  const resetText = structuredClone(text);
  resetText.pages[1].text =
    "EVALUATION\nChoose the correct answer\n1. First question?\na) One b) Two c) Three d) Four\n2. Second question?\na) One b) Two c) Three d) Four\n1. Explain this later section.";
  const bounded = inventoryBookBackSections(resetText, [chapter]);
  assert.deepEqual(bounded[0].questionNumbers, [1, 2]);
  assert.ok(!bounded[0].sourceText.includes("Explain this later section"));
  assert.equal(bounded[0].terminationReason, "question-number-reset");
});
test("key-eligible candidates stay held and re-extraction preserves independent corrections/history", () => {
  const source: TextbookMcqCandidate = {
    id: "stable",
    bookId: "test",
    subjectId: "subject",
    chapterId: "chapter",
    chapterTitle: "Chapter",
    number: 1,
    page: 9,
    section: "Book-back",
    questionText: "Original Tamil wording?",
    options: ["One", "Two", "Three", "Four"],
    correctAnswer: "A",
    keyPage: 10,
    status: "Published",
    qualityFlags: [],
    sourceSha256: "a".repeat(64),
  };
  const record = heldExtractionRecord(
    source,
    [
      { page: 9, text: "Raw source wording" },
      { page: 10, text: "1. A" },
    ],
    [],
  );
  assert.equal(record.status, "Needs Review");
  assert.equal(record.practicePublished, false);
  assert.equal(record.parserEligibility, true);
  assert.equal(record.sourcePageText, "Raw source wording");
  assert.equal(record.keyPageText, "1. A");
  const edited = {
    ...record,
    questionText: "Teacher draft preserved",
    reviewHistory: [
      {
        action: "edit",
        actorId: "fixture",
        at: new Date().toISOString(),
        reason: "Fixture correction",
        before: source,
        after: source,
      },
    ],
  };
  const merged = mergeHeldRecords([edited], [record]);
  assert.equal(merged.added, 0);
  assert.deepEqual(merged.records, [edited]);
  assert.throws(
    () => mergeHeldRecords([edited, edited], []),
    /Duplicate saved/,
  );
});
