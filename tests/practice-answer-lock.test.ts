import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("atomic PostgreSQL saves lock non-timed answers across single/bulk/concurrent requests and allow timed draft changes", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon;create role authenticated;create role service_role;create table public.avs_quiz_sessions(id text primary key,student_id text,data jsonb,question_snapshot jsonb);",
    );
    const migration = await readFile(
      "supabase/migrations/20261023_practice_answer_lock.sql",
      "utf8",
    );
    await db.exec(migration);
    await db.exec(migration);
    for (const mode of ["quick", "timed"]) {
      const s = {
        id: mode,
        studentId: "owner",
        mode,
        isCompleted: false,
        answers: {},
        questionIds: ["q1", "q2"],
      };
      await db.query(
        "insert into public.avs_quiz_sessions values($1,'owner',$2,$3)",
        [
          mode,
          JSON.stringify(s),
          JSON.stringify({
            q1: { correctAnswer: "A" },
            q2: { correctAnswer: "A" },
          }),
        ],
      );
    }
    const single = async (id: string, q: string, answer: string | null) =>
      (
        await db.query<{
          s: {
            answers: Record<
              string,
              { selectedAnswer: string; isCorrect: boolean }
            >;
          };
        }>("select public.avs_save_answer($1,'owner',$2,$3) as s", [
          id,
          q,
          answer,
        ])
      ).rows[0].s;
    await single("quick", "q1", "B");
    await Promise.all([
      single("quick", "q1", "A"),
      single("quick", "q1", null),
    ]);
    const bulk = (
      await db.query<{
        s: {
          answers: Record<
            string,
            { selectedAnswer: string; isCorrect: boolean }
          >;
        };
      }>("select public.avs_save_answers('quick','owner',$1) as s", [
        JSON.stringify({ q1: "A", q2: "A" }),
      ])
    ).rows[0].s;
    assert.equal(bulk.answers.q1.selectedAnswer, "B");
    assert.equal(bulk.answers.q1.isCorrect, false);
    assert.equal(bulk.answers.q2.isCorrect, true);
    assert.equal(
      (await single("timed", "q1", "B")).answers.q1.selectedAnswer,
      "B",
    );
    assert.equal((await single("timed", "q1", "A")).answers.q1.isCorrect, true);
    assert.equal(
      (
        await db.query<{ s: unknown }>(
          "select public.avs_save_answer('quick','other','q1','A') as s",
        )
      ).rows[0].s,
      null,
    );
    const denied = await db.query<{ allowed: boolean }>(
      "select has_function_privilege('authenticated','public.avs_save_answer(text,text,text,text,numeric,boolean)','execute') as allowed",
    );
    assert.equal(denied.rows[0].allowed, false);
  } finally {
    await db.close();
  }
});
