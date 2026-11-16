import assert from "node:assert/strict";
import test from "node:test";
import inventory from "../docs/materials-folder-nov15-inventory.json";
import resources from "../src/lib/additional-materials-resources.json";
import { MATERIAL_CHAPTERS } from "../src/lib/learning-materials";
import { materialId } from "../scripts/lib/material-inspection";

test("November 15 scan accounts for the complete supplied folder", () => {
  assert.equal(inventory.physicalFiles, 393);
  assert.equal(inventory.physicalVideos, 308);
  assert.equal(inventory.pdfs, 85);
  assert.equal(inventory.byteUniqueResources, 382);
  assert.equal(inventory.uniqueVideos, 297);
  assert.equal(inventory.duplicateAliases, 11);
  assert.equal(inventory.previousFilesUnchanged, 377);
  assert.equal(inventory.newPdfs, 16);
  assert.equal(inventory.newVideos, 0);
  assert.equal(inventory.newPdfPages, 141);
});

test("all supplied PDFs have unique IDs, complete metadata and existing chapter links", () => {
  assert.equal(
    new Set(inventory.additions.map((item) => item.sha256)).size,
    16,
  );
  assert.equal(
    inventory.additions.filter((item) => item.chapterId === "maths-ch-4")
      .length,
    6,
  );
  assert.equal(
    inventory.additions.filter((item) => item.chapterId === "maths-ch-6")
      .length,
    10,
  );
  for (const item of inventory.additions) {
    const matches = resources.filter(
      (row) => row.resource.id === materialId("note", item.file),
    );
    assert.equal(matches.length, 1);
    const actual = matches[0].resource;
    assert.equal(actual.sha256, item.sha256);
    assert.equal(actual.sizeBytes, item.sizeBytes);
    assert.equal(actual.pageCount, item.pageCount);
    assert.equal(actual.pdfUrl, item.hostedUrl);
    assert.equal(actual.sourceFile, item.file);
    assert.equal(actual.chapterId, item.chapterId);
    assert.deepEqual(actual.pages, []);
    assert.equal(actual.downloadAllowed, true);
    assert.ok(
      MATERIAL_CHAPTERS.some((chapter) => chapter.id === item.chapterId),
    );
    assert.match(item.description, /await teacher review/);
  }
});

test("partial and incomplete source warnings persist with the actual PDF records", () => {
  for (const exercise of ["4.1", "4.2"]) {
    const source = inventory.additions.find(
      (item) => item.exercise === exercise,
    )!;
    const actual = resources.find(
      (row) => row.resource.sourceFile === source.file,
    )!.resource;
    assert.ok(source.sourceWarnings?.length);
    assert.deepEqual(actual.sourceWarnings, source.sourceWarnings);
  }
  assert.match(
    inventory.additions.find((item) => item.exercise === "4.1")!.title,
    /Partial/,
  );
  assert.match(
    inventory.additions.find((item) => item.exercise === "4.2")!.description,
    /Additional Problem 3/,
  );
});

test("MCQ material remains downloadable revision notes with stable source evidence", () => {
  for (const exercise of ["4.6", "6.10"]) {
    const item = inventory.additions.find((row) => row.exercise === exercise)!;
    assert.equal(item.kind, "note");
    assert.equal(item.badge, "REVISION");
    assert.equal(item.pageCount, 10);
    assert.match(item.title, /MCQ revision PDF/);
    assert.ok(
      inventory.evidence.exercises.some((row) => row.exercise === exercise),
    );
  }
  const large = inventory.additions.find((item) => item.exercise === "6.1")!;
  assert.ok(large.sizeBytes > 50 * 1024 * 1024);
  assert.match(large.hostedUrl, /^https:\/\/github\.com\/devanand2008\//);
  for (const pdf of inventory.evidence.pdfs) {
    assert.ok(pdf.sampledPdfPages.includes(1));
    assert.ok(pdf.sampledPdfPages.includes(pdf.pageCount));
  }
});
