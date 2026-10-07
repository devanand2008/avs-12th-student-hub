import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/db/user-data";
import { checkRateLimit } from "@/lib/rate-limit";
import { OtpError, sendFirstLoginOtp } from "@/lib/auth/otp";
import {
  OTP_COOKIE,
  OTP_SECONDS,
  encodeOtpChallenge,
  decodeOtpChallenge,
  maskPhone,
} from "@/lib/auth/otp-challenge";
import { BackendUnavailableError } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const body = await request.json();
    const existing = decodeOtpChallenge(cookieStore.get(OTP_COOKIE)?.value);
    const raw = body.phone ?? existing?.phone;
    if (typeof raw !== "string" || raw.length > 30)
      throw new OtpError("Enter a valid Indian mobile number.");
    const phone = normalizePhone(raw);
    if (!/^[6-9]\d{9}$/.test(phone))
      throw new OtpError("Enter a valid 10-digit Indian mobile number.");
    const ip = (request.headers.get("x-forwarded-for") || "local")
      .split(",")[0]
      .trim();
    for (const [key, max, seconds] of [
      [`otp-send-ip:${ip}`, 10, 3600],
      [`otp-send-phone:${phone}`, 4, 3600],
      [`otp-send-cooldown:${phone}`, 1, 60],
    ] as const)
      if (!(await checkRateLimit(key, max, seconds)).success)
        throw new OtpError(
          "Too many OTP requests. Wait before trying again.",
          429,
        );
    const input = await sendFirstLoginOtp(phone);
    const { token, challenge } = encodeOtpChallenge(input);
    cookieStore.set(OTP_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: OTP_SECONDS,
    });
    return NextResponse.json({
      success: true,
      maskedPhone: maskPhone(phone),
      expiresAt: challenge.expiresAt,
      resendAt: challenge.sentAt + 60000,
      redirectTo: "/login/otp",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not send OTP.",
        ...(error instanceof OtpError
          ? { code: error.code, redirectTo: error.redirectTo }
          : {}),
      },
      {
        status:
          error instanceof OtpError
            ? error.status
            : error instanceof BackendUnavailableError
              ? 503
              : 400,
      },
    );
  }
}
