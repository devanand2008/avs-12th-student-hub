import type { Student } from "@/types";
import { isPhoneVerified, requiresFirstPhoneOtp } from "./phone";

export type StudentActivationMode = "admin" | "sms";

export function studentActivationMode(): StudentActivationMode {
  return process.env.STUDENT_ACTIVATION_MODE === "admin" ? "admin" : "sms";
}

export function isAdminApproved(student: Student): boolean {
  return Boolean(student.adminApprovedAt && student.adminApprovedBy);
}

export function isStudentActivated(student: Student): boolean {
  return (
    isPhoneVerified(student) ||
    (studentActivationMode() === "admin" && isAdminApproved(student))
  );
}

export function requiresStudentActivation(student: Student): boolean {
  return studentActivationMode() === "admin"
    ? !isStudentActivated(student)
    : requiresFirstPhoneOtp(student);
}
