import assert from "node:assert/strict";
import test from "node:test";
import {
  extractBookMcqs,
  type ExtractedBook,
} from "../scripts/lib/textbook-question-parser";
import type { Textbook } from "../src/lib/textbooks";
import { parseQuestionCsv } from "../src/lib/question-import";
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
test("missing, conflicting and damaged answers are withheld; numbered options are extracted", () => {
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
  assert.equal(
    extract("1 a 2 b 3 c 4 d", true).candidates[0].status,
    "Needs Review",
  );
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
