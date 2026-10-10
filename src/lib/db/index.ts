import * as memory from "./memory";
import * as persistent from "./supabase";
import { backendMode, BackendUnavailableError } from "@/lib/supabase/server";
export type { AdminUserData } from "./user-data";
import { normalizePhone } from "./user-data";
import { requiresFirstPhoneOtp } from "@/lib/auth/phone";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

function driver() {
  const mode = backendMode();
  if (mode === "unconfigured") throw new BackendUnavailableError();
  return mode === "supabase" ? persistent : memory;
}

export async function verifyStudentPhone(
  userId: string,
  phone: string,
  authId: string,
) {
  if (backendMode() === "supabase")
    return persistent.verifyStudentPhone(userId, phone, authId);
  const student = await driver().getStudentByUserId(userId);
  if (
    !student ||
    !student.activeStatus ||
    !/^[6-9]\d{9}$/.test(phone) ||
    !authId ||
    normalizePhone(student.studentPhone) !== phone ||
    !requiresFirstPhoneOtp(student)
  )
    return null;
  student.phoneVerifiedAt = new Date().toISOString();
  student.phoneVerifiedNumber = phone;
  delete student.initialPasswordSetAt;
  student.mustChangePassword = true;
  const user = await driver().getUserById(userId);
  if (user) {
    user.mustChangePassword = true;
    user.passwordHash = await bcrypt.hash(
      randomBytes(32).toString("base64url"),
      12,
    );
  }
  await logAudit(userId, "VERIFY_FIRST_LOGIN_PHONE", "student", student.id);
  return student;
}

export async function initDatabase(
  ...args: Parameters<typeof memory.initDatabase>
): Promise<Awaited<ReturnType<typeof memory.initDatabase>>> {
  return driver().initDatabase(...args);
}
export async function getUserByLoginId(
  ...args: Parameters<typeof memory.getUserByLoginId>
): Promise<Awaited<ReturnType<typeof memory.getUserByLoginId>>> {
  return driver().getUserByLoginId(...args);
}
export async function getUserById(
  ...args: Parameters<typeof memory.getUserById>
): Promise<Awaited<ReturnType<typeof memory.getUserById>>> {
  return driver().getUserById(...args);
}
export async function getStudentByUserId(
  ...args: Parameters<typeof memory.getStudentByUserId>
): Promise<Awaited<ReturnType<typeof memory.getStudentByUserId>>> {
  return driver().getStudentByUserId(...args);
}
export async function updateUserPassword(
  ...args: Parameters<typeof memory.updateUserPassword>
): Promise<Awaited<ReturnType<typeof memory.updateUserPassword>>> {
  return driver().updateUserPassword(...args);
}
export async function getAllStudents(
  ...args: Parameters<typeof memory.getAllStudents>
): Promise<Awaited<ReturnType<typeof memory.getAllStudents>>> {
  return driver().getAllStudents(...args);
}
export async function getAllUserData(
  ...args: Parameters<typeof memory.getAllUserData>
): Promise<Awaited<ReturnType<typeof memory.getAllUserData>>> {
  return driver().getAllUserData(...args);
}
export async function getStudentById(
  ...args: Parameters<typeof memory.getStudentById>
): Promise<Awaited<ReturnType<typeof memory.getStudentById>>> {
  return driver().getStudentById(...args);
}
export async function createStudentWithUser(
  ...args: Parameters<typeof memory.createStudentWithUser>
): Promise<Awaited<ReturnType<typeof memory.createStudentWithUser>>> {
  return driver().createStudentWithUser(...args);
}
export async function registerStudent(
  ...args: Parameters<typeof memory.registerStudent>
): Promise<Awaited<ReturnType<typeof memory.registerStudent>>> {
  return driver().registerStudent(...args);
}
export async function toggleStudentActive(
  ...args: Parameters<typeof memory.toggleStudentActive>
): Promise<Awaited<ReturnType<typeof memory.toggleStudentActive>>> {
  return driver().toggleStudentActive(...args);
}
export async function resetStudentPassword(
  ...args: Parameters<typeof memory.resetStudentPassword>
): Promise<Awaited<ReturnType<typeof memory.resetStudentPassword>>> {
  return driver().resetStudentPassword(...args);
}
export async function approveStudent(id: string, actorId: string) {
  return driver().approveStudent(id, actorId);
}
export async function getSubjects(
  ...args: Parameters<typeof memory.getSubjects>
): Promise<Awaited<ReturnType<typeof memory.getSubjects>>> {
  return driver().getSubjects(...args);
}
export async function getSubjectById(
  ...args: Parameters<typeof memory.getSubjectById>
): Promise<Awaited<ReturnType<typeof memory.getSubjectById>>> {
  return driver().getSubjectById(...args);
}
export async function getAllChapters(): Promise<Awaited<ReturnType<typeof memory.getAllChapters>>> {
  return driver().getAllChapters();
}

