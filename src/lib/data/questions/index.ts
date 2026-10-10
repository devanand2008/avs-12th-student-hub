import type { Question } from "@/types";
import { CS_QUESTIONS as rawCs } from "./cs";
import { BOTANY_QUESTIONS as rawBotany } from "./botany";
import { ZOOLOGY_QUESTIONS as rawZoology } from "./zoology";
import { MATHS_QUESTIONS as rawMaths } from "./maths";
import { holdGeneratedQuestion } from "../../../../scripts/lib/generated-question-review";
import { ORIGINAL_PRACTICE_QUESTIONS } from "./original";

export const CS_QUESTIONS = rawCs.map(holdGeneratedQuestion);
export const BOTANY_QUESTIONS = rawBotany.map(holdGeneratedQuestion);
export const ZOOLOGY_QUESTIONS = rawZoology.map(holdGeneratedQuestion);
export const MATHS_QUESTIONS = rawMaths.map(holdGeneratedQuestion);

export const ALL_PRACTICE_QUESTIONS: Question[] = [
  ...ORIGINAL_PRACTICE_QUESTIONS.map((question): Question => ({
    ...question,
    status: "Teacher Review",
    questionOrigin: "Legacy Sample",
    reviewStatus: "needs_teacher_review",
  })),
  ...CS_QUESTIONS,
  ...BOTANY_QUESTIONS,
  ...ZOOLOGY_QUESTIONS,
  ...MATHS_QUESTIONS,
];

export const QUESTION_COUNTS_BY_CHAPTER: Record<string, number> =
  ALL_PRACTICE_QUESTIONS.reduce(
    (acc, q) => {
      if (q.status === "Published")
        acc[q.chapterId] = (acc[q.chapterId] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

export const QUESTION_COUNTS_BY_SUBJECT: Record<string, number> =
  ALL_PRACTICE_QUESTIONS.reduce(
    (acc, q) => {
      if (q.status === "Published")
        acc[q.subjectId] = (acc[q.subjectId] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
