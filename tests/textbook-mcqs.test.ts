import assert from "node:assert/strict";
import test from "node:test";
import {
  extractBookMcqs,
  type ExtractedBook,
} from "../scripts/lib/textbook-question-parser";
import type { Textbook } from "../src/lib/textbooks";
import { parseQuestionCsv } from "../src/lib/question-import";
import { parsePrintedAnswerKey } from "../scripts/lib/textbook-answer-keys";
const book = {
  id: "fixture-book",
  subject: "Commerce",
  sha256: "a".repeat(64),
} as Textbook;
function extract(key: string, corrupt = false, numeric = false) {
  const label = (letter: string, i: number) =>
    numeric ? `(${i + 1})` : `${letter})`;
  const questions = Array.from(
    { length: 4 },
    (_, i) =>
      `${i + 1}. Which item describes the ${corrupt && i === 0 ? "\uFFFD" : "correct"} result for example ${i + 1}?\n${["First", "Second", "Third", "Fourth"].map((value, j) => `${label("abcd"[j], j)} ${value} option`).join("\n")}`,
  ).join("\n");
  const extracted: ExtractedBook = {
    id: book.id,
    sha256: book.sha256!,
    outline: [{ title: "Chapter 1", page: 8 }],
    pages: [
      {
        page: 8,
        text: `Evaluation\nChoose the correct answer\n${questions}\nAnswers\n${key}\nII Short answer`,
      },
    ],
  };
  return extractBookMcqs(book, extracted);
}
test("inline and table answer keys match all adjacent question numbers", () => {
  for (const key of [
    "1 a 2 b 3 c 4 d",
    "1 2 3 4\na b c d",
    "1.(a) 2.(b) 3.(c) 4.(d)",
  ]) {
    const { candidates } = extract(key);
    assert.equal(candidates.length, 4);
    assert.deepEqual(
      candidates.map((q) => q.correctAnswer),
      ["A", "B", "C", "D"],
    );
    assert.ok(candidates.every((q) => q.status === "Published"));
    assert.ok(candidates.every((q) => q.page === 8 && q.keyPage === 8));
    assert.deepEqual(
      candidates.map((q) => q.id),
      extract(key).candidates.map((q) => q.id),
    );
  }
});
test("missing and conflicting keys are withheld; damaged text uses the original PDF", () => {
  assert.ok(
    extract("1 a 2 b").candidates.every(
      (q) => q.status === "Needs Review" && !q.correctAnswer,
    ),
  );
  assert.ok(
    extract("1 a 2 b 3 c 4 d 1 b").candidates.every(
      (q) => q.status === "Needs Review" && !q.correctAnswer,
    ),
  );
  const damaged = extract("1 a 2 b 3 c 4 d", true).candidates[0];
  assert.equal(damaged.status, "Published");
  assert.equal(damaged.presentation, "Original PDF");
  assert.equal(damaged.correctAnswer, "A");
  assert.deepEqual(
    extract("1 a 2 b 3 c 4 d", false, true).candidates[0].options,
    ["First option", "Second option", "Third option", "Fourth option"],
  );
  assert.throws(
    () =>
      extractBookMcqs(
        { ...book, sha256: "b".repeat(64) },
        { id: book.id, sha256: book.sha256!, pages: [], outline: [] },
      ),
    /checksum/,
  );
});
test("numeric and explained keys keep source offsets and reject contradictory codes", () => {
  const numeric = parsePrintedAnswerKey("1 2 3 4 ---\n(4) (3) (2) (1) ---");
  assert.equal(numeric.complete, true);
  assert.equal(numeric.tablePairs, 4);
  assert.deepEqual([...numeric.answers.values()], ["D", "C", "B", "A"]);
  const text =
    "1. b) First answer\n2. Long explanation\nAnswer : option(c)\n3. option(d)";
  const explained = parsePrintedAnswerKey(text, true);
  assert.deepEqual(
    [...explained.answers.entries()].sort((a, b) => a[0] - b[0]),
    [
      [1, "B"],
      [2, "C"],
      [3, "D"],
    ],
  );
  assert.equal(explained.positions.get(2), text.indexOf("Answer :"));
  assert.equal(parsePrintedAnswerKey("1 a 2 b 3 c 1 a").conflict, false);
  assert.equal(parsePrintedAnswerKey("1 a 2 b 3 c 1 d").conflict, true);
  assert.equal(parsePrintedAnswerKey("1 2 3\n(a) (b)").conflict, true);
});
test("back-of-book exercise keys match their own chapters and preserve formulas as PDF pages", () => {
  const math = { ...book, subject: "Mathematics" };
  const questions = (exercise: string) =>
    `EXERCISE ${exercise}\nChoose the correct answer\n${[1, 2, 3, 4].map((n) => `${n}. x = ?\n(1) x²\n(2) 1/x\n(3) x + 1\n(4) x – 1`).join("\n")}`;
  const extracted: ExtractedBook = {
    id: book.id,
    sha256: book.sha256!,
    outline: [
      { title: "Chapter 1", page: 8 },
      { title: "Chapter 2", page: 10 },
      { title: "Answers", page: 50 },
      { title: "Glossary", page: 53 },
    ],
    pages: [
      { page: 8, text: questions("1.8") },
      { page: 10, text: questions("2.9") },
      {
        page: 50,
        text: "ANSWERS\nExercise 1.8\n1 2 3 4\n(4) (3) (2) (1)\nExercise 2.9",
      },
      { page: 51, text: "1 2 3 4\n(1) (2) (3) (4)" },
      { page: 53, text: "1 a 2 a 3 a 4 a" },
    ],
  };
  const { candidates } = extractBookMcqs(math, extracted);
  assert.equal(candidates.length, 8);
  assert.ok(
    candidates.every(
      (q) => q.status === "Published" && q.presentation === "Original PDF",
    ),
  );
  assert.deepEqual(
    candidates.filter((q) => q.page === 8).map((q) => q.correctAnswer),
    ["D", "C", "B", "A"],
  );
  assert.deepEqual(
    candidates.filter((q) => q.page === 10).map((q) => q.correctAnswer),
    ["A", "B", "C", "D"],
  );
  assert.ok(
    candidates.filter((q) => q.page === 10).every((q) => q.keyPage === 51),
  );
  const conflict = structuredClone(extracted);
  conflict.pages[3].text = "1 2 3 4\n(1) (2) (3) (4)\n1. (4)";
  assert.ok(
    extractBookMcqs(math, conflict)
      .candidates.filter((q) => q.page === 10)
      .every((q) => q.status === "Needs Review"),
  );
});
test("reviewed spreadsheet accepts quoted Tamil and rejects unavailable answers or duplicates", () => {
  const header =
    "chapter_id,question,option_a,option_b,option_c,option_d,correct_answer";
  const rows = parseQuestionCsv(
    `${header}\nch-1,"தமிழ், choose the correct value",First,Second,,,B`,
  );
  assert.equal(rows[0].question, "தமிழ், choose the correct value");
  assert.equal(rows[0].correct_answer, "B");
  assert.throws(
    () =>
      parseQuestionCsv(
        `${header}\nch-1,Choose the correct value,First,Second,,,D`,
      ),
    /nonempty option/,
  );
  assert.throws(
    () =>
      parseQuestionCsv(
        `${header}\nch-1,Choose the correct value,First,First,,,A`,
      ),
    /distinct/,
  );
});
