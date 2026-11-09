import { expect, test } from "@playwright/test";
import { authRequest } from "../helpers/otp-browser";

test("admin chooses a temporary password, old sessions stop, and student must change it", async ({
  page,
  browser,
}, info) => {
  const studentId = `PASSWORD-${info.project.name.toUpperCase()}`;
  const personal = "Original-fixture-password";
  const registration = await authRequest(page, "/api/auth/register", {
    studentName: `Password Student ${info.project.name}`,
    email: `${studentId.toLowerCase()}@example.test`,
    studentId,
    registerNumber: studentId,
    phone: info.project.name === "mobile" ? "9871190012" : "9871190011",
    schoolName: "Password Test School",
    standard: "12th Standard",
    stream: "Computer Science",
    medium: "English",
    password: personal,
  });
  expect(registration.status(), await registration.text()).toBe(200);
  expect(
    (
      await authRequest(page, "/api/auth/login", {
        loginId: studentId,
        password: personal,
      })
    ).status(),
  ).toBe(200);
  const oldCookies = await page.context().cookies();
  expect(
    (
      await page.request.post("/api/admin/students/actions", {
        data: {
          studentId,
          action: "reset-password",
          newPassword: "Injected-test-password",
        },
      })
    ).status(),
  ).toBe(403);
  let login = await authRequest(page, "/api/auth/login", {
    loginId: "qa-admin@example.test",
    password: "QA-only-changed-password",
  });
  if (login.status() !== 200)
    login = await authRequest(page, "/api/auth/login", {
      loginId: "qa-admin@example.test",
      password: "QA-only-bootstrap-password",
    });
  expect(login.status()).toBe(200);
  if ((await login.json()).user.mustChangePassword)
    expect(
      (
        await authRequest(page, "/api/auth/change-password", {
          currentPassword: "QA-only-bootstrap-password",
          newPassword: "QA-only-changed-password",
        })
      ).status(),
    ).toBe(200);
  const directory = await (await page.request.get("/api/admin/users")).json();
  const user = directory.users.find(
    (u: { student?: { studentId: string } }) =>
      u.student?.studentId === studentId,
  );
  expect(user).toBeTruthy();
  for (const newPassword of ["short", "அ".repeat(25), 123])
    expect(
      (
        await page.request.post("/api/admin/students/actions", {
          data: {
            studentId: user.student.id,
            action: "reset-password",
            newPassword,
          },
        })
      ).status(),
    ).toBe(400);
  await page.goto("/admin/students");
  await page.getByLabel("Search users", { exact: true }).fill(studentId);
  await page
    .getByRole("button", {
      name: `Reset password for Password Student ${info.project.name}`,
      exact: true,
    })
    .click();
  const replacement = `Chosen-fixture-${info.project.name}-password`;
  await page
    .getByLabel("Replacement temporary password (optional)")
    .fill(replacement);
  await page
    .getByRole("button", { name: "Show replacement password", exact: true })
    .click();
  await expect(
    page.getByLabel("Replacement temporary password (optional)"),
  ).toHaveAttribute("type", "text");
  const responsePromise = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/admin/students/actions") &&
      r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect((await response.json()).temporaryPassword).toBe(replacement);
  await expect(page.getByText(replacement, { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Copy login details", exact: true })
    .click();
  await expect(
    page.getByText(/Login details copied|copy it manually/),
  ).toBeVisible();
  const after = await (await page.request.get("/api/admin/users")).text();
  expect(after).not.toContain(replacement);
  expect(after).not.toContain("passwordHash");
  const oldContext = await browser.newContext();
  await oldContext.addCookies(oldCookies);
  expect(
    (
      await oldContext.request.get(new URL("/api/engagement", page.url()).href)
    ).status(),
  ).toBe(401);
  await oldContext.close();
  expect(
    (
      await authRequest(page, "/api/auth/login", {
        loginId: studentId,
        password: personal,
      })
    ).status(),
  ).toBe(401);
  const studentLogin = await authRequest(page, "/api/auth/login", {
    loginId: studentId,
    password: replacement,
  });
  expect(studentLogin.status()).toBe(200);
  expect((await studentLogin.json()).user.mustChangePassword).toBe(true);
  expect((await page.request.get("/api/engagement")).status()).toBe(403);
  expect(
    (
      await authRequest(page, "/api/auth/change-password", {
        currentPassword: replacement,
        newPassword: `New-private-${info.project.name}-password`,
      })
    ).status(),
  ).toBe(200);
  expect((await page.request.get("/api/engagement")).status()).toBe(200);
});
