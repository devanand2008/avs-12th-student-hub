import { listResources } from "@/lib/content";
import {
  AIKnowledgeChunk,
  Announcement,
  Book,
  Bookmark,
  Chapter,
  HandwrittenNote,
  Question,
  QuizSession,
  QuizTest,
  StreamType,
  Student,
  StudentProgress,
  Subject,
  Topic,
  User,
  VideoLesson,
} from "@/types";
import bcrypt from "bcryptjs";
import { studentActivationMode } from "@/lib/auth/activation";
import {
  normalizePhone,
  validateRegistration,
  type AdminUserData,
  type StudentRegistration,
} from "./user-data";
import { randomBytes, randomInt, randomUUID } from "node:crypto";
import {
  INITIAL_BOOKS,
  INITIAL_CHAPTERS,
  INITIAL_DEMO_STUDENTS,
  INITIAL_KNOWLEDGE_CHUNKS,
  INITIAL_QUESTIONS,
  INITIAL_SUBJECTS,
  INITIAL_TOPICS,
} from "./initial-seed";

// In-Memory Global Store with Singleton pattern for server runtime
interface DBState {
  noteVisits: Map<string, { studentId: string; noteId: string; page: number }>;
  videoVisits: Map<
    string,
    { studentId: string; videoId: string; seconds: number; percent: number }
  >;
  users: Map<string, User>;
  students: Map<string, Student>;
  subjects: Map<string, Subject>;
  books: Map<string, Book>;
  chapters: Map<string, Chapter>;
  topics: Map<string, Topic>;
  notes: Map<string, HandwrittenNote>;
  videos: Map<string, VideoLesson>;
  questions: Map<string, Question>;
  quizTests: Map<string, QuizTest>;
  quizSessions: Map<string, QuizSession>;
  progress: Map<string, StudentProgress>;
  announcements: Map<string, Announcement>;
  bookmarks: Map<string, Bookmark>;
  knowledgeChunks: Map<string, AIKnowledgeChunk>;
  auditLogs: Array<{
    id: string;
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: unknown;
    timestamp: string;
  }>;
  initialized: boolean;
}

declare global {
  var __AVS_DB__: DBState | undefined;
}

function getInitialDBState(): DBState {
  return {
    noteVisits: new Map(),
    videoVisits: new Map(),
    users: new Map(),
    students: new Map(),
    subjects: new Map(),
    books: new Map(),
    chapters: new Map(),
    topics: new Map(),
    notes: new Map(),
    videos: new Map(),
    questions: new Map(),
    quizTests: new Map(),
    quizSessions: new Map(),
    progress: new Map(),
    announcements: new Map(),
    bookmarks: new Map(),
    knowledgeChunks: new Map(),
    auditLogs: [],
    initialized: false,
  };
}

const dbState: DBState = global.__AVS_DB__ || getInitialDBState();
global.__AVS_DB__ = dbState;
let initialization: Promise<void> | null = null;

export async function initDatabase(): Promise<void> {
  if (!initialization)
    initialization = initialize().catch((error) => {
      initialization = null;
      throw error;
    });
  return initialization;
}

