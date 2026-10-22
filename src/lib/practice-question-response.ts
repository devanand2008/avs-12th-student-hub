import type { Question } from "@/types";

/** Unanswered solutions must not travel in practice-start or restore responses. */
export function practiceQuestionResponse(question: Question, reveal = false) {
  if (reveal) return question;
  const safe = { ...question };
  delete (safe as Partial<Question>).correctAnswer;
  delete (safe as Partial<Question>).explanation;
  delete safe.explanationTamil;
  delete safe.sourceAnswerPage;
  return safe;
}
