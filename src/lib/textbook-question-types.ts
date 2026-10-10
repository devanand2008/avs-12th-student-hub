export type McqAnswer = "A" | "B" | "C" | "D";
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
  status: "Published" | "Needs Review";
  qualityFlags: string[];
  sourceSha256: string;
  reviewedBy?: string;
  reviewedAt?: string;
}
export interface TextbookMcqChapter {
  id: string;
  number: number;
  title: string;
  page: number;
  published: number;
  review: number;
}
export interface TextbookMcqCoverage {
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
