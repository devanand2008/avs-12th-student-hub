import { getUserByLoginId, getUserById, verifyStudentPhone } from "@/lib/db";
import { normalizePhone } from "@/lib/db/user-data";
import { requireSupabase } from "@/lib/supabase/server";
import { requiresFirstPhoneOtp } from "./phone";
import { passwordVersion } from "./session";
import type { OtpChallenge } from "./otp-challenge";
import { studentActivationMode } from "./activation";

export class OtpError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code?: string,
    public redirectTo?: string,
  ) {
    super(message);
  }
}
export async function pendingPhoneStudent(phone: string) {
  if (studentActivationMode() === "admin")
    throw new OtpError(
      "Student accounts use administrator approval. Ask your administrator for approval and a temporary password, then sign in.",
      409,
      "ADMIN_APPROVAL_REQUIRED",
      "/login",
    );
  const match = await getUserByLoginId(phone);
  if (
    !match ||
    match.user.role !== "student" ||
    !match.student?.activeStatus ||
    normalizePhone(match.student.studentPhone) !== phone
  )
    throw new OtpError(
      "Use the mobile number registered on your student account. Contact your administrator if it needs updating.",
    );
  if (!requiresFirstPhoneOtp(match.student))
    throw new OtpError(
      "Your mobile number is already verified. Sign in with your password.",
      409,
      "PHONE_ALREADY_VERIFIED",
      "/login?studentId=" + encodeURIComponent(phone),
    );
  return { ...match, student: match.student };
}
export async function sendFirstLoginOtp(phone: string) {
  const match = await pendingPhoneStudent(phone);
  const { error } = await requireSupabase().auth.signInWithOtp({
    phone: "+91" + phone,
    options: {
      shouldCreateUser: true,
      channel: "sms",
      data: { name: match.student.studentName },
    },
  });
  if (error) {
    if (error.status === 429)
      throw new OtpError("Please wait before requesting another OTP.", 429);
    if (["phone_provider_disabled", "otp_disabled"].includes(error.code || ""))
      throw new OtpError(
        "Mobile verification is unavailable. If your account is already verified, sign in with your password. New accounts need your administrator to enable SMS verification.",
        503,
        "PHONE_OTP_UNAVAILABLE",
      );
    throw new OtpError(
      "SMS could not be delivered. Ask your administrator to check the SMS provider configuration.",
      503,
      "SMS_DELIVERY_FAILED",
    );
  }
  return {
    userId: match.user.id,
    phone,
    passwordVersion: passwordVersion(match.user.passwordHash),
  };
}
export async function verifyFirstLoginOtp(
  challenge: OtpChallenge,
  token: string,
) {
  if (challenge.expiresAt <= Date.now())
    throw new OtpError("OTP expired. Request a new code.");
  const match = await pendingPhoneStudent(challenge.phone);
  if (
    match.user.id !== challenge.userId ||
    passwordVersion(match.user.passwordHash) !== challenge.passwordVersion
  )
    throw new OtpError("Your account changed. Request a new OTP.");
  const { data, error } = await requireSupabase().auth.verifyOtp({
    phone: "+91" + challenge.phone,
    token,
    type: "sms",
  });
  if (
    error ||
    !data.user?.phone_confirmed_at ||
    normalizePhone(data.user.phone || "") !== challenge.phone
  )
    throw new OtpError(
      "Incorrect or expired OTP. Check the code or request a new one.",
    );
  const student = await verifyStudentPhone(
    challenge.userId,
    challenge.phone,
    data.user.id,
  );
  const user = await getUserById(challenge.userId);
  if (!student || !user)
    throw new OtpError(
      "Your account changed or this code was already used. Please sign in again.",
      409,
    );
  return { user, student };
}
