import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import inventory from "../docs/materials-folder-nov6-inventory.json";
import catalog from "../src/lib/additional-materials-catalog.json";
import resources from "../src/lib/additional-materials-resources.json";

test("new scanned Chemistry editions retain source bytes, deterministic IDs and honest review status", async () => {
  for (const s of inventory.additions) {
    const source = await readFile("book's/" + s.file);
    assert.equal(source.subarray(0, 5).toString(), "%PDF-");
    assert.equal(source.length, s.sizeBytes);
    assert.equal(createHash("sha256").update(source).digest("hex"), s.sha256);
    assert.deepEqual(
      catalog.find((r) => r.file === s.file),
      s,
    );
    const row = resources.find((r) => r.resource.sourceFile === s.file);
    assert.ok(row);
    assert.equal(row.kind, "note");
    assert.equal(
      row.resource.id,
      "note-import-" +
        createHash("sha256").update(s.file).digest("hex").slice(0, 24),
    );
    assert.equal(row.resource.pdfUrl, s.hostedUrl);
    assert.equal(row.resource.pageCount, s.pageCount);
    assert.equal(row.resource.chapterId, s.chapterId);
    assert.match(row.resource.description, /not been teacher-verified/);
    assert.match(row.resource.description, /repeated or combined scans/);
    assert.equal(s.language, "English");
    assert.equal(s.subjectId, "tb-12-chemistry-english-v1-2d0e27cb");
    const chapter = inventory.registeredChapters.find(
      (c) => c.id === s.chapterId,
    );
    assert.ok(chapter?.isActive);
    assert.equal(chapter.subjectId, s.subjectId);
  }
  assert.deepEqual(
    inventory.additions.map((s) => [s.chapterId, s.pageCount]),
    [
      ["tb-12-chemistry-english-v1-2d0e27cb-ch-2", 53],
      ["tb-12-chemistry-english-v1-2d0e27cb-ch-1", 70],
    ],
  );
  assert.equal(
    new Set(resources.map((r) => r.resource.id)).size,
    resources.length,
  );
});

test("the folder inventory distinguishes physical aliases, new PDFs and unchanged videos", () => {
  assert.equal(inventory.physicalFiles, 271);
  assert.equal(inventory.previousFilesUnchanged, 269);
  assert.equal(inventory.newVideos, 0);
  assert.equal(inventory.newPdfs, 2);
  assert.equal(inventory.newPdfPages, 123);
  assert.equal(
    inventory.byteUniqueResources,
    inventory.uniqueVideos + inventory.pdfs,
  );
  assert.equal(
    inventory.physicalFiles - inventory.videoAliases,
    inventory.byteUniqueResources,
  );
  for (const s of inventory.additions) {
    assert.equal(catalog.filter((r) => r.sha256 === s.sha256).length, 1);
    assert.equal(catalog.filter((r) => r.file === s.file).length, 1);
  }
});
