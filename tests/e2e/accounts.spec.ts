import { expect, test } from "@playwright/test";
import { completeFirstOtp } from "../helpers/otp-browser";

test("public registration persists the profile and authenticates by ID, email and phone", async ({
  page,
}, info) => {
  async function request(method: "get" | "post", url: string, data?: unknown) {
    const cookies = await page.context().cookies();
    return page.request[method](url, {
      data,
      headers: {
        Cookie: cookies
          .map((cookie) => cookie.name + "=" + cookie.value)
          .join("; "),
        "x-forwarded-for": "accounts-" + info.project.name,
      },
    });
  }
  const studentId = `SELF-E2E-${info.project.name.toUpperCase()}`;
  const phone = info.project.name === "mobile" ? "9880000002" : "9880000001";
  const email = `${info.project.name}.registered@example.test`;
  const password = "Registered-personal-password";
  const registered = await request("post", "/api/auth/register", {
    studentName: "Registered " + info.project.name + " Student",
    phone: "+91 " + phone,
    schoolName: "Registration Test School",
    standard: "12th Standard",
    stream: "Biology",
    medium: "Tamil",
    email,
    studentId,
    password,
    role: "admin",
  });
  expect(registered.status()).toBe(200);
  const response = await registered.json();
  expect(response.user.role).toBe("student");
  expect(response.user.medium).toBe("Tamil");
  expect(response.user.phone).toBe(phone);
  expect(JSON.stringify(response)).not.toContain("passwordHash");
  expect((await request("get", "/api/auth/me")).status()).toBe(401);
  const blocked = await request("post", "/api/auth/login", {
    loginId: studentId,
    password,
  });
  expect(blocked.status()).toBe(403);
  expect((await blocked.json()).code).toBe("PHONE_VERIFICATION_REQUIRED");
  expect((await completeFirstOtp(page, phone)).redirectTo).toBe(
    "/change-password",
  );
  const changed = await request("post", "/api/auth/change-password", {
    newPassword: password,
  });
  expect(changed.status()).toBe(200);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/dashboard/);
  const me = await request("get", "/api/auth/me");
  expect(me.status()).toBe(200);
  expect((await me.json()).user.studentId).toBe(studentId);
  expect((await request("get", "/api/admin/users")).status()).toBe(403);
  await request("post", "/api/auth/logout");
  for (const loginId of [studentId, email, "+91 " + phone]) {
    const login = await request("post", "/api/auth/login", {
      loginId,
      password,
    });
    expect(login.status()).toBe(200);
    expect((await login.json()).user.studentId).toBe(studentId);
    expect((await request("get", "/api/auth/me")).status()).toBe(200);
    await request("post", "/api/auth/logout");
  }
  expect([409, 429]).toContain(
    (await request("post", "/api/auth/otp/send", { phone })).status(),
  );
  const duplicate = await request("post", "/api/auth/register", {
    studentName: "Duplicate Student",
    phone,
    schoolName: "Registration Test School",
    stream: "Biology",
    password,
  });
  expect(duplicate.status()).toBe(400);
  expect((await duplicate.json()).error).toContain("already exists");
});
