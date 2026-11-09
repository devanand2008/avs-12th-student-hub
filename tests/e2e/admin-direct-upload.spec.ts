import { test, expect } from "@playwright/test";
import { authRequest } from "../helpers/otp-browser";
test("admin file picker stores playable video with detected duration before explicit publishing", async ({
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
  await page.goto("/admin/videos");
  await page.getByRole("button", { name: /Add video/ }).click();
  const form = page.locator("form.content-form");
  const chapter = await form
    .locator('select[name="chapterId"] option:not([disabled])')
    .first()
    .getAttribute("value");
  await form.locator('select[name="chapterId"]').selectOption(chapter!);
  const plans: string[] = [];
  page.on("response", async (response) => {
    if (
      new URL(response.url()).pathname === "/api/admin/content/uploads" &&
      response.ok()
    )
      plans.push((await response.json()).id);
  });
  let uploadParts = 0;
  let reachedSecond!: () => void;
  let release!: () => void;
  const paused = new Promise<void>((resolve) => {
    reachedSecond = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/storage/v1/object/upload/sign/**", async (route) => {
    if (route.request().method() === "PUT" && ++uploadParts === 2) {
      reachedSecond();
      await gate;
      await route.abort().catch(() => {});
    } else await route.continue();
  });
  await form
    .locator('input[type="file"]')
    .setInputFiles("public/media/student-guide.mp4");
  await paused;
  await page
    .getByRole("button", { name: "Cancel upload", exact: true })
    .click();
  await expect(
    page.getByText("Upload cancelled. Select the same file again to resume.", {
      exact: true,
    }),
  ).toBeVisible();
  release();
  await form
    .locator('input[type="file"]')
    .setInputFiles("public/media/student-guide.mp4");
  await expect(
    page.getByText("File stored securely.", { exact: false }),
  ).toBeVisible();
  expect(plans).toHaveLength(2);
  expect(plans[1]).toBe(plans[0]);
  expect(uploadParts).toBe(3);
  await expect(form.locator('input[name="durationSeconds"]')).not.toHaveValue(
    "0",
  );
  await form
    .locator('input[name="title"]')
    .fill(`QA playable upload ${info.project.name}`);
  await form.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByText("Draft saved. Publish it when you are ready."),
  ).toBeVisible();
  const resources = (
    await (await page.request.get("/api/admin/content?kind=video")).json()
  ).resources;
  const resource = resources.find(
    (v: { title: string }) =>
      v.title === `QA playable upload ${info.project.name}`,
  );
  expect(resource.isPublished).toBe(false);
  expect(resource.sizeBytes).toBeGreaterThan(0);
  await authRequest(page, "/api/auth/login", {
    loginId: "AVSBIO26-0001",
    password: "Student@2026",
  });
  expect((await page.request.get(resource.videoUrl)).status()).toBe(404);
  await authRequest(page, "/api/auth/login", {
    loginId: "qa-admin@example.test",
    password: "QA-only-changed-password",
  });
  await page.request.post("/api/admin/content", {
    data: { kind: "video", id: resource.id, action: "publish" },
  });
  await authRequest(page, "/api/auth/login", {
    loginId: "AVSBIO26-0001",
    password: "Student@2026",
  });
  await page.route("**/api/activity", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({ json: { success: true } })
      : route.continue(),
  );
  await page.goto("/videos/watch/" + resource.id);
  const video = page.locator("video");
  await video.evaluate(async (v: HTMLVideoElement) => {
    v.muted = true;
    await v.play();
  });
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0);
  await video.evaluate((v: HTMLVideoElement) => v.pause());
});
