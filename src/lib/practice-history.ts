import { z } from "zod";

export interface PracticeAttemptRecord {
  id: string;
  timestamp: string; // ISO string
  subjectId: string;
  subjectName?: string;
  chapterId?: string;
  chapterName?: string;
  mode: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  accuracy: number;
  durationSeconds?: number;
  sourceFilter?: "All" | "Book-In" | "Book-Out";
}

const recordSchema = z
  .object({
    id: z.string().min(1).max(180),
    timestamp: z.string().datetime(),
    subjectId: z.string().min(1).max(180),
    subjectName: z.string().max(180).optional(),
    chapterId: z.string().max(180).optional(),
    chapterName: z.string().max(180).optional(),
    mode: z.enum([
      "quick",
      "chapter",
      "book",
      "weak",
      "timed",
      "random",
      "daily10",
      "daily25",
      "revision",
    ]),
    score: z.number().int().min(0).max(500),
    totalQuestions: z.number().int().min(1).max(500),
    correctCount: z.number().int().min(0).max(500),
    wrongCount: z.number().int().min(0).max(500),
    unansweredCount: z.number().int().min(0).max(500),
    accuracy: z.number().int().min(0).max(100),
    durationSeconds: z.number().finite().min(0).optional(),
    sourceFilter: z.enum(["All", "Book-In", "Book-Out"]).optional(),
  })
  .refine(
    (record) =>
      record.score === record.correctCount &&
      record.correctCount + record.wrongCount + record.unansweredCount ===
        record.totalQuestions &&
      record.accuracy ===
        Math.round((record.correctCount / record.totalQuestions) * 100),
  );

// Legacy unscoped records have no provable owner and must not be shown to
// another student on a shared device. Leave them untouched for recovery.
function storageKey(ownerId: string) {
  return "skillup_practice_history:" + encodeURIComponent(ownerId);
}

export function getPracticeHistory(ownerId: string): PracticeAttemptRecord[] {
  if (typeof window === "undefined" || !ownerId) return [];
  try {
    const raw = localStorage.getItem(storageKey(ownerId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .flatMap((entry) => {
          const result = recordSchema.safeParse(entry);
          return result.success ? [result.data] : [];
        })
        .slice(0, 50);
    }
    return [];
  } catch {
    return [];
  }
}

export function savePracticeAttempt(
  ownerId: string,
  attempt: Omit<PracticeAttemptRecord, "timestamp"> & { timestamp?: string },
): PracticeAttemptRecord[] {
  if (typeof window === "undefined" || !ownerId) return [];
  try {
    const history = getPracticeHistory(ownerId);
    const fullRecord: PracticeAttemptRecord = {
      ...attempt,
      timestamp: attempt.timestamp || new Date().toISOString(),
    };
    if (!recordSchema.safeParse(fullRecord).success) return history;
    // Keep most recent first, unique by ID, maximum 50 records
    const updated = [
      fullRecord,
      ...history.filter((item) => item.id !== fullRecord.id),
    ].slice(0, 50);
    localStorage.setItem(storageKey(ownerId), JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearPracticeHistory(ownerId: string): void {
  if (typeof window === "undefined" || !ownerId) return;
  try {
    localStorage.removeItem(storageKey(ownerId));
  } catch {}
}