export async function getChaptersBySubject(
  ...args: Parameters<typeof memory.getChaptersBySubject>
): Promise<Awaited<ReturnType<typeof memory.getChaptersBySubject>>> {
  return driver().getChaptersBySubject(...args);
}
export async function getChapterById(
  ...args: Parameters<typeof memory.getChapterById>
): Promise<Awaited<ReturnType<typeof memory.getChapterById>>> {
  return driver().getChapterById(...args);
}
export async function updateChapter(
  ...args: Parameters<typeof memory.updateChapter>
): Promise<Awaited<ReturnType<typeof memory.updateChapter>>> {
  return driver().updateChapter(...args);
}
export async function getNotesByChapter(
  ...args: Parameters<typeof memory.getNotesByChapter>
): Promise<Awaited<ReturnType<typeof memory.getNotesByChapter>>> {
  return driver().getNotesByChapter(...args);
}
export async function getAllNotes(
  ...args: Parameters<typeof memory.getAllNotes>
): Promise<Awaited<ReturnType<typeof memory.getAllNotes>>> {
  return driver().getAllNotes(...args);
}
export async function getNoteById(
  ...args: Parameters<typeof memory.getNoteById>
): Promise<Awaited<ReturnType<typeof memory.getNoteById>>> {
  return driver().getNoteById(...args);
}
export async function createNote(
  ...args: Parameters<typeof memory.createNote>
): Promise<Awaited<ReturnType<typeof memory.createNote>>> {
  return driver().createNote(...args);
}
export async function getVideosByChapter(
  ...args: Parameters<typeof memory.getVideosByChapter>
): Promise<Awaited<ReturnType<typeof memory.getVideosByChapter>>> {
  return driver().getVideosByChapter(...args);
}
export async function getAllVideos(
  ...args: Parameters<typeof memory.getAllVideos>
): Promise<Awaited<ReturnType<typeof memory.getAllVideos>>> {
  return driver().getAllVideos(...args);
}
export async function getVideoById(
  ...args: Parameters<typeof memory.getVideoById>
): Promise<Awaited<ReturnType<typeof memory.getVideoById>>> {
  return driver().getVideoById(...args);
}
export async function createVideo(
  ...args: Parameters<typeof memory.createVideo>
): Promise<Awaited<ReturnType<typeof memory.createVideo>>> {
  return driver().createVideo(...args);
}
export async function getQuestions(
  ...args: Parameters<typeof memory.getQuestions>
): Promise<Awaited<ReturnType<typeof memory.getQuestions>>> {
  return driver().getQuestions(...args);
}
export async function getQuestionById(
  ...args: Parameters<typeof memory.getQuestionById>
): Promise<Awaited<ReturnType<typeof memory.getQuestionById>>> {
  return driver().getQuestionById(...args);
}
export async function createQuestion(
  ...args: Parameters<typeof memory.createQuestion>
): Promise<Awaited<ReturnType<typeof memory.createQuestion>>> {
  return driver().createQuestion(...args);
}
export async function updateQuestionStatus(
  ...args: Parameters<typeof memory.updateQuestionStatus>
): Promise<Awaited<ReturnType<typeof memory.updateQuestionStatus>>> {
  return driver().updateQuestionStatus(...args);
}
export async function getAllTests(
  ...args: Parameters<typeof memory.getAllTests>
): Promise<Awaited<ReturnType<typeof memory.getAllTests>>> {
  return driver().getAllTests(...args);
}
export async function getTestById(
  ...args: Parameters<typeof memory.getTestById>
): Promise<Awaited<ReturnType<typeof memory.getTestById>>> {
  return driver().getTestById(...args);
}
export async function startQuizSession(
  ...args: Parameters<typeof memory.startQuizSession>
): Promise<Awaited<ReturnType<typeof memory.startQuizSession>>> {
  return driver().startQuizSession(...args);
}
export async function saveQuizAnswer(
  ...args: Parameters<typeof memory.saveQuizAnswer>
): Promise<Awaited<ReturnType<typeof memory.saveQuizAnswer>>> {
  return driver().saveQuizAnswer(...args);
}
export async function submitQuizSession(
  ...args: Parameters<typeof memory.submitQuizSession>
): Promise<Awaited<ReturnType<typeof memory.submitQuizSession>>> {
  return driver().submitQuizSession(...args);
}
export async function getQuizSessionById(
  ...args: Parameters<typeof memory.getQuizSessionById>
): Promise<Awaited<ReturnType<typeof memory.getQuizSessionById>>> {
  return driver().getQuizSessionById(...args);
}
export async function getStudentQuizHistory(
  ...args: Parameters<typeof memory.getStudentQuizHistory>
): Promise<Awaited<ReturnType<typeof memory.getStudentQuizHistory>>> {
  return driver().getStudentQuizHistory(...args);
}
export async function getCompletedQuizSessions(
  ...args: Parameters<typeof memory.getCompletedQuizSessions>
): Promise<Awaited<ReturnType<typeof memory.getCompletedQuizSessions>>> {
  return driver().getCompletedQuizSessions(...args);
}
export async function getStudentProgress(
  ...args: Parameters<typeof memory.getStudentProgress>
): Promise<Awaited<ReturnType<typeof memory.getStudentProgress>>> {
  return driver().getStudentProgress(...args);
}
export async function getLearningActivity(
  ...args: Parameters<typeof memory.getLearningActivity>
): Promise<Awaited<ReturnType<typeof memory.getLearningActivity>>> {
  return driver().getLearningActivity(...args);
}
export async function recordNoteVisit(
  ...args: Parameters<typeof memory.recordNoteVisit>
): Promise<Awaited<ReturnType<typeof memory.recordNoteVisit>>> {
  return driver().recordNoteVisit(...args);
}
export async function recordVideoVisit(
  ...args: Parameters<typeof memory.recordVideoVisit>
): Promise<Awaited<ReturnType<typeof memory.recordVideoVisit>>> {
  return driver().recordVideoVisit(...args);
}
export async function updateStudentChapterProgress(
  ...args: Parameters<typeof memory.updateStudentChapterProgress>
): Promise<Awaited<ReturnType<typeof memory.updateStudentChapterProgress>>> {
  return driver().updateStudentChapterProgress(...args);
}
export async function getActiveAnnouncements(
  ...args: Parameters<typeof memory.getActiveAnnouncements>
): Promise<Awaited<ReturnType<typeof memory.getActiveAnnouncements>>> {
  return driver().getActiveAnnouncements(...args);
}
export async function createAnnouncement(
  ...args: Parameters<typeof memory.createAnnouncement>
): Promise<Awaited<ReturnType<typeof memory.createAnnouncement>>> {
  return driver().createAnnouncement(...args);
}
export async function getStudentBookmarks(
  ...args: Parameters<typeof memory.getStudentBookmarks>
): Promise<Awaited<ReturnType<typeof memory.getStudentBookmarks>>> {
  return driver().getStudentBookmarks(...args);
}
export async function toggleBookmark(
  ...args: Parameters<typeof memory.toggleBookmark>
): Promise<Awaited<ReturnType<typeof memory.toggleBookmark>>> {
  return driver().toggleBookmark(...args);
}
export async function retrieveGroundedKnowledge(
  ...args: Parameters<typeof memory.retrieveGroundedKnowledge>
): Promise<Awaited<ReturnType<typeof memory.retrieveGroundedKnowledge>>> {
  return driver().retrieveGroundedKnowledge(...args);
}
export async function logAudit(
  ...args: Parameters<typeof memory.logAudit>
): Promise<Awaited<ReturnType<typeof memory.logAudit>>> {
  return driver().logAudit(...args);
}
export async function getAuditLogs(
  ...args: Parameters<typeof memory.getAuditLogs>
): Promise<Awaited<ReturnType<typeof memory.getAuditLogs>>> {
  return driver().getAuditLogs(...args);
}

export async function getQuizQuestions(id: string) {
  if (backendMode() === "supabase") return persistent.getQuizQuestions(id);
  const session = await getQuizSessionById(id);
  return (
    await Promise.all((session?.questionIds || []).map(getQuestionById))
  ).filter((q) => q !== null);
}

export async function saveQuizAnswers(
  id: string,
  answers: Record<string, "A" | "B" | "C" | "D" | null>,
) {
  if (backendMode() === "supabase")
    return persistent.saveQuizAnswers(id, answers);
  const session = await getQuizSessionById(id);
  if (
    !session ||
    session.isCompleted ||
    (session.expiresAt && Date.now() > Date.parse(session.expiresAt)) ||
    Object.keys(answers).some((qid) => !session.questionIds.includes(qid))
  )
    return null;
  for (const [qid, answer] of Object.entries(answers)) {
    if (!(await saveQuizAnswer(id, qid, answer))) return null;
  }
  return session;
}
