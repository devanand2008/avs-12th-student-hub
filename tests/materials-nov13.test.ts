import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import inventory from "../docs/materials-folder-nov13-inventory.json";
import resources from "../src/lib/additional-materials-resources.json";
import catalog from "../src/lib/additional-materials-catalog.json";
import chapters from "../src/lib/ai-study-chapters.json";
import { MATERIAL_CHAPTERS } from "../src/lib/learning-materials";
import { materialId } from "../scripts/lib/material-inspection";

test("November 13 source inventory accounts for new files and byte-identical aliases", () => {
  assert.equal(inventory.physicalFiles, 377);
  assert.equal(inventory.physicalVideos, 308);
  assert.equal(inventory.pdfs, 69);
  assert.equal(inventory.byteUniqueResources, 366);
  assert.equal(inventory.uniqueVideos, 297);
  assert.equal(inventory.duplicateAliases, 11);
  assert.equal(inventory.previousFilesUnchanged, 362);
  assert.equal(inventory.newVideos, 5);
  assert.equal(inventory.newPdfs, 10);
  assert.equal(
    new Set(inventory.additions.map((item) => item.sha256)).size,
    15,
  );
});

test("all new resources retain unique IDs, source hashes and playable download URLs", () => {
  for (const item of inventory.additions) {
    const id = materialId(item.kind as "video" | "note", item.file);
    const matches = resources.filter((row) => row.resource.id === id);
    assert.equal(matches.length, 1);
    const resource = matches[0].resource;
    assert.equal(resource.sourceFile, item.file);
    assert.equal(resource.sha256, item.sha256);
    assert.equal(resource.sizeBytes, item.sizeBytes);
    assert.equal(resource.chapterId, item.chapterId);
    assert.equal(resource.subjectId, item.subjectId);
    assert.equal(resource.isPublished, true);
    assert.match(resource.description, /await teacher/);
    const url = "videoUrl" in resource ? resource.videoUrl : resource.pdfUrl;
    assert.equal(url, item.hostedUrl);
    assert.ok(
      url?.endsWith(item.sha256 + (item.kind === "video" ? ".mp4" : ".pdf")),
    );
    assert.equal(catalog.filter((row) => row.file === item.file).length, 1);
  }
});

test("five English genetics lessons map to the registered Bio-Zoology Chapter 5", () => {
  const videos = inventory.additions.filter((item) => item.kind === "video");
  assert.equal(videos.length, 5);
  for (const item of videos) {
    assert.equal(item.language, "English");
    assert.equal(item.subjectId, "tb-12-bio-zoology-english-7e848813");
    assert.equal(item.chapterId, item.subjectId + "-ch-5");
    assert.ok(chapters.some((chapter) => chapter.id === item.chapterId));
    assert.ok(item.durationSeconds && item.durationSeconds > 300);
    const bytes = fs.readFileSync("public" + item.thumbnailUrl);
    assert.equal(bytes.readUInt16BE(0), 0xffd8);
    assert.match(item.description, /Molecular Genetics/);
  }
});

test("handwritten PDF counts use actual pages and preserve the combined Complex Numbers topic", () => {
  const notes = inventory.additions.filter((item) => item.kind === "note");
  assert.equal(
    notes.reduce((count, item) => count + (item.pageCount || 0), 0),
    161,
  );
  assert.equal(inventory.newPdfPages, 161);
  assert.equal(
    notes.filter((item) => item.chapterId === "maths-ch-1").length,
    8,
  );
  const combined = notes.find((item) =>
    item.file.includes("Combined_42_Pages"),
  )!;
  assert.equal(combined.chapterId, "maths-ch-2");
  assert.equal(combined.topic, "Complex Numbers");
  assert.equal(combined.pageCount, 42);
  const theory = notes.find((item) => item.chapterId === "maths-ch-3")!;
  assert.equal(theory.pageCount, 32);
  assert.doesNotMatch(
    notes.find((item) => item.file.includes("Exercise_1_2_"))!.title,
    /additional/i,
  );
  assert.equal(
    notes.find((item) => item.file.includes("Exercise_1_7_"))!.pageCount,
    6,
  );
  for (const item of notes) {
    assert.ok(
      MATERIAL_CHAPTERS.some((chapter) => chapter.id === item.chapterId),
    );
    const resource = resources.find(
      (row) => row.resource.id === materialId("note", item.file),
    )!.resource;
    assert.ok("pdfUrl" in resource);
    assert.deepEqual(resource.pages, []);
    assert.equal(resource.downloadAllowed, true);
  }
});

test("each inspected source has complete hash, size and preview provenance", () => {
  assert.equal(inventory.allFiles.length, inventory.physicalFiles);
  for (const source of inventory.allFiles) {
    assert.match(source.sha256, /^[a-f0-9]{64}$/);
    assert.ok(source.sizeBytes > 0);
  }
  for (const video of inventory.evidence.videos)
    assert.equal(video.frames.length, 3);
  for (const pdf of inventory.evidence.pdfs) {
    assert.ok(pdf.sampledPdfPages.includes(1));
    assert.ok(pdf.sampledPdfPages.includes(pdf.pageCount));
  }
});
