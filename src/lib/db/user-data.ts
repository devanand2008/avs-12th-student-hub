import type { Student, User } from "@/types";

// Explicit public fields: account secrets never belong in admin reports.
export type AdminUserData = Pick<
  User,
  "id" | "role" | "email" | "mustChangePassword" | "createdAt" | "updatedAt"
> & {
  student?: Student;
  learning?: {
    quizAttempts: number;
    mcqsAttempted: number;
    averageScore: number;
    notesViewed: number;
    videosWatched: number;
    bookmarksCount: number;
    lastActiveAt?: string;
  };
};

export type StudentRegistration = {
  studentName: string;
  phone: string;
  schoolName: string;
  registerNumber?: string;
  standard?: string;
  stream: Student["stream"];
  medium?: Student["medium"];
  studentId?: string;
  email?: string;
  password: string;
};

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits;
}

export function validateRegistration(data: StudentRegistration) {
  const phone = normalizePhone(data.phone);
  const studentId = data.studentId?.trim().toUpperCase() || undefined;
  const email = data.email?.trim().toLowerCase() || undefined;
  if (!/^[6-9]\d{9}$/.test(phone))
    throw new Error("Please enter a valid Indian mobile number.");
  if (studentId && !/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(studentId))
    throw new Error(
      "Use 3–40 letters, numbers, hyphens or underscores for your account ID.",
    );
  if (
    email &&
    (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  )
    throw new Error("Please enter a valid email address.");
  if (!["Computer Science", "Biology"].includes(data.stream))
    throw new Error("Please choose a supported stream.");
  if (data.medium && !["English", "Tamil"].includes(data.medium))
    throw new Error("Please choose English or Tamil medium.");
  if (
    data.studentName.trim().length < 2 ||
    data.studentName.trim().length > 100 ||
    data.schoolName.trim().length < 2 ||
    data.schoolName.trim().length > 200
  )
    throw new Error("Please enter your name and school.");
  if (data.standard && data.standard !== "12th Standard")
    throw new Error("Only 12th Standard registration is available.");
  if (data.password.length < 6 || Buffer.byteLength(data.password, "utf8") > 72)
    throw new Error(
      "Use at least 6 characters and no more than 72 UTF-8 bytes for your password.",
    );
  const registerNumber = data.registerNumber?.trim() || undefined;
  return { phone, studentId, email, registerNumber };
}
