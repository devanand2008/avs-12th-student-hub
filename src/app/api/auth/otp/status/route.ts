import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { studentActivationMode } from "@/lib/auth/activation";
import {
  OTP_COOKIE,
  decodeOtpChallenge,
  maskPhone,
} from "@/lib/auth/otp-challenge";
export async function GET() {
  if (studentActivationMode() === "admin")
    return NextResponse.json(
      {
        error:
          "Student activation uses administrator approval and password login.",
        code: "ADMIN_APPROVAL_REQUIRED",
      },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  const challenge = decodeOtpChallenge(
    (await cookies()).get(OTP_COOKIE)?.value,
  );
  if (!challenge)
    return NextResponse.json(
      { error: "Request a new OTP to continue." },
      { status: 401 },
    );
  return NextResponse.json(
    {
      maskedPhone: maskPhone(challenge.phone),
      expiresAt: challenge.expiresAt,
      resendAt: challenge.sentAt + 60000,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
