import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

test("native sign-in works without scripts and restores the requested page and query", async ({
  page,
}) => {
  await page.goto("/notes?chapterId=maths-ch-1");
  const loginId = page.getByLabel("Email Address");
  const password = page.getByLabel("Password", { exact: true });
  const submit = page.getByRole("button", {
    name: "Sign In to SkillUp",
    exact: true,
  });

  await loginId.fill("AVSCS26-0001");
  await password.fill("incorrect-password");
  await submit.click();
  await expect(page.getByRole("alert")).toHaveText(
    "Email or password is incorrect.",
  );
  await expect(password).toBeEmpty();

  await loginId.fill("AVSCS26-0001");
  await password.fill("Student@2026");
  const result = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/auth/login" &&
      response.request().method() === "POST",
  );
  await submit.click();
  expect((await result).status()).toBe(303);
  await expect(page).toHaveURL(/\/notes\?chapterId=maths-ch-1$/);
  expect((await page.request.get("/api/auth/me")).status()).toBe(200);
  await page.reload();
  await expect(page).toHaveURL(/\/notes\?chapterId=maths-ch-1$/);
});

test("native sign-in rejects an external destination", async ({ page }) => {
  await page.goto("/login?redirect=%2F%2Fexample.test");
  await page.getByLabel("Email Address").fill("AVSCS26-0001");
  await page.getByLabel("Password", { exact: true }).fill("Student@2026");
  await page
    .getByRole("button", { name: "Sign In to SkillUp", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
