export type StreamType = "Computer Science" | "Biology";
export type MediumType = "English" | "Tamil";
export type UserRole = "admin" | "student";

export interface User {
  id: string;
  role: UserRole;
  email: string;
  passwordHash: string;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  userId: string;
  studentId: string; // e.g. AVSCS26-0001, AVSBIO26-0001
  studentName: string;
  registerNumber: string;
  schoolName: string;
  standard?: string;
  studentEmail: string;
  studentPhone: string;
  phoneVerifiedAt?: string;
  phoneVerifiedNumber?: string;
  adminApprovedAt?: string;
  adminApprovedBy?: string;
  initialPasswordSetAt?: string;
  stream: StreamType;
  medium: MediumType;
  academicYear: string;
  profilePhoto?: string;
  activeStatus: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface Subject {
  id: string;
  streamId: StreamType | "Common";
  name: string; // e.g. "Computer Science", "Bio-Botany", "Bio-Zoology"
  code: string;
  icon: string;
  description: string;
  orderIndex: number;
  totalChapters: number;
}

export interface Book {
  id: string;
  subjectId: string;
  name: string;
  volume: string;
  description: string;
  orderIndex: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  bookId: string;
  chapterNumber: number;
  title: string;
  titleTamil: string;
  description: string;
  totalNotes: number;
  totalVideos: number;
  totalMcqs: number;
  isActive: boolean;
  orderIndex: number;
}

export interface Topic {
  id: string;
  chapterId: string;
  title: string;
  titleTamil: string;
  orderIndex: number;
}

export type NoteBadge = "HANDWRITTEN" | "IMPORTANT" | "REVISION" | "EXAM FOCUS";

export interface NotePage {
  pageNumber: number;
  imageUrl: string;
  caption?: string;
  captionTamil?: string;
}

export interface HandwrittenNote {
  subjectId?: string;
  subjectName?: string;
  sourceFile?: string;
  sha256?: string;
  sizeBytes?: number;
  language?: MediumType;
  academicYear?: string;
  topic?: string;
  id: string;
  chapterId: string;
  topicId?: string;
  title: string;
  titleTamil: string;
  description: string;
  badge: NoteBadge;
  pageCount: number;
  downloadAllowed: boolean;
  isPublished: boolean;
  viewsCount: number;
  pages: NotePage[];
  pdfUrl?: string;
  updatedAt: string;
}

export interface VideoLesson {
  subjectId?: string;
  subjectName?: string;
  sourceFile?: string;
  sha256?: string;
  sizeBytes?: number;
  language?: MediumType;
  academicYear?: string;
  topic?: string;
  id: string;
  chapterId: string;
  topicId?: string;
  title: string;
  titleTamil: string;
  description: string;
  videoUrl: string;
  embedType: "youtube" | "notebooklm" | "mp4";
  durationSeconds: number;
  thumbnailUrl: string;
  teacherName: string;
  sourceLabel: string; // "Gemini Notebook / NotebookLM Video Lessons"
  isPublished: boolean;
  createdAt: string;
}

export type DifficultyLevel = "Easy" | "Medium" | "Hard";
export type QuestionSource = "Book-In" | "Book-Out";
export type QuestionStatus =
  "Draft" | "Teacher Review" | "Approved" | "Published";

export interface Question {
  id: string;
  chapterId: string;
  topicId?: string;
  questionText: string;
  questionTextTamil: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  explanationTamil: string;
  difficulty: DifficultyLevel;
  sourceType: QuestionSource;
  status: QuestionStatus;
  stream: StreamType | "Common";
  subjectId: string;
  createdAt: string;
}

export type PracticeMode =
  | "quick"
  | "chapter"
  | "book"
  | "weak"
  | "timed"
  | "random"
  | "daily10"
  | "daily25"
  | "revision";

export interface QuizTest {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  chapterId?: string;
  mode: PracticeMode;
  questionCount: number;
  durationMins: number;
  passPercentage: number;
  negativeMarking: boolean;
  allowedAttempts: number;
  isActive: boolean;
}

export interface PracticeAnswerRecord {
  questionId: string;
  selectedAnswer: "A" | "B" | "C" | "D" | null;
  isCorrect: boolean;
  timeSpentSeconds: number;
  markedForReview?: boolean;
}

export interface QuizSession {
  id: string;
  studentId: string;
  testId?: string;
  chapterId?: string;
  subjectId: string;
  mode: PracticeMode;
  sourceFilter?: "All" | "Book-In" | "Book-Out";
  startedAt: string;
  questionIds: string[];
  expiresAt?: string;
  completedAt?: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  timeTakenSeconds: number;
  answers: Record<string, PracticeAnswerRecord>;
  isCompleted: boolean;
}

export interface StudentProgress {
  id: string;
  studentId: string;
  chapterId: string;
  notesViewed: number;
  noteLastPage: number;
  videoWatchPercentage: number;
  mcqsAttempted: number;
  bestScore: number;
  averageScore: number;
  lastAccessedAt: string;
  isCompleted: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  priority: "Normal" | "High" | "Urgent";
  targetStream: "All" | StreamType;
  publishDate: string;
  expiryDate?: string;
  isActive: boolean;
}

export interface Bookmark {
  id: string;
  studentId: string;
  contentType: "note" | "video" | "question" | "chapter";
  contentId: string;
  title: string;
  subtitle?: string;
  url: string;
  createdAt: string;
}

export interface AIKnowledgeChunk {
  id: string;
  stream: StreamType;
  subjectName: string;
  chapterTitle: string;
  topicTitle?: string;
  chunkText: string;
  chunkTextTamil?: string;
  sourceType:
    | "Handwritten Note"
    | "Syllabus Concept"
    | "Explanation"
    | "NotebookLM Summary";
}

export interface AIChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  citations?: {
    subject: string;
    chapter: string;
    topic?: string;
    source: string;
  }[];
  timestamp: string;
}
