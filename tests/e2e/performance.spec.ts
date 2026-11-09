import { test, expect } from "@playwright/test";
import { testAppOrigin } from "../helpers/e2e-urls";

test("video library renders in batches, searches the full collection and shares concurrent auth", async ({
  page,
}) => {
  await page.request.post("/api/auth/login", {
    data: { loginId: "AVSBIO26-0001", password: "Student@2026" },
  });
  const videos = (await (await page.request.get("/api/videos")).json()).videos;
  let authRequests = 0;
  let speculativeWatchRequests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/auth/me") authRequests++;
    if (
      request.url().includes("/videos/watch/") &&
      request.headers()["next-router-prefetch"]
    )
      speculativeWatchRequests++;
  });
  await page.route("**/api/auth/me", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.continue();
  });
  await page.route("**/api/activity", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({ json: { success: true } })
      : route.continue(),
  );
  await page.goto("/videos");
  const cards = page.locator('main a[href^="/videos/watch/"]');
  await expect(
    page.getByRole("heading", { name: /Browse Video Lessons/ }),
  ).toContainText(String(videos.length));
  await expect(cards).toHaveCount(24);
  expect(authRequests).toBe(1);
  expect(speculativeWatchRequests).toBe(0);
  await page.getByRole("button", { name: "Load more videos" }).focus();
  await page.keyboard.press("Enter");
  await expect(cards).toHaveCount(48);
  const target = videos.at(-1);
  await page.getByLabel("Search video lessons").fill(target.title);
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText(target.title);
  await page
    .getByLabel("Filter videos by language")
    .selectOption(target.language);
  await expect(cards).toHaveCount(1);
  await cards.first().click();
  await expect(page).toHaveURL(new RegExp(`/videos/watch/${target.id}$`));
  await expect(
    page.getByRole("heading", { name: target.title, exact: true, level: 2 }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page
    .getByRole("link", { name: "Subjects & Syllabus", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/subjects$/);
  await expect(
    page.getByRole("heading", { name: /Subjects & Curriculum/ }),
  ).toBeVisible();
});

test("fresh auth rejects disabled accounts and revoked cookies without a cached identity", async ({
  page,
  browser,
}, info) => {
  const studentId = `PERF-${info.project.name.toUpperCase()}`;
  const password = "Performance-private-password";
  const registration = await page.request.post("/api/auth/register", {
    data: {
      studentName: `Performance ${info.project.name}`,
      email: `${studentId.toLowerCase()}@example.test`,
      studentId,
      registerNumber: studentId,
      phone: info.project.name === "mobile" ? "9861190072" : "9861190071",
      schoolName: "Performance Fixture",
      standard: "12th Standard",
      stream: "Computer Science",
      medium: "English",
      password,
    },
  });
  expect(registration.status()).toBe(200);
  expect(
    (
      await page.request.post("/api/auth/login", {
        data: { loginId: studentId, password },
      })
    ).status(),
  ).toBe(200);
  expect((await page.request.get("/api/auth/me")).status()).toBe(200);
  const admin = await browser.newContext({ baseURL: testAppOrigin });
  try {
    let login = await admin.request.post("/api/auth/login", {
      data: {
        loginId: "qa-admin@example.test",
        password: "QA-only-changed-password",
      },
    });
    if (login.status() !== 200)
      login = await admin.request.post("/api/auth/login", {
        data: {
          loginId: "qa-admin@example.test",
          password: "QA-only-bootstrap-password",
        },
      });
    expect(login.status()).toBe(200);
    if ((await login.json()).user.mustChangePassword)
      expect(
        (
          await admin.request.post("/api/auth/change-password", {
            data: {
              currentPassword: "QA-only-bootstrap-password",
              newPassword: "QA-only-changed-password",
            },
          })
        ).status(),
      ).toBe(200);
    const directory = await (
      await admin.request.get("/api/admin/users")
    ).json();
    const student = directory.users.find(
      (u: { student?: { studentId: string } }) =>
        u.student?.studentId === studentId,
    ).student;
    for (const expectedStatus of [401, 200]) {
      expect(
        (
          await admin.request.post("/api/admin/students/actions", {
            data: { studentId: student.id, action: "toggle-status" },
          })
        ).status(),
      ).toBe(200);
      expect((await page.request.get("/api/auth/me")).status()).toBe(
        expectedStatus,
      );
      expect((await page.request.get("/api/videos")).status()).toBe(
        expectedStatus,
      );
    }
    const old = await browser.newContext({
      baseURL: testAppOrigin,
      storageState: await page.context().storageState(),
    });
    try {
      expect((await page.request.post("/api/auth/logout")).status()).toBe(200);
      expect((await old.request.get("/api/auth/me")).status()).toBe(401);
      expect((await old.request.get("/api/videos")).status()).toBe(401);
    } finally {
      await old.close();
    }
  } finally {
    await admin.close();
  }
});
