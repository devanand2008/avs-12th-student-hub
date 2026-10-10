import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcryptjs";
import { startPostgrestFixture } from "./helpers/postgrest";
import {
  seedTextbookBank,
  fixtureChapterId,
  fixtureSubjectId,
} from "./helpers/textbook-bank";
test("MCQ review and spreadsheet imports are atomic, administrator-only and update coverage", async () => {
  const fixture = await startPostgrestFixture();
  try {
    const db = fixture.db;
    await seedTextbookBank(db);
    await db.query(
      "update public.textbook_mcq_candidates set data=data || '{\"presentation\":\"Original PDF\"}'::jsonb where id='fixture-textbook-q-3'",
    );
    const hash = await bcrypt.hash("Fixture-only-admin-password", 10);
    await db.query("select public.avs_bootstrap_admin($1)", [
      JSON.stringify({
        id: "review-admin",
        email: "review@example.test",
        role: "admin",
        passwordHash: hash,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ]);
    const review = (
      actor: string,
      answer: string | null,
      options: string[] = ["First", "Second"],
    ) =>
      db.query(
        "select public.avs_review_textbook_mcq($1,$2,$3,$4,$5) as data",
        [
          "fixture-textbook-q-3",
          actor,
          "Choose the correct account result.",
          JSON.stringify(options),
          answer,
        ],
      );
    await assert.rejects(review("untrusted-user", "B"), /Admin authorization/);
    await assert.rejects(review("review-admin", null), /choose an answer/);
    await assert.rejects(review("review-admin", "D"), /choose an answer/);
    await assert.rejects(
      review("review-admin", "B", ["Same", "Same"]),
      /choose an answer/,
    );
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::integer as n from public.avs_questions where id='fixture-textbook-q-3'",
        )
      ).rows[0].n,
      0,
    );
    await review("review-admin", "B");
    const published = (
      await db.query<{ data: Record<string, unknown> }>(
        "select data from public.avs_questions where id='fixture-textbook-q-3'",
      )
    ).rows[0].data;
    assert.equal(published.correctAnswer, "B");
    assert.equal(published.sourcePage, 12);
    assert.equal(published.sourcePresentation, "Text");
    assert.equal(published.answerVerification, "Teacher Review");
    assert.equal(
      (
        await db.query<{ data: { presentation: string } }>(
          "select data from public.textbook_mcq_candidates where id='fixture-textbook-q-3'",
        )
      ).rows[0].data.presentation,
      "Text",
    );
    const row = {
      id: "import-q-unit",
      chapterId: fixtureChapterId,
      subjectId: fixtureSubjectId,
      questionText: "Choose the valid imported option.",
      optionA: "One",
      optionB: "Two",
      optionC: "",
      optionD: "",
      correctAnswer: "B",
      sourceType: "Book-In",
      status: "Published",
      stream: "Common",
    };
    const save = (rows: unknown[]) =>
      db.query<{ data: { imported: number; skipped: number } }>(
        "select public.avs_import_questions($1,$2) as data",
        [JSON.stringify(rows), "review-admin"],
      );
    await assert.rejects(
      save([row, { ...row, id: "bad-import", chapterId: "missing" }]),
      /Invalid reviewed/,
    );
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::integer as n from public.avs_questions where id='import-q-unit'",
        )
      ).rows[0].n,
      0,
    );
    assert.deepEqual((await save([row])).rows[0].data, {
      imported: 1,
      skipped: 0,
    });
    assert.deepEqual((await save([row])).rows[0].data, {
      imported: 0,
      skipped: 1,
    });
    const coverage = (
      await db.query<{ data: { published: number; review: number }[] }>(
        "select public.avs_textbook_mcq_catalog() as data",
      )
    ).rows[0].data;
    assert.equal(coverage[0].published, 4);
    assert.equal(coverage[0].review, 0);
    await db.exec("set role anon");
    await assert.rejects(
      db.query("select * from public.textbook_mcq_candidates"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select public.avs_textbook_mcq_catalog()"),
      /permission denied/,
    );
    await db.exec("reset role");
  } finally {
    await fixture.close();
  }
});
