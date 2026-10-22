import assert from "node:assert/strict";
import test from "node:test";
import {
  selectPracticeQuestions,
  matchesPracticeSearch,
  eligiblePracticeCoverage,
} from "../src/lib/textbook-practice-selection";
import type { Question } from "../src/types";
import baseline from "../src/lib/textbook-publication-baseline.json";
import { hasTextbookPublicationApproval } from "../src/lib/textbook-publication-policy";
import type { TextbookMcqCoverage } from "../src/lib/textbook-question-types";
const source = {
  id: "one",
  questionText: "Which amount is the opening capital?",
  optionA: "100",
  optionB: "200",
  optionC: "300",
  optionD: "400",
  correctAnswer: "A",
  status: "Published",
  reviewStatus: "approved",
  reviewedBy: "isolated-fixture-reviewer",
  reviewedAt: "2026-10-14T00:00:00.000Z",
  sourceTextbookId: "book-one",
  sourceQuestionNumber: 7,
  chapterId: "one",
  subjectId: "subject",
} as Question;
test("book/chapter counts exclude unreviewed published rows exactly like practice selection", () => {
  const book = {
    bookId: "book-one",
    subjectId: "subject",
    published: 99,
    chapters: [
      { id: "one", published: 99 },
      { id: "empty", published: 20 },
    ],
    review: 17,
  } as TextbookMcqCoverage;
  const questions = [
    { ...source, sourceType: "Book-In" as const },
    {
      ...source,
      id: "unreviewed",
      sourceType: "Book-In" as const,
      reviewStatus: undefined,
      reviewedBy: undefined,
    },
    {
      ...source,
      id: "rejected",
      sourceType: "Book-In" as const,
      reviewStatus: "rejected" as const,
    },
    {
      ...source,
      id: "different-subject",
      sourceType: "Book-In" as const,
      subjectId: "other",
    },
  ];
  const result = eligiblePracticeCoverage([book], questions)[0];
  assert.equal(result.published, 1);
  assert.deepEqual(
    result.chapters.map((c) => c.published),
    [1, 0],
  );
  assert.equal(result.review, 17);
  assert.equal(book.published, 99);
});
test("retention covers only the exact saved publications; a new or altered textbook row needs a review", () => {
  assert.equal(baseline.questions.length, 995);
  assert.equal(
    new Set(baseline.questions.map((q) => q.id)).size,
    baseline.questions.length,
  );
  assert.equal(
    hasTextbookPublicationApproval({
      ...source,
      reviewStatus: undefined,
      reviewedBy: undefined,
      id: "new-unreviewed",
    }),
    false,
  );
  assert.equal(
    hasTextbookPublicationApproval({
      ...source,
      id: baseline.questions[0].id,
      reviewStatus: undefined,
      reviewedBy: undefined,
      questionText: "Silently changed source wording",
    }),
    false,
  );
  assert.equal(
    hasTextbookPublicationApproval({ ...source, reviewedBy: undefined }),
    false,
  );
  assert.equal(hasTextbookPublicationApproval(source), true);
});
test("search respects Tamil/option text and printed question number without cross-book or held matches", () => {
  assert.ok(matchesPracticeSearch(source, "capital 7"));
  assert.ok(matchesPracticeSearch(source, "200"));
  assert.ok(
    matchesPracticeSearch(
      { ...source, questionTextTamil: "மின்சாரம்" },
      "மின்சாரம்",
    ),
  );
  const result = selectPracticeQuestions(
    [
      source,
      { ...source, id: "other-volume", sourceTextbookId: "book-two" },
      { ...source, id: "held", status: "Teacher Review" },
      { ...source, id: "rejected", reviewStatus: "rejected" },
      { ...source, id: "needs-review", reviewStatus: "needs_teacher_review" },
      { ...source, id: "invalid", correctAnswer: "D", optionD: "" },
    ],
    { bookId: "book-one", search: "capital" },
  );
  assert.deepEqual(
    result.map((q) => q.id),
    ["one"],
  );
});
test("same-set retries retain source order, omit withdrawn questions and do not duplicate IDs", () => {
  const questions = [
    source,
    { ...source, id: "two" },
    { ...source, id: "held", status: "Teacher Review" as const },
  ];
  assert.deepEqual(
    selectPracticeQuestions(questions, {
      previousIds: ["two", "held", "one", "one"],
    }).map((q) => q.id),
    ["two", "one"],
  );
  assert.equal(
    selectPracticeQuestions(
      Array.from({ length: 501 }, (_, i) => ({ ...source, id: String(i) })),
      {},
    ).length,
    501,
  );
});
