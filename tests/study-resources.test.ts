import assert from "node:assert/strict";
import test from "node:test";
import manifest from "../src/lib/study-resources-catalog.json";
import {
  studyResources,
  resourceSubjects,
  resourceCurriculumReferences,
  visibleResources,
} from "../src/lib/study-resources";
import {
  resourceSchema,
  resourceMatches,
  validateResourceManifest,
  resourceFilterChoices,
} from "../src/lib/study-resource-schema";
import { youtubeEmbedUrl } from "../src/lib/media";
test("mark facets require specific printed subject and medium evidence, without invented chapter choices", () => {
  const papers = studyResources.filter(
    (r) => r.category === "question-papers" && r.status === "listed",
  );
  const tamil = resourceFilterChoices(papers, {
    subject: "Tamil",
    medium: "Tamil",
  });
  assert.deepEqual(tamil.marks, [1]);
  assert.deepEqual(tamil.chapters, []);
  assert.deepEqual(
    resourceFilterChoices(papers, { subject: "Physics" }).marks,
    [],
  );
  const paper = studyResources.find((r) => r.id === "dge-hse2-2022-archive")!;
  assert(
    resourceMatches(paper, { subject: "Tamil", medium: "Tamil", marks: "1" }),
  );
  assert(!resourceMatches(paper, { subject: "Physics", marks: "1" }));
  assert(!resourceMatches(paper, { medium: "English", marks: "1" }));
  assert(!resourceMatches(paper, { marks: "15" }));
  assert(!resourceMatches(paper, { chapter: "invented" }));
  assert(!resourceMatches(paper, { rights: "openly_licensed" }));
  assert.equal(
    resourceSchema.safeParse({
      ...paper,
      markFormats: [{ ...paper.markFormats[0], subject: "Invented" }],
    }).success,
    false,
  );
});
test("curriculum references reuse exact textbook IDs and retain volumes; pending archives and videos stay separate", () => {
  const book = studyResources.find(
    (r) =>
      r.id.startsWith("textbook-reference-") && r.title.includes("Physics"),
  )!;
  const refs = resourceCurriculumReferences(book);
  assert.equal(refs.length, 1);
  assert.equal(refs[0].subjectId, `tb-${refs[0].textbookId}`);
  assert.equal(book.id, `textbook-reference-${refs[0].textbookId}`);
  assert(refs[0].volume);
  assert.equal(studyResources.filter((r) => r.status === "listed").length, 17);
  assert.equal(
    studyResources.filter((r) => r.status === "temporary_unverified").length,
    86,
  );
  const archive = studyResources.find((r) => r.id === "dge-hse2-2021-archive")!;
  assert.equal(archive.session, null);
  assert.equal(archive.status, "temporary_unverified");
  assert(visibleResources.every((r) => r.availability !== "unavailable"));
});
test("download permissions and canonical duplicate identities reject misleading records", () => {
  const r = studyResources[0];
  assert.equal(
    resourceSchema.safeParse({ ...r, download: "local_permitted" }).success,
    false,
  );
  assert.throws(
    () =>
      validateResourceManifest(
        {
          version: 1,
          resources: [
            r,
            { ...r, id: "duplicate-fragment", pdfUrl: r.pdfUrl + "#page=2" },
          ],
        },
        resourceSubjects,
      ),
    /Duplicate resource identity/,
  );
  assert.equal(
    resourceSchema.safeParse({ ...r, title: "", publisher: "" }).success,
    false,
  );
  for (const url of [
    "https://youtube.com.evil.test/watch?v=DiWlqmIR1cY",
    "https://evil.test/embed/DiWlqmIR1cY",
    "https://www.youtube.com/watch?v=short",
    "javascript:alert(1)",
  ])
    assert.equal(youtubeEmbedUrl(url), null);
});
test("resource registry uses real subject metadata, unique identities and separate source/licence/embedding states", () => {
  assert.equal(
    validateResourceManifest(manifest, resourceSubjects).resources.length,
    103,
  );
  assert.equal(new Set(studyResources.map((r) => r.id)).size, 103);
  const papers = studyResources.filter((r) => r.category === "question-papers");
  assert.deepEqual(
    papers.map((r) => r.year).sort(),
    [2021, 2022, 2023, 2024, 2025, 2026],
  );
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
  assert.equal(videos.length, 11);
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
