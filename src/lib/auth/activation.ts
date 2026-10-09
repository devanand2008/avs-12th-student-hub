import type { Student } from "@/types";
import { isPhoneVerified, requiresFirstPhoneOtp } from "./phone";

export type StudentActivationMode = "admin" | "sms" | "direct";

export function studentActivationMode(): StudentActivationMode {
  if (process.env.STUDENT_ACTIVATION_MODE === "sms") return "sms";
  if (process.env.STUDENT_ACTIVATION_MODE === "admin") return "admin";
  return "direct";
}

export function isAdminApproved(student: Student): boolean {
  return Boolean(student.adminApprovedAt && student.adminApprovedBy);
}

export function isStudentActivated(student: Student): boolean {
  if (studentActivationMode() === "direct") return true;
  return (
    isPhoneVerified(student) ||
    (studentActivationMode() === "admin" && isAdminApproved(student))
  );
}

export function requiresStudentActivation(student: Student): boolean {
  const mode = studentActivationMode();
  if (mode === "direct") return false;
  return mode === "admin"
    ? !isStudentActivated(student)
    : requiresFirstPhoneOtp(student);
}
