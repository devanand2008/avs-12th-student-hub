import assert from "node:assert/strict";
import test from "node:test";
import {
  questionImportSchema,
  parseQuestionCsv,
} from "../src/lib/question-import";
import {
  questionInput,
  textbookReviewInput,
} from "../src/lib/question-publishing";

const questionText =
  'What is the output of this program?\nint x = 1;\nif (x) {\n  printf("Hello");\n}';
const options = ["Hello", "No output", "Compile error", "Runtime error"];
const row = {
  chapter_id: "chapter-1",
  question: questionText,
  option_a: options[0],
  option_b: options[1],
  option_c: options[2],
  option_d: options[3],
  correct_answer: "A",
};
const publishedQuestion = {
  chapterId: "chapter-1",
  questionText,
  optionA: options[0],
  optionB: options[1],
  optionC: options[2],
  optionD: options[3],
  correctAnswer: "A",
  status: "Published",
};
const review = {
  id: "source-question-1",
  questionText,
  options,
  correctAnswer: "A",
};

test("question import, creation and teacher review preserve multiline code", () => {
  assert.equal(questionImportSchema.parse(row).question, questionText);
  assert.equal(
    questionInput.parse(publishedQuestion).questionText,
    questionText,
  );
  assert.equal(textbookReviewInput.parse(review).questionText, questionText);
  const codeOption = 'int x = 1;\n  printf("Hello");';
  assert.equal(
    textbookReviewInput.parse({
      ...review,
      options: [codeOption, ...options.slice(1)],
    }).options[0],
    codeOption,
  );
  const csv = [
    Object.keys(row).join(","),
    Object.values(row)
      .map((value) => `"${value.replace(/"/g, '""')}"`)
      .join(","),
  ].join("\r\n");
  assert.equal(parseQuestionCsv(csv)[0].question, questionText);
});

test("all publishing entry points reject textbook-image prompts and placeholder choices", () => {
  for (const text of [
    "Read question 4 on the textbook page below.",
    "Read printed question 4 in the original textbook.",
  ]) {
    assert.equal(
      questionImportSchema.safeParse({ ...row, question: text }).success,
      false,
    );
    assert.equal(
      questionInput.safeParse({ ...publishedQuestion, questionText: text })
        .success,
      false,
    );
    assert.equal(
      textbookReviewInput.safeParse({ ...review, questionText: text }).success,
      false,
    );
  }
  for (const placeholder of ["First printed option (a / அ / 1)", "Option 1"]) {
    assert.equal(
      questionImportSchema.safeParse({ ...row, option_a: placeholder }).success,
      false,
    );
    assert.equal(
      questionInput.safeParse({ ...publishedQuestion, optionA: placeholder })
        .success,
      false,
    );
    assert.equal(
      textbookReviewInput.safeParse({
        ...review,
        options: [placeholder, ...options.slice(1)],
      }).success,
      false,
    );
  }
});

test("publishing rejects damaged glyphs and duplicate choices but preserves draft review workflow", () => {
  for (const damaged of [
    "Damaged \uE010 glyph",
    "Damaged \uFFFD glyph",
    "Damaged \u0000 glyph",
  ]) {
    assert.equal(
      questionImportSchema.safeParse({ ...row, option_b: damaged }).success,
      false,
    );
    assert.equal(
      questionInput.safeParse({ ...publishedQuestion, optionB: damaged })
        .success,
      false,
    );
    assert.equal(
      textbookReviewInput.safeParse({
        ...review,
        options: [options[0], damaged, ...options.slice(2)],
      }).success,
      false,
    );
  }
  assert.equal(
    questionImportSchema.safeParse({ ...row, option_b: "hello" }).success,
    false,
  );
  assert.equal(
    questionInput.safeParse({ ...publishedQuestion, optionB: "hello" }).success,
    false,
  );
  assert.equal(
    textbookReviewInput.safeParse({ ...review, options: ["Hello", "hello"] })
      .success,
    false,
  );
  assert.equal(
    textbookReviewInput.safeParse({
      ...review,
      options: ["Hello", "No output"],
      correctAnswer: "D",
    }).success,
    false,
  );
  assert.equal(
    questionInput.safeParse({
      ...publishedQuestion,
      questionText: "Read question 4 on the textbook page below.",
      status: "Draft",
    }).success,
    true,
  );
});
