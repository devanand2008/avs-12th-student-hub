import { test, expect } from "@playwright/test";
import { authRequest } from "../helpers/otp-browser";
test("admin multipart uploads resume and publish individual files; video cards open dedicated watch pages", async ({
  page,
}, info) => {
  let r = await authRequest(page, "/api/auth/login", {
    loginId: "qa-admin@example.test",
    password: "QA-only-changed-password",
  });
  if (r.status() !== 200)
    r = await authRequest(page, "/api/auth/login", {
      loginId: "qa-admin@example.test",
      password: "QA-only-bootstrap-password",
    });
  if ((await r.json()).user.mustChangePassword)
    await authRequest(page, "/api/auth/change-password", {
      currentPassword: "QA-only-bootstrap-password",
      newPassword: "QA-only-changed-password",
    });
  const book = (
    await (await page.request.get("/api/subjects")).json()
  ).subjects.find((s: { chapters: unknown[] }) => s.chapters.length);
  const size = 5 * 1024 * 1024 + 7,
    fingerprint = "a".repeat(64);
  const planR = await page.request.post("/api/admin/content/uploads", {
    data: { name: "QA lesson.mp4", mime: "video/mp4", size, fingerprint },
  });
  expect(planR.status()).toBe(200);
  const plan = await planR.json();
  expect(plan.parts).toHaveLength(2);
  expect(
    (
      await page.request.post(`/api/admin/content/uploads/${plan.id}/complete`)
    ).status(),
  ).toBe(400);
  const first = Buffer.alloc(4 * 1024 * 1024, 1);
  first.write("ftyp", 4);
  expect(
    (
      await page.request.put(plan.parts[0].signedUrl, {
        data: first,
        headers: { "Content-Type": "application/octet-stream" },
      })
    ).status(),
  ).toBe(200);
  const resumed = await (
    await page.request.post("/api/admin/content/uploads", {
      data: {
        name: "QA lesson.mp4",
        mime: "video/mp4",
        size,
        fingerprint,
        resumeId: plan.id,
      },
    })
  ).json();
  expect(resumed.parts[0].uploaded).toBe(true);
  expect(resumed.id).toBe(plan.id);
  expect(
    (
      await page.request.post("/api/admin/content/uploads", {
        data: {
          name: "QA lesson.mp4",
          mime: "video/mp4",
          size,
          fingerprint: "b".repeat(64),
          resumeId: plan.id,
        },
      })
    ).status(),
  ).toBe(403);
  await page.request.put(resumed.parts[1].signedUrl, {
    data: Buffer.alloc(size - first.length, 2),
    headers: { "Content-Type": "application/octet-stream" },
  });
  expect(
    (
      await page.request.post(`/api/admin/content/uploads/${plan.id}/complete`)
    ).status(),
  ).toBe(200);
  const saved = await page.request.post("/api/admin/content", {
    data: {
      kind: "video",
      title: `QA dedicated video ${info.project.name}`,
      chapterId: book.chapters[0].id,
      url: plan.url,
      embedType: "mp4",
      durationSeconds: 1,
      isPublished: true,
    },
  });
  expect(saved.status()).toBe(201);
  const sync = await page.request.post("/api/admin/content/sync");
  expect(sync.status()).toBe(200);
  expect(
    (await (await page.request.post("/api/admin/content/sync")).json())
      .inserted,
  ).toBe(0);
  await page.goto("/admin/videos");
  await expect(
    page.getByRole("button", { name: "Save supplied library to database" }),
  ).toBeVisible();
  await authRequest(page, "/api/auth/login", {
    loginId: "AVSBIO26-0001",
    password: "Student@2026",
  });
  expect(
    (
      await page.request.post("/api/admin/content/uploads", { data: {} })
    ).status(),
  ).toBe(403);
  const bytes = await page.request.get(plan.url, {
    headers: { Range: "bytes=4194302-4194306" },
  });
  expect(bytes.status()).toBe(206);
  expect([...(await bytes.body())]).toEqual([1, 1, 2, 2, 2]);
  await page.route("**/api/activity", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({ json: { success: true } })
      : route.continue(),
  );
  await page.goto("/videos");
  await expect(page.locator("video")).toHaveCount(0);
  const card = page.getByRole("link", {
    name: new RegExp(`QA dedicated video ${info.project.name}`),
  });
  await card.click();
  await expect(page).toHaveURL(/\/videos\/watch\//);
  await expect(page.locator("video")).toHaveAttribute("src", plan.url);
  await expect(
    page.getByRole("heading", {
      name: `QA dedicated video ${info.project.name}`,
      exact: true,
      level: 2,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
