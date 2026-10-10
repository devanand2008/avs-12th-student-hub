import type { Question } from "@/types";

type PracticeText = Pick<
  Question,
  | "questionText"
  | "optionA"
  | "optionB"
  | "optionC"
  | "optionD"
  | "sourcePresentation"
>;
const imagePrompt =
  /^(?:read\s+(?:printed\s+)?question\s+\d+.*(?:original textbook|textbook page|page below)|evaluation question\s+\d+\s*$)/i;
const placeholder =
  /^(?:(?:first|second|third|fourth)\s+printed\s+option\b|option\s+[1-4]\s*$)/i;
const damagedGlyphs = /[\u0000\uFFFD\uE000-\uF8FF]/u;

/** Only substantive text questions can enter a text-only quiz snapshot. */
export function isTextPracticeQuestion(question: PracticeText): boolean {
  if (question.sourcePresentation === "Original PDF") return false;
  const text = question.questionText.trim();
  if (text.length < 8 || imagePrompt.test(text) || damagedGlyphs.test(text))
    return false;
  const options = [
    question.optionA,
    question.optionB,
    question.optionC,
    question.optionD,
  ];
  if (!options[0]?.trim() || !options[1]?.trim()) return false;
  const values = options
    .filter((option) => option?.trim())
    .map((option) => option.trim());
  return (
    values.length >= 2 &&
    values.every(
      (option) => !placeholder.test(option) && !damagedGlyphs.test(option),
    ) &&
    new Set(values.map((option) => option.toLocaleLowerCase())).size ===
      values.length
  );
}
