import assert from "node:assert/strict";
import test from "node:test";
import { startPostgrestFixture } from "./helpers/postgrest";
import additions from "../src/lib/additional-materials-resources.json";

test("source material progress persists with its foreign key while canonical registration preserves stored edits and archives", async () => {
  const fixture = await startPostgrestFixture(0, true);
  const saved = { ...process.env };
  try {
    Object.assign(process.env, {
      DB_DRIVER: "",
      ENABLE_DEMO_DATA: "false",
      SUPABASE_URL: fixture.url,
      SUPABASE_SECRET_KEY: "qa-service-key",
      ADMIN_EMAIL: "qa-admin@example.test",
      ADMIN_INITIAL_PASSWORD: "QA-only-bootstrap-password",
    });
    const { ensureActivityResource, listResources, saveResource } =
      await import("../src/lib/content");
    const { requireSupabase } = await import("../src/lib/supabase/server");
    const db = await import("../src/lib/db");
    await db.initDatabase();
    const student = await db.getUserByLoginId("AVSBIO26-0001");
    assert.ok(student?.student);
    const client = requireSupabase();
    const note = additions.find((r) => r.kind === "note")!;
    const video = additions.find(
      (r) =>
        r.kind === "video" &&
        r.resource.createdAt === "2026-10-30T00:00:00.000Z",
    )!;
    for (const row of [note, video]) {
      const kind = row.kind as "note" | "video";
      const absent = await client
        .from("learning_resources")
        .select("id")
        .eq("id", row.resource.id);
      assert.ifError(absent.error);
      assert.equal(absent.data?.length, 0);
      await Promise.all([
        ensureActivityResource(kind, row.resource.id),
        ensureActivityResource(kind, row.resource.id),
      ]);
      const stored = await client
        .from("learning_resources")
        .select("resource")
        .eq("id", row.resource.id);
      assert.ifError(stored.error);
      assert.deepEqual(
        stored.data?.map((r) => r.resource),
        [row.resource],
      );
    }
    await db.recordVideoVisit(
      student.student.studentId,
      video.resource.id,
      15.25,
      4.5,
    );
    await db.recordNoteVisit(student.student.studentId, note.resource.id, 2);
    const activity = await db.getLearningActivity(student.student.studentId);
    assert.ok(
      activity.videos.some(
        (r) =>
          r.videoId === video.resource.id &&
          r.seconds === 15.25 &&
          r.percent === 4.5,
      ),
    );
    assert.ok(
      activity.notes.some((r) => r.noteId === note.resource.id && r.page === 2),
    );
    const archived = {
      ...video.resource,
      title: "Teacher edited this resource",
      isPublished: false,
    };
    await saveResource("video", archived as Parameters<typeof saveResource>[1]);
    await ensureActivityResource("video", video.resource.id);
    const retained = await client
      .from("learning_resources")
      .select("resource")
      .eq("id", video.resource.id)
      .single();
    assert.ifError(retained.error);
    assert.deepEqual(retained.data?.resource, archived);
    assert.ok(
      !(await listResources("video")).some((r) => r.id === video.resource.id),
    );
    await ensureActivityResource("video", "not-a-canonical-source");
    const unknown = await client
      .from("learning_resources")
      .select("id")
      .eq("id", "not-a-canonical-source");
    assert.ifError(unknown.error);
    assert.deepEqual(unknown.data, []);
  } finally {
    process.env = saved;
    await fixture.close();
  }
});
