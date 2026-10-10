import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { startPostgrestFixture } from "./helpers/postgrest";
import { seedTextbookBank } from "./helpers/textbook-bank";
import { textbookModerationInput } from "../src/lib/question-publishing";
import {
  reviewAuditMatches,
  type ReviewDecisionAudit,
  type ReviewDecisionEvent,
} from "../scripts/lib/textbook-review-audit";

test("teacher moderation preserves evidence, requires human approval, rejects stale edits and keeps an audit trail", async () => {
  const fixture = await startPostgrestFixture();
  try {
    const db = fixture.db;
    await seedTextbookBank(db);
    // Reproduce the retained-question overlap: a published quiz row can have
    // a Needs Review source candidate without becoming a pending practice row.
    await db.query(
      "update public.textbook_mcq_candidates set data=data || '{\"status\":\"Needs Review\"}'::jsonb where id='fixture-textbook-q-1'",
    );
    const publishedPage = await db.query<{
      data: { total: number; questions: { practicePublished: boolean }[] };
    }>(
      "select public.avs_textbook_review_page($1,null,'published',null,1) as data",
      [
        (
          await db.query<{ book_id: string }>(
            "select book_id from public.textbook_mcq_candidates limit 1",
          )
        ).rows[0].book_id,
      ],
    );
    assert.equal(publishedPage.rows[0].data.total, 2);
    assert.ok(
      publishedPage.rows[0].data.questions.every((q) => q.practicePublished),
    );
    const reviewPage = await db.query<{ data: { total: number } }>(
      "select public.avs_textbook_review_page($1,null,'review',null,1) as data",
      [
        (
          await db.query<{ book_id: string }>(
            "select book_id from public.textbook_mcq_candidates limit 1",
          )
        ).rows[0].book_id,
      ],
    );
    assert.equal(reviewPage.rows[0].data.total, 1);
    await db.query("select public.avs_bootstrap_admin($1)", [
      JSON.stringify({
        id: "teacher",
        role: "admin",
        email: "teacher@example.test",
        passwordHash: await bcrypt.hash("Fixture-teacher-password", 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ]);
    const id = "fixture-textbook-q-3";
    const get = async () =>
      (
        await db.query<{ data: Record<string, unknown>; version: string }>(
          "select data,updated_at::text as version from public.textbook_mcq_candidates where id=$1",
          [id],
        )
      ).rows[0];
    const original = (await get()).data;
    const prep = {
      batchId: "fixture-ch1-review-01",
      sourceSha256: original.sourceSha256,
      sourceCheck: "matched",
      keyCheck: "uncertain",
      duplicateIds: [],
      keyPageText: "Original printed key evidence",
    };
    const prepare = () =>
      db.query<{ data: { prepared: number; skipped: number } }>(
        "select public.avs_prepare_textbook_review($1) as data",
        [
          JSON.stringify([
            { id, originalExtraction: original, reviewPreparation: prep },
          ]),
        ],
      );
    assert.deepEqual((await prepare()).rows[0].data, {
      prepared: 1,
      skipped: 0,
    });
    assert.deepEqual((await prepare()).rows[0].data, {
      prepared: 0,
      skipped: 1,
    });
    assert.equal((await get()).data.status, "Needs Review");
    assert.equal((await get()).data.correctAnswer, null);
    const moderate = (
      action: string,
      version: string,
      confirmed = false,
      reason = "",
      actor = "teacher",
    ) =>
      db.query(
        "select public.avs_moderate_textbook_mcq($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          id,
          actor,
          action,
          "Choose the correct source result.",
          JSON.stringify(["First", "Second"]),
          "B",
          confirmed,
          reason,
          version,
        ],
      );
    await assert.rejects(
      moderate("approve", (await get()).version, false),
      /Explicit human approval/,
    );
    await assert.rejects(
      moderate("approve", (await get()).version, true, "", "student"),
      /Admin authorization/,
    );
    const prior = (await get()).version;
    await moderate("edit", prior);
    await assert.rejects(moderate("approve", prior, true), /reload/);
    assert.equal((await get()).data.status, "Needs Review");
    assert.equal((await get()).data.reviewStatus, "needs_teacher_review");
    assert.deepEqual((await get()).data.reviewPreparation, prep);
    await assert.rejects(
      moderate("reject", (await get()).version, false, ""),
      /rejection reason/,
    );
    await moderate(
      "reject",
      (await get()).version,
      false,
      "Ambiguous source choices",
    );
    assert.equal((await get()).data.reviewStatus, "rejected");
    await moderate(
      "approve",
      (await get()).version,
      true,
      "Checked original source",
    );
    const approved = (await get()).data;
    assert.equal(approved.reviewStatus, "approved");
    assert.equal(approved.reviewedBy, "teacher");
    assert.deepEqual(approved.originalExtraction, original);
    assert.equal((approved.reviewHistory as unknown[]).length, 3);
    const q = (
      await db.query<{ data: Record<string, unknown> }>(
        "select data from public.avs_questions where id=$1",
        [id],
      )
    ).rows[0].data;
    assert.equal(q.correctAnswer, "B");
    assert.equal(q.reviewStatus, "approved");
    await moderate("edit", (await get()).version);
    assert.equal(
      (
        await db.query<{ status: string }>(
          "select status from public.avs_questions where id=$1",
          [id],
        )
      ).rows[0].status,
      "Teacher Review",
    );
    assert.deepEqual((await prepare()).rows[0].data, {
      prepared: 0,
      skipped: 1,
    });
    const audits = await db.query<{
      data: ReviewDecisionAudit;
    }>(
      "select data from public.avs_audit_logs where data->>'action'='MODERATE_TEXTBOOK_MCQ'",
    );
    assert.equal(audits.rows.length, 4);
    assert.ok(audits.rows.every((row) => row.data.before && row.data.after));
    // Exercise the read-only follow-up checker against actual persisted SQL
    // decisions, including full audit snapshots versus event summaries.
    const history = (await get()).data.reviewHistory as ReviewDecisionEvent[];
    for (const event of history)
      assert.ok(
        audits.rows.some((row) => reviewAuditMatches(id, event, row.data)),
      );
    const event = history[0];
    const matchingAudit = audits.rows.find((row) =>
      reviewAuditMatches(id, event, row.data),
    )!.data;
    assert.equal(
      reviewAuditMatches(id, event, {
        ...matchingAudit,
        userId: "forged-actor",
      }),
      false,
    );
    assert.equal(
      reviewAuditMatches(id, event, { ...matchingAudit, before: null }),
      false,
    );
    assert.equal(
      reviewAuditMatches(id, event, {
        ...matchingAudit,
        review: { ...matchingAudit.review!, before: { tampered: true } },
      }),
      false,
    );
    const first = (
      await db.query<{
        data: { chapterId: string; subjectId: string; bookId: string };
      }>(
        "select data from public.textbook_mcq_candidates where id='fixture-textbook-q-1'",
      )
    ).rows[0].data;
    const publishedChapterId = first.chapterId.replace(/-ch-1$/, "-ch-2");
    await db.query(
      "insert into public.avs_curriculum(kind,id,data) values('chapter',$1,$2)",
      [
        publishedChapterId,
        JSON.stringify({
          id: publishedChapterId,
          subjectId: first.subjectId,
          title: "Verified published chapter",
        }),
      ],
    );
    await db.query(
      "update public.avs_questions set data=data || jsonb_build_object('chapterId',$1::text) where id='fixture-textbook-q-1'",
      [publishedChapterId],
    );
    const correctedPage = (
      await db.query<{ data: { total: number } }>(
        "select public.avs_textbook_review_page($1,$2,'published',null,1) as data",
        [first.bookId, publishedChapterId],
      )
    ).rows[0].data;
    assert.equal(correctedPage.total, 1);
    await db.query(
      "select public.avs_review_textbook_mcq('fixture-textbook-q-1','teacher','Choose the correct published result.','[\"First\",\"Second\"]'::jsonb,'B')",
    );
    const preserved = (
      await db.query<{
        data: { chapterId: string; originalExtraction: { chapterId: string } };
      }>(
        "select data from public.textbook_mcq_candidates where id='fixture-textbook-q-1'",
      )
    ).rows[0].data;
    assert.equal(preserved.chapterId, publishedChapterId);
    assert.equal(preserved.originalExtraction.chapterId, first.chapterId);
    const version = (await get()).version;
    await db.exec("set role anon");
    await assert.rejects(prepare(), /permission denied/);
    await assert.rejects(
      moderate("approve", version, true),
      /permission denied/,
    );
  } finally {
    await fixture.close();
  }
});

test("approval API requires a deliberate human confirmation and valid option mapping", () => {
  const input = {
    id: "candidate",
    action: "approve",
    expectedUpdatedAt: new Date().toISOString(),
    questionText: "Select the correct source answer.",
    options: ["One", "Two"],
    correctAnswer: "B",
  };
  assert.equal(textbookModerationInput.safeParse(input).success, false);
  assert.equal(
    textbookModerationInput.safeParse({ ...input, humanConfirmed: true })
      .success,
    true,
  );
  assert.equal(
    textbookModerationInput.safeParse({
      ...input,
      humanConfirmed: true,
      correctAnswer: "D",
    }).success,
    false,
  );
});

test("legacy withdrawal is idempotent and preserves the existing source wording and answer", async () => {
  const fixture = await startPostgrestFixture();
  try {
    const sample = {
      id: "q-cs-101",
      chapterId: "cs-ch-1",
      subjectId: "cs",
      questionText: "Legacy unverified example",
      optionA: "One",
      optionB: "Two",
      correctAnswer: "B",
      status: "Published",
    };
    await fixture.db.query(
      "insert into public.avs_questions(id,data) values($1,$2)",
      [sample.id, JSON.stringify(sample)],
    );
    const migration = await readFile(
      "supabase/migrations/20261010140320_textbook_teacher_review.sql",
      "utf8",
    );
    await fixture.db.exec(migration);
    await fixture.db.exec(migration);
    const result = (
      await fixture.db.query<{ data: Record<string, unknown> }>(
        "select data from public.avs_questions where id=$1",
        [sample.id],
      )
    ).rows[0].data;
    assert.equal(result.status, "Teacher Review");
    assert.equal(result.questionText, sample.questionText);
    assert.equal(result.correctAnswer, sample.correctAnswer);
    assert.equal(
      (
        await fixture.db.query<{ n: number }>(
          "select count(*)::integer as n from public.avs_audit_logs where data->>'action'='HOLD_UNVERIFIED_LEGACY'",
        )
      ).rows[0].n,
      1,
    );
  } finally {
    await fixture.close();
  }
});
