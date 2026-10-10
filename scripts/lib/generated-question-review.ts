import type { Question } from "../../src/types";

/** Generated explanations and estimated citations are not answer verification. */
export function holdGeneratedQuestion(question: Question): Question {
  const draft = { ...question };
  delete draft.sourceTextbookId;
  delete draft.sourcePage;
  delete draft.sourceEndPage;
  delete draft.sourceAnswerPage;
  delete draft.sourceQuestionNumber;
  delete draft.sourcePresentation;
  delete draft.answerVerification;
  return {
    ...draft,
    id: `review-generated-${question.id}`,
    sourceType: "Book-Out",
    status: "Teacher Review",
    explanation: `Unverified generated draft. A teacher must check the question, choices and answer against the original book before publication.\n\n${question.explanation}`,
  };
}
