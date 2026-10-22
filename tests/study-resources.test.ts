import assert from "node:assert/strict";
import test from "node:test";
import manifest from "../src/lib/study-resources-catalog.json";
import { studyResources, resourceSubjects } from "../src/lib/study-resources";
import {
  resourceSchema,
  resourceMatches,
  validateResourceManifest,
} from "../src/lib/study-resource-schema";
import { youtubeEmbedUrl } from "../src/lib/media";
test("resource registry uses real subject metadata, unique identities and separate source/licence/embedding states", () => {
  assert.equal(
    validateResourceManifest(manifest, resourceSubjects).resources.length,
    99,
  );
  assert.equal(new Set(studyResources.map((r) => r.id)).size, 99);
  const papers = studyResources.filter((r) => r.category === "question-papers");
  assert.deepEqual(papers.map((r) => r.year).sort(), [2023, 2024, 2025, 2026]);
  assert(
    papers.every(
      (r) =>
        r.rights === "official_access_terms_unclear" &&
        !r.localAsset &&
        r.pdfUrl,
    ),
  );
  assert.equal(
    studyResources.filter((r) => r.rights === "openly_licensed").length,
    4,
  );
  assert.equal(studyResources.filter((r) => r.localAsset).length, 0);
  const videos = studyResources.filter((r) => r.category === "video-lessons");
  assert.equal(videos.length, 9);
  assert(
    videos.every(
      (r) =>
        r.embedding === "oembed_supported" && youtubeEmbedUrl(r.originalUrl),
    ),
  );
  assert(videos.some((r) => r.status === "temporary_unverified"));
});
test("search and category filters use actual English/Tamil title, medium, year, type and publisher metadata", () => {
  const paper = studyResources.find((r) => r.id === "dge-hse2-march-2025")!;
  assert(
    resourceMatches(paper, {
      subject: "Physics",
      medium: "Tamil",
      year: "2025",
      type: "Public exam collection",
      source: paper.publisher,
    }),
  );
  assert(!resourceMatches(paper, { year: "2022" }));
  assert(!resourceMatches(paper, { subject: "not-in-registry" }));
  assert(
    studyResources.some((r) => resourceMatches(r, { q: "முப்பட்டகத்தின்" })),
  );
  assert(studyResources.every((r) => resourceMatches(r, {})));
});
test("unsafe URLs, fabricated embedding, licence claims, duplicate resources and unknown subjects fail validation", () => {
  const item = structuredClone(studyResources[0]);
  for (const url of [
    "javascript:alert(1)",
    "http://example.test/paper.pdf",
    "https://user:password@example.test/a",
    "https://localhost/a",
  ]) {
    assert.equal(
      resourceSchema.safeParse({ ...item, originalUrl: url }).success,
      false,
    );
  }
  assert.equal(
    resourceSchema.safeParse({
      ...item,
      category: "video-lessons",
      originalUrl: "https://example.com/iframe",
    }).success,
    false,
  );
  assert.equal(
    resourceSchema.safeParse({
      ...item,
      rights: "openly_licensed",
      licence: null,
      licenceUrl: null,
    }).success,
    false,
  );
  assert.equal(
    resourceSchema.safeParse({
      ...item,
      localAsset: "/resources/a.pdf",
      redistribution: "unclear",
    }).success,
    false,
  );
  assert.equal(
    resourceSchema.safeParse({ ...item, iframeHtml: "<iframe src='evil'>" })
      .success,
    false,
  );
  assert.throws(
    () =>
      validateResourceManifest(
        { version: 1, resources: [item, item] },
        resourceSubjects,
      ),
    /Duplicate/,
  );
  assert.throws(
    () =>
      validateResourceManifest(
        {
          version: 1,
          resources: [{ ...item, subjects: ["Fabricated subject"] }],
        },
        resourceSubjects,
      ),
    /Unknown textbook subject/,
  );
});
