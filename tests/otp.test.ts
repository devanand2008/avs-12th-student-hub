import assert from "node:assert/strict";
import test from "node:test";
import {
  encodeOtpChallenge,
  decodeOtpChallenge,
  maskPhone,
} from "../src/lib/auth/otp-challenge";
import { decodeSession } from "../src/lib/auth/session";
import { isPhoneVerified, requiresFirstPhoneOtp } from "../src/lib/auth/phone";
import type { Student } from "../src/types";

test("OTP challenges reject tampering, expiry and reuse as login sessions", (t) => {
  const input = {
    userId: "qa-user",
    phone: "9876543210",
    passwordVersion: "qa-version",
  };
  const encoded = encodeOtpChallenge(input);
  assert.deepEqual(decodeOtpChallenge(encoded.token), encoded.challenge);
  assert.equal(decodeOtpChallenge(encoded.token + ".extra"), null);
  assert.equal(decodeOtpChallenge("X" + encoded.token.slice(1)), null);
  assert.equal(
    decodeOtpChallenge(encoded.token.split(".")[0] + ".bad-signature"),
    null,
  );
  assert.equal(decodeSession(encoded.token), null);
  assert.equal(decodeOtpChallenge("a".repeat(5000)), null);
  t.mock.method(Date, "now", () => 1000);
  const expired = encodeOtpChallenge(input);
  t.mock.restoreAll();
  assert.equal(decodeOtpChallenge(expired.token), null);
  assert.equal(maskPhone(input.phone).includes(input.phone), false);
});

test("first-login verification is bound to the current mobile number", () => {
  const student = {
    studentPhone: "+91 9876543210",
    phoneVerifiedNumber: "9876543210",
    phoneVerifiedAt: new Date().toISOString(),
  } as Student;
  assert.equal(isPhoneVerified(student), true);
  assert.equal(
    isPhoneVerified({ ...student, studentPhone: "9876543211" }),
    false,
  );
  assert.equal(
    isPhoneVerified({ ...student, phoneVerifiedAt: undefined }),
    false,
  );
  assert.equal(isPhoneVerified({ ...student, studentPhone: "" }), false);
  assert.equal(
    requiresFirstPhoneOtp({ ...student, mustChangePassword: true }),
    true,
  );
  assert.equal(
    requiresFirstPhoneOtp({
      ...student,
      mustChangePassword: true,
      initialPasswordSetAt: new Date().toISOString(),
    }),
    false,
  );
});
