import { expect, test, type Page } from "@playwright/test";
import { authRequest } from "../helpers/otp-browser";

test.skip(
  process.env.AVS_TEST_ACTIVATION_MODE !== "admin",
  "Uses the isolated administrator-approval test server.",
);

async function authenticatedGet(page: Page, path: string) {
  return page.request.get(path, {
    headers: {
      Cookie: (await page.context().cookies())
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; "),
    },
  });
}

async function signInAdmin(page: Page) {
  const password = "QA-only-bootstrap-password";
  let response = await authRequest(page, "/api/auth/login", {
    loginId: "qa-admin@example.test",
    password,
  });
  if (response.status() !== 200)
    response = await authRequest(page, "/api/auth/login", {
      loginId: "qa-admin@example.test",
      password: "QA-only-changed-password",
    });
  expect(response.status()).toBe(200);
  if ((await response.json()).user.mustChangePassword) {
    const changed = await authRequest(page, "/api/auth/change-password", {
      currentPassword: password,
      newPassword: "QA-only-changed-password",
    });
    expect(changed.status()).toBe(200);
  }
}

test("registration waits for admin approval, then password setup opens the learning app without SMS", async ({
  page,
}, info) => {
  const studentName = `Approval ${info.project.name} Student`;
  const studentId = `APPROVAL-${info.project.name.toUpperCase()}`;
  const phone = info.project.name === "mobile" ? "9880020002" : "9880020001";
  await page.goto("/register");
  await expect(page.locator('button[type="submit"]')).toBeEnabled();
  await expect(page.locator("#password")).toHaveCount(0);
  await page.locator("#studentName").fill(studentName);
  await page.locator("#email").fill(`${info.project.name}.approval@example.test`);
  await page.locator("#registerNumber").fill(`SCHOOL-${studentId}`);
  await page.locator("#phone").fill(phone);
  await page.locator("#schoolName").fill("Approval Test School");
  await page.locator("#studentId").fill(studentId);
  const registration = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/register") &&
      response.request().method() === "POST",
  );
  await page.locator('button[type="submit"]').click();
  const registered = await (await registration).json();
  expect(registered.requiresAdminApproval).toBe(true);
  expect(registered.requiresPhoneVerification).toBe(false);
  await expect(page).toHaveURL(/login\?approval=pending/);
  await expect(
    page.getByText(
      "Registration received. Your account is waiting for administrator approval.",
    ),
  ).toBeVisible();
  expect((await page.request.get("/api/auth/me")).status()).toBe(401);
  expect([401, 403]).toContain(
    (
      await authRequest(page, "/api/admin/students/actions", {
        action: "approve",
        studentId,
      })
    ).status(),
  );
  const otp = await authRequest(page, "/api/auth/otp/send", { phone });
  expect(otp.status()).toBe(409);
  expect((await otp.json()).code).toBe("ADMIN_APPROVAL_REQUIRED");
  expect(
    (await page.context().cookies()).some(
      (cookie) => cookie.name === "avs_otp_challenge",
    ),
  ).toBe(false);
  await page.goto("/login/mobile");
  await expect(
    page.getByRole("heading", { name: "Administrator approval required" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send OTP", exact: true }),
  ).toHaveCount(0);
  await signInAdmin(page);
  await page.goto("/admin/students");
  await page
    .getByRole("button", { name: `Approve ${studentName}`, exact: true })
    .click();
  const approvedResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin/students/actions") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  const approved = await (await approvedResponse).json();
  expect(approved.success).toBe(true);
  await expect(
    page.getByText(approved.temporaryPassword, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: `Approve ${studentName}`, exact: true }),
  ).toHaveCount(0);
  await authRequest(page, "/api/auth/logout");
  await page.goto(`/login?studentId=${studentId}`);
  await page
    .getByLabel("Password", { exact: true })
    .fill(approved.temporaryPassword);
  await page
    .getByRole("button", { name: "Sign In to SkillUp", exact: true })
    .click();
  await expect(page).toHaveURL(/change-password/);
  expect((await authenticatedGet(page, "/api/performance")).status()).toBe(403);
  const changed = await authRequest(page, "/api/auth/change-password", {
    currentPassword: approved.temporaryPassword,
    newPassword: "Approved-student-personal-password",
  });
  expect(changed.status()).toBe(200);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/dashboard/);
  const profile = await authenticatedGet(page, "/api/performance");
  expect(profile.status()).toBe(200);
  const user = await (await authenticatedGet(page, "/api/auth/me")).json();
  expect(user.user.studentId).toBe(studentId);
  expect(
    (
      await authRequest(page, "/api/admin/students/actions", {
        action: "approve",
        studentId,
      })
    ).status(),
  ).toBe(403);
  await authRequest(page, "/api/auth/logout");
  const fresh = await authRequest(page, "/api/auth/login", {
    loginId: studentId,
    password: "Approved-student-personal-password",
  });
  expect(fresh.status()).toBe(200);
  expect((await fresh.json()).redirectTo).toBe("/dashboard");
});

test("administrator-created students use temporary passwords and deactivation ends access", async ({
  page,
}, info) => {
  await signInAdmin(page);
  const created = await authRequest(page, "/api/admin/students/create", {
    studentName: `Admin-created ${info.project.name} Student`,
    registerNumber: `ADMIN-APPROVAL-${info.project.name}`,
    schoolName: "Approval Test School",
    stream: "Biology",
  });
  expect(created.status()).toBe(200);
  const account = await created.json();
  expect(account.student.adminApprovedAt).toBeTruthy();
  expect(account.student.phoneVerifiedAt).toBeUndefined();
  await authRequest(page, "/api/auth/logout");
  const login = await authRequest(page, "/api/auth/login", {
    loginId: account.student.studentId,
    password: account.temporaryPassword,
  });
  expect(login.status()).toBe(200);
  expect((await login.json()).redirectTo).toBe("/change-password");
  const change = await authRequest(page, "/api/auth/change-password", {
    currentPassword: account.temporaryPassword,
    newPassword: "Created-student-personal-password",
  });
  expect(change.status()).toBe(200);
  const studentCookies = await page.context().cookies();
  const temporary = await authRequest(page, "/api/auth/login", {
    loginId: account.student.studentId,
    password: account.temporaryPassword,
  });
  expect(temporary.status()).toBe(401);
  await signInAdmin(page);
  const response = await authRequest(page, "/api/admin/students/actions", {
    studentId: account.student.id,
    action: "toggle-status",
  });
  expect(response.status()).toBe(200);
  const existingSession = await page.request.get("/api/auth/me", {
    headers: {
      Cookie: studentCookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; "),
    },
  });
  expect(existingSession.status()).toBe(401);
  await authRequest(page, "/api/auth/logout");
  const inactive = await authRequest(page, "/api/auth/login", {
    loginId: account.student.studentId,
    password: "Created-student-personal-password",
  });
  expect(inactive.status()).toBe(401);
});
