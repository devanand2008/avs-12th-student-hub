import { expect, test, type Page } from "@playwright/test";
import { authRequest } from "../helpers/otp-browser";

async function admin(page: Page) {
  let response = await authRequest(page, "/api/auth/login", {
    loginId: "qa-admin@example.test",
    password: "QA-only-changed-password",
  });
  if (response.status() !== 200)
    response = await authRequest(page, "/api/auth/login", {
      loginId: "qa-admin@example.test",
      password: "QA-only-bootstrap-password",
    });
  expect(response.status()).toBe(200);
  if ((await response.json()).user.mustChangePassword)
    expect(
      (
        await authRequest(page, "/api/auth/change-password", {
          currentPassword: "QA-only-bootstrap-password",
          newPassword: "QA-only-changed-password",
        })
      ).status(),
    ).toBe(200);
}
test("teacher saves an unpublished draft, explicitly approves, then rejects with a recorded reason", async ({
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
  await expect(
    dialog.getByRole("region", {
      name: "Original extraction and source evidence",
    }),
  ).toContainText("Fixture account question number 3");
  await dialog
    .getByRole("textbox", { name: "Question", exact: true })
    .fill(
      `Fixture account question number 3: teacher draft ${info.project.name}.`,
    );
  await dialog.getByLabel("Verified correct answer").selectOption("B");
  await dialog.getByRole("button", { name: "Save edits for review" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(row).toContainText("needs_teacher_review");
  await row.getByRole("button", { name: "Review MCQ" }).click();
  await expect(
    dialog.getByRole("button", { name: "Publish reviewed MCQ" }),
  ).toBeDisabled();
  await dialog
    .getByRole("checkbox", { name: /I checked the original question/ })
    .check();
  await dialog.getByRole("button", { name: "Publish reviewed MCQ" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(row).toContainText("approved");
  await row.getByRole("button", { name: "Review MCQ" }).click();
  await expect(
    dialog.getByRole("button", { name: "Reject question" }),
  ).toBeDisabled();
  await dialog
    .getByLabel("Review note / rejection reason")
    .fill("Printed option boundaries need another teacher check.");
  await dialog.getByRole("button", { name: "Reject question" }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByLabel("Question status").selectOption("rejected");
  await expect(row).toContainText("rejected");
  await row.getByRole("button", { name: "Review MCQ" }).click();
  await dialog.getByText("Review history", { exact: true }).click();
  await expect(dialog).toContainText(
    "Printed option boundaries need another teacher check.",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
