import test from "node:test";
import assert from "node:assert/strict";
import {
  ALL_PRACTICE_QUESTIONS,
  MATHS_QUESTIONS,
  QUESTION_COUNTS_BY_CHAPTER,
} from "../src/lib/data/questions";
import { ORIGINAL_PRACTICE_QUESTIONS } from "../src/lib/data/questions/original";

test("generated drafts cannot publish guesses or estimated textbook citations", () => {
  const generated = ALL_PRACTICE_QUESTIONS.filter((q) =>
    q.id.startsWith("review-generated-"),
  );
  assert.ok(generated.length > 500);
  assert.ok(MATHS_QUESTIONS.length > 200);
  assert.equal(
    new Set(ALL_PRACTICE_QUESTIONS.map((q) => q.id)).size,
    ALL_PRACTICE_QUESTIONS.length,
  );
  for (const q of generated) {
    assert.equal(q.status, "Teacher Review");
    assert.equal(q.sourceType, "Book-Out");
    assert.equal(q.sourceTextbookId, undefined);
    assert.equal(q.sourceAnswerPage, undefined);
    assert.equal(q.answerVerification, undefined);
    assert.match(q.explanation, /^Unverified generated draft/);
  }
  assert.deepEqual(
    ALL_PRACTICE_QUESTIONS.filter((q) => q.status === "Published"),
    ORIGINAL_PRACTICE_QUESTIONS,
  );
  assert.equal(QUESTION_COUNTS_BY_CHAPTER["maths-ch-1"] ?? 0, 0);
});
