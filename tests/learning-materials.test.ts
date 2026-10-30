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
