import assert from "node:assert/strict";
import test from "node:test";
import {
  twoColumnPdfText,
  type PositionedPdfText,
} from "../scripts/lib/pdf-column-text";
import {
  prepareBoundedSection,
  combineExtractionProposals,
  type BoundedSectionDefinition,
} from "../scripts/lib/source-bounded-extraction";
import { mergeHeldRecords } from "../scripts/lib/book-back-inventory";
import type { Textbook } from "../src/lib/textbooks";
import type { TextbookMcqCandidate } from "../src/lib/textbook-question-types";

test("PDF column ordering keeps split question choices together without repairing source glyphs", () => {
  const item = (str: string, x: number, y: number): PositionedPdfText => ({
    str,
    width: 20,
    transform: [1, 0, 0, 1, x, y],
  });
  const items = [
    item("3. next question", 340, 750),
    item("1. original Tamil \u0001", 50, 750),
    item("2. continued", 50, 100),
    item("(a) option one", 340, 780),
  ];
  const saved = structuredClone(items);
  const result = twoColumnPdfText(items, 600);
  assert(result.indexOf("2. continued") < result.indexOf("(a) option one"));
  assert(result.includes("\u0001"));
  assert.deepEqual(items, saved);
});
const book = {
  id: "test-physics",
  subject: "Physics",
  sourceMedium: "Tamil",
  volume: "1",
  sourceFile: "original.pdf",
  sha256: "a".repeat(64),
} as Textbook;
const definition: BoundedSectionDefinition = {
  chapterNumber: 2,
  chapterTitle: "Source unit",
  chapterStartPdfPage: 88,
  chapterEndPdfPage: 132,
  pageGroups: [
    { page: 126, printedPage: 118, first: 1, last: 2 },
    { page: 127, printedPage: 119, first: 3, last: 3 },
  ],
  keyPdfPage: 127,
  visualKeyText: "1) a 2) b 3) c",
  diagramQuestions: [2],
  incompleteGraphQuestions: [2],
};
const pages = [
  {
    page: 126,
    originalText: "Immutable original cache, including damaged Tamil",
    columnOrderedText:
      "I. Source exercise\n1. First source question?\na) One b) Two c) Three d) Four\n2. Which graph?\na) graph label A b) graph label B",
  },
  {
    page: 127,
    originalText: "Original key and unrelated short answers",
    columnOrderedText:
      "c) graph label C d) graph label D\n3. Third source question?\na) One b) Two c) Three d) Four\nவிடைகள்:\n1) a 2) b 3) c\nII Short answers\n1. Explain the lesson.",
  },
];
test("bounded source inventory retains IDs/raw evidence, flags incomplete graphs, and never grants approval", () => {
  const existing = {
    id: "stable-original",
    bookId: book.id,
    chapterId: `tb-${book.id}-ch-2`,
    number: 1,
    page: 126,
    sourceSha256: book.sha256,
    questionText: "Saved damaged extraction",
    options: ["original"],
    correctAnswer: null,
    section: "In-text",
    reviewHistory: [],
  } as unknown as TextbookMcqCandidate;
  const saved = structuredClone(existing);
  const result = prepareBoundedSection(book, definition, pages, [existing]);
  assert.equal(result.candidates.length, 3);
  assert.equal(result.candidates[0].id, existing.id);
  assert.deepEqual(result.candidates[0].originalExtraction?.options, [
    "original",
  ]);
  assert.equal(result.candidates[1].endPage, 127);
  assert.equal(result.candidates[1].correctAnswer, null);
  assert.equal(
    result.candidates[1].extractionEvidence.proposedPrintedAnswer,
    "B",
  );
  assert.equal(result.candidates[1].extractionEvidence.approvalBlocked, true);
  assert.equal(
    result.candidates[1].extractionEvidence.completeTextOptions,
    false,
  );
  assert(
    result.candidates.every(
      (c) =>
        c.status === "Needs Review" &&
        c.reviewStatus === "needs_teacher_review" &&
        c.practicePublished === false,
    ),
  );
  assert(!result.section.sourceText.includes("Explain the lesson"));
  assert.deepEqual(existing, saved);
  const repeat = prepareBoundedSection(book, definition, pages, [existing]);
  assert.deepEqual(
    repeat.candidates.map((c) => c.id),
    result.candidates.map((c) => c.id),
  );
  const edited = {
    ...result.candidates[0],
    questionText: "Separately saved teacher correction",
    reviewHistory: [{ action: "edit" }],
  };
  assert.deepEqual(
    mergeHeldRecords([edited], repeat.candidates).records[0],
    edited,
  );
});
test("bounded inventory rejects key disagreement, changed page mappings, missing questions and conflicting identities", () => {
  assert.throws(
    () =>
      prepareBoundedSection(
        book,
        { ...definition, visualKeyText: "1) b 2) b 3) c" },
        pages,
        [],
      ),
    /Printed key differs/,
  );
  assert.throws(
    () =>
      prepareBoundedSection(
        book,
        {
          ...definition,
          pageGroups: [
            { ...definition.pageGroups[0], printedPage: 999 },
            definition.pageGroups[1],
          ],
        },
        pages,
        [],
      ),
    /Printed source mapping/,
  );
  const damaged = structuredClone(pages);
  damaged[0].columnOrderedText = damaged[0].columnOrderedText.replace(
    "2. Which graph?",
    "Missing number",
  );
  assert.throws(
    () => prepareBoundedSection(book, definition, damaged, []),
    /Question order differs/,
  );
  const result = prepareBoundedSection(book, definition, pages, []);
  assert.throws(
    () =>
      prepareBoundedSection(book, definition, pages, [
        result.candidates[0],
        { ...result.candidates[0], id: "conflict" },
      ]),
    /Conflicting candidate identities/,
  );
});
test("generic and source-bounded recovery cannot create two active IDs for one printed occurrence", () => {
  const bounded = prepareBoundedSection(book, definition, pages, []).candidates;
  const generic = { ...bounded[0], id: "generic-draft-for-same-source" };
  const result = combineExtractionProposals([], [generic], bounded);
  assert.equal(result.length, bounded.length);
  assert(!result.some((c) => c.id === generic.id));
  assert.equal(
    mergeHeldRecords<TextbookMcqCandidate>([generic], result).records.length,
    bounded.length + 1,
    "Saved inactive artifact must not be deleted",
  );
  assert.throws(
    () =>
      combineExtractionProposals(
        [],
        [],
        [bounded[0], { ...bounded[0], id: "conflict" }],
      ),
    /Conflicting source-bounded/,
  );
});
