import {
  getStudentByUserId,
  getUserById,
  getUserByLoginId,
  logAudit,
  updateUserPassword,
} from "@/lib/db";
import { Student, User } from "@/types";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import {
  decodeSession,
  encodeSession,
  passwordVersion,
  type SessionPayload,
} from "./session";
export { decodeSession, encodeSession } from "./session";
export type { SessionPayload } from "./session";

import { isSessionRevoked, revokeSession } from "./security-store";
import { isPhoneVerified } from "./phone";
import { isStudentActivated } from "./activation";

const COOKIE_NAME = "avs_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
// Encode and decode session payload securely
export async function createSession(
  user: User,
  student?: Student,
  initialPasswordSetupUntil?: number,
): Promise<SessionPayload> {
  if (
    user.role === "student" &&
    (!student?.activeStatus || !isStudentActivated(student))
  )
    throw new Error("Your student account needs activation before signing in.");
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload: SessionPayload = {
    userId: user.id,
    role: user.role,
    email: user.email,
    studentId: student?.studentId,
    studentName: student?.studentName,
    stream: student?.stream,
    mustChangePassword: student?.mustChangePassword || user.mustChangePassword,
    passwordVersion: passwordVersion(user.passwordHash),
    sessionId: randomUUID(),
    expiresAt,
    initialPasswordSetupUntil,
  };

  const token = encodeSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });

  await logAudit(user.id, "LOGIN", "session", undefined, {
    role: user.role,
    studentId: student?.studentId,
  });
  return payload;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = decodeSession(token);
  if (
    !session ||
    !session.sessionId ||
    (await isSessionRevoked(session.sessionId))
  )
    return null;
  const user = await getUserById(session.userId);
  if (
    !user ||
    user.role !== session.role ||
    session.passwordVersion !== passwordVersion(user.passwordHash)
  )
    return null;
  const student =
    user.role === "student" ? await getStudentByUserId(user.id) : null;
  if (
    user.role === "student" &&
    (!student ||
      !student.activeStatus ||
      !isStudentActivated(student) ||
      student.studentId !== session.studentId)
  )
    return null;
  return {
    ...session,
    mustChangePassword:
      student?.mustChangePassword || user.mustChangePassword || false,
  };
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  if (session) {
    if (session.sessionId)
      await revokeSession(session.sessionId, session.expiresAt);
    await logAudit(session.userId, "LOGOUT", "session");
  }
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function authenticateUser(
  loginId: string,
  plainPass: string,
): Promise<{
  success: boolean;
  user?: User;
  student?: Student;
  error?: string;
}> {
  const match = await getUserByLoginId(loginId);
  if (!match) {
    return { success: false, error: "Email or password is incorrect." };
  }

  const { user, student } = match;
  if (user.role === "student" && !student)
    return {
      success: false,
      error:
        "Please contact your administrator to restore your student profile.",
    };

  if (student && !student.activeStatus) {
    return {
      success: false,
      error:
        "This account is inactive. Please contact your administrator.",
    };
  }

  const isValid = await bcrypt.compare(plainPass, user.passwordHash);
  if (!isValid) {
    return { success: false, error: "Email or password is incorrect." };
  }

  return { success: true, user, student };
}

export async function changeUserPassword(
  userId: string,
  currentPass: string,
  newPass: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getUserById(userId);
  if (!user) {
    return { success: false, error: "User account not found." };
  }

  const previousHash = user.passwordHash;
  const matches = await bcrypt.compare(currentPass, previousHash);
  if (!matches) {
    return { success: false, error: "Current password does not match." };
  }

  if (newPass.length < 10 || Buffer.byteLength(newPass, "utf8") > 72) {
    return {
      success: false,
      error:
        "Use a password of at least 10 characters and no more than 72 UTF-8 bytes.",
    };
  }

  const newHash = await bcrypt.hash(newPass, 10);
  if (!(await updateUserPassword(userId, newHash, previousHash)))
    return {
      success: false,
      error: "Your password changed during this request. Please sign in again.",
    };
  await logAudit(userId, "CHANGE_PASSWORD", "user", userId);

  return { success: true };
}

export async function setInitialStudentPassword(
  userId: string,
  newPass: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getUserById(userId);
  const student = await getStudentByUserId(userId);
  if (
    !user ||
    user.role !== "student" ||
    !user.mustChangePassword ||
    !student?.activeStatus ||
    !student.mustChangePassword ||
    !isPhoneVerified(student)
  )
    return {
      success: false,
      error: "Initial password setup is not available for this account.",
    };
  if (newPass.length < 10 || Buffer.byteLength(newPass, "utf8") > 72)
    return {
      success: false,
      error: "Use at least 10 characters and no more than 72 UTF-8 bytes.",
    };
  if (
    !(await updateUserPassword(
      userId,
      await bcrypt.hash(newPass, 12),
      user.passwordHash,
    ))
  )
    return {
      success: false,
      error: "Your account changed. Please sign in again.",
    };
  await logAudit(userId, "SET_INITIAL_PASSWORD_AFTER_OTP", "user", userId);
  return { success: true };
}
