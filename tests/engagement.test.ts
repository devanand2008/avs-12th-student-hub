import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { startPostgrestFixture } from "./helpers/postgrest";
import {
  awardPoints,
  engagementRpc,
  quizPointEvents,
  type EngagementBoard,
} from "../src/lib/engagement";
import {
  reminderMessage,
  runStudyReminders,
  unsubscribeOwner,
  unsubscribeToken,
} from "../src/lib/study-reminders";
import type { QuizSession } from "../src/types";

test("point plans award ten per fully completed attempt with stable retry keys", () => {
  const q = {
    id: "test",
    isCompleted: true,
    mode: "timed",
    startedAt: "2026-11-02T00:00:00Z",
    completedAt: "2026-11-02T03:00:00Z",
    questionIds: ["a", "b"],
    totalQuestions: 2,
    answers: {
      a: { selectedAnswer: "A", isCorrect: true },
      b: { selectedAnswer: "B", isCorrect: false },
    },
  } as unknown as QuizSession;
  const events = quizPointEvents(q);
  assert.equal(
    events.reduce((n, e) => n + e.points, 0),
    10,
  );
  assert.equal(events.at(-1)?.key, "practice-complete:v2:test");
  assert.deepEqual(quizPointEvents({ ...q, isCompleted: false }), []);
  assert.deepEqual(quizPointEvents({ ...q, answers: {} }), []);
  assert.equal(
    quizPointEvents({
      ...q,
      questionIds: ["a", "b", "c", "d", "e", "f"],
      totalQuestions: 6,
    }).some((e) => e.kind === "Assessment completed"),
    false,
  );
});
test("persistent rewards deduplicate concurrent awards, protect privacy and throttle reminders", async () => {
  const fixture = await startPostgrestFixture(0, true),
    saved = { ...process.env },
    originalFetch = global.fetch;
  try {
    Object.assign(process.env, {
      DB_DRIVER: "",
      ENABLE_DEMO_DATA: "false",
      SUPABASE_URL: fixture.url,
      SUPABASE_SECRET_KEY: "qa-service-key",
      ADMIN_EMAIL: "qa-admin@example.test",
      ADMIN_INITIAL_PASSWORD: "QA-only-bootstrap-password",
      SESSION_SECRET: "unit-only-session-signing-secret-at-least-32-characters",
      REMINDERS_ENABLED: "false",
    });
    const db = await import("../src/lib/db");
    await db.initDatabase();
    const student = await db.getUserByLoginId("AVSBIO26-0001");
    assert.ok(student);
    const uid = student.user.id;
    const a = await Promise.all([
      awardPoints(uid, [
        { key: "video:test", kind: "Video lesson opened", points: 2 },
      ]),
      awardPoints(uid, [
        { key: "video:test", kind: "Video lesson opened", points: 2 },
      ]),
    ]);
    assert.equal(
      a.reduce((n, v) => n + v, 0),
      2,
    );
    await awardPoints(uid, [
      { key: "note:test", kind: "Notes opened", points: 1 },
    ]);
    let board = await engagementRpc<EngagementBoard>("avs_engagement_board", {
      p_user_id: uid,
    });
    assert.equal(board.me?.points, 3);
    const originalName = board.me!.display_name;
    assert.ok(originalName.includes(" · "));
    await fixture.db.query(
      "update avs_engagement_profiles set display_name=$1 where user_id=$2",
      [originalName.replace(" · ", " Â· "), uid],
    );
    await fixture.db.exec(
      await readFile(
        "supabase/migrations/20261102_engagement_display_name.sql",
        "utf8",
      ),
    );
    board = await engagementRpc("avs_engagement_board", { p_user_id: uid });
    assert.equal(board.me?.display_name, originalName);
    assert.equal(board.me?.points, 3);
    assert.equal(board.me?.rank, 1);
    assert.equal(board.leaders.length, 1);
    assert.deepEqual(Object.keys(board.leaders[0]).sort(), [
      "isMe",
      "name",
      "points",
      "rank",
    ]);
    const before = await fixture.db.query(
      "select count(*)::int n from avs_quiz_sessions",
    );
    await engagementRpc("avs_engagement_preferences", {
      p_user_id: uid,
      p_name: "My alias",
      p_visible: false,
      p_reminders: true,
    });
    await fixture.db.exec(
      await readFile(
        "supabase/migrations/20261102_engagement_display_name.sql",
        "utf8",
      ),
    );
    board = await engagementRpc("avs_engagement_board", { p_user_id: uid });
    assert.equal(board.me?.display_name, "My alias");
    assert.equal(board.leaders.length, 0);
    assert.equal(board.me?.rank, null);
    const token = unsubscribeToken(uid);
    assert.equal(unsubscribeOwner(token), uid);
    assert.equal(unsubscribeOwner(token + "changed"), null);
    assert.equal(unsubscribeOwner("broken"), null);
    assert.equal((await runStudyReminders()).disabled, true);
    await fixture.db.query(
      "update avs_users set data=jsonb_set(data,'{email}',to_jsonb('learner@school.invalid'::text)) where id=$1",
      [uid],
    );
    await fixture.db.query(
      "update avs_engagement_profiles set last_seen=now()-interval '4 days',reminder_after=now()-interval '1 day' where user_id=$1",
      [uid],
    );
    Object.assign(process.env, {
      REMINDERS_ENABLED: "true",
      RESEND_API_KEY: "unit-only-fake-key",
      REMINDER_FROM_EMAIL: "School <study@school.invalid>",
      CRON_SECRET: "unit-only-cron-secret",
    });
    let calls = 0;
    global.fetch = async (input, init) => {
      if (String(input) === "https://api.resend.com/emails") {
        calls++;
        const body = JSON.parse(String(init?.body));
        assert.ok(body.text.includes("/unsubscribe?token="));
        assert.equal(body.to[0], "learner@school.invalid");
        return new Response(JSON.stringify({ id: "unit-delivery" }), {
          status: 200,
        });
      }
      return originalFetch(input, init);
    };
    const runs = await Promise.all([runStudyReminders(), runStudyReminders()]);
    assert.equal(calls, 1);
    assert.equal(
      runs.reduce((n, r) => n + r.sent, 0),
      1,
    );
    assert.equal((await runStudyReminders()).sent, 0);
    await engagementRpc("avs_unsubscribe_reminders", { p_user_id: uid });
    await fixture.db.query(
      "update avs_engagement_profiles set reminder_after=now()-interval '1 day' where user_id=$1",
      [uid],
    );
    assert.equal((await runStudyReminders()).sent, 0);
    const deliveries = await fixture.db.query<{ status: string }>(
      "select status from avs_reminder_deliveries",
    );
    assert.deepEqual(deliveries.rows, [{ status: "sent" }]);
    assert.deepEqual(
      await fixture.db.query("select count(*)::int n from avs_quiz_sessions"),
      before,
    );
    const grants = await fixture.db.query<{ allowed: boolean }>(
      "select has_function_privilege('anon','public.avs_award_points(text,jsonb)','execute') as allowed",
    );
    assert.equal(grants.rows[0].allowed, false);
    assert.ok(
      reminderMessage("Learner", "https://example.invalid/unsub").text.includes(
        "3 days",
      ),
    );
  } finally {
    global.fetch = originalFetch;
    process.env = saved;
    await fixture.close();
  }
});
