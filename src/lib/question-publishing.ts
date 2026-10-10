import { z } from "zod";
import { isTextPracticeQuestion } from "./practice-question-text";

const readableTextMessage =
  "Enter the full question and distinct answer choices as readable text before publishing.";

export const questionInput = z
  .object({
    chapterId: z.string().min(1),
    questionText: z.string().trim().min(3).max(3000),
    questionTextTamil: z.string().max(3000).default(""),
    optionA: z.string().trim().min(1).max(1000),
    optionB: z.string().trim().min(1).max(1000),
    optionC: z.string().trim().min(1).max(1000),
    optionD: z.string().trim().min(1).max(1000),
    correctAnswer: z.enum(["A", "B", "C", "D"]),
    explanation: z.string().max(4000).default(""),
    explanationTamil: z.string().max(4000).default(""),
    difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Medium"),
    sourceType: z.enum(["Book-In", "Book-Out"]).default("Book-In"),
    status: z
      .enum(["Draft", "Teacher Review", "Approved", "Published"])
      .default("Draft"),
  })
  .refine(
    (question) =>
      question.status !== "Published" || isTextPracticeQuestion(question),
    { message: readableTextMessage },
  );

export const textbookReviewInput = z
  .object({
    id: z.string().min(1).max(180),
    questionText: z.string().trim().min(8).max(2500),
    options: z.array(z.string().trim().min(1).max(1000)).min(2).max(4),
    correctAnswer: z.enum(["A", "B", "C", "D"]),
  })
  .refine(
    (value) => "ABCD".indexOf(value.correctAnswer) < value.options.length,
    { message: "Choose one of the provided options as the answer." },
  )
  .refine(
    (value) =>
      isTextPracticeQuestion({
        questionText: value.questionText,
        optionA: value.options[0],
        optionB: value.options[1],
        optionC: value.options[2] || "",
        optionD: value.options[3] || "",
      }),
    { message: readableTextMessage },
  );

const reviewIdentity = {
  id: z.string().min(1).max(180),
  expectedUpdatedAt: z.string().min(1).max(80),
  reason: z.string().trim().max(1000).default(""),
};
export const textbookModerationInput = z.union([
  textbookReviewInput.and(
    z.object({
      ...reviewIdentity,
      action: z.literal("approve"),
      humanConfirmed: z.literal(true, {
        error:
          "Confirm that you checked the original question, options and answer.",
      }),
    }),
  ),
  z
    .object({
      ...reviewIdentity,
      action: z.literal("edit"),
      questionText: z.string().trim().min(8).max(2500),
      options: z.array(z.string().max(1000)).min(2).max(4),
      correctAnswer: z.enum(["A", "B", "C", "D"]).nullable(),
    })
    .refine(
      (value) =>
        value.correctAnswer === null ||
        "ABCD".indexOf(value.correctAnswer) < value.options.length,
      { message: "Choose an answer from the provided options." },
    ),
  z.object({
    ...reviewIdentity,
    action: z.literal("reject"),
    reason: z.string().trim().min(3).max(1000),
  }),
]);
