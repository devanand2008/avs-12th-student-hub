import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

test("native sign-in works without scripts and restores the requested page and query", async ({
  page,
}) => {
  const guest = await page.request.get("/notes?chapterId=maths-ch-1", {
    maxRedirects: 0,
  });
  expect(guest.status()).toBe(307);
  expect(guest.headers()["cache-control"]).toContain("no-store");
  expect(guest.headers().vary).toMatch(/cookie/i);
  const anonymous = await page.request.get("/api/auth/me");
  expect(anonymous.status()).toBe(401);
  expect(anonymous.headers()["cache-control"]).toContain("no-store");
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
  const accepted = await result;
  expect(accepted.status()).toBe(200);
  expect(accepted.headers()["content-type"]).toContain("text/html");
  expect(accepted.headers().location).toBeUndefined();
  await expect(page).toHaveURL(/\/notes\?chapterId=maths-ch-1$/);
  const cookie = (await page.context().cookies()).find(
    (item) => item.name === "avs_session",
  );
  expect(cookie?.httpOnly).toBe(true);
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

test("a browser that loses its saved session sees a cookie message", async ({
  page,
  request,
  baseURL,
}) => {
  const accepted = await request.post("/api/auth/login", {
    headers: { Origin: new URL(baseURL!).origin },
    form: { loginId: "AVSCS26-0001", password: "Student@2026" },
    maxRedirects: 0,
  });
  expect(accepted.status()).toBe(200);
  expect(accepted.headers()["set-cookie"]).toContain("avs_session=");
  const handoff = (await accepted.text()).match(
    /href="(\/auth\/continue\?[^"]+)"/,
  )?.[1];
  expect(handoff).toBeDefined();
  // Visit the handoff from the browser context, which lacks the API session cookie.
  await page.goto(handoff!);
  await expect(page.getByRole("alert")).toContainText(
    "Your browser could not keep you signed in.",
  );
});

test("an invalid session cookie is distinguished from a missing cookie", async ({
  page,
  baseURL,
}) => {
  await page
    .context()
    .addCookies([{ name: "avs_session", value: "invalid", url: baseURL! }]);
  await page.goto("/auth/continue");
  await expect(page.getByRole("alert")).toHaveText(
    "Your sign-in session could not be verified. Please try signing in again.",
  );
});
