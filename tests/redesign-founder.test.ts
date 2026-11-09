import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { seoPages, pageMetadata } from "../src/lib/seo";

test("Founder page and portfolio integration are properly implemented", () => {
  const founderPagePath = path.join(process.cwd(), "src/app/founder/page.tsx");
  assert.ok(fs.existsSync(founderPagePath), "src/app/founder/page.tsx must exist");

  const founderContent = fs.readFileSync(founderPagePath, "utf-8");
  assert.match(founderContent, /Dr\.\s*D\.\s*R\.\s*Joshua/i, "Must contain Dr. D. R. Joshua");
  assert.match(founderContent, /Vice Principal/i, "Must identify Vice Principal");
  assert.match(founderContent, /AVS Engineering College/i, "Must identify AVS Engineering College");
  assert.match(founderContent, /https:\/\/dr-d-r-joshua-skillup\.vercel\.app\//i, "Must contain verified portfolio URL");
  assert.match(founderContent, /target="_blank"/i, "External links must open in a new tab");
  assert.match(founderContent, /rel="noopener noreferrer"/i, "External links must use secure rel attributes");
  assert.match(founderContent, /\/images\/joshua-introduction\.png/i, "Must reference the verified portrait asset");

  // Verify SEO entries
  assert.ok("/founder" in seoPages, "seoPages must contain /founder");
  const meta = pageMetadata("/founder");
  assert.ok(meta.description?.includes("Dr. D. R. Joshua"));
});

test("Navbar contains horizontally scrollable mobile nav with founder and scroll indicators", () => {
  const navbarPath = path.join(process.cwd(), "src/components/layout/Navbar.tsx");
  assert.ok(fs.existsSync(navbarPath), "src/components/layout/Navbar.tsx must exist");

  const navbarContent = fs.readFileSync(navbarPath, "utf-8");
  assert.match(navbarContent, /nav-horizontal-scroll/i, "Must use horizontal scroll styling");
  assert.match(navbarContent, /href="\/founder"/i, "Must link to /founder");
  assert.match(navbarContent, /scrollProgress/i, "Must compute horizontal scroll progress");
  assert.match(navbarContent, /canScrollLeft/i, "Must support scroll indicators");
  assert.match(navbarContent, /canScrollRight/i, "Must support scroll indicators");
  assert.match(navbarContent, /scrollIntoView/i, "Must scroll active item into view");
});

test("Homepage contains redesigned hero, 6 feature cards, journey steps, and founder spotlight", () => {
  const homePath = path.join(process.cwd(), "src/app/page.tsx");
  assert.ok(fs.existsSync(homePath), "src/app/page.tsx must exist");

  const homeContent = fs.readFileSync(homePath, "utf-8");
  assert.match(homeContent, /Learn Smarter\.\s*Score Higher\.[\s\S]*?Grow with SkillUp\./i, "Must contain requested headline");
  assert.match(homeContent, /Your complete Class 12 learning companion/i, "Must contain requested subtitle");
  assert.match(homeContent, /Start Learning/i, "Must have Start Learning CTA");
  assert.match(homeContent, /Explore Study Materials/i, "Must have Explore Study Materials CTA");
  assert.match(homeContent, /Dr\.\s*D\.\s*R\.\s*Joshua/i, "Must feature Dr. D. R. Joshua");
  assert.match(homeContent, /https:\/\/dr-d-r-joshua-skillup\.vercel\.app\//i, "Must link to verified founder portfolio");
  assert.match(homeContent, /href="\/founder"/i, "Must link to /founder");
});

test("Footer contains founder links and verified institutional address", () => {
  const footerPath = path.join(process.cwd(), "src/components/layout/Footer.tsx");
  assert.ok(fs.existsSync(footerPath), "src/components/layout/Footer.tsx must exist");

  const footerContent = fs.readFileSync(footerPath, "utf-8");
  assert.match(footerContent, /Founder – Dr\.\s*D\.\s*R\.\s*Joshua/i, "Must contain founder link");
  assert.match(footerContent, /href="\/founder"/i, "Must link to /founder");
  assert.match(footerContent, /https:\/\/dr-d-r-joshua-skillup\.vercel\.app\//i, "Must link to founder portfolio");
  assert.match(footerContent, /AVS Engineering College/i, "Must show institution name");
});
