import { createHash } from "node:crypto";
import baseline from "./textbook-publication-baseline.json";
import type { Question } from "@/types";

export function publicationFingerprint(q: Question): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        q.id,
        q.sourceTextbookId,
        q.chapterId,
        q.subjectId,
        q.questionText,
        q.questionTextTamil || "",
        q.optionA,
        q.optionB,
        q.optionC,
        q.optionD,
        q.correctAnswer,
        q.sourcePage,
        q.sourceEndPage || null,
        q.sourceAnswerPage,
        q.sourceQuestionNumber,
        q.language,
      ]),
    )
    .digest("hex");
}
const retained = new Map(baseline.questions.map((q) => [q.id, q.fingerprint]));

/** The user explicitly retained the dated 995-row bank; all new textbook rows need a recorded review. */
export function hasTextbookPublicationApproval(q: Question): boolean {
  if (!q.sourceTextbookId) return true;
  if (q.reviewStatus === "approved" && q.reviewedBy?.trim() && q.reviewedAt)
    return true;
  const fingerprint = retained.get(q.id);
  return Boolean(fingerprint && fingerprint === publicationFingerprint(q));
}
