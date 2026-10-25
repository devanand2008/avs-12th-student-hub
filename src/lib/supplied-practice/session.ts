import { z } from "zod";
import type { SuppliedQuestion } from "./types";
export type SuppliedAnswers = Record<string, number>;
export function recordSuppliedAnswer(
  questions: readonly SuppliedQuestion[],
  answers: SuppliedAnswers,
  id: string,
  choice: number,
): SuppliedAnswers {
  if (Object.hasOwn(answers, id)) return answers;
  const q = questions.find((q) => q.id === id),
    options = q && (q.optionsEn.length ? q.optionsEn : q.optionsTa);
  if (
    !options ||
    !Number.isInteger(choice) ||
    choice < 0 ||
    choice >= options.length
  )
    return answers;
  return { ...answers, [id]: choice };
}
export function suppliedScore(
  questions: readonly SuppliedQuestion[],
  answers: SuppliedAnswers,
) {
  const correct = questions.filter(
    (q) => Object.hasOwn(answers, q.id) && answers[q.id] === q.proposedAnswer,
  ).length;
  const answered = questions.filter((q) => Object.hasOwn(answers, q.id)).length;
  return {
    correct,
    wrong: answered - correct,
    unanswered: questions.length - answered,
    total: questions.length,
    percentage: questions.length
      ? Math.round((correct / questions.length) * 100)
      : 0,
  };
}
const historySchema = z
  .object({
    id: z.string().min(1),
    collectionId: z.string().min(1),
    section: z.string(),
    timestamp: z.string().datetime(),
    correct: z.number().int().min(0),
    wrong: z.number().int().min(0),
    unanswered: z.number().int().min(0),
    total: z.number().int().min(1).max(500),
    percentage: z.number().int().min(0).max(100),
  })
  .refine(
    (r) =>
      r.correct + r.wrong + r.unanswered === r.total &&
      r.percentage === Math.round((r.correct / r.total) * 100),
  );
export type SuppliedAttempt = z.infer<typeof historySchema>;
const key = (owner: string) =>
  "skillup_supplied_practice_history:" + encodeURIComponent(owner);
export function readSuppliedHistory(owner: string): SuppliedAttempt[] {
  if (typeof window === "undefined" || !owner) return [];
  try {
    const rows = JSON.parse(localStorage.getItem(key(owner)) || "[]");
    return Array.isArray(rows)
      ? rows
          .flatMap((r) => {
            const result = historySchema.safeParse(r);
            return result.success ? [result.data] : [];
          })
          .slice(0, 50)
      : [];
  } catch {
    return [];
  }
}
export function saveSuppliedAttempt(
  owner: string,
  attempt: SuppliedAttempt,
): boolean {
  if (
    typeof window === "undefined" ||
    !owner ||
    !historySchema.safeParse(attempt).success
  )
    return false;
  try {
    localStorage.setItem(
      key(owner),
      JSON.stringify(
        [
          attempt,
          ...readSuppliedHistory(owner).filter((r) => r.id !== attempt.id),
        ].slice(0, 50),
      ),
    );
    return true;
  } catch {
    return false;
  }
}
