import { test, expect } from "@playwright/test";
test("public study hub, actual paper filters and original PDF fallback preserve navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('a[href="/resources"]:visible').first().click();
  await expect(
    page.getByRole("heading", { name: "Study Resources", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: /Previous Year Question Papers/ })
    .click();
  await page.getByLabel("Subjects", { exact: true }).selectOption("Physics");
  await page.getByLabel("Mediums", { exact: true }).selectOption("Tamil");
  await page.getByLabel("Years", { exact: true }).selectOption("2025");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByRole("status")).toContainText("1 collections found");
  await page.getByRole("link", { name: "View paper / PDF" }).click();
  await expect(
    page.getByRole("heading", { name: "Open the original PDF", exact: true }),
  ).toBeVisible();
  const original = page.getByRole("link", { name: "Open Original PDF" });
  await expect(original).toHaveAttribute(
    "href",
    /tnegadge\.s3.*2025_MAR_12_QUESTION_PAPER\.pdf/,
  );
  await expect(original).toHaveAttribute("target", "_blank");
  await expect(page.locator("iframe,object,embed")).toHaveCount(0);
  await page
    .getByRole("link", { name: "Back to resources and filters" })
    .click();
  await expect(page.getByLabel("Years", { exact: true })).toHaveValue("2025");
  await expect(page.getByLabel("Subjects", { exact: true })).toHaveValue(
    "Physics",
  );
  await page.getByLabel("Search resources").fill("no-matching-paper-fixture");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(
    page.getByRole("heading", { name: "No matching resources yet" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).first().click();
  await expect(page.getByRole("status")).toContainText("4 collections");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("reading resources disclose licences, temporary provenance and unavailable sources", async ({
  page,
}) => {
  await page.goto("/resources/learning-materials");
  await page.getByLabel("Subjects", { exact: true }).selectOption("Chemistry");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await page.getByRole("link", { name: "View resource" }).click();
  await expect(
    page.getByRole("heading", { name: "Chemistry 2e", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Read licence terms" }),
  ).toHaveAttribute(
    "href",
    "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  );
  await expect(
    page.getByText("noncommercial", { exact: false }).first(),
  ).toBeVisible();
  await page.goto("/resources/temporary");
  await expect(
    page.getByRole("heading", { name: "Temporary Learning Resources" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Temporary learning resource. Source relevance and availability may not yet be fully verified. Opens an external educational service.",
    ),
  ).toBeVisible();
  await page.getByLabel("Search resources").fill("முப்பட்டகத்தின்");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(
    page.getByRole("heading", { name: "No matching resources yet" }),
  ).toBeVisible();
  const response = await page.goto("/resources/item/not-a-resource");
  // Next's loading boundary may stream HTTP 200 before notFound(); the rejected
  // resource must show the unavailable UI and noindex, never a usable resource.
  expect([200, 404]).toContain(response?.status());
  await expect(
    page.getByRole("heading", { name: "Resource not available" }),
  ).toBeVisible();
  await expect(
    page.locator('meta[name="robots"][content*="noindex"]').first(),
  ).toHaveAttribute("content",/noindex/);
  await expect(page.locator("iframe")).toHaveCount(0);
  const category = await page.goto("/resources/unsupported");
  expect([200, 404]).toContain(category?.status());
  await expect(
    page.getByRole("heading", { name: "Resource not available" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Return to Study Resources" }),
  ).toBeVisible();
});
test("YouTube is click-to-load, uses only the privacy host and handles player errors without arbitrary HTML", async ({
  page,
}) => {
  await page.route("https://www.youtube-nocookie.com/embed/**", async (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><title>Isolated YouTube error fixture</title><script>setTimeout(()=>parent.postMessage(JSON.stringify({event:"onError",info:150}),"*"),600)</script>',
    }),
  );
  await page.goto("/resources/video-lessons");
  await page.getByRole("link", { name: "Watch lesson" }).first().click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.getByRole("button", { name: "Play lesson" }).click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    /^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}\?enablejsapi=1&rel=0$/,
  );
  await expect(page.getByRole("status")).toContainText("could not play");
  await expect(
    page.getByRole("link", { name: "Open on YouTube" }),
  ).toHaveAttribute(
    "href",
    /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/,
  );
  await page.getByRole("button", { name: "Video not playing?" }).click();
  await expect(page.getByRole("status")).toContainText("cannot bypass");
  await page.getByRole("button", { name: "Retry player" }).click();
  await expect(page.locator("iframe")).toHaveCount(1);
});
