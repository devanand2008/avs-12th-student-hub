import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import inventory from "../docs/materials-folder-nov12-inventory.json";
import catalog from "../src/lib/additional-materials-catalog.json";
import resources from "../src/lib/additional-materials-resources.json";
import aliases from "../src/lib/video-source-aliases.json";
import chapters from "../src/lib/ai-study-chapters.json";
import { materialId } from "../scripts/lib/material-inspection";

test("November 12 folder inventory accounts for every file and keeps distinct digital editions", () => {
  assert.equal(inventory.physicalFiles, 362);
  assert.equal(inventory.physicalVideos, 303);
  assert.equal(inventory.pdfs, 59);
  assert.equal(inventory.previousFilesUnchanged, 329);
  assert.equal(inventory.byteUniqueResources, 351);
  assert.equal(inventory.uniqueVideos, 292);
  assert.equal(inventory.additions.length, 32);
  assert.equal(inventory.videoAliases, 11);
  assert.equal(
    new Set(inventory.additions.map((item) => item.sha256)).size,
    32,
  );
  const editions = catalog.filter((item) =>
    /\/Digital_Electronics(?: \(1\))?\.mp4$/.test(item.file),
  );
  assert.equal(editions.length, 2);
  assert.notEqual(editions[0].sha256, editions[1].sha256);
  const alias = aliases.find(
    (item) => item.file === "phy/video/மின்னணு_தகவல்_தொடர்பு (1).mp4",
  )!;
  assert.equal(alias.canonicalFile, "phy/video/மின்னணு_தகவல்_தொடர்பு.mp4");
});

test("all 32 new videos have stable playable metadata, verified chapter IDs and source thumbnails", () => {
  for (const source of inventory.additions) {
    const row = resources.find(
      (item) => item.resource.id === materialId("video", source.file),
    )!;
    assert.ok(row);
    assert.equal(row.resource.sha256, source.sha256);
    assert.equal(row.resource.chapterId, source.chapterId);
    assert.equal(row.resource.subjectId, source.subjectId);
    assert.equal(row.resource.videoUrl, source.hostedUrl);
    assert.equal(row.resource.durationSeconds, source.durationSeconds);
    assert.equal(row.resource.isPublished, true);
    assert.match(row.resource.description, /have not been teacher-verified/);
    assert.ok(
      chapters.some(
        (chapter) =>
          chapter.id === source.chapterId &&
          chapter.subjectId === source.subjectId,
      ),
    );
    assert.ok(
      source.chapterId.endsWith("-ch-10") ||
        source.chapterId.endsWith("-ch-11"),
    );
    const image = fs.readFileSync("public" + source.thumbnailUrl);
    assert.equal(image.readUInt16BE(0), 0xffd8);
    if (source.language === "Tamil")
      assert.match(source.title, /[\u0b80-\u0bff]/u);
  }
  assert.equal(
    inventory.additions.filter((item) => item.language === "English").length,
    17,
  );
  assert.equal(
    inventory.additions.filter((item) => item.language === "Tamil").length,
    15,
  );
  assert.equal(
    inventory.additions.filter((item) => item.chapterId.endsWith("-ch-10"))
      .length,
    24,
  );
  assert.equal(
    inventory.additions.filter((item) => item.chapterId.endsWith("-ch-11"))
      .length,
    8,
  );
});

test("34 earlier Physics videos retain their IDs and move to the textbook's actual units", () => {
  assert.equal(inventory.mappingCorrections.length, 34);
  for (const change of inventory.mappingCorrections) {
    const source = catalog.find((item) => item.file === change.file)!;
    const row = resources.find((item) => item.resource.id === change.id)!;
    assert.equal(source.chapterId, change.newChapterId);
    assert.equal(row.resource.chapterId, change.newChapterId);
    assert.equal(row.resource.sourceFile, change.file);
    assert.equal(row.resource.id, materialId("video", change.file));
    assert.ok(chapters.some((chapter) => chapter.id === change.newChapterId));
  }
});
