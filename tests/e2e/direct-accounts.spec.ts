import { expect, test, type Page } from "@playwright/test";
import ExcelJS from "exceljs";
import { authRequest } from "../helpers/otp-browser";
import { fixtureBook, fixtureChapterId } from "../helpers/textbook-bank";
test.skip(
  process.env.AVS_TEST_ACTIVATION_MODE !== "direct",
  "Uses email/password registration without SMS.",
);
async function get(page: Page, path: string) {
  return page.request.get(path, {
    headers: {
      Cookie: (await page.context().cookies())
        .map((c) => `${c.name}=${c.value}`)
        .join("; "),
    },
  });
}
async function admin(page: Page) {
  let result = await authRequest(page, "/api/auth/login", {
    loginId: "qa-admin@example.test",
    password: "QA-only-changed-password",
  });
  if (result.status() !== 200)
    result = await authRequest(page, "/api/auth/login", {
      loginId: "qa-admin@example.test",
      password: "QA-only-bootstrap-password",
    });
  expect(result.status()).toBe(200);
  if ((await result.json()).user.mustChangePassword)
    expect(
      (
        await authRequest(page, "/api/auth/change-password", {
          currentPassword: "QA-only-bootstrap-password",
          newPassword: "QA-only-changed-password",
        })
      ).status(),
    ).toBe(200);
}
test("students choose a password, sign in with email and see their profile in the admin Excel export", async ({
  page,
}, info) => {
  const email = `direct.${info.project.name}@example.test`,
    name = `Direct ${info.project.name} Student`,
    password = "Direct-personal-password";
  await page.goto("/register");
  await expect(page.locator("#password")).toBeVisible();
  for (const [id, value] of Object.entries({
    studentName: name,
    email,
    password,
    confirmPassword: password,
    schoolName: "Email Login Test School",
    registerNumber: `DIRECT-${info.project.name}`,
    phone: info.project.name === "mobile" ? "9891230012" : "9891230011",
  }))
    await page.locator(`#${id}`).fill(value);
  const registered = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/auth/register") && r.request().method() === "POST",
  );
  await page.locator('button[type="submit"]').click();
  const response = await registered;
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.requiresPhoneVerification).toBe(false);
  expect(data.requiresAdminApproval).toBe(false);
  expect(JSON.stringify(data)).not.toContain(password);
  expect(data.user.role).toBe("student");
  await expect(page).toHaveURL(/login\?registered=1/);
  await expect(page.locator("#login-id")).toHaveValue(email);
  await page.locator("#login-password").fill(password);
  await page
    .getByRole("button", { name: "Sign In to SkillUp", exact: true })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.locator("body")).toContainText(name);
  for (const path of [
    "/api/admin/users/export",
    "/api/admin/textbook-questions?bookId=" + fixtureBook.id,
  ])
    expect((await get(page, path)).status()).toBe(403);
  expect(
    (
      await authRequest(page, "/api/admin/questions/import", { rows: [] })
    ).status(),
  ).toBe(403);
  const otp = await authRequest(page, "/api/auth/otp/send", {
    phone: info.project.name === "mobile" ? "9891230012" : "9891230011",
  });
  expect(otp.status()).toBe(409);
  expect((await otp.json()).code).toBe("PASSWORD_LOGIN_ENABLED");
  await page.goto("/textbook-practice");
  await expect(
    page.getByRole("heading", { name: "One-mark MCQs by subject and chapter" }),
  ).toBeVisible();
  await page.getByLabel("Subject and textbook").selectOption(fixtureBook.id);
  await expect(
    page.getByRole("button", { name: "Start textbook practice" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Start textbook practice" }).click();
  await expect(
    page.getByRole("link", { name: /^Original textbook/ }),
  ).toBeVisible();
  const started = await authRequest(page, "/api/practice/start", {
    subjectId: `tb-${fixtureBook.id}`,
    chapterId: fixtureChapterId,
    mode: "timed",
    limit: 2,
    sourceFilter: "Book-In",
  });
  expect(started.status()).toBe(200);
  const quiz = await started.json();
  expect(quiz.questions).toHaveLength(2);
  expect(
    quiz.questions.every((q: Record<string, unknown>) => !q.correctAnswer),
  ).toBe(true);
  const scored = await authRequest(page, "/api/practice/submit", {
    sessionId: quiz.session.id,
    answers: Object.fromEntries(
      quiz.questions.map((q: { id: string }) => [q.id, "B"]),
    ),
  });
  expect(scored.status()).toBe(200);
  expect((await scored.json()).accuracy).toBe(100);
  await page.goto(`/textbooks/${fixtureBook.id}?page=12`);
  await expect(page.getByTestId("pdf-page")).toHaveAttribute(
    "data-rendered-page",
    "12",
    { timeout: 30000 },
  );
  await authRequest(page, "/api/auth/logout");
  await admin(page);
  await page.goto("/admin/students");
  await expect(page.getByRole("heading", { name: "All users" })).toBeVisible();
  const exported = await get(
    page,
    "/api/admin/users/export?search=" + encodeURIComponent(email),
  );
  expect(exported.status()).toBe(200);
  expect(exported.headers()["content-type"]).toContain("spreadsheetml");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    (await exported.body()) as unknown as ExcelJS.Buffer,
  );
  expect(workbook.getWorksheet("Students")!.getRow(2).getCell(1).value).toBe(
    name,
  );
  expect(workbook.getWorksheet("Students")!.getRow(2).getCell(5).value).toBe(
    email,
  );
  expect(JSON.stringify(workbook.model)).not.toContain(password);
  await page.goto("/admin/students/import");
  await page.locator('input[type="file"]').setInputFiles({
    name: "Users.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: await exported.body(),
  });
  await expect(page.locator("textarea")).toContainText(name);
  await authRequest(page, "/api/auth/logout");
  expect(
    (
      await authRequest(page, "/api/auth/login", {
        loginId: email.toUpperCase(),
        password,
      })
    ).status(),
  ).toBe(200);
  await page.goto("/login/mobile");
  await expect(
    page.getByRole("heading", { name: "Sign in with your email and password" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("admin reviews unknown answers and imports duplicate-safe chapter MCQs", async ({
  page,
}, info) => {
  await admin(page);
  await page.goto("/admin/textbook-questions");
  await page.getByLabel("Question status").selectOption("all");
  const row = page
    .getByRole("row")
    .filter({ hasText: "Fixture account question number 3" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Review MCQ" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Verified correct answer").selectOption("");
  await expect(
    dialog.getByRole("button", { name: "Publish reviewed MCQ" }),
  ).toBeDisabled();
  await dialog.getByLabel("Verified correct answer").selectOption("B");
  await dialog.getByRole("button", { name: "Publish reviewed MCQ" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("published");
  await page.goto("/admin/questions/import");
  const csv = `chapter_id,question,option_a,option_b,option_c,option_d,correct_answer\n${fixtureChapterId},Reviewed upload ${info.project.name} question?,One,Two,,,B`;
  await page.getByLabel("Question CSV").fill(csv);
  await page
    .getByRole("button", { name: "Import and publish reviewed questions" })
    .click();
  await expect(page.getByRole("status")).toContainText("1 questions published");
  await page
    .getByRole("button", { name: "Import and publish reviewed questions" })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "1 existing questions skipped",
  );
});
