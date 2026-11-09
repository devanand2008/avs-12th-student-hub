import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import inventory from "../docs/materials-folder-nov5-inventory.json";
import catalog from "../src/lib/additional-materials-catalog.json";
import resources from "../src/lib/additional-materials-resources.json";
import textbooks from "../src/lib/textbooks-catalog.json";
import { MATERIAL_CHAPTERS } from "../src/lib/learning-materials";

test("November lessons resolve to active source-book chapters and distinguish general guidance", async () => {
  const guidance = inventory.supplementaryEvidence;
  for (const source of inventory.additions) {
    assert.deepEqual(
      catalog.find((r) => r.file === source.file),
      source,
    );
    const book = textbooks.books.find((b) => `tb-${b.id}` === source.subjectId);
    assert.ok(book, source.file);
    assert.equal(book.medium, source.language);
    const chapter = [
      ...inventory.registeredChapters,
      ...MATERIAL_CHAPTERS,
    ].find((c) => c.id === source.chapterId);
    assert.ok(chapter?.isActive, source.chapterId);
    assert.equal(chapter.subjectId, source.subjectId);
    assert.equal(chapter.bookId, book.id);
    if (source.chapterId === guidance.chapterId) {
      assert.equal(source.file, guidance.video);
      assert.equal(guidance.isTextbookChapter, false);
      assert.equal(chapter.chapterNumber, 0);
      assert.match(chapter.title, /not a textbook chapter/);
      assert.match(source.description, /cross-chapter/);
    } else {
      const evidence = inventory.chapterEvidence.find(
        (e) =>
          e.bookId === book.id &&
          source.chapterId === `${source.subjectId}-ch-${e.chapter}`,
      );
      assert.ok(evidence, source.file);
      assert.equal(chapter.chapterNumber, evidence.chapter);
    }
    assert.match(source.description, /not been teacher-verified/);
  }
});

test("new videos retain deterministic IDs, measured media metadata and exact source hashes", async () => {
  const ids = new Set<string>();
  const hashes = new Set<string>();
  for (const s of inventory.additions) {
    const row = resources.find((r) => r.resource.sourceFile === s.file);
    assert.ok(row);
    const r = row.resource;
    assert.equal(row.kind, "video");
    assert.equal(
      r.id,
      "video-import-" +
        createHash("sha256").update(s.file).digest("hex").slice(0, 24),
    );
    assert.ok(!ids.has(r.id));
    ids.add(r.id);
    assert.ok(!hashes.has(s.sha256));
    hashes.add(s.sha256);
    const bytes = await readFile("book's/" + s.file);
    assert.equal(bytes.length, s.sizeBytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), s.sha256);
    assert.equal(bytes.toString("ascii", 4, 8), "ftyp");
    assert.ok(typeof r.durationSeconds === "number" && r.durationSeconds > 0);
    assert.equal(r.durationSeconds, s.durationSeconds);
    assert.equal(r.videoUrl, s.hostedUrl);
    assert.equal(r.chapterId, s.chapterId);
    const poster = await readFile("public" + s.thumbnailUrl);
    assert.equal(poster.readUInt16BE(0), 0xffd8);
  }
  assert.equal(ids.size, inventory.newUniqueVideos);
});

test("similarly named plant-breeding editions and eddy-current lessons remain separate", () => {
  for (const pattern of [/Plant_Breeding/, /Eddy_Currents/]) {
    const variants = inventory.additions.filter((s) => pattern.test(s.file));
    assert.ok(variants.length > 1);
    assert.equal(new Set(variants.map((s) => s.sha256)).size, variants.length);
    assert.equal(new Set(variants.map((s) => s.title)).size, variants.length);
  }
  assert.equal(inventory.newPdfs, 0);
  assert.equal(
    inventory.physicalFiles - inventory.videoAliases,
    inventory.byteUniqueResources,
  );
  assert.equal(
    inventory.uniqueVideos + inventory.pdfs,
    inventory.byteUniqueResources,
  );
});
