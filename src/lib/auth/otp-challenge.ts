import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { sessionSecret } from "./session";

export const OTP_COOKIE = "avs_otp_challenge";
export const OTP_SECONDS = 300;
export type OtpChallenge = {
  userId: string;
  phone: string;
  passwordVersion: string;
  id: string;
  expiresAt: number;
  sentAt: number;
};
export function encodeOtpChallenge(
  input: Omit<OtpChallenge, "id" | "expiresAt" | "sentAt">,
) {
  const sentAt = Date.now();
  const challenge: OtpChallenge = {
    ...input,
    id: randomUUID(),
    sentAt,
    expiresAt: sentAt + OTP_SECONDS * 1000,
  };
  const data = Buffer.from(JSON.stringify(challenge)).toString("base64url");
  const signature = createHmac("sha256", sessionSecret())
    .update("phone-otp:" + data)
    .digest("base64url");
  return { challenge, token: data + "." + signature };
}
export function decodeOtpChallenge(token?: string): OtpChallenge | null {
  try {
    if (!token || token.length > 4096) return null;
    const [data, signature, extra] = token.split(".");
    if (!data || !signature || extra) return null;
    const expected = createHmac("sha256", sessionSecret())
      .update("phone-otp:" + data)
      .digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null;
    const value = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (
      typeof value.userId !== "string" ||
      typeof value.id !== "string" ||
      !/^[6-9]\d{9}$/.test(value.phone) ||
      typeof value.passwordVersion !== "string" ||
      !Number.isFinite(value.expiresAt) ||
      !Number.isFinite(value.sentAt) ||
      value.expiresAt <= Date.now()
    )
      return null;
    return value;
  } catch {
    return null;
  }
}
export function maskPhone(phone: string) {
  return "+91 •••••• " + phone.slice(-4);
}
