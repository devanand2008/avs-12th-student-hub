import assert from "node:assert/strict";
import test from "node:test";
import { startPostgrestFixture } from "./helpers/postgrest";
import {
  issueCompletionToken,
  readCompletionToken,
} from "../src/lib/completion-token";
test("supplied attempts bind the student, collection, question set and unique attempt ID", () => {
  const old = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET =
    "qa-only-attempt-secret-at-least-thirty-two-characters";
  try {
    const a = issueCompletionToken("student", "collection", ["a", "b"]);
    assert.deepEqual(readCompletionToken(a, "student", "collection")?.ids, [
      "a",
      "b",
    ]);
    assert.equal(readCompletionToken(a, "other", "collection"), null);
    assert.equal(readCompletionToken(a, "student", "other"), null);
    assert.equal(readCompletionToken(a + "x", "student", "collection"), null);
    assert.notEqual(
      readCompletionToken(a, "student", "collection")?.id,
      readCompletionToken(
        issueCompletionToken("student", "collection", ["a", "b"]),
        "student",
        "collection",
      )?.id,
    );
  } finally {
    if (old === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = old;
  }
});
test("gift eligibility, concurrent requests, authorised transitions, privacy and immutable audit", async () => {
  const fixture = await startPostgrestFixture(0, true),
    db = fixture.db;
  type GiftResult = {
    eligible: boolean;
    points: number;
    claim: { id: string; version: number; status: string } | null;
    history: unknown[];
  };
  try {
    const uid = (
      await db.query<{ id: string }>(
        "select id from avs_users where role='student' order by id limit 1",
      )
    ).rows[0].id;
    // Use the real seeded user ID, never a production user.
    const gift = async (request = false) =>
      (
        await db.query<{ r: GiftResult }>("select avs_student_gift($1,$2) r", [
          uid,
          request,
        ])
      ).rows[0].r;
    await db.query("select avs_touch_engagement($1)", [uid]);
    await db.query(
      "update avs_engagement_profiles set points=99999 where user_id=$1",
      [uid],
    );
    assert.equal((await gift(true)).claim, null);
    await db.query(
      "update avs_engagement_profiles set points=100000 where user_id=$1",
      [uid],
    );
    const requests = await Promise.all([gift(true), gift(true)]);
    assert.equal(requests[0].claim?.id, requests[1].claim?.id);
    assert.equal(requests[0].points, 100000);
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from avs_gift_claims",
        )
      ).rows[0].n,
      1,
    );
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from avs_gift_history",
        )
      ).rows[0].n,
      1,
    );
    const id = requests[0].claim!.id;
    const update = (
      actor: string,
      version: number,
      status: string,
      gift = "Science kit",
      note = "School office collection",
    ) =>
      db.query<{ r: boolean }>(
        "select avs_update_gift($1,$2,$3,$4,$5,$6,'private phone arrangement') r",
        [actor, id, version, status, gift, note],
      );
    await assert.rejects(update(uid, 1, "approved"), /Admin required/);
    await assert.rejects(
      update("qa-admin", 1, "delivered"),
      /Invalid transition/,
    );
    await assert.rejects(
      update("qa-admin", 1, "approved", ""),
      /Choose a gift/,
    );
    assert.equal((await update("qa-admin", 1, "approved")).rows[0].r, true);
    assert.equal((await update("qa-admin", 1, "approved")).rows[0].r, false);
    await assert.rejects(
      update("qa-admin", 2, "dispatched", "Science kit", ""),
      /required/,
    );
    await update("qa-admin", 2, "dispatched");
    await update("qa-admin", 3, "delivered");
    await assert.rejects(
      update("qa-admin", 4, "requested"),
      /Invalid transition/,
    );
    const visible = await gift();
    assert.equal(visible.claim?.status, "delivered");
    assert.equal(visible.history.length, 4);
    assert.equal(visible.points, 100000);
    assert.ok(!JSON.stringify(visible).includes("private phone"));
    await assert.rejects(
      db.query("select avs_admin_gifts($1)", [uid]),
      /Admin required/,
    );
    assert.ok(
      JSON.stringify(
        (await db.query("select avs_admin_gifts('qa-admin') r")).rows,
      ).includes("private phone"),
    );
    const permission = await db.query<{ allowed: boolean }>(
      "select has_function_privilege('anon','avs_student_gift(text,boolean)','execute') allowed",
    );
    assert.equal(permission.rows[0].allowed, false);
    assert.equal(
      (
        await db.query<{ allowed: boolean }>(
          "select has_table_privilege('authenticated','avs_gift_history','select') allowed",
        )
      ).rows[0].allowed,
      false,
    );
  } finally {
    await fixture.close();
  }
});
test("video completion requires nonoverlapping timed coverage; seeking, forged percent and retries cannot inflate points", async () => {
  const fixture = await startPostgrestFixture(0, true),
    db = fixture.db;
  try {
    const uid = (
      await db.query<{ id: string }>(
        "select id from avs_users where role='student' order by id limit 1",
      )
    ).rows[0].id;
    const track = async (position: number, phase: string) =>
      (
        await db.query<{
          r: { earned: number; complete: boolean; watchedPercent: number };
        }>("select avs_track_video_reward($1,'qa-video',20,$2,$3) r", [
          uid,
          position,
          phase,
        ])
      ).rows[0].r;
    const wait = () =>
      db.query(
        "update avs_video_reward_progress set seen_at=clock_timestamp()-interval '5 seconds' where user_id=$1",
        [uid],
      );
    await track(0, "start");
    assert.equal((await track(20, "ended")).earned, 0);
    await track(0, "seek");
    await track(0, "start");
    await wait();
    assert.equal((await track(10, "progress")).watchedPercent, 50);
    await track(0, "seek");
    await track(0, "start");
    await wait();
    assert.equal((await track(10, "progress")).watchedPercent, 50);
    await track(20, "seek");
    assert.equal((await track(20, "ended")).earned, 0);
    await track(10, "seek");
    await track(10, "start");
    await wait();
    assert.equal((await track(20, "ended")).earned, 10);
    assert.equal((await track(20, "ended")).earned, 0);
    assert.equal(
      (
        await db.query<{ points: number }>(
          "select points from avs_engagement_profiles where user_id=$1",
          [uid],
        )
      ).rows[0].points,
      10,
    );
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from avs_point_events where user_id=$1",
          [uid],
        )
      ).rows[0].n,
      1,
    );
  } finally {
    await fixture.close();
  }
});
