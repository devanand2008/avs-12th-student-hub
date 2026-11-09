import assert from "node:assert/strict";
import test from "node:test";
import { materialId, mp4Duration } from "../scripts/lib/material-inspection";
import { SOURCE_MATERIALS } from "../src/lib/learning-materials";
import { getSubjects, getChapterById } from "../src/lib/db";
import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import videoAliases from "../src/lib/video-source-aliases.json";
import videoCatalog from "../src/lib/video-lessons-catalog.json";
import additionalCatalog from "../src/lib/additional-materials-catalog.json";
import refreshInventory from "../docs/materials-folder-refresh-inventory.json";
import octoberInventory from "../docs/materials-folder-oct31-inventory.json";
import currentElectricityInventory from "../docs/materials-folder-oct31b-inventory.json";
import zoologyInventory from "../docs/materials-folder-oct31c-inventory.json";
import textbookCatalog from "../src/lib/textbooks-catalog.json";
import novemberInventory from "../docs/materials-folder-nov2-inventory.json";
import magnetismInventory from "../docs/materials-folder-nov4-inventory.json";
import ecologyInventory from "../docs/materials-folder-nov4b-inventory.json";

test("ecology videos use real Botany chapters and retain distinct succession editions", () => {
  const hashes = new Set<string>();
  for (const source of ecologyInventory.additions) {
    assert.ok(!hashes.has(source.sha256));
    hashes.add(source.sha256);
    assert.deepEqual(
      additionalCatalog.find((s) => s.file === source.file),
      source,
    );
    const book = textbookCatalog.books.find(
      (b) => `tb-${b.id}` === source.subjectId,
    );
    assert.equal(book?.subject, "Bio-Botany");
    assert.equal(book?.medium, source.language);
    assert.equal(source.language, "English");
    assert.ok(
      [6, 7, 8].some(
        (ch) => source.chapterId === `${source.subjectId}-ch-${ch}`,
      ),
    );
    assert.match(source.description, /not been teacher-verified/);
  }
  assert.equal(hashes.size, ecologyInventory.newUniqueVideos);
  const variants = ecologyInventory.additions.filter((s) =>
    /Ecosystem___Succession(?: \(1\))?\.mp4$/.test(s.file),
  );
  assert.equal(variants.length, 2);
  assert.equal(new Set(variants.map((s) => s.sha256)).size, 2);
  assert.equal(new Set(variants.map((s) => s.title)).size, 2);
});

test("magnetism resources preserve medium-specific Unit 3 mapping and one canonical duplicate", () => {
  const seen = new Set<string>();
  for (const source of magnetismInventory.additions) {
    assert.ok(!seen.has(source.sha256));
    seen.add(source.sha256);
    assert.deepEqual(
      additionalCatalog.find((s) => s.file === source.file),
      source,
    );
    const book = textbookCatalog.books.find(
      (b) => `tb-${b.id}` === source.subjectId,
    );
    assert.equal(book?.subject, "Physics");
    assert.equal(book?.volume, "1");
    assert.equal(book?.medium, source.language);
    assert.equal(source.chapterId, `${source.subjectId}-ch-3`);
    assert.ok(source.durationSeconds > 0);
    assert.match(source.description, /not been teacher-verified/);
  }
  assert.equal(seen.size, magnetismInventory.newUniqueVideos);
  const aliases = magnetismInventory.aliases.filter((a) =>
    /காந்தவியலின்_ரகசியங்கள்/.test(a.file),
  );
  assert.equal(aliases.length, 1);
  assert.equal(
    aliases[0].canonicalFile,
    "phy/video/காந்தவியலின்_ரகசியங்கள்.mp4",
  );
  assert.ok(!additionalCatalog.some((s) => s.file === aliases[0].file));
});

test("Botany folder refresh maps source content to registered chapters without duplicating editions", () => {
  assert.equal(novemberInventory.additions.length, 20);
  assert.equal(novemberInventory.uniqueVideos, 146);
  assert.equal(novemberInventory.pdfs, 57);
  const mapping = new Map(novemberInventory.additions.map((s) => [s.file, s]));
  const misnamed = mapping.get("bio/bio/video/botany chap 2 video 2.mp4")!;
  assert.ok(misnamed.chapterId.endsWith("-ch-1"));
  assert.match(misnamed.description, /opening slide identifies Chapter 1/);
  for (const s of novemberInventory.additions) {
    assert.equal(s.subjectId, "tb-12-bio-botany-english-f15d4524");
    assert.match(s.description, /have not been teacher-verified/);
    assert.equal(
      additionalCatalog.filter((r) => r.sha256 === s.sha256).length,
      1,
    );
  }
  const editions = novemberInventory.additions.filter((s) =>
    /Plant_Tissue_Culture(?: \(\d\))?\.mp4$/.test(s.file),
  );
  assert.equal(editions.length, 3);
  assert.equal(new Set(editions.map((s) => s.sha256)).size, 3);
  assert.equal(new Set(editions.map((s) => s.title)).size, 3);
});

