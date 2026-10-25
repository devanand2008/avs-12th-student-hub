import { test, expect, type Page } from "@playwright/test";
import { authRequest } from "../helpers/otp-browser";
test.setTimeout(180000);
async function get(page: Page, url: string) {
  return page.request.get(url, {
    headers: {
      Cookie: (await page.context().cookies())
        .map((c) => `${c.name}=${c.value}`)
        .join("; "),
    },
  });
}
async function admin(page: Page) {
  let r = await authRequest(page, "/api/auth/login", {
    loginId: "qa-admin@example.test",
    password: "QA-only-changed-password",
  });
  if (r.status() !== 200)
    r = await authRequest(page, "/api/auth/login", {
      loginId: "qa-admin@example.test",
      password: "QA-only-bootstrap-password",
    });
  expect(r.status()).toBe(200);
  if ((await r.json()).user.mustChangePassword)
    expect(
      (
        await authRequest(page, "/api/auth/change-password", {
          currentPassword: "QA-only-bootstrap-password",
          newPassword: "QA-only-changed-password",
        })
      ).status(),
    ).toBe(200);
}

test("supplied collections enable labelled practice without exposing admin exports", async ({
  page,
}) => {
  expect((await get(page, "/api/supplied-practice?preview=1")).status()).toBe(
    401,
  );
  expect(
    (
      await get(page, "/api/admin/supplied-practice/export?format=json")
    ).status(),
  ).toBe(401);
  expect(
    (
      await authRequest(page, "/api/auth/login", {
        loginId: "AVSCS26-0001",
        password: "Student@2026",
      })
    ).status(),
  ).toBe(200);
  const r = await get(page, "/api/supplied-practice");
  expect(r.status()).toBe(200);
  const body = await r.json();
  expect(body.collections).toHaveLength(10);
  expect(JSON.stringify(body)).not.toContain("proposedAnswer");
  expect(
    body.collections.reduce((n: number, c: { held: number }) => n + c.held, 0),
  ).toBe(2244);
  expect(
    body.collections.reduce(
      (n: number, c: { available: number }) => n + c.available,
      0,
    ),
  ).toBe(2244);
  const supplied = await get(
    page,
    "/api/supplied-practice?questions=1&collection=chemistry-v1",
  );
  expect(supplied.status()).toBe(200);
  expect((await supplied.json()).answerStatus).toBe("supplied_unverified");
  expect((await get(page, "/api/supplied-practice?preview=1")).status()).toBe(
    403,
  );
  expect(
    (
      await get(page, "/api/admin/supplied-practice/export?format=csv")
    ).status(),
  ).toBe(403);
  await page.goto("/practice/collections");
  await expect(
    page.getByRole("heading", { name: "Your one-mark practice library" }),
  ).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(10);
  await page
    .getByRole("textbox", { name: "Search collections" })
    .fill("Chemistry");
  await expect(page.getByRole("article")).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("link", { name: "Start published textbook practice" }),
  ).toHaveAttribute("href", "/textbook-practice");
});

test("students answer native MCQs, retain locked scores, finish, retry and reload separate history", async ({
  page,
}) => {
  expect(
    (
      await authRequest(page, "/api/auth/login", {
        loginId: "AVSCS26-0001",
        password: "Student@2026",
      })
    ).status(),
  ).toBe(200);
  await page.goto("/practice/collections/chemistry-v1");
  await expect(
    page.getByRole("heading", { name: "Set up your practice" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Start practice", exact: true })
    .click();
  await expect(
    page.getByText("Bauxite has the composition", { exact: true }),
  ).toBeVisible();
  expect(await page.locator("iframe,canvas").count()).toBe(0);
  await page.getByRole("button", { name: /^B Al/ }).click();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Matches the supplied answer",
  );
  await expect(page.getByRole("button", { name: /^B Al/ })).toBeDisabled();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(
    page.getByText("1 answered · 1 matched", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Finish practice", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Practice complete" }),
  ).toBeInViewport();
  await expect(page.getByText("1 / 10", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Saved to your supplied-practice history",
  );
  await page.getByRole("button", { name: "Retry missed or skipped" }).click();
  await expect(
    page.getByText("Question 1 of 9", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Your recent supplied-practice results",
    }),
  ).toBeVisible();
  await page
    .getByLabel("Practice language", { exact: true })
    .selectOption("ta");
  await page
    .getByRole("button", { name: "Start practice", exact: true })
    .click();
  await expect(
    page.getByText("Bauxite has the composition", { exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("admin previews native bilingual questions, sources and pagination without recording decisions", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await admin(page);
  await page.goto("/admin/supplied-practice?collection=chemistry-v1");
  await expect(
    page.getByText("Question 1 of 252", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Bauxite has the composition", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("iframe,canvas")).toHaveCount(0);
  await page.getByRole("button", { name: /^A/ }).first().click();
  await page.getByRole("button", { name: "Compare supplied answer" }).click();
  await expect(page.getByRole("status")).toContainText("Proposed answer: B");
  await expect(page.getByRole("button", { name: /^A/ }).first()).toBeDisabled();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Previous question", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Proposed answer: B");
  await page.getByText("Source, original text & review warnings").click();
  await expect(
    page.getByText("Original ID: u1_bb_1", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next 25 →" }).click();
  await expect(
    page.getByText("Question 26 of 252", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Collection", { exact: true }).selectOption("tamil");
  await expect(
    page.getByText("Question 1 of 135", { exact: false }),
  ).toBeVisible();
  const json = await get(
    page,
    "/api/admin/supplied-practice/export?collection=mathematics-v2&format=json",
  );
  expect(json.status()).toBe(200);
  const payload = await json.json();
  expect(payload.questions).toHaveLength(180);
  expect(
    payload.questions.every(
      (q: { reviewStatus: string }) => q.reviewStatus === "pending",
    ),
  ).toBe(true);
  const csv = await get(
    page,
    "/api/admin/supplied-practice/export?collection=tamil&format=csv",
  );
  expect(await csv.text()).toContain("candidate_id");
  expect(csv.headers()["content-disposition"]).toContain("attachment");
  for (const id of [
    "physics-v1",
    "physics-v2",
    "mathematics-v1",
    "mathematics-v2",
    "computer-science",
    "bio-zoology",
    "english",
    "chemistry-v2",
  ]) {
    await page.getByLabel("Collection", { exact: true }).selectOption(id);
    await expect(page.getByText(/^Question 1 of /)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Compare supplied answer" }),
    ).toBeDisabled();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
