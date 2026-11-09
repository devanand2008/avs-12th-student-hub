import { test, expect } from "@playwright/test";
import { authRequest } from "../helpers/otp-browser";

test("admin scoreboard is authenticated, read only and respects student privacy", async ({
  page,
}, info) => {
  expect((await page.request.get("/api/admin/leaderboard")).status()).toBe(401);
  const loginId =
    info.project.name === "desktop" ? "AVSBIO26-0001" : "AVSCS26-0001";
  await authRequest(page, "/api/auth/login", {
    loginId,
    password: "Student@2026",
  });
  expect((await page.request.get("/api/admin/leaderboard")).status()).toBe(403);
  await page.request.get("/api/engagement");
  await page.request.patch("/api/engagement", {
    data: {
      name: `Private ${info.project.name}`,
      visible: false,
      reminders: false,
    },
  });
  const before = await (await page.request.get("/api/engagement")).json();
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
  if ((await response.json()).user.mustChangePassword) {
    expect(
      (
        await authRequest(page, "/api/auth/change-password", {
          currentPassword: "QA-only-bootstrap-password",
          newPassword: "QA-only-changed-password",
        })
      ).status(),
    ).toBe(200);
  }
  const r = await page.request.get("/api/admin/leaderboard");
  expect(r.status()).toBe(200);
  expect(r.headers()["cache-control"]).toContain("no-store");
  const board = await r.json();
  expect(board.me).toBeNull();
  expect(board.recent).toEqual([]);
  expect(
    board.leaders.some(
      (p: { name: string }) => p.name === `Private ${info.project.name}`,
    ),
  ).toBe(false);
  for (const p of board.leaders)
    expect(Object.keys(p).sort()).toEqual(["isMe", "name", "points", "rank"]);
  expect(
    (
      await page.request.patch("/api/admin/leaderboard", {
        data: { points: 999 },
      })
    ).status(),
  ).toBe(405);
  await page.goto("/admin/leaderboard");
  await expect(
    page.getByRole("heading", { name: "Learning scoreboard", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Administrator view", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Top learners" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save preferences" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Refresh scoreboard" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.screenshot({
    path: `.local/admin-scoreboard-${info.project.name}.png`,
    fullPage: true,
  });
  await authRequest(page, "/api/auth/login", {
    loginId,
    password: "Student@2026",
  });
  const after = await (await page.request.get("/api/engagement")).json();
  expect(after.me.points).toBe(before.me.points);
  expect(after.recent).toEqual(before.recent);
  await page.request.patch("/api/engagement", {
    data: {
      name: `Learner ${info.project.name}`,
      visible: true,
      reminders: true,
    },
  });
});
