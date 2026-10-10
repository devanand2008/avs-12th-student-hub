export type McqAnswer = "A" | "B" | "C" | "D";
export interface TextbookReviewPreparation {
  batchId: string;
  preparedAt: string;
  sourceSha256: string;
  subject: string;
  title: string;
  medium: string;
  volume: string | null;
  printedPage: number | null;
  printedPageEvidence: string;
  sourceCheck: "matched" | "uncertain";
  keyCheck: "matched" | "mismatch" | "uncertain";
  sourceQuestionText: string;
  sourceOptions: string[];
  englishText: string | null;
  tamilText: string | null;
  sourcePageText: string;
  keyPageText: string;
  parsedAnswer: McqAnswer | null;
  warnings: string[];
  duplicateIds: string[];
}
export interface TextbookReviewBatch {
  batchId: string;
  chapterId: string;
  total: number;
  sourceMatched: number;
  keyMatched: number;
  uncertain: number;
  duplicates: number;
  pending: number;
  approved: number;
  rejected: number;
}
export interface TextbookMcqCandidate {
  id: string;
  bookId: string;
  subjectId: string;
  chapterId: string;
  chapterTitle: string;
  number: number;
  page: number;
  section: "Book-back" | "In-text";
  questionText: string;
  options: string[];
  correctAnswer: McqAnswer | null;
  keyPage?: number;
  exercise?: string;
  endPage?: number;
  presentation?: "Text" | "Original PDF";
  status: "Published" | "Needs Review";
  qualityFlags: string[];
  sourceSha256: string;
  reviewedBy?: string;
  reviewedAt?: string;
  updatedAt?: string;
  practicePublished?: boolean;
  publicationChapterId?: string | null;
  reviewStatus?: "needs_teacher_review" | "approved" | "rejected";
  reviewPreparation?: TextbookReviewPreparation;
  originalExtraction?: Pick<
    TextbookMcqCandidate,
    "questionText" | "options" | "correctAnswer"
  >;
  reviewHistory?: {
    action: string;
    actorId: string;
    at: string;
    reason: string;
    before: {
      questionText: string;
      options: string[];
      correctAnswer: McqAnswer | null;
    };
    after: {
      questionText: string;
      options: string[];
      correctAnswer: McqAnswer | null;
    };
  }[];
}
export interface TextbookMcqChapter {
  id: string;
  number: number;
  title: string;
  page: number;
  exercisePage?: number;
  published: number;
  review: number;
}
export interface TextbookMcqCoverage {
  extractionVersion?: number;
  bookId: string;
  subjectId: string;
  chapters: TextbookMcqChapter[];
  total: number;
  published: number;
  review: number;
  pages: number;
  sourceSha256: string;
  importedAt: string;
  notes: string[];
}
