import assert from "node:assert/strict";
import test from "node:test";
import { materialId, mp4Duration } from "../scripts/lib/material-inspection";
import { SOURCE_MATERIALS } from "../src/lib/learning-materials";
import { getSubjects, getChapterById } from "../src/lib/db";

process.env.DB_DRIVER = "memory";
process.env.ENABLE_DEMO_DATA = "true";

test("both student streams can find Mathematics and Tamil materials", async () => {
  for (const stream of ["Computer Science", "Biology"] as const) {
    const subjects = await getSubjects(stream);
    for (const subjectId of ["sub-maths", "sub-tamil"]) {
      assert.ok(subjects.some((subject) => subject.id === subjectId));
    }
  }
  for (const source of SOURCE_MATERIALS) {
    const chapter = await getChapterById(source.chapterId);
    assert.ok(chapter?.isActive, source.file);
    assert.equal(chapter.subjectId, source.subjectId);
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