async function initialize(): Promise<void> {
  if (dbState.initialized) return;

  // 1. Seed admin user
  const demoEnabled =
    process.env.ENABLE_DEMO_DATA === "true" ||
    (process.env.NODE_ENV !== "production" &&
      process.env.ENABLE_DEMO_DATA !== "false");
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminInitialPass = process.env.ADMIN_INITIAL_PASSWORD;
  if (adminEmail && adminInitialPass) {
    const adminPassHash = await bcrypt.hash(adminInitialPass, 10);

    const adminUser: User = {
      id: "usr-admin-01",
      role: "admin",
      email: adminEmail,
      passwordHash: adminPassHash,
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dbState.users.set(adminUser.id, adminUser);
    dbState.users.set(adminUser.email.toLowerCase(), adminUser);
  }

  // 2. Seed Demo Students & Users
  const studentDemoPassHash = await bcrypt.hash("Student@2026", 10);

  for (const stud of demoEnabled ? INITIAL_DEMO_STUDENTS : []) {
    const studentUser: User = {
      id: stud.userId,
      role: "student",
      email: stud.studentEmail,
      passwordHash: studentDemoPassHash,
      createdAt: stud.createdAt,
      updatedAt: stud.createdAt,
    };
    dbState.users.set(studentUser.id, studentUser);
    dbState.users.set(stud.studentId.toUpperCase(), studentUser);
    dbState.students.set(stud.id, stud);
    dbState.students.set(stud.studentId.toUpperCase(), stud);
  }

  // 3. Seed Subjects & Books & Chapters
  INITIAL_SUBJECTS.forEach((s) => dbState.subjects.set(s.id, s));
  INITIAL_BOOKS.forEach((b) => dbState.books.set(b.id, b));
  INITIAL_CHAPTERS.forEach((c) => dbState.chapters.set(c.id, c));
  INITIAL_TOPICS.forEach((t) => dbState.topics.set(t.id, t));

  // 4. Seed Notes & Videos & Questions
  INITIAL_CHAPTERS.forEach((chapter) => {
    chapter.totalNotes = 0;
    chapter.totalVideos = 0;
  });
  if (demoEnabled) {
    INITIAL_QUESTIONS.forEach((q) => dbState.questions.set(q.id, q));
    INITIAL_KNOWLEDGE_CHUNKS.forEach((k) =>
      dbState.knowledgeChunks.set(k.id, k),
    );
  }

  // 5. Seed default Quiz Tests
  const defaultTests: QuizTest[] = [
    {
      id: "test-cs-quick",
      title: "Class 12 CS Quick 10-Mark Drill",
      description:
        "Fast 10-question practice test covering Functions, Python basics, and SQL.",
      subjectId: "sub-cs",
      mode: "quick",
      questionCount: 10,
      durationMins: 10,
      passPercentage: 60,
      negativeMarking: false,
      allowedAttempts: 999,
      isActive: true,
    },
    {
      id: "test-bot-timed",
      title: "Bio-Botany Chapter 1 Timed Exam",
      description:
        "Official 15-minute test on Plant Reproduction with server-side timer validation.",
      subjectId: "sub-botany",
      chapterId: "bot-ch-1",
      mode: "timed",
      questionCount: 10,
      durationMins: 15,
      passPercentage: 70,
      negativeMarking: false,
      allowedAttempts: 5,
      isActive: true,
    },
    {
      id: "test-zoo-daily",
      title: "Bio-Zoology Daily 10 Practice",
      description:
        "Daily high-yield MCQs for Class 12 Biology public examination prep.",
      subjectId: "sub-zoology",
      mode: "daily10",
      questionCount: 10,
      durationMins: 10,
      passPercentage: 60,
      negativeMarking: false,
      allowedAttempts: 999,
      isActive: true,
    },
  ];
  defaultTests.forEach((t) => dbState.quizTests.set(t.id, t));

  dbState.initialized = true;
}

// Ensure DB is initialized before access
async function ensureInit() {
  if (!dbState.initialized) {
    await initDatabase();
  }
}

// ==========================================
// AUTH & USERS
// ==========================================
export async function getUserByLoginId(
  loginId: string,
): Promise<{ user: User; student?: Student } | null> {
  await ensureInit();
  const normalized = loginId.trim().toLowerCase();
  const normalizedUpper = loginId.trim().toUpperCase();
  let matchedStudent: Student | undefined;

  // Check direct email or upper student ID
  let user =
    dbState.users.get(normalized) || dbState.users.get(normalizedUpper);
  if (!user) {
    // Search among all users
    for (const u of dbState.users.values()) {
      if (u.email.toLowerCase() === normalized) {
        user = u;
        break;
      }
    }
  }

  if (!user) {
    // Search students by studentId
    const stud = dbState.students.get(normalizedUpper);
    if (stud) {
      user = dbState.users.get(stud.userId);
      matchedStudent = stud;
    }
  }

  if (!user) {
    // Search students by phone number
    const cleanPhone = normalizePhone(normalized);
    if (cleanPhone.length === 10 && /^[+\d\s()-]+$/.test(normalized)) {
      for (const s of dbState.students.values()) {
        if (s.studentPhone && normalizePhone(s.studentPhone) === cleanPhone) {
          user = dbState.users.get(s.userId);
          matchedStudent = s;
          break;
        }
      }
    }
  }

  if (!user) {
    // Search students by school register number
    for (const s of dbState.students.values()) {
      if (s.registerNumber && s.registerNumber.trim().toLowerCase() === normalized) {
        user = dbState.users.get(s.userId);
        matchedStudent = s;
        break;
      }
    }
  }

  if (!user) return null;

  if (user.role === "student") {
    matchedStudent ||= dbState.students.get(normalizedUpper);
    if (!matchedStudent) {
      for (const s of dbState.students.values()) {
        if (s.userId === user.id) {
          matchedStudent = s;
          break;
        }
      }
    }
  }

  return { user, student: matchedStudent };
}

export async function getUserById(id: string): Promise<User | null> {
  await ensureInit();
  return dbState.users.get(id) || null;
}

export async function getStudentByUserId(
  userId: string,
): Promise<Student | null> {
  await ensureInit();
  for (const s of dbState.students.values()) {
    if (s.userId === userId) return s;
  }
  return null;
}

export async function updateUserPassword(
  userId: string,
  newPasswordHash: string,
  expectedHash?: string,
): Promise<boolean> {
  await ensureInit();
  const user = dbState.users.get(userId);
  if (!user) return false;
  if (expectedHash && user.passwordHash !== expectedHash) return false;
  user.passwordHash = newPasswordHash;
  user.mustChangePassword = false;
  user.updatedAt = new Date().toISOString();

  // If student, clear mustChangePassword flag
  if (user.role === "student") {
    const student = await getStudentByUserId(userId);
    if (student) {
      student.mustChangePassword = false;
      if (
        student.adminApprovedAt ||
        (student.phoneVerifiedAt &&
          student.phoneVerifiedNumber === normalizePhone(student.studentPhone))
      )
        student.initialPasswordSetAt ||= new Date().toISOString();
    }
  }
  return true;
}

// ==========================================
// STUDENTS MANAGEMENT
// ==========================================
export async function getAllStudents(): Promise<Student[]> {
  await ensureInit();
  const uniqueStudents = new Map<string, Student>();
  for (const s of dbState.students.values()) {
    uniqueStudents.set(s.id, s);
  }
  return Array.from(uniqueStudents.values());
}

export async function getAllUserData(
  actorId: string,
): Promise<AdminUserData[]> {
  await ensureInit();
  if (dbState.users.get(actorId)?.role !== "admin")
    throw new Error("Admin authorization required");
  const students = await getAllStudents();
  const users = new Map(
    Array.from(dbState.users.values()).map((u) => [u.id, u]),
  );
  return Array.from(users.values())
    .map((user) => {
      const student = students.find((s) => s.userId === user.id);
      const safe: AdminUserData = {
        id: user.id,
        role: user.role,
        email: user.email,
        mustChangePassword:
          student?.mustChangePassword || user.mustChangePassword || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
      if (!student) return safe;
      const sessions = Array.from(dbState.quizSessions.values()).filter(
        (s) => s.studentId === student.studentId && s.isCompleted,
      );
      const attempted = sessions.reduce(
        (n, s) => n + s.correctCount + s.wrongCount,
        0,
      );
      const correct = sessions.reduce((n, s) => n + s.correctCount, 0);
      const notes = Array.from(dbState.noteVisits.values()).filter(
        (n) => n.studentId === student.studentId || n.studentId === user.id,
      );
      const videos = Array.from(dbState.videoVisits.values()).filter(
        (v) =>
          (v.studentId === student.studentId || v.studentId === user.id) &&
          v.percent >= 90,
      );
      const bookmarks = Array.from(dbState.bookmarks.values()).filter(
        (b) => b.studentId === student.studentId || b.studentId === user.id,
      );
      const activityDates = [
        student.createdAt,
        ...sessions.map((s) => s.completedAt || s.startedAt),
        ...dbState.auditLogs
          .filter((a) => a.userId === user.id)
          .map((a) => a.timestamp),
      ];
      return {
        ...safe,
        student: { ...student },
        learning: {
          quizAttempts: sessions.length,
          mcqsAttempted: attempted,
          averageScore: attempted ? Math.round((100 * correct) / attempted) : 0,
          notesViewed: notes.length,
          videosWatched: videos.length,
          bookmarksCount: bookmarks.length,
          lastActiveAt: activityDates.sort(
            (a, b) => Date.parse(b) - Date.parse(a),
          )[0],
        },
      };
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function getStudentById(id: string): Promise<Student | null> {
  await ensureInit();
  return dbState.students.get(id) || null;
}

export async function createStudentWithUser(data: {
  studentName: string;
  registerNumber: string;
  schoolName: string;
  studentEmail?: string;
  studentPhone?: string;
  stream: StreamType;
  medium?: "English" | "Tamil";
  academicYear?: string;
  temporaryPassword?: string;
  actorId?: string;
}): Promise<{ student: Student; temporaryPassword: string }> {
  await ensureInit();
  if (data.actorId && dbState.users.get(data.actorId)?.role !== "admin")
    throw new Error("Admin authorization required");

  const tempPassword =
    data.temporaryPassword || `AVS@26${randomBytes(9).toString("base64url")}`;
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  // No asynchronous gap between duplicate/sequence checks and insertion.
  const existing = Array.from(
    new Map(
      Array.from(dbState.students.values()).map((s) => [s.id, s]),
    ).values(),
  );
  if (
    existing.some(
      (s) =>
        s.registerNumber.trim().toLowerCase() ===
        data.registerNumber.trim().toLowerCase(),
    )
  )
    throw new Error("Duplicate register number");
  if (!["Computer Science", "Biology"].includes(data.stream))
    throw new Error("Invalid stream");
  if (
    data.studentEmail &&
    Array.from(dbState.users.values()).some(
      (u) => u.email.toLowerCase() === data.studentEmail!.trim().toLowerCase(),
    )
  )
    throw new Error("An account with this email already exists.");
  if (
    data.studentPhone &&
    existing.some(
      (s) =>
        normalizePhone(s.studentPhone) === normalizePhone(data.studentPhone!),
    )
  )
    throw new Error("An account with this phone number already exists.");
  const streamPrefix =
    data.stream === "Computer Science" ? "AVSCS26" : "AVSBIO26";
  const maximum = existing
    .filter((s) => s.stream === data.stream)
    .reduce(
      (max, s) => Math.max(max, Number(s.studentId.split("-").at(-1)) || 0),
      0,
    );
  const seqNum = (maximum + 1).toString().padStart(4, "0");
  const studentId = `${streamPrefix}-${seqNum}`;

  const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const studentRecordId = `stud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const user: User = {
    id: userId,
    role: "student",
    email:
      data.studentEmail?.trim().toLowerCase() ||
      `${studentId.toLowerCase()}@avs.edu`,
    passwordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const student: Student = {
    id: studentRecordId,
    userId,
    studentId,
    studentName: data.studentName,
    registerNumber: data.registerNumber,
    schoolName: data.schoolName,
    studentEmail: user.email,
    studentPhone: data.studentPhone ? normalizePhone(data.studentPhone) : "",
    stream: data.stream,
    medium: data.medium || "English",
    academicYear: data.academicYear || "2026-2027",
    activeStatus: true,
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
  };

  dbState.users.set(user.id, user);
  dbState.users.set(studentId.toUpperCase(), user);
  dbState.students.set(student.id, student);
  dbState.students.set(studentId.toUpperCase(), student);

  if (studentActivationMode() === "admin" && data.actorId) {
    student.adminApprovedAt = new Date().toISOString();
    student.adminApprovedBy = data.actorId;
    logAudit(data.actorId, "APPROVE_STUDENT", "student", student.id, {
      activationMethod: "admin",
    });
  }

  logAudit("admin", "CREATE_STUDENT", "student", student.id, {
    studentId,
    stream: data.stream,
  });

  return { student, temporaryPassword: tempPassword };
}

export async function registerStudent(
  data: StudentRegistration,
): Promise<{ student: Student; user: User }> {
  await ensureInit();
  const {
    phone: cleanPhone,
    studentId: requestedId,
    email,
  } = validateRegistration(data);
  if (data.standard && data.standard !== "12th Standard")
    throw new Error("Only 12th Standard registration is available.");
  const passwordHash = await bcrypt.hash(data.password, 12);

  // Hash first. Duplicate checks, ID allocation and inserts below have no async gap.
  const existing = Array.from(
    new Map(
      Array.from(dbState.students.values()).map((s) => [s.id, s]),
    ).values(),
  );

  if (existing.some((s) => normalizePhone(s.studentPhone) === cleanPhone))
    throw new Error(
      "An account with this phone number already exists. Please sign in.",
    );
  if (
    email &&
    Array.from(dbState.users.values()).some(
      (u) => u.email.toLowerCase() === email,
    )
  )
    throw new Error(
      "An account with this email already exists. Please sign in.",
    );

  if (requestedId) {
    if (
      existing.some(
        (s) =>
          s.studentId.toUpperCase() === requestedId ||
          s.registerNumber.trim().toUpperCase() === requestedId,
      )
    ) {
      throw new Error(
        `Account ID "${requestedId}" is already taken. Please choose another.`,
      );
    }
  }

  let studentId = requestedId;
  if (!studentId) {
    const streamPrefix =
      data.stream === "Computer Science" ? "AVSCS26" : "AVSBIO26";
    const maximum = existing
      .filter((s) => s.stream === data.stream)
      .reduce(
        (max, s) => Math.max(max, Number(s.studentId.split("-").at(-1)) || 0),
        0,
      );
    const seqNum = (maximum + 1).toString().padStart(4, "0");
    studentId = `${streamPrefix}-${seqNum}`;
  }

  const userId = `usr-${randomUUID()}`;
  const studentRecordId = `stud-${randomUUID()}`;

  const user: User = {
    id: userId,
    role: "student",
    email: email || `${studentId.toLowerCase()}@avs.edu`,
    passwordHash,
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const student: Student = {
    id: studentRecordId,
    userId,
    studentId,
    studentName: data.studentName.trim(),
    registerNumber: data.registerNumber?.trim() || studentId,
    schoolName: data.schoolName.trim(),
    standard: data.standard?.trim() || "12th Standard",
    studentEmail: user.email,
    studentPhone: cleanPhone,
    stream: data.stream,
    medium: data.medium || "English",
    academicYear: "2026-2027",
    activeStatus: true,
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
  };

  dbState.users.set(user.id, user);
  dbState.users.set(studentId.toUpperCase(), user);
  dbState.students.set(student.id, student);
  dbState.students.set(studentId.toUpperCase(), student);

  logAudit(userId, "REGISTER_STUDENT", "student", student.id, {
    studentId,
    stream: data.stream,
    schoolName: data.schoolName,
  });

  return { student, user };
}

export async function toggleStudentActive(
  id: string,
  actorId?: string,
): Promise<boolean> {
  await ensureInit();
  if (actorId && dbState.users.get(actorId)?.role !== "admin")
    throw new Error("Admin authorization required");
  const student = dbState.students.get(id);
  if (!student) return false;
  student.activeStatus = !student.activeStatus;
  logAudit(actorId || "admin", "TOGGLE_STUDENT_STATUS", "student", student.id, {
    activeStatus: student.activeStatus,
  });
  return true;
}

export async function resetStudentPassword(
  id: string,
  actorId?: string,
): Promise<string | null> {
  await ensureInit();
  if (actorId && dbState.users.get(actorId)?.role !== "admin")
    throw new Error("Admin authorization required");
  const student = dbState.students.get(id);
  if (!student) return null;
  const user = dbState.users.get(student.userId);
  if (!user) return null;

  const tempPassword = `AVS@26${randomBytes(9).toString("base64url")}`;
  user.passwordHash = await bcrypt.hash(tempPassword, 10);
  user.mustChangePassword = true;
  user.updatedAt = new Date().toISOString();
  student.mustChangePassword = true;

  logAudit(
    actorId || "admin",
    "RESET_STUDENT_PASSWORD",
    "student",
    student.id,
    {
      studentId: student.studentId,
    },
  );
  return tempPassword;
}

export async function approveStudent(id: string, actorId: string) {
  await ensureInit();
  if (dbState.users.get(actorId)?.role !== "admin")
    throw new Error("Admin authorization required");
  const student = dbState.students.get(id);
  if (!student?.activeStatus || student.adminApprovedAt) return null;
  const user = dbState.users.get(student.userId);
  if (!user || user.role !== "student") return null;
  const temporaryPassword = "AVS@" + randomBytes(12).toString("base64url");
  const hash = await bcrypt.hash(temporaryPassword, 12);
  if (!student.activeStatus || student.adminApprovedAt) return null;
  const stamp = new Date().toISOString();
  student.adminApprovedAt = stamp;
  student.adminApprovedBy = actorId;
  student.mustChangePassword = true;
  delete student.initialPasswordSetAt;
  user.passwordHash = hash;
  user.mustChangePassword = true;
  user.updatedAt = stamp;
  logAudit(actorId, "APPROVE_STUDENT", "student", student.id, {
    studentId: student.studentId,
    activationMethod: "admin",
  });
  return { student, temporaryPassword };
}

// ==========================================
// CURRICULUM: SUBJECTS & CHAPTERS & NOTES & VIDEOS
// ==========================================
export async function getSubjects(stream?: StreamType): Promise<Subject[]> {
  await ensureInit();
  const list = Array.from(dbState.subjects.values());
  if (stream) {
    return list.filter((s) => s.streamId === stream || s.streamId === "Common");
  }
  return list.sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function getSubjectById(id: string): Promise<Subject | null> {
  await ensureInit();
  return dbState.subjects.get(id) || null;
}

export async function getAllChapters(): Promise<Chapter[]> {
  await ensureInit();
  return Array.from(dbState.chapters.values());
}

export async function getChaptersBySubject(
  subjectId: string,
): Promise<Chapter[]> {
  await ensureInit();
  return Array.from(dbState.chapters.values())
    .filter((c) => c.subjectId === subjectId)
    .sort((a, b) => a.chapterNumber - b.chapterNumber);
}

export async function getChapterById(id: string): Promise<Chapter | null> {
  await ensureInit();
  return dbState.chapters.get(id) || null;
}

export async function updateChapter(
  id: string,
  updates: Partial<Chapter>,
): Promise<Chapter | null> {
  await ensureInit();
  const ch = dbState.chapters.get(id);
  if (!ch) return null;
  Object.assign(ch, updates);
  logAudit("admin", "UPDATE_CHAPTER", "chapter", id, updates);
  return ch;
}

export async function getNotesByChapter(
  chapterId: string,
): Promise<HandwrittenNote[]> {
  await ensureInit();
  return Array.from(dbState.notes.values()).filter(
    (n) => n.chapterId === chapterId && n.isPublished,
  );
}

export async function getAllNotes(): Promise<HandwrittenNote[]> {
  await ensureInit();
  return (await listResources("note", true)) as HandwrittenNote[];
}

export async function getNoteById(id: string): Promise<HandwrittenNote | null> {
  await ensureInit();
  const note = dbState.notes.get(id);
  if (note) {
    note.viewsCount = (note.viewsCount || 0) + 1;
  }
  return note || null;
}

export async function createNote(
  note: Omit<HandwrittenNote, "id" | "viewsCount" | "updatedAt">,
): Promise<HandwrittenNote> {
  await ensureInit();
  const id = `note-${randomUUID()}`;
  const newNote: HandwrittenNote = {
    ...note,
    id,
    viewsCount: 0,
    updatedAt: new Date().toISOString(),
  };
  dbState.notes.set(id, newNote);
  logAudit("admin", "CREATE_NOTE", "handwritten_notes", id, {
    title: newNote.title,
  });
  return newNote;
}

export async function getVideosByChapter(
  chapterId: string,
): Promise<VideoLesson[]> {
  await ensureInit();
  return Array.from(dbState.videos.values()).filter(
    (v) => v.chapterId === chapterId && v.isPublished,
  );
}

export async function getAllVideos(): Promise<VideoLesson[]> {
  await ensureInit();
  return (await listResources("video", true)) as VideoLesson[];
}

export async function getVideoById(id: string): Promise<VideoLesson | null> {
  await ensureInit();
  return dbState.videos.get(id) || null;
}

export async function createVideo(
  video: Omit<VideoLesson, "id" | "createdAt">,
): Promise<VideoLesson> {
  await ensureInit();
  const id = `vid-${randomUUID()}`;
  const newVideo: VideoLesson = {
    ...video,
    id,
    createdAt: new Date().toISOString(),
  };
  dbState.videos.set(id, newVideo);
  logAudit("admin", "CREATE_VIDEO", "video_lessons", id, {
    title: newVideo.title,
  });
  return newVideo;
}

// ==========================================
// QUESTION BANK (MCQ ENGINE)
// ==========================================
export async function getQuestions(filters?: {
  chapterId?: string;
  subjectId?: string;
  sourceType?: "Book-In" | "Book-Out";
  difficulty?: "Easy" | "Medium" | "Hard";
  status?: string;
}): Promise<Question[]> {
  await ensureInit();
  let list = Array.from(dbState.questions.values());

  if (filters?.chapterId) {
    list = list.filter((q) => q.chapterId === filters.chapterId);
  }
  if (filters?.subjectId) {
    list = list.filter((q) => q.subjectId === filters.subjectId);
  }
  if (filters?.sourceType) {
    list = list.filter((q) => q.sourceType === filters.sourceType);
  }
  if (filters?.difficulty) {
    list = list.filter((q) => q.difficulty === filters.difficulty);
  }
  if (filters?.status) {
    list = list.filter((q) => q.status === filters.status);
  }

  return list;
}

export async function getQuestionById(id: string): Promise<Question | null> {
  await ensureInit();
  return dbState.questions.get(id) || null;
}

export async function createQuestion(
  q: Omit<Question, "id" | "createdAt">,
): Promise<Question> {
  await ensureInit();
  const id = `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newQ: Question = {
    ...q,
    id,
    createdAt: new Date().toISOString(),
  };
  dbState.questions.set(id, newQ);
  logAudit("admin", "CREATE_QUESTION", "question", id, {
    chapterId: q.chapterId,
    sourceType: q.sourceType,
  });
  return newQ;
}

export async function updateQuestionStatus(
  id: string,
  status: Question["status"],
): Promise<boolean> {
  await ensureInit();
  const q = dbState.questions.get(id);
  if (!q) return false;
  q.status = status;
  logAudit("admin", "UPDATE_QUESTION_STATUS", "question", id, { status });
  return true;
}

// ==========================================
// PRACTICE SESSIONS & TESTS
// ==========================================
export async function getAllTests(): Promise<QuizTest[]> {
  await ensureInit();
  return Array.from(dbState.quizTests.values());
}

export async function getTestById(id: string): Promise<QuizTest | null> {
  await ensureInit();
  return dbState.quizTests.get(id) || null;
}

export async function startQuizSession(params: {
  studentId: string;
  subjectId: string;
  chapterId?: string;
  testId?: string;
  mode: QuizSession["mode"];
  sourceFilter?: "All" | "Book-In" | "Book-Out";
  limit?: number;
}): Promise<{ session: QuizSession; questions: Question[] }> {
  await ensureInit();

  // Fetch relevant questions
  let availableQuestions = Array.from(dbState.questions.values()).filter(
    (q) => q.status === "Published" && q.subjectId === params.subjectId,
  );

  if (params.chapterId) {
    availableQuestions = availableQuestions.filter(
      (q) => q.chapterId === params.chapterId,
    );
  }

  if (params.sourceFilter && params.sourceFilter !== "All") {
    availableQuestions = availableQuestions.filter(
      (q) => q.sourceType === params.sourceFilter,
    );
  }

  // Shuffle & slice
  const count =
    params.limit ||
    (params.mode === "daily10" ? 10 : params.mode === "daily25" ? 25 : 10);
  for (let i = availableQuestions.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [availableQuestions[i], availableQuestions[j]] = [
      availableQuestions[j],
      availableQuestions[i],
    ];
  }
  const selected = availableQuestions.slice(
    0,
    Math.min(100, Math.max(1, count)),
  );
  if (!selected.length)
    throw new Error(
      "This chapter does not have published practice questions yet.",
    );

  const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const session: QuizSession = {
    id: sessionId,
    studentId: params.studentId,
    testId: params.testId,
    chapterId: params.chapterId,
    subjectId: params.subjectId,
    mode: params.mode,
    sourceFilter: params.sourceFilter || "All",
    startedAt: new Date().toISOString(),
    questionIds: selected.map((q) => q.id),
    expiresAt:
      params.mode === "timed"
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        : undefined,
    score: 0,
    totalQuestions: selected.length,
    correctCount: 0,
    wrongCount: 0,
    unansweredCount: selected.length,
    timeTakenSeconds: 0,
    answers: {},
    isCompleted: false,
  };

  dbState.quizSessions.set(sessionId, session);
  return { session, questions: selected };
}

export async function saveQuizAnswer(
  sessionId: string,
  questionId: string,
  selectedAnswer: "A" | "B" | "C" | "D" | null,
  timeSpentSeconds: number = 0,
  markedForReview: boolean = false,
): Promise<QuizSession | null> {
  await ensureInit();
  const session = dbState.quizSessions.get(sessionId);
  if (!session || session.isCompleted) return null;
  if (!session.questionIds.includes(questionId)) return null;
  if (session.expiresAt && Date.now() > Date.parse(session.expiresAt))
    return null;
  if (selectedAnswer !== null && !["A", "B", "C", "D"].includes(selectedAnswer))
    return null;

  const question = dbState.questions.get(questionId);
  const isCorrect = question
    ? question.correctAnswer === selectedAnswer
    : false;

  session.answers[questionId] = {
    questionId,
    selectedAnswer,
    isCorrect,
    timeSpentSeconds,
    markedForReview,
  };

  return session;
}

export async function submitQuizSession(
  sessionId: string,
): Promise<QuizSession | null> {
  await ensureInit();
  const session = dbState.quizSessions.get(sessionId);
  if (!session) return null;
  if (session.isCompleted) return session;

  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  for (const ans of Object.values(session.answers)) {
    if (ans.selectedAnswer === null) {
      unanswered++;
    } else if (ans.isCorrect) {
      correct++;
    } else {
      wrong++;
    }
  }

  // Calculate unrecorded answers
  const answeredCount = correct + wrong;
  unanswered = Math.max(0, session.totalQuestions - answeredCount);

  const score = correct;
  session.score = score;
  session.correctCount = correct;
  session.wrongCount = wrong;
  session.unansweredCount = unanswered;
  session.timeTakenSeconds = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(session.startedAt)) / 1000),
  );
  session.isCompleted = true;
  session.completedAt = new Date().toISOString();

  // Update student chapter progress
  if (session.chapterId) {
    await updateStudentChapterProgress(session.studentId, session.chapterId, {
      mcqsAttempted: session.totalQuestions,
      bestScore: (score / Math.max(1, session.totalQuestions)) * 100,
    });
  }

  return session;
}

export async function getQuizSessionById(
  sessionId: string,
): Promise<QuizSession | null> {
  await ensureInit();
  return dbState.quizSessions.get(sessionId) || null;
}

export async function getStudentQuizHistory(
  studentId: string,
): Promise<QuizSession[]> {
  await ensureInit();
  return Array.from(dbState.quizSessions.values())
    .filter((s) => s.studentId === studentId && s.isCompleted)
    .sort(
      (a, b) =>
        new Date(b.completedAt || 0).getTime() -
        new Date(a.completedAt || 0).getTime(),
    );
}

export async function getCompletedQuizSessions(): Promise<QuizSession[]> {
  await ensureInit();
  return Array.from(dbState.quizSessions.values()).filter(
    (session) => session.isCompleted,
  );
}

// ==========================================
// STUDENT PROGRESS & ANALYTICS
// ==========================================
export async function getStudentProgress(studentId: string): Promise<{
  overallProgress: number;
  chaptersCompleted: number;
  notesViewed: number;
  videosWatched: number;
  mcqsAttempted: number;
  averageScore: number;
  currentStreak: number;
  weakChapters: Array<{ chapterId: string; title: string; score: number }>;
}> {
  await ensureInit();

  const sessions = await getStudentQuizHistory(studentId);
  const totalMCQs = sessions.reduce(
    (acc, s) => acc + (s.correctCount + s.wrongCount),
    0,
  );
  const totalCorrect = sessions.reduce((acc, s) => acc + s.correctCount, 0);
  const avgScore =
    totalMCQs > 0 ? Math.round((totalCorrect / totalMCQs) * 100) : 0;

  // Weak chapters identification
  const chapterScores = new Map<string, { total: number; correct: number }>();
  for (const s of sessions) {
    if (s.chapterId) {
      const cur = chapterScores.get(s.chapterId) || { total: 0, correct: 0 };
      cur.total += s.totalQuestions;
      cur.correct += s.correctCount;
      chapterScores.set(s.chapterId, cur);
    }
  }

  const weakChapters: Array<{
    chapterId: string;
    title: string;
    score: number;
  }> = [];
  for (const [chId, data] of chapterScores.entries()) {
    const accuracy = Math.round((data.correct / Math.max(1, data.total)) * 100);
    if (accuracy < 70) {
      const ch = dbState.chapters.get(chId);
      if (ch) {
        weakChapters.push({
          chapterId: chId,
          title: ch.title,
          score: accuracy,
        });
      }
    }
  }

  return {
    overallProgress: Math.round(
      (Array.from(dbState.progress.values()).filter(
        (p) => p.studentId === studentId && p.isCompleted,
      ).length /
        (dbState.students.get(studentId)?.stream === "Biology" ? 22 : 16)) *
        100,
    ),
    chaptersCompleted: Array.from(dbState.progress.values()).filter(
      (p) => p.studentId === studentId && p.isCompleted,
    ).length,
    notesViewed: Array.from(dbState.noteVisits.values()).filter(
      (visit) => visit.studentId === studentId,
    ).length,
    videosWatched: Array.from(dbState.videoVisits.values()).filter(
      (visit) => visit.studentId === studentId && visit.percent >= 90,
    ).length,
    mcqsAttempted: totalMCQs,
    averageScore: avgScore,
    currentStreak: calculateStreak(sessions),
    weakChapters,
  };
}

export async function getLearningActivity(studentId: string) {
  await ensureInit();
  return {
    notes: Array.from(dbState.noteVisits.values()).filter(
      (visit) => visit.studentId === studentId,
    ),
    videos: Array.from(dbState.videoVisits.values()).filter(
      (visit) => visit.studentId === studentId,
    ),
  };
}
export async function recordNoteVisit(
  studentId: string,
  noteId: string,
  page: number,
) {
  await ensureInit();
  dbState.noteVisits.set(`${studentId}_${noteId}`, { studentId, noteId, page });
}
export async function recordVideoVisit(
  studentId: string,
  videoId: string,
  seconds: number,
  percent: number,
) {
  await ensureInit();
  dbState.videoVisits.set(`${studentId}_${videoId}`, {
    studentId,
    videoId,
    seconds,
    percent,
  });
}

function calculateStreak(sessions: QuizSession[]) {
  const day = (date: Date) =>
    date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const days = new Set(
    sessions.map((s) => day(new Date(s.completedAt || s.startedAt))),
  );
  const cursor = new Date();
  let streak = 0;
  if (!days.has(day(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(day(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function updateStudentChapterProgress(
  studentId: string,
  chapterId: string,
  data: Partial<StudentProgress>,
): Promise<void> {
  await ensureInit();
  const key = `${studentId}_${chapterId}`;
  let record = dbState.progress.get(key);
  if (!record) {
    record = {
      id: `prog-${Date.now()}`,
      studentId,
      chapterId,
      notesViewed: 0,
      noteLastPage: 1,
      videoWatchPercentage: 0,
      mcqsAttempted: 0,
      bestScore: 0,
      averageScore: 0,
      lastAccessedAt: new Date().toISOString(),
      isCompleted: false,
    };
  }

  Object.assign(record, data);
  record.lastAccessedAt = new Date().toISOString();
  dbState.progress.set(key, record);
}

// ==========================================
// ANNOUNCEMENTS & BOOKMARKS
// ==========================================
export async function getActiveAnnouncements(
  stream?: StreamType,
): Promise<Announcement[]> {
  await ensureInit();
  return Array.from(dbState.announcements.values()).filter(
    (a) =>
      a.isActive &&
      (a.targetStream === "All" || !stream || a.targetStream === stream),
  );
}

export async function createAnnouncement(
  data: Omit<Announcement, "id">,
): Promise<Announcement> {
  await ensureInit();
  const id = `ann-${Date.now()}`;
  const ann: Announcement = { ...data, id };
  dbState.announcements.set(id, ann);
  logAudit("admin", "CREATE_ANNOUNCEMENT", "announcement", id, {
    title: ann.title,
  });
  return ann;
}

export async function getStudentBookmarks(
  studentId: string,
): Promise<Bookmark[]> {
  await ensureInit();
  return Array.from(dbState.bookmarks.values()).filter(
    (b) => b.studentId === studentId,
  );
}

export async function toggleBookmark(
  data: Omit<Bookmark, "id" | "createdAt">,
): Promise<{ bookmarked: boolean }> {
  await ensureInit();
  const key = `${data.studentId}_${data.contentType}_${data.contentId}`;
  if (dbState.bookmarks.has(key)) {
    dbState.bookmarks.delete(key);
    return { bookmarked: false };
  }
  const bm: Bookmark = {
    id: `bm-${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString(),
  };
  dbState.bookmarks.set(key, bm);
  return { bookmarked: true };
}

// ==========================================
// AI RAG GROUNDED RETRIEVAL ENGINE
// ==========================================
export async function retrieveGroundedKnowledge(
  query: string,
  stream?: StreamType,
  threshold: number = 0.2,
): Promise<Array<{ chunk: AIKnowledgeChunk; score: number }>> {
  await ensureInit();

  const queryTerms = query
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const results: Array<{ chunk: AIKnowledgeChunk; score: number }> = [];

  for (const chunk of dbState.knowledgeChunks.values()) {
    if (stream && chunk.stream !== stream) continue;

    const fullText =
      `${chunk.subjectName} ${chunk.chapterTitle} ${chunk.topicTitle || ""} ${chunk.chunkText} ${chunk.chunkTextTamil || ""}`.toLowerCase();

    let matchedTerms = 0;
    for (const term of queryTerms) {
      if (fullText.includes(term)) {
        matchedTerms++;
      }
    }

    const score = queryTerms.length > 0 ? matchedTerms / queryTerms.length : 0;
    if (score >= threshold) {
      results.push({ chunk, score });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 3);
}

// ==========================================
// AUDIT LOGS
// ==========================================
export function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: unknown,
) {
  dbState.auditLogs.unshift({
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    action,
    entityType,
    entityId,
    details,
    timestamp: new Date().toISOString(),
  });
  if (dbState.auditLogs.length > 500) {
    dbState.auditLogs.pop();
  }
}

export function getAuditLogs() {
  return dbState.auditLogs.slice(0, 100);
}
