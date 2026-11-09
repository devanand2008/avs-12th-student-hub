import assert from "node:assert/strict";
import test from "node:test";
import inventory from "../docs/materials-folder-nov9-inventory.json";
import catalog from "../src/lib/additional-materials-catalog.json";
import resources from "../src/lib/additional-materials-resources.json";
import aliases from "../src/lib/video-source-aliases.json";
import studyChapters from "../src/lib/ai-study-chapters.json";

test("November 9 Class 12 Physics video additions maintain correct curriculum mappings and metadata", () => {
  assert.equal(inventory.physicalFiles, 311);
  assert.equal(inventory.physicalVideos, 252);
  assert.equal(inventory.uniqueVideos, 244);
  assert.equal(inventory.videoAliases, 8);
  assert.equal(inventory.byteUniqueResources, 303);
  assert.equal(inventory.newUniqueVideos, 39);
  assert.equal(inventory.newAliases, 1);
  assert.equal(inventory.additions.length, 39);

  for (const s of inventory.additions) {
    const catalogEntry = catalog.find((c) => c.sha256 === s.sha256);
    assert.ok(catalogEntry, `Catalog entry missing for ${s.file}`);
    assert.equal(catalogEntry.file, s.file);
    assert.equal(catalogEntry.chapterId, s.chapterId);
    assert.equal(catalogEntry.subjectId, s.subjectId);
    assert.equal(catalogEntry.language, s.language);
    assert.equal(catalogEntry.durationSeconds, s.durationSeconds);

    const resourceRow = resources.find(
      (r) => r.resource.sourceFile === s.file,
    );
    assert.ok(resourceRow, `Runtime resource missing for ${s.file}`);
    assert.equal(resourceRow.kind, "video");
    assert.equal(resourceRow.resource.chapterId, s.chapterId);
    assert.equal(resourceRow.resource.subjectId, s.subjectId);
    assert.equal(resourceRow.resource.language, s.language);
    assert.equal(resourceRow.resource.durationSeconds, s.durationSeconds);
    assert.equal(resourceRow.resource.videoUrl, s.hostedUrl);
    assert.equal(resourceRow.resource.embedType, "mp4");
    assert.equal(resourceRow.resource.isPublished, true);

    const chapter = studyChapters.find(
      (c: { id: string }) => c.id === s.chapterId,
    );
    assert.ok(chapter, `Registered chapter not found: ${s.chapterId}`);
    assert.equal(chapter.subjectId, s.subjectId);
  }

  assert.equal(
    new Set(resources.map((r) => r.resource.id)).size,
    resources.length,
    "All resource IDs must be unique",
  );
  assert.equal(resources.length, 236);
  assert.equal(catalog.length, 236);
});

test("video alias map resolves duplicate Nov 9 Maxwell physical video without double-counting", () => {
  const alias = aliases.find(
    (a) => a.file === "phy/video/Maxwell_s_Missing_Piece (1).mp4",
  );
  assert.ok(alias, "Alias entry must exist in video-source-aliases.json");
  assert.equal(
    alias.canonicalFile,
    "phy/video/Maxwell_s_Missing_Piece.mp4",
  );
  assert.equal(
    alias.sha256,
    "f522729cfe56676aa76f097c833e1483a958f3bf0368564669550c17e20bd2f6",
  );
  assert.equal(aliases.length, 8);
});
