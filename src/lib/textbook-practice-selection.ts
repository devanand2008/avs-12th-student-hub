import type { Question } from "@/types";
import { isTextPracticeQuestion } from "./practice-question-text";
import { hasTextbookPublicationApproval } from "./textbook-publication-policy";
import type { TextbookMcqCoverage } from "./textbook-question-types";

/** Counts use the same eligibility gate as a new attempt, not a status-only RPC. */
export function eligiblePracticeCoverage(
  coverage: TextbookMcqCoverage[],
  questions: Question[],
): TextbookMcqCoverage[] {
  const books = new Map<string, Question[]>();
  for (const q of selectPracticeQuestions(questions, {})) {
    if (!q.sourceTextbookId || q.sourceType !== "Book-In") continue;
    const key = `${q.sourceTextbookId}:${q.subjectId}`;
    const group = books.get(key) || [];
    group.push(q);
    books.set(key, group);
  }
  return coverage.map((book) => {
    const eligible = books.get(`${book.bookId}:${book.subjectId}`) || [];
    const chapters = new Map<string, number>();
    for (const q of eligible)
      chapters.set(q.chapterId, (chapters.get(q.chapterId) || 0) + 1);
    return {
      ...book,
      published: eligible.length,
      chapters: book.chapters.map((chapter) => ({
        ...chapter,
        published: chapters.get(chapter.id) || 0,
      })),
    };
  });
}

export function matchesPracticeSearch(
  question: Question,
  search = "",
): boolean {
  const terms = search.trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean);
  const text = [
    question.questionText,
    question.questionTextTamil,
    question.sourceQuestionNumber,
    question.optionA,
    question.optionB,
    question.optionC,
    question.optionD,
  ]
    .join(" ")
    .toLocaleLowerCase();
  return terms.every((term) => text.includes(term));
}

/** Shared by browsing and both persistence drivers; held rows never enter a new attempt. */
export function selectPracticeQuestions(
  questions: Question[],
  selection: {
    bookId?: string;
    search?: string;
    previousIds?: string[];
  },
): Question[] {
  const available = questions.filter(
    (question) =>
      question.status === "Published" &&
      question.reviewStatus !== "rejected" &&
      question.reviewStatus !== "needs_teacher_review" &&
      hasTextbookPublicationApproval(question) &&
      isTextPracticeQuestion(question) &&
      /^[ABCD]$/.test(question.correctAnswer) &&
      Boolean(
        question[
          `option${question.correctAnswer}` as
            "optionA" | "optionB" | "optionC" | "optionD"
        ]?.trim(),
      ) &&
      (!selection.bookId || question.sourceTextbookId === selection.bookId) &&
      matchesPracticeSearch(question, selection.search),
  );
  if (!selection.previousIds) return available;
  const byId = new Map(available.map((q) => [q.id, q]));
  return [...new Set(selection.previousIds)].flatMap((id) =>
    byId.has(id) ? [byId.get(id)!] : [],
  );
}
