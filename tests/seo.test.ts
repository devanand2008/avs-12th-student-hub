import test from "node:test";
import assert from "node:assert/strict";
import {
  pageMetadata,
  privateMetadata,
  publicSearchPaths,
  searchableResources,
  SITE_URL,
  websiteStructuredData,
  SEO_BRAND,
  SEO_KEYWORDS,
  seoPages,
} from "../src/lib/seo";
import sitemap from "../src/app/sitemap";
import robots from "../src/app/robots";

test("search sitemap contains unique public canonical URLs without private or pending resources", () => {
  const paths = publicSearchPaths();
  assert.equal(new Set(paths).size, paths.length);
  for (const path of paths)
    assert.doesNotMatch(
      path,
      /^\/(api|admin|login|register|dashboard|profile|practice|notes|videos|search|performance|bookmarks)(\/|$)|\?|#|temporary/,
    );
  for (const resource of searchableResources)
    assert.equal(resource.status, "listed");
  assert.deepEqual(
    sitemap().map((entry) => entry.url),
    paths.map((path) => new URL(path, SITE_URL).href),
  );
  assert.ok(sitemap().every((entry) => !entry.lastModified));
  assert.equal(robots().sitemap, `${SITE_URL}/sitemap.xml`);
  assert.deepEqual(robots().rules, {
    userAgent: "*",
    allow: "/",
    disallow: ["/api/"],
  });
});
test("public metadata opts into indexing and uses the production canonical and social preview", () => {
  for (const path of [
    "/",
    "/resources",
    "/models",
    "/ai-study-tools",
    "/textbooks",
    "/resources/guides",
  ] as const) {
    const metadata = pageMetadata(path);
    assert.deepEqual(metadata.robots, { index: true, follow: true });
    assert.equal(metadata.alternates?.canonical, new URL(path, SITE_URL).href);
    assert.ok(metadata.description && metadata.description.length > 60);
    assert.equal(metadata.openGraph?.url, new URL(path, SITE_URL).href);
  }
  assert.deepEqual(privateMetadata.robots, { index: false, follow: false });
  assert.equal(websiteStructuredData.url, SITE_URL);
  assert.equal(websiteStructuredData["@type"], "WebSite");
  assert.deepEqual(websiteStructuredData.inLanguage, ["en", "ta"]);
  assert.equal(websiteStructuredData.name, SEO_BRAND);
  assert.ok(websiteStructuredData.alternateName.includes("Skill Up"));
  assert.match(pageMetadata("/").description!, /joshuaskillup/);
  assert.match(JSON.stringify(pageMetadata("/").title), /joshuaskillup/);
});

test("brand titles and bilingual search terms reflect real public content without duplicate names", () => {
  for (const path of Object.keys(seoPages) as (keyof typeof seoPages)[]) {
    const m = pageMetadata(path);
    const title = (m.title as { absolute: string }).absolute;
    assert.equal(title.toLowerCase().split(SEO_BRAND).length - 1, 1);
    assert.equal(m.openGraph?.siteName, SEO_BRAND);
    assert.ok(m.twitter && "card" in m.twitter);
    assert.equal(m.twitter.card, "summary_large_image");
  }
  assert.equal(new Set(SEO_KEYWORDS).size, SEO_KEYWORDS.length);
  assert.ok(SEO_KEYWORDS.some((word) => /[\u0B80-\u0BFF]/u.test(word)));
  assert.ok(publicSearchPaths().includes("/resources/guides"));
  assert.ok(!("aggregateRating" in websiteStructuredData));
  assert.ok(!("potentialAction" in websiteStructuredData));
});
