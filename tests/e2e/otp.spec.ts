import { expect, test } from "@playwright/test";
import { authRequest, readTestOtp } from "../helpers/otp-browser";

test("unavailable mobile verification offers password sign-in without authenticating", async ({
  page,
}) => {
  const phone = "9890000091";
  const error =
    "Mobile verification is unavailable. Sign in with your password if your account is already verified.";
  await page.route("**/api/auth/otp/send", (route) =>
    route.fulfill({
      status: 503,
      json: { error, code: "PHONE_OTP_UNAVAILABLE" },
    }),
  );
  await page.goto("/login/mobile");
  await page.getByLabel("Mobile number", { exact: true }).fill(phone);
  await page.getByRole("button", { name: "Send OTP", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: error })).toHaveText(error);
  await expect(page).toHaveURL(/\/login\/mobile$/);
  const passwordLink = page.getByRole("link", {
    name: "Sign in with your password",
    exact: true,
  });
  await expect(passwordLink).toHaveAttribute(
    "href",
    "/login?studentId=" + phone,
  );
  await passwordLink.click();
  await expect(page.getByLabel("Gmail / Email Address")).toHaveValue(
    phone,
  );
  expect((await page.request.get("/api/auth/me")).status()).toBe(401);
  await page.goto("/login/otp");
  await expect(
    page.getByRole("link", {
      name: "Sign in with your password",
      exact: true,
    }),
  ).toHaveAttribute("href", "/login");
});

test("already verified mobile accounts return to password sign-in without authenticating", async ({
  page,
}) => {
  const phone = "9890000092";
  await page.route("**/api/auth/otp/send", (route) =>
    route.fulfill({
      status: 409,
      json: {
        error:
          "Your mobile number is already verified. Sign in with your password.",
        code: "PHONE_ALREADY_VERIFIED",
        redirectTo: "https://example.invalid/",
      },
    }),
  );
  await page.goto("/login/mobile?phone=" + phone);
  await expect(page.getByLabel("Mobile number", { exact: true })).toHaveValue(
    phone,
  );
  await page.getByRole("button", { name: "Send OTP", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?studentId=9890000092$/);
  await expect(page.getByLabel("Gmail / Email Address")).toHaveValue(
    phone,
  );
  expect((await page.request.get("/api/auth/me")).status()).toBe(401);
  expect(
    (await page.context().cookies()).some(
      (cookie) => cookie.name === "avs_session",
    ),
  ).toBe(false);
});

test("OTP rejects missing challenges, expired codes, resend floods and excessive guesses", async ({
  page,
}, info) => {
  expect(
    (
      await authRequest(page, "/api/auth/otp/verify", { token: "123456" })
    ).status(),
  ).toBe(400);
  expect(
    (await authRequest(page, "/api/auth/otp/send", { phone: "123" })).status(),
  ).toBe(400);
  for (const [phase, suffix] of [
    ["expiry", "3"],
    ["attempts", "4"],
  ]) {
    const phone =
      "98900000" + (info.project.name === "mobile" ? "3" : "4") + suffix;
    const registered = await authRequest(page, "/api/auth/register", {
      studentName: "OTP Boundary Test Student",
      email: `otp.${phone}@example.test`,
      phone,
      schoolName: "OTP Test School",
      stream: "Computer Science",
      password: "Boundary-personal-password",
    });
    expect(registered.status()).toBe(200);
    const sent = await authRequest(page, "/api/auth/otp/send", { phone });
    expect(sent.status()).toBe(200);
    const payload = await sent.json();
    expect(payload.otp).toBeUndefined();
    expect(payload.token).toBeUndefined();
    expect(
      (await authRequest(page, "/api/auth/otp/send", { phone })).status(),
    ).toBe(429);
    const code = await readTestOtp(page, phone);
    if (phase === "expiry") {
      await page.request.delete(
        "http://127.0.0.1:3101/_qa/otp?phone=" +
          encodeURIComponent("+91" + phone),
        { headers: { apikey: "qa-service-key" } },
      );
      const expired = await authRequest(page, "/api/auth/otp/verify", {
        token: code,
      });
      expect(expired.status()).toBe(400);
      expect((await expired.json()).error).toContain("expired");
    } else {
      for (let i = 0; i < 5; i++)
        expect(
          (
            await authRequest(page, "/api/auth/otp/verify", { token: "000000" })
          ).status(),
        ).toBe(400);
      expect(
        (
          await authRequest(page, "/api/auth/otp/verify", { token: code })
        ).status(),
      ).toBe(429);
    }
    expect((await page.request.get("/api/auth/me")).status()).toBe(401);
  }
});
