import { test, expect } from "@playwright/test";
import { authRequest } from "../helpers/otp-browser";
import inventory from "../../docs/materials-folder-nov6-inventory.json";
import resources from "../../src/lib/additional-materials-resources.json";

test.beforeEach(async ({ page }) => {
  expect(
    (
      await authRequest(page, "/api/auth/login", {
        loginId: "AVSBIO26-0001",
        password: "Student@2026",
      })
    ).status(),
  ).toBe(200);
});

test("glass scoreboard displays actual totals and offers keyboard navigation without overflow", async ({
  page,
}, info) => {
  const board = await (await page.request.get("/api/engagement")).json();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/dashboard");
  const card = page.getByRole("link", {
    name: "Open your learning scoreboard",
    exact: true,
  });
  await expect(card).toContainText(board.me.points.toLocaleString("en-IN"));
  await expect(card.getByRole("progressbar")).toHaveAttribute(
    "value",
    String(Math.min(board.me.points, 100000)),
  );
  await expect(card).toContainText("Gift potential");
  await expect(card.locator(":scope > div").last()).toHaveCSS(
    "backdrop-filter",
    "blur(14px)",
  );
  await expect(card).toContainText(
    "Complete a quiz or full video to earn 10 points.",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await card.screenshot({
    path: `.local/glass-scoreboard-local-${info.project.name}.png`,
  });
  await card.focus();
  await expect(card).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/leaderboard$/);
  await expect(
    page.getByRole("heading", { name: "Learning scoreboard", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("unavailable points remain readable and do not invent a zero balance", async ({
  page,
}) => {
  await page.route("**/api/engagement", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.goto("/dashboard");
  const card = page.getByRole("link", {
    name: "Open your learning scoreboard",
  });
  await expect(card).toContainText("Points are temporarily unavailable.");
  await expect(card.getByRole("progressbar")).toHaveCount(0);
  await expect(
    card.getByText("Total points", { exact: true }).locator(".."),
  ).toContainText("—");
  await expect(card).toHaveAttribute("href", "/leaderboard");
});

test("private ranks and large balances remain accurate with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/engagement", (route) =>
    route.fulfill({
      json: {
        me: { points: 1234567, rank: null, leaderboard_visible: false },
        leaders: [],
        recent: [],
      },
    }),
  );
  await page.goto("/dashboard");
  const card = page.getByRole("link", {
    name: "Open your learning scoreboard",
  });
  await expect(card).toContainText("12,34,567");
  await expect(card).toContainText("Private");
  await expect(card).toContainText("100%");
  await expect(card.getByRole("progressbar")).toHaveAttribute(
    "value",
    "100000",
  );
  await card.hover();
  expect(await card.evaluate((el) => getComputedStyle(el).transform)).toBe(
    "none",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

test("both new Chemistry note editions are discoverable and open their source PDFs", async ({
  page,
}) => {
  for (const source of inventory.additions) {
    const row = resources.find((r) => r.resource.sourceFile === source.file);
    expect(row).toBeTruthy();
    await page.goto("/notes");
    await page.getByLabel("Search notes").fill(source.title);
    await expect(
      page.getByRole("heading", { name: source.title, exact: true }),
    ).toBeVisible();
    const link = page.locator(`a[href="/notes/${row!.resource.id}"]`);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/notes/${row!.resource.id}$`));
    await expect(page.getByText(source.title, { exact: true })).toBeVisible();
    const response = await page.request.get(
      `/api/notes/${row!.resource.id}/pdf`,
      { headers: { Range: "bytes=0-4" } },
    );
    expect(response.status()).toBe(206);
    expect((await response.body()).toString()).toBe("%PDF-");
  }
});
