import type { Student } from "@/types";
import { normalizePhone } from "@/lib/db/user-data";

export function isPhoneVerified(student: Student): boolean {
  const phone = normalizePhone(student.studentPhone);
  return (
    /^[6-9]\d{9}$/.test(phone) &&
    Boolean(student.phoneVerifiedAt) &&
    student.phoneVerifiedNumber === phone
  );
}

export function phoneLoginPath(phone: string): string {
  return "/login/mobile?phone=" + encodeURIComponent(normalizePhone(phone));
}
export function requiresFirstPhoneOtp(student: Student): boolean {
  return (
    !isPhoneVerified(student) ||
    (!student.initialPasswordSetAt && student.mustChangePassword)
  );
}
