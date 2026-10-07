import type { UserRole } from "@/types";
import { createHmac, timingSafeEqual } from "node:crypto";

export interface SessionPayload {
  userId: string;
  role: UserRole;
  email: string;
  studentId?: string;
  studentName?: string;
  stream?: string;
  mustChangePassword?: boolean;
  expiresAt: number;
  passwordVersion?: string;
  sessionId?: string;
  initialPasswordSetupUntil?: number;
}

export function sessionSecret() {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === "production")
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return "avs-local-development-only-session-key-change-before-deploy";
}

export function encodeSession(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", sessionSecret())
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

export function decodeSession(token: string): SessionPayload | null {
  try {
    const [data, signature, extra] = token.split(".");
    if (!data || !signature || extra || token.length > 8192) return null;
    const expected = createHmac("sha256", sessionSecret())
      .update(data)
      .digest();
    const received = Buffer.from(signature, "base64url");
    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    )
      return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (
      typeof payload.userId !== "string" ||
      !["student", "admin"].includes(payload.role) ||
      !Number.isFinite(payload.expiresAt) ||
      Date.now() >= payload.expiresAt
    )
      return null;
    return payload;
  } catch {
    return null;
  }
}

export function passwordVersion(hash: string): string {
  return createHmac("sha256", sessionSecret()).update(hash).digest("base64url");
}
