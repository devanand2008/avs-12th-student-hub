import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { startPostgrestFixture } from "./helpers/postgrest";
import {
  MEDIA_PART_BYTES,
  mediaRange,
  validMediaHeader,
  mediaPartCount,
} from "../src/lib/media-upload-policy";
import { completeMediaUpload, findMediaUpload } from "../src/lib/media-uploads";
import { streamUploadedMedia } from "../src/lib/media-stream";
import { randomUUID } from "node:crypto";
import { giftPotential } from "../src/lib/score-potential";

test("ranges, file signatures and gift potential cover invalid and boundary cases", () => {
  assert.equal(mediaRange("bytes=3-2", 10), null);
  assert.equal(mediaRange("bytes=10-", 10), null);
  assert.equal(mediaRange("bytes=0-1,3-4", 10), null);
  assert.deepEqual(mediaRange("bytes=-3", 10), {
    start: 7,
    end: 9,
    partial: true,
  });
  assert.equal(mediaRange("bytes=0-", 10000000)?.end, MEDIA_PART_BYTES - 1);
  assert.equal(mediaPartCount(55 * 1024 * 1024), 14);
  assert.ok(validMediaHeader("application/pdf", Buffer.from("%PDF-1.7")));
  assert.ok(!validMediaHeader("application/pdf", Buffer.from("<html>")));
  assert.equal(giftPotential(25000), 25);
  assert.equal(giftPotential(200000), 100);
  assert.equal(giftPotential(-5), 0);
});
test("private multipart media survives resume, verifies parts, streams exact cross-part bytes and honours publication", async () => {
  const fixture = await startPostgrestFixture(0, true);
  const keys = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
    "DB_DRIVER",
  ];
  const old = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  process.env.SUPABASE_URL = fixture.url;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "qa-service-key";
  delete process.env.SUPABASE_SECRET_KEY;
  delete process.env.DB_DRIVER;
  const client = createClient(fixture.url, "qa-service-key");
  try {
    const id = randomUUID(),
      size = 55 * 1024 * 1024 + 17;
    await fixture.db.query(
      "insert into learning_media_uploads(id,created_by,name,fingerprint,mime,size_bytes) values($1,'qa-admin','Large lesson.mp4',$2,'video/mp4',$3)",
      [id, "a".repeat(64), size],
    );
    const storage = client.storage.from("learning-upload-parts");
    let upload = (await findMediaUpload(id))!;
    await assert.rejects(() => completeMediaUpload(upload), /missing/);
    for (let i = 0; i < mediaPartCount(size); i++) {
      const bytes = Buffer.alloc(
        Math.min(MEDIA_PART_BYTES, size - i * MEDIA_PART_BYTES),
        i + 1,
      );
      if (i === 0) bytes.write("ftyp", 4);
      const path = `${id}/${String(i).padStart(4, "0")}.part`;
      const signed = await storage.createSignedUploadUrl(path);
      assert.equal(signed.error, null);
      const r = await fetch(signed.data!.signedUrl, {
        method: "PUT",
        body: bytes,
        headers: { "Content-Type": "application/octet-stream" },
      });
      assert.equal(r.status, 200);
      if (i === 0) {
        assert.equal((await storage.list(id)).data?.length, 1);
        await assert.rejects(() => completeMediaUpload(upload), /missing/);
      }
    }
    await completeMediaUpload(upload);
    upload = (await findMediaUpload(id))!;
    assert.equal(upload.status, "complete");
    await completeMediaUpload(upload); // idempotent finalisation
    const req = (range?: string, method = "GET") =>
      new Request("http://localhost/api/media/" + id, {
        method,
        headers: range ? { Range: range } : {},
      });
    assert.equal((await streamUploadedMedia(req(), id, false)).status, 404);
    await fixture.db.query(
      "insert into learning_resources(id,kind,resource) values($1,'video',$2)",
      [
        "qa-video",
        JSON.stringify({
          id: "qa-video",
          isPublished: true,
          videoUrl: "/api/media/" + id,
        }),
      ],
    );
    const r = await streamUploadedMedia(
      req(`bytes=${MEDIA_PART_BYTES - 3}-${MEDIA_PART_BYTES + 3}`),
      id,
      false,
    );
    assert.equal(r.status, 206);
    assert.deepEqual(
      [...new Uint8Array(await r.arrayBuffer())],
      [1, 1, 1, 2, 2, 2, 2],
    );
    const suffix = await streamUploadedMedia(req("bytes=-4"), id, false);
    assert.deepEqual(
      [...new Uint8Array(await suffix.arrayBuffer())],
      [14, 14, 14, 14],
    );
    const head = await streamUploadedMedia(req(undefined, "HEAD"), id, false);
    assert.equal(head.headers.get("content-length"), String(size));
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    assert.equal(
      (await streamUploadedMedia(req("bytes=999999999-"), id, true)).status,
      416,
    );
    const full = await streamUploadedMedia(req(), id, false);
    assert.equal((await full.arrayBuffer()).byteLength, size);
    const cancel = await streamUploadedMedia(req(), id, true);
    await cancel.body!.cancel();
    const grants = await fixture.db.query<{ n: number }>(
      "select count(*)::int n from information_schema.role_table_grants where table_name='learning_media_uploads' and grantee in ('anon','authenticated')",
    );
    assert.equal(grants.rows[0].n, 0);
  } finally {
    for (const k of keys) {
      if (old[k] === undefined) delete process.env[k];
      else process.env[k] = old[k];
    }
    await fixture.close();
  }
});
