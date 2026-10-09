import type * as Memory from "./memory";
import type {
  User,
  Student,
  Subject,
  Chapter,
  HandwrittenNote,
  VideoLesson,
  Question,
  QuizTest,
  QuizSession,
  StudentProgress,
  Announcement,
  Bookmark,
  AIKnowledgeChunk,
} from "@/types";
import {
  requireSupabase,
  databaseError,
  BackendUnavailableError,
} from "@/lib/supabase/server";
import { listResources, saveResource } from "@/lib/content";
import {
  INITIAL_SUBJECTS,
  INITIAL_BOOKS,
  INITIAL_CHAPTERS,
  INITIAL_TOPICS,
} from "./initial-seed";
import bcrypt from "bcryptjs";
import { studentActivationMode } from "@/lib/auth/activation";
import { randomBytes, randomInt, randomUUID } from "node:crypto";
import {
  normalizePhone,
  validateRegistration,
  type AdminUserData,
  type StudentRegistration,
} from "./user-data";

type Audit = ReturnType<typeof Memory.getAuditLogs>[number];
const client = requireSupabase;
let initialization: Promise<void> | undefined;

async function rpc<T>(
  name: string,
  params: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await client().rpc(name, params);
  if (error) throw databaseError(error);
  return data as T;
}
async function one<T>(
  table: string,
  column: string,
  value: string,
  kind?: string,
): Promise<T | null> {
  let query = client().from(table).select("data").eq(column, value);
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query.maybeSingle();
  if (error) throw databaseError(error);
  return (data?.data as T) || null;
}
async function all<T>(
  table: string,
  filters: Record<string, string | boolean> = {},
): Promise<T[]> {
  const values: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    let query = client()
      .from(table)
      .select("data")
      .order(
        table === "avs_curriculum"
          ? "kind"
          : table === "avs_activity"
            ? "resource_id"
            : table === "avs_progress"
              ? "chapter_id"
              : table === "avs_bookmarks"
                ? "content_id"
                : "id",
      );
    for (const [key, value] of Object.entries(filters))
      query = query.eq(key, value);
    if (table === "avs_curriculum") query = query.order("id");
    const { data, error } = await query.range(offset, offset + 999);
    if (error) throw databaseError(error);
    values.push(...(data || []).map((row) => row.data as T));
    if ((data?.length || 0) < 1000) break;
  }
  return values;
}
async function put<T extends { id: string }>(
  table: string,
  data: T,
  extra: Record<string, unknown> = {},
) {
  const { error } = await client()
    .from(table)
    .upsert({ id: data.id, data, ...extra });
  if (error) throw databaseError(error);
  return data;
}
export async function initDatabase() {
  if (!initialization)
    initialization = (async () => {
      const { data, error } = await client()
        .from("avs_schema_versions")
        .select("version")
        .eq("version", "20261007_first_login_otp")
        .maybeSingle();
      if (error) throw databaseError(error);
      if (!data)
        throw new BackendUnavailableError(
          "Apply the Supabase account-directory and first-login OTP migrations first.",
        );
      if (studentActivationMode() === "admin") {
        const approval = await client()
          .from("avs_schema_versions")
          .select("version")
          .eq("version", "20261007144717_admin_student_approval")
          .maybeSingle();
        if (approval.error || !approval.data)
          throw new BackendUnavailableError(
            "Apply the admin_student_approval migration before using administrator approval.",
          );
      }
      // Ignore existing rows: restarting or deploying must never reset passwords/content.
      const rows = [
        ...INITIAL_SUBJECTS.map((data) => ({
          kind: "subject",
          id: data.id,
          data,
        })),
        ...INITIAL_BOOKS.map((data) => ({ kind: "book", id: data.id, data })),
        ...INITIAL_CHAPTERS.map((data) => ({
          kind: "chapter",
          id: data.id,
          data: { ...data, totalNotes: 0, totalVideos: 0, totalMcqs: 0 },
        })),
        ...INITIAL_TOPICS.map((data) => ({ kind: "topic", id: data.id, data })),
      ];
      const seeded = await client()
        .from("avs_curriculum")
        .upsert(rows, { onConflict: "kind,id", ignoreDuplicates: true });
      if (seeded.error) throw databaseError(seeded.error);
      const email = process.env.ADMIN_EMAIL?.trim();
      const password = process.env.ADMIN_INITIAL_PASSWORD;
      if (email && password) {
        const { data: existing, error: lookupError } = await client()
          .from("avs_users")
          .select("role")
          .eq("email", email.toLowerCase())
          .maybeSingle();
        if (lookupError) throw databaseError(lookupError);
        if (existing && existing.role !== "admin")
          throw new Error("Administrator email is already used by a student.");
        if (!existing)
          await rpc("avs_bootstrap_admin", {
            p_user: {
              id: "usr-" + randomUUID(),
              role: "admin",
              email,
              passwordHash: await bcrypt.hash(password, 12),
              mustChangePassword: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });
      }
    })().catch((error) => {
      initialization = undefined;
      throw error;
    });
  return initialization;
}
export async function getUserByLoginId(
  loginId: string,
): Promise<{ user: User; student?: Student } | null> {
  await initDatabase();
  const trimmed = loginId.trim();

  // 1. Direct email lookup (primary for Gmail login)
  const userByEmail = await one<User>("avs_users", "email", trimmed.toLowerCase());
  if (userByEmail) {
    const student =
      userByEmail.role === "student" ? await getStudentByUserId(userByEmail.id) : null;
    return { user: userByEmail, student: student || undefined };
  }

  // 2. Student ID lookup
  let student = await one<Student>(
    "avs_students",
    "student_id",
    trimmed.toUpperCase(),
  );

  // 3. School register number lookup
  if (!student) {
    student = await one<Student>(
      "avs_students",
      "register_number",
      trimmed.toLowerCase(),
    );
  }

  // 4. Phone number lookup
  if (!student && /^[+\d\s()-]+$/.test(trimmed)) {
    const phone = normalizePhone(trimmed);
    if (phone.length === 10)
      student = await one<Student>("avs_students", "student_phone", phone);
  }

  if (student) {
    const user = await getUserById(student.userId);
    if (user) return { user, student };
  }

  return null;
}
export async function getUserById(id: string) {
  await initDatabase();
  return one<User>("avs_users", "id", id);
}
export async function getStudentByUserId(id: string) {
  await initDatabase();
  return one<Student>("avs_students", "user_id", id);
}
export async function verifyStudentPhone(
  userId: string,
  phone: string,
  authId: string,
): Promise<Student | null> {
  await initDatabase();
  return rpc("avs_verify_student_phone", {
    p_user_id: userId,
    p_phone: phone,
    p_auth_id: authId,
    p_invalidated_hash: await bcrypt.hash(
      randomBytes(32).toString("base64url"),
      12,
    ),
  });
}
export async function getAllStudents() {
  await initDatabase();
  return all<Student>("avs_students");
}
export async function getAllUserData(
  actorId: string,
): Promise<AdminUserData[]> {
  await initDatabase();
  const { data: actor, error } = await client()
    .from("avs_users")
    .select("role")
    .eq("id", actorId)
    .maybeSingle();
  if (error) throw databaseError(error);
  if (actor?.role !== "admin") throw new Error("Admin authorization required");
  return rpc<AdminUserData[]>("avs_admin_user_directory", {
    p_actor_id: actorId,
  });
}
export async function getStudentById(id: string) {
  await initDatabase();
  return (
    (await one<Student>("avs_students", "id", id)) ||
    one<Student>("avs_students", "student_id", id.toUpperCase())
  );
}
export async function updateUserPassword(
  userId: string,
  newPasswordHash: string,
  expectedHash?: string,
) {
  const user = await getUserById(userId);
  return user
    ? rpc<boolean>("avs_change_password", {
        p_user_id: userId,
        p_expected_hash: expectedHash || user.passwordHash,
        p_new_hash: newPasswordHash,
        p_require_change: false,
      })
    : false;
}
export async function createStudentWithUser(
  data: Parameters<typeof Memory.createStudentWithUser>[0],
) {
  await initDatabase();
  if (!data.actorId)
    throw new Error("An administrator is required to create student accounts.");
  const temporaryPassword =
    data.temporaryPassword || "AVS@" + randomBytes(12).toString("base64url");
  const { actorId, temporaryPassword: supplied, ...profile } = data;
  void supplied;
  const student = await rpc<Student>("avs_create_student", {
    p_profile: {
      ...profile,
      approveOnCreate: studentActivationMode() === "admin",
    },
    p_password_hash: await bcrypt.hash(temporaryPassword, 12),
    p_actor_id: actorId,
  });
  return { student, temporaryPassword };
}
export async function registerStudent(
  data: StudentRegistration,
): Promise<{ student: Student; user: User }> {
  const normalized = validateRegistration(data);
  await initDatabase();
  return rpc<{ student: Student; user: User }>("avs_register_student", {
    p_profile: {
      studentName: data.studentName.trim(),
      studentId: normalized.studentId,
      studentEmail: normalized.email,
      registerNumber: normalized.registerNumber || normalized.studentId,
      schoolName: data.schoolName.trim(),
      standard: data.standard?.trim() || "12th Standard",
      stream: data.stream,
      medium: data.medium || "English",
      studentPhone: normalized.phone,
      academicYear: "2026-2027",
    },
    p_password_hash: await bcrypt.hash(data.password, 12),
  });
}
export async function toggleStudentActive(id: string, actorId?: string) {
  await initDatabase();
  if (actorId && (await getUserById(actorId))?.role !== "admin")
    throw new Error("Admin authorization required");
  const student = await rpc<Student | null>("avs_toggle_student", { p_id: id });
  if (student)
    await logAudit(
      actorId || "admin",
      "TOGGLE_STUDENT_STATUS",
      "student",
      student.id,
      {
        activeStatus: student.activeStatus,
      },
    );
  return Boolean(student);
}
export async function resetStudentPassword(id: string, actorId?: string) {
  if (actorId && (await getUserById(actorId))?.role !== "admin")
    throw new Error("Admin authorization required");
  const student = await getStudentById(id);
  if (!student) return null;
  const user = await getUserById(student.userId);
  if (!user) return null;
  const password = "AVS@" + randomBytes(12).toString("base64url");
  const changed = await rpc<boolean>("avs_change_password", {
    p_user_id: user.id,
    p_expected_hash: user.passwordHash,
    p_new_hash: await bcrypt.hash(password, 12),
    p_require_change: true,
  });
  if (!changed)
    throw new Error("Password changed concurrently; retry the reset.");
  await logAudit(
    actorId || "admin",
    "RESET_STUDENT_PASSWORD",
    "student",
    student.id,
    {
      studentId: student.studentId,
    },
  );
  return password;
}

export async function approveStudent(id: string, actorId: string) {
  await initDatabase();
  if ((await getUserById(actorId))?.role !== "admin")
    throw new Error("Admin authorization required");
  const temporaryPassword = "AVS@" + randomBytes(12).toString("base64url");
  const student = await rpc<Student | null>("avs_approve_student", {
    p_id: id,
    p_actor_id: actorId,
    p_password_hash: await bcrypt.hash(temporaryPassword, 12),
  });
  return student ? { student, temporaryPassword } : null;
}
export async function getSubjects(
  stream?: Parameters<typeof Memory.getSubjects>[0],
) {
  await initDatabase();
  return (await all<Subject>("avs_curriculum", { kind: "subject" }))
    .filter((s) => !stream || s.streamId === stream || s.streamId === "Common")
    .sort((a, b) => a.orderIndex - b.orderIndex);
}
export async function getSubjectById(id: string) {
  await initDatabase();
  return one<Subject>("avs_curriculum", "id", id, "subject");
}
export async function getChaptersBySubject(id: string) {
  await initDatabase();
  return (await all<Chapter>("avs_curriculum", { kind: "chapter" }))
    .filter((c) => c.subjectId === id)
    .sort((a, b) => a.chapterNumber - b.chapterNumber);
}
export async function getChapterById(id: string) {
  await initDatabase();
  return one<Chapter>("avs_curriculum", "id", id, "chapter");
}
export async function updateChapter(id: string, updates: Partial<Chapter>) {
  const chapter = await getChapterById(id);
  if (!chapter) return null;
  const updated = { ...chapter, ...updates, id };
  await put("avs_curriculum", updated, { kind: "chapter" });
  await logAudit("admin", "UPDATE_CHAPTER", "chapter", id, updates);
  return updated;
}
export async function getAllNotes() {
  return (await listResources("note", true)) as HandwrittenNote[];
}
export async function getNotesByChapter(id: string) {
  return ((await listResources("note")) as HandwrittenNote[]).filter(
    (n) => n.chapterId === id,
  );
}
export async function getNoteById(id: string) {
  return (await getAllNotes()).find((n) => n.id === id) || null;
}
export async function createNote(
  note: Parameters<typeof Memory.createNote>[0],
) {
  const data = {
    ...note,
    id: "note-" + randomUUID(),
    viewsCount: 0,
    updatedAt: new Date().toISOString(),
  };
  await saveResource("note", data);
  return data;
}
export async function getAllVideos() {
  return (await listResources("video", true)) as VideoLesson[];
}
export async function getVideosByChapter(id: string) {
  return ((await listResources("video")) as VideoLesson[]).filter(
    (v) => v.chapterId === id,
  );
}
export async function getVideoById(id: string) {
  return (await getAllVideos()).find((v) => v.id === id) || null;
}
export async function createVideo(
  video: Parameters<typeof Memory.createVideo>[0],
) {
  const data = {
    ...video,
    id: "video-" + randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await saveResource("video", data);
  return data;
}
export async function getQuestions(
  filters: Parameters<typeof Memory.getQuestions>[0] = {},
) {
  await initDatabase();
  const dbFilters: Record<string, string> = {};
  if (filters?.chapterId) dbFilters.chapter_id = filters.chapterId;
  if (filters?.subjectId) dbFilters.subject_id = filters.subjectId;
  if (filters?.status) dbFilters.status = filters.status;
  return (await all<Question>("avs_questions", dbFilters)).filter(
    (q) =>
      (!filters?.sourceType || q.sourceType === filters.sourceType) &&
      (!filters?.difficulty || q.difficulty === filters.difficulty),
  );
}
export async function getQuestionById(id: string) {
  await initDatabase();
  return one<Question>("avs_questions", "id", id);
}
export async function createQuestion(
  q: Parameters<typeof Memory.createQuestion>[0],
) {
  await initDatabase();
  const question = await put("avs_questions", {
    ...q,
    id: "q-" + randomUUID(),
    createdAt: new Date().toISOString(),
  });
  await logAudit("admin", "CREATE_QUESTION", "question", question.id);
  return question;
}
export async function updateQuestionStatus(
  id: string,
  status: Question["status"],
) {
  const q = await getQuestionById(id);
  if (!q) return false;
  await put("avs_questions", { ...q, status });
  await logAudit("admin", "UPDATE_QUESTION_STATUS", "question", id, { status });
  return true;
}
export async function getAllTests() {
  await initDatabase();
  return all<QuizTest>("avs_curriculum", { kind: "test" });
}
export async function getTestById(id: string) {
  await initDatabase();
  return one<QuizTest>("avs_curriculum", "id", id, "test");
}
export async function startQuizSession(
  params: Parameters<typeof Memory.startQuizSession>[0],
) {
  let questions = await getQuestions({
    subjectId: params.subjectId,
    chapterId: params.chapterId,
    status: "Published",
    sourceType: params.sourceFilter === "All" ? undefined : params.sourceFilter,
  });
  for (let i = questions.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  questions = questions.slice(
    0,
    Math.min(
      100,
      Math.max(1, params.limit || (params.mode === "daily25" ? 25 : 10)),
    ),
  );
  if (!questions.length)
    throw new Error(
      "This chapter does not have published practice questions yet.",
    );
  const session = await rpc<QuizSession>("avs_start_quiz", {
    p_session: {
      ...params,
      id: "sess-" + randomUUID(),
      questionIds: questions.map((q) => q.id),
      sourceFilter: params.sourceFilter || "All",
      score: 0,
      totalQuestions: questions.length,
      correctCount: 0,
      wrongCount: 0,
      unansweredCount: questions.length,
      timeTakenSeconds: 0,
      answers: {},
      isCompleted: false,
    },
  });
  return { session, questions: await getQuizQuestions(session.id) };
}
export async function getQuizSessionById(id: string) {
  await initDatabase();
  return one<QuizSession>("avs_quiz_sessions", "id", id);
}
export async function saveQuizAnswer(
  ...[id, qid, answer, seconds = 0, review = false]: Parameters<
    typeof Memory.saveQuizAnswer
  >
) {
  const session = await getQuizSessionById(id);
  if (!session) return null;
  return rpc<QuizSession | null>("avs_save_answer", {
    p_session_id: id,
    p_student_id: session.studentId,
    p_question_id: qid,
    p_answer: answer,
    p_seconds: seconds,
    p_review: review,
  });
}
export async function submitQuizSession(id: string) {
  const session = await getQuizSessionById(id);
  if (!session) return null;
  return rpc<QuizSession | null>("avs_submit_quiz", {
    p_session_id: id,
    p_student_id: session.studentId,
  });
}
export async function getStudentQuizHistory(id: string) {
  await initDatabase();
  return (
    await all<QuizSession>("avs_quiz_sessions", {
      student_id: id,
      completed: true,
    })
  ).sort(
    (a, b) =>
      Date.parse(b.completedAt || b.startedAt) -
      Date.parse(a.completedAt || a.startedAt),
  );
}
export async function getCompletedQuizSessions() {
  await initDatabase();
  return all<QuizSession>("avs_quiz_sessions", { completed: true });
}
async function ownerId(id: string) {
  const student = await getStudentById(id);
  if (student) return student.userId;
  const user = await getUserById(id);
  if (!user) throw new Error("Account not found.");
  return user.id;
}
export async function getLearningActivity(id: string) {
  await initDatabase();
  const rows = await all<
    | { kind: "note"; studentId: string; noteId: string; page: number }
    | {
        kind: "video";
        studentId: string;
        videoId: string;
        seconds: number;
        percent: number;
      }
  >("avs_activity", { student_id: await ownerId(id) });
  return {
    notes: rows.filter((r) => r.kind === "note"),
    videos: rows.filter((r) => r.kind === "video"),
  };
}
async function activity(
  id: string,
  kind: "note" | "video",
  resourceId: string,
  data: Record<string, unknown>,
) {
  await initDatabase();
  const { error } = await client()
    .from("avs_activity")
    .upsert(
      {
        student_id: await ownerId(id),
        kind,
        resource_id: resourceId,
        data: { ...data, kind, studentId: id },
      },
      { onConflict: "student_id,kind,resource_id" },
    );
  if (error) throw databaseError(error);
}
export async function recordNoteVisit(
  id: string,
  noteId: string,
  page: number,
) {
  await activity(id, "note", noteId, { noteId, page });
}
export async function recordVideoVisit(
  id: string,
  videoId: string,
  seconds: number,
  percent: number,
) {
  await activity(id, "video", videoId, { videoId, seconds, percent });
}
export async function updateStudentChapterProgress(
  id: string,
  chapterId: string,
  updates: Partial<StudentProgress>,
) {
  await initDatabase();
  const rows = await all<StudentProgress>("avs_progress", {
    student_id: id,
    chapter_id: chapterId,
  });
  const data = {
    id: id + "_" + chapterId,
    studentId: id,
    chapterId,
    notesViewed: 0,
    noteLastPage: 1,
    videoWatchPercentage: 0,
    mcqsAttempted: 0,
    bestScore: 0,
    averageScore: 0,
    isCompleted: false,
    ...((rows[0] as Partial<StudentProgress> | undefined) || {}),
    ...updates,
    lastAccessedAt: new Date().toISOString(),
  };
  const { error } = await client()
    .from("avs_progress")
    .upsert(
      { student_id: id, chapter_id: chapterId, data },
      { onConflict: "student_id,chapter_id" },
    );
  if (error) throw databaseError(error);
}
export async function getStudentProgress(
  id: string,
): Promise<Awaited<ReturnType<typeof Memory.getStudentProgress>>> {
  const [sessions, activity, student, progress] = await Promise.all([
    getStudentQuizHistory(id),
    getLearningActivity(id),
    getStudentById(id),
    all<StudentProgress>("avs_progress", { student_id: id }),
  ]);
  const chapters = await getSubjects(student?.stream);
  const totalChapters = chapters.reduce((n, s) => n + s.totalChapters, 0);
  const completed = progress.filter((p) => p.isCompleted).length;
  const attempted = sessions.reduce(
    (n, s) => n + s.correctCount + s.wrongCount,
    0,
  );
  const correct = sessions.reduce((n, s) => n + s.correctCount, 0);
  const scores = new Map<string, { correct: number; total: number }>();
  for (const s of sessions) {
    if (s.chapterId) {
      const score = scores.get(s.chapterId) || { correct: 0, total: 0 };
      score.correct += s.correctCount;
      score.total += s.totalQuestions;
      scores.set(s.chapterId, score);
    }
  }
  const weakChapters = [];
  for (const [chapterId, score] of scores) {
    const pct = Math.round((score.correct / Math.max(1, score.total)) * 100);
    if (pct < 70) {
      const chapter = await getChapterById(chapterId);
      if (chapter)
        weakChapters.push({ chapterId, title: chapter.title, score: pct });
    }
  }
  const day = (date: Date) =>
    date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const days = new Set(
    sessions.map((s) => day(new Date(s.completedAt || s.startedAt))),
  );
  const cursor = new Date();
  let currentStreak = 0;
  if (!days.has(day(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(day(cursor))) {
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    overallProgress: Math.round((completed / Math.max(1, totalChapters)) * 100),
    chaptersCompleted: completed,
    notesViewed: activity.notes.length,
    videosWatched: activity.videos.filter((v) => (v.percent || 0) >= 90).length,
    mcqsAttempted: attempted,
    averageScore: attempted ? Math.round((correct / attempted) * 100) : 0,
    currentStreak,
    weakChapters,
  };
}
export async function getActiveAnnouncements(stream?: Subject["streamId"]) {
  await initDatabase();
  return (await all<Announcement>("avs_announcements")).filter(
    (a) =>
      a.isActive &&
      (!stream || a.targetStream === "All" || a.targetStream === stream),
  );
}
export async function createAnnouncement(
  data: Parameters<typeof Memory.createAnnouncement>[0],
) {
  await initDatabase();
  return put("avs_announcements", { ...data, id: "ann-" + randomUUID() });
}
export async function getStudentBookmarks(id: string) {
  await initDatabase();
  return all<Bookmark>("avs_bookmarks", { owner_id: await ownerId(id) });
}
export async function toggleBookmark(
  data: Parameters<typeof Memory.toggleBookmark>[0],
) {
  await initDatabase();
  return {
    bookmarked: await rpc<boolean>("avs_toggle_bookmark", {
      p_owner_id: await ownerId(data.studentId),
      p_bookmark: {
        ...data,
        id: "bm-" + randomUUID(),
        createdAt: new Date().toISOString(),
      },
    }),
  };
}
export async function retrieveGroundedKnowledge(
  query: string,
  stream?: Subject["streamId"],
  threshold = 0.2,
) {
  await initDatabase();
  const terms = query
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
  return (await all<AIKnowledgeChunk>("avs_curriculum", { kind: "knowledge" }))
    .filter((c) => !stream || c.stream === stream)
    .map((chunk) => {
      const text = [
        chunk.subjectName,
        chunk.chapterTitle,
        chunk.topicTitle,
        chunk.chunkText,
        chunk.chunkTextTamil,
      ]
        .join(" ")
        .toLowerCase();
      return {
        chunk,
        score: terms.length
          ? terms.filter((t) => text.includes(t)).length / terms.length
          : 0,
      };
    })
    .filter((r) => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
export async function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: unknown,
) {
  await put("avs_audit_logs", {
    id: "audit-" + randomUUID(),
    userId,
    action,
    entityType,
    entityId,
    details,
    timestamp: new Date().toISOString(),
  });
}
export async function getAuditLogs(): Promise<Audit[]> {
  await initDatabase();
  const { data, error } = await client()
    .from("avs_audit_logs")
    .select("id,data")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw databaseError(error);
  return (data || []).map((row) => ({ ...row.data, id: row.id }));
}

export async function getQuizQuestions(id: string): Promise<Question[]> {
  await initDatabase();
  const { data, error } = await client()
    .from("avs_quiz_sessions")
    .select("data,question_snapshot")
    .eq("id", id)
    .maybeSingle();
  if (error) throw databaseError(error);
  if (!data) return [];
  return (data?.data.questionIds || []).map(
    (qid: string) => data.question_snapshot[qid],
  );
}

export async function saveQuizAnswers(
  id: string,
  answers: Record<string, "A" | "B" | "C" | "D" | null>,
): Promise<QuizSession | null> {
  const session = await getQuizSessionById(id);
  if (!session) return null;
  return rpc("avs_save_answers", {
    p_session_id: id,
    p_student_id: session.studentId,
    p_answers: answers,
  });
}
