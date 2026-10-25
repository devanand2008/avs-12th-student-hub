import type { SuppliedQuestion } from "./types";
/** Structural usability only; never represents teacher approval or correctness. */
export function hasUsableSuppliedAnswer(q: SuppliedQuestion) {
  const choices = q.optionsEn.length ? q.optionsEn : q.optionsTa;
  return (
    Boolean(q.questionEn.trim() || q.questionTa.trim()) &&
    choices.length >= 2 &&
    choices.every(
      (option) => typeof option === "string" && Boolean(option.trim()),
    ) &&
    Number.isInteger(q.proposedAnswer) &&
    q.proposedAnswer !== null &&
    q.proposedAnswer >= 0 &&
    q.proposedAnswer < choices.length &&
    (!q.optionsEn.length ||
      !q.optionsTa.length ||
      q.optionsEn.length === q.optionsTa.length)
  );
}
