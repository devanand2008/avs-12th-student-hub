import test from "node:test";
import assert from "node:assert/strict";
import { isTextPracticeQuestion } from "../src/lib/practice-question-text";

const text = {
  questionText:
    "What does this Python code print?\nvalues = [1, 2]\nprint(values[1])",
  optionA: "1",
  optionB: "2",
  optionC: "[1, 2]",
  optionD: "An error",
  sourcePresentation: "Text" as const,
};
test("text practice accepts distinct real choices and preserves code and Tamil text", () => {
  assert.equal(isTextPracticeQuestion(text), true);
  assert.equal(
    isTextPracticeQuestion({
      ...text,
      questionText: "பைத்தானில் பெயரற்ற செயற்கூறின் சிறப்புச்சொல் எது?",
      optionA: "def",
      optionB: "lambda",
      optionC: "func",
      optionD: "inline",
    }),
    true,
  );
  assert.equal(
    isTextPracticeQuestion({ ...text, optionC: "", optionD: "" }),
    true,
  );
});
test("image placeholders and corrupted extraction cannot enter text practice", () => {
  assert.equal(
    isTextPracticeQuestion({ ...text, sourcePresentation: "Original PDF" }),
    false,
  );
  assert.equal(
    isTextPracticeQuestion({
      ...text,
      questionText: "Read question 2 on the textbook page below.",
    }),
    false,
  );
  assert.equal(
    isTextPracticeQuestion({
      ...text,
      optionA: "First printed option (a / 1)",
    }),
    false,
  );
  assert.equal(isTextPracticeQuestion({ ...text, optionA: "Option 1" }), false);
  assert.equal(isTextPracticeQuestion({ ...text, optionB: "1" }), false);
  assert.equal(
    isTextPracticeQuestion({
      ...text,
      questionText: "Matrix \uF8EE A equals what?",
    }),
    false,
  );
  assert.equal(isTextPracticeQuestion({ ...text, optionC: "\uFFFD" }), false);
});
