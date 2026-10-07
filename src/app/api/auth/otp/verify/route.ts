import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { OTP_COOKIE, decodeOtpChallenge } from "@/lib/auth/otp-challenge";
import { OtpError, verifyFirstLoginOtp } from "@/lib/auth/otp";
import { BackendUnavailableError } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const challenge = decodeOtpChallenge(cookieStore.get(OTP_COOKIE)?.value);
    if (!challenge)
      throw new OtpError("Your OTP session expired. Request a new code.");
    const { token } = await request.json();
    if (typeof token !== "string" || !/^\d{6}$/.test(token))
      throw new OtpError("Enter the 6-digit code from your SMS.");
    const ip = (request.headers.get("x-forwarded-for") || "local")
      .split(",")[0]
      .trim();
    for (const [key, max] of [
      [`otp-verify:${challenge.id}`, 5],
      [`otp-verify-phone:${challenge.phone}`, 12],
      [`otp-verify-ip:${ip}`, 30],
    ] as const)
      if (!(await checkRateLimit(key, max, 600)).success)
        throw new OtpError(
          "Too many verification attempts. Wait and request a new OTP.",
          429,
        );
    const { user, student } = await verifyFirstLoginOtp(challenge, token);
    await createSession(
      user,
      student,
      student.mustChangePassword ? Date.now() + 10 * 60000 : undefined,
    );
    cookieStore.delete(OTP_COOKIE);
    return NextResponse.json({
      success: true,
      redirectTo: student.mustChangePassword
        ? "/change-password"
        : "/dashboard",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not verify OTP.",
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