process.env.DB_DRIVER = "memory";
process.env.ENABLE_DEMO_DATA = "true";

test("both student streams can find Mathematics and Tamil materials", async () => {
  for (const stream of ["Computer Science", "Biology"] as const) {
    const subjects = await getSubjects(stream);
    for (const subjectId of ["sub-maths", "sub-tamil", "sub-english"]) {
      assert.ok(subjects.some((subject) => subject.id === subjectId));
    }
  }
  for (const source of SOURCE_MATERIALS) {
    const chapter = await getChapterById(source.chapterId);
    assert.ok(chapter?.isActive, source.file);
    assert.equal(chapter.subjectId, source.subjectId);
  }
});

test("new supplied videos resolve to active registered chapters and preserve their subjects", async () => {
  for (const addition of refreshInventory.additions) {
    const source = additionalCatalog.find(
      (item) => item.file === addition.file,
    );
    assert.ok(source, addition.file);
    const chapter = await getChapterById(source.chapterId);
    assert.ok(chapter?.isActive, addition.file);
    assert.equal(chapter.subjectId, source.subjectId, addition.file);
    assert.ok(chapter.chapterNumber > 0, addition.file);
  }
});

test("October 31 videos retain registered medium/chapter mappings and source warnings", async () => {
  const ids = new Set<string>();
  for (const source of octoberInventory.additions) {
    assert.ok(!ids.has(source.file), source.file);
    ids.add(source.file);
    assert.deepEqual(
      additionalCatalog.find((s) => s.file === source.file),
      source,
    );
    if (source.subjectId === "sub-maths") {
      const chapter = await getChapterById(source.chapterId);
      assert.equal(chapter?.subjectId, source.subjectId);
      assert.equal(chapter?.isActive, true);
    } else {
      const book = textbookCatalog.books.find(
        (b) => `tb-${b.id}` === source.subjectId,
      );
      assert.ok(book, source.file);
      assert.equal(book.subject, "Physics");
      assert.equal(book.medium, source.language);
      const mapping = octoberInventory.chapterMappings.find(
        (m) => m.file === source.file,
      );
      assert.equal(mapping?.chapterId, source.chapterId);
      assert.match(source.chapterId, /-ch-[1-5]$/);
      assert.ok(mapping?.registeredTitle);
    }
    assert.match(source.description, /not been teacher-verified/);
  }
  const incorrect = octoberInventory.additions.find((s) =>
    s.file.endsWith("Origin_of_Everyday_Forces.mp4"),
  );
  assert.ok(incorrect);
  assert.match(incorrect.description, /captions are reversed/);
  assert.match(
    incorrect.description,
    /Like charges repel; unlike charges attract/,
  );
});

test("new current-electricity videos use the matching textbook medium and existing Unit 2", () => {
  const files = new Set<string>();
  for (const source of currentElectricityInventory.additions) {
    assert.ok(!files.has(source.file), source.file);
    files.add(source.file);
    assert.deepEqual(
      additionalCatalog.find((s) => s.file === source.file),
      source,
    );
    const book = textbookCatalog.books.find(
      (b) => `tb-${b.id}` === source.subjectId,
    );
    assert.ok(book, source.file);
    assert.equal(book.subject, "Physics");
    assert.equal(book.medium, source.language);
    assert.equal(source.chapterId, `${source.subjectId}-ch-2`);
    assert.match(source.description, /not been teacher-verified/);
  }
  assert.equal(files.size, currentElectricityInventory.newUniqueVideos);
});

