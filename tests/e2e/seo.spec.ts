import { test, expect } from "@playwright/test";
import {
  pageMetadata,
  publicSearchPaths,
  searchableResources,
  SITE_URL,
} from "../../src/lib/seo";

test("public pages expose accurate canonical metadata and private pages remain noindex", async ({
  page,
}) => {
  // This checks fourteen routes, including cold development-server compilations.
  test.setTimeout(240_000);
  for (const path of [
    "/",
    "/models",
    "/resources",
    "/ai-study-tools",
    "/textbooks",
    "/resources/guides",
  ] as const) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(
      (pageMetadata(path).title as { absolute: string }).absolute,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      path === "/" ? SITE_URL : new URL(path, SITE_URL).href,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /^index, follow$/,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      new RegExp(
        `^${SITE_URL.replaceAll(".", "\\.")}/opengraph-image(?:\\?|$)`,
      ),
    );
  }
  await page.goto("/interactive-3d");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${SITE_URL}/models`,
  );
  const resource = searchableResources[0];
  for (const path of [
    "/resources/all?q=biology",
    "/resources/question-papers",
    `/resources/item/${resource.id}?returnTo=%2Fresources%2Fall`,
  ]) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      SITE_URL + path.split("?")[0],
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "index, follow",
    );
  }
  for (const path of ["/login", "/register", "/resources/temporary"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
  }
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
});

test("Google discovery files and visible homepage work without invented dates or structured claims", async ({
  page,
}) => {
  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])).toEqual(
    publicSearchPaths().map((p) => new URL(p, SITE_URL).href),
  );
  expect(xml).not.toContain("<lastmod>");
  const robots = await page.request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  const html = await page.request.get("/", {
    headers: { "User-Agent": "Googlebot" },
  });
  expect(await html.text()).toContain("Tamil Nadu Class 12");
  expect(await html.text()).toContain("joshuaskillup");
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Tamil Nadu Class 12",
  );
  const structured = JSON.parse(
    await page.locator('script[type="application/ld+json"]').innerText(),
  );
  expect(structured).toMatchObject({
    "@type": "WebSite",
    name: "joshuaskillup",
    url: SITE_URL,
  });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "joshuaskillup",
  );
  await expect(page.locator('p[lang="ta"]')).toContainText("12ஆம் வகுப்பு");
  expect(structured.alternateName).toContain("Skill Up");
  await expect(
    page.getByText("joshuaskillup · Skill Up Class 12 Learning Portal", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

test("brand sharing preview is a real 1200 by 630 PNG", async ({ page }) => {
  const image = await page.request.get("/opengraph-image");
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toContain("image/png");
  const bytes = await image.body();
  expect(bytes.toString("ascii", 1, 4)).toBe("PNG");
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(630);
});
