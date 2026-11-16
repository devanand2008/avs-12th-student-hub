import { test, expect } from "@playwright/test";
import inventory from "../../docs/materials-folder-nov12-inventory.json";
import runtime from "../../src/lib/additional-materials-resources.json";

test.beforeEach(async ({ page }) => {
  const login = await page.request.post("/api/auth/login", {
    data: { loginId: "AVSBIO26-0001", password: "Student@2026" },
  });
  expect(login.status()).toBe(200);
  await page.route("**/api/activity", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({ json: { success: true } })
      : route.continue(),
  );
});

test("the local catalogue exposes all additions, corrected chapters and supplied PDFs", async ({
  page,
}) => {
  const response = await page.request.get("/api/videos");
  expect(response.status()).toBe(200);
  const { videos } = await response.json();
  // The isolated fixture contains source-controlled additions. The 67 older
  // database-only resources are checked separately against the live database.
  expect(videos).toHaveLength(
    runtime.filter((row) => row.kind === "video").length,
  );
  for (const source of inventory.additions) {
    const expected = runtime.find(
      (row) => row.resource.sha256 === source.sha256,
    )!.resource;
    const actual = videos.find(
      (video: { id: string }) => video.id === expected.id,
    );
    expect(actual).toMatchObject({
      chapterId: source.chapterId,
      language: source.language,
      videoUrl: source.hostedUrl,
      thumbnailUrl: source.thumbnailUrl,
    });
  }
  for (const correction of inventory.mappingCorrections) {
    expect(
      videos.find((video: { id: string }) => video.id === correction.id)
        ?.chapterId,
    ).toBe(correction.newChapterId);
  }
  const notesResponse = await page.request.get("/api/notes");
  expect(notesResponse.status()).toBe(200);
  const noteCount = runtime.filter((row) => row.kind === "note").length;
  expect((await notesResponse.json()).notes).toHaveLength(noteCount);
  await page.goto("/notes");
  await expect(page.locator('main a[href^="/notes/"]')).toHaveCount(noteCount);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

test("English and Tamil Unit 10 and 11 videos play, seek and retain source thumbnails", async ({
  page,
}, info) => {
  test.setTimeout(240000);
  for (const language of ["English", "Tamil"]) {
    for (const chapter of [10, 11]) {
      const source = inventory.additions.find(
        (item) =>
          item.language === language &&
          item.chapterId.endsWith(`-ch-${chapter}`),
      )!;
      const resource = runtime.find(
        (row) => row.resource.sha256 === source.sha256,
      )!.resource;
      await page.goto(`/videos/watch/${resource.id}`);
      await expect(
        page.getByRole("heading", {
          name: source.title,
          exact: true,
          level: 2,
        }),
      ).toBeVisible();
      const video = page.locator("video");
      await expect(video).toHaveAttribute("src", source.hostedUrl);
      await expect(video).toHaveAttribute("poster", source.thumbnailUrl);
      await expect
        .poll(
          () =>
            video.evaluate(
              (element: HTMLVideoElement) =>
                Number.isFinite(element.duration) && element.duration > 0,
            ),
          { timeout: 60000 },
        )
        .toBe(true);
      const actualDuration = await video.evaluate(
        (element: HTMLVideoElement) => element.duration,
      );
      expect(Math.abs(actualDuration - source.durationSeconds)).toBeLessThan(2);
      await video.evaluate(async (element: HTMLVideoElement) => {
        element.muted = true;
        await element.play();
      });
      await expect
        .poll(
          () =>
            video.evaluate((element: HTMLVideoElement) => element.currentTime),
          { timeout: 20000 },
        )
        .toBeGreaterThan(0.1);
      await video.evaluate((element: HTMLVideoElement) => {
        element.pause();
        element.currentTime = element.duration * 0.2;
      });
      await expect
        .poll(
          () =>
            video.evaluate(
              (element: HTMLVideoElement) =>
                !element.seeking && element.readyState >= 2,
            ),
          { timeout: 45000 },
        )
        .toBe(true);
      expect(
        await video.evaluate(
          (element: HTMLVideoElement) => element.currentTime,
        ),
      ).toBeGreaterThan(actualDuration * 0.19);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      await page.screenshot({
        path: `.local/materials-nov12-${language}-${chapter}-${info.project.name}.png`,
      });
    }
  }
});