test("new reproductive-health and inheritance lessons map to active Zoology chapters", async () => {
  const files = new Set<string>();
  for (const source of zoologyInventory.additions) {
    assert.ok(!files.has(source.file), source.file);
    files.add(source.file);
    assert.deepEqual(
      additionalCatalog.find((s) => s.file === source.file),
      source,
    );
    assert.equal(source.subjectId, "sub-zoology");
    assert.ok(["zoo-ch-3", "zoo-ch-4"].includes(source.chapterId));
    const chapter = await getChapterById(source.chapterId);
    assert.equal(chapter?.subjectId, source.subjectId);
    assert.equal(chapter?.isActive, true);
    assert.match(source.description, /not been teacher-verified/);
  }
  assert.equal(files.size, zoologyInventory.newUniqueVideos);
});

test("every supplied video is catalogued once or linked to a byte-identical existing video", async () => {
  const root = path.resolve("book's");
  async function walk(dir: string): Promise<string[]> {
    const found: string[] = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) found.push(...(await walk(file)));
      else if (/\.mp4$/i.test(file))
        found.push(path.relative(root, file).replaceAll("\\", "/"));
    }
    return found;
  }
  const videos = [...SOURCE_MATERIALS, ...additionalCatalog].filter(
    (source) => source.kind === "video",
  );
  assert.deepEqual(
    (await walk(root)).sort(),
    [...videos.map((v) => v.file), ...videoAliases.map((a) => a.file)].sort(),
  );
  const hashes = new Map<string, string>();
  for (const video of videos) {
    const buffer = await readFile(path.join(root, video.file));
    const sha = createHash("sha256").update(buffer).digest("hex");
    assert.ok(!hashes.has(sha), `Duplicate playlist item: ${video.file}`);
    hashes.set(sha, video.file);
    assert.ok(mp4Duration(buffer) > 0);
    if (video.hostedUrl) {
      assert.equal(video.sha256, sha);
      assert.ok(video.hostedUrl.endsWith(`/${sha}.mp4`));
    }
  }
  for (const alias of videoAliases) {
    assert.equal(hashes.get(alias.sha256), alias.canonicalFile);
    assert.equal(
      createHash("sha256")
        .update(await readFile(path.join(root, alias.file)))
        .digest("hex"),
      alias.sha256,
    );
  }
});

test("new Tamil titles retain Unicode and video lessons have real source thumbnails", async () => {
  for (const video of videoCatalog) {
    assert.ok(!video.title.includes("?"), video.file);
    if (video.language === "Tamil") {
      assert.match(video.titleTamil, /[\u0b80-\u0bff]/u);
      assert.ok(!video.titleTamil.includes("?"));
    }
    assert.equal(video.subjectName, video.language);
    const image = await readFile(path.join("public", video.thumbnailUrl));
    assert.equal(image.readUInt16BE(0), 0xffd8);
  }
});

test("repeat imports use stable IDs including across Windows path separators", () => {
  const ids = SOURCE_MATERIALS.map((source) =>
    materialId(source.kind, source.file),
  );
  assert.equal(new Set(ids).size, SOURCE_MATERIALS.length);
  assert.equal(
    materialId("note", "maths/pdf/example.pdf"),
    materialId("note", "maths\\pdf\\example.pdf"),
  );
  assert.notEqual(
    materialId("note", "example.pdf"),
    materialId("video", "example.pdf"),
  );
});

function box(type: string, payload: Buffer) {
  const result = Buffer.alloc(payload.length + 8);
  result.writeUInt32BE(result.length);
  result.write(type, 4, "ascii");
  payload.copy(result, 8);
  return result;
}
test("MP4 duration reads late movie headers, 64-bit duration and rejects malformed media", () => {
  const header = Buffer.alloc(24);
  header.writeUInt32BE(1000, 12);
  header.writeUInt32BE(293125, 16);
  const file = Buffer.concat([
    box("ftyp", Buffer.from("mp42")),
    box("mdat", Buffer.alloc(30)),
    box("moov", box("mvhd", header)),
  ]);
  assert.equal(mp4Duration(file), 294);
  const longHeader = Buffer.alloc(32);
  longHeader[0] = 1;
  longHeader.writeUInt32BE(1000, 20);
  longHeader.writeBigUInt64BE(BigInt(486713), 24);
  assert.equal(mp4Duration(box("moov", box("mvhd", longHeader))), 487);
  assert.throws(() => mp4Duration(Buffer.from("not a video")), /Invalid MP4/);
  assert.throws(() => mp4Duration(box("mdat", Buffer.alloc(8))), /not found/);
  header.writeUInt32BE(0, 12);
  assert.throws(
    () => mp4Duration(box("moov", box("mvhd", header))),
    /Invalid MP4 duration/,
  );
});
