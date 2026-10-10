import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { startPostgrestFixture } from "./helpers/postgrest";
import { seedTextbookBank, fixtureBook } from "./helpers/textbook-bank";
import {
  preparedReviewQueue,
  reviewQueueCsv,
  csvReference,
  reviewIssues,
} from "../src/lib/textbook-review-queue";

test("Tamil export uses database medium, includes every page, retains IDs/evidence and never changes moderation", async () => {
  const fixture = await startPostgrestFixture();
  try {
    await seedTextbookBank(fixture.db);
    // Deliberately misleading ID: actual database metadata determines medium.
    const bookId = "fixture-english-filename-but-tamil-metadata";
    await fixture.db.query(
      `insert into public.textbooks(id,title,subject,medium,source_medium,category,source_title,source_file,source_url,source_page)
      select $1,title,subject,'Tamil','Tamil',category,source_title,source_file,source_url,source_page from public.textbooks where id=$2`,
      [bookId, fixtureBook.id],
    );
    const candidates = Array.from({ length: 251 }, (_, i) => ({
      id: `fixture-tamil-${String(i).padStart(3, "0")}`,
      bookId,
      chapterId: `tb-${bookId}-ch-1`,
      chapterTitle: "முதல் அத்தியாயம்",
      subjectId: "fixture-subject",
      number: i + 1,
      page: 12,
      keyPage: 18,
      questionText: 'தமிழ் வினா, "ஆதாரம்"\nஇரண்டாம் வரி',
      options: [
        "முதல் விடை",
        "இரண்டாம் விடை",
        "மூன்றாம் விடை",
        "நான்காம் விடை",
      ],
      sourceSha256: "a".repeat(64),
      status: "Needs Review",
      reviewStatus: "needs_teacher_review",
      qualityFlags: ["Verify Tamil option boundaries"],
      correctAnswer: "B",
      reviewPreparation: {
        batchId: "fixture-tamil-batch-01",
        medium: "Tamil",
        volume: null,
        keyCheck: "uncertain",
        sourceCheck: "matched",
        printedPage: null,
        sourceQuestionText: "மூல வினா",
        sourceOptions: ["மூல விடை"],
        duplicateIds: [],
        warnings: ["Two exercises use question number 1; determine key scope."],
        sourcePageText: "மூல நூல் ஆதாரம்",
        keyPageText: "1. ஆ",
      },
    }));
    await fixture.db.query(
      `insert into public.textbook_mcq_candidates(id,book_id,data)
      select x->>'id',x->>'bookId',x from jsonb_array_elements($1::jsonb) x`,
      [JSON.stringify(candidates)],
    );
    const client = createClient(fixture.url, "qa-service-key");
    const entries = await preparedReviewQueue(client, { medium: "Tamil" });
    assert.equal(entries.length, 251); // spans more than a single API page
    assert.ok(
      entries.every(
        (e) => e.book.source_medium === "Tamil" && e.book.id === bookId,
      ),
    );
    assert.deepEqual(
      await preparedReviewQueue(client, { medium: "English" }),
      [],
    );
    assert.equal(
      (
        await preparedReviewQueue(client, {
          medium: "Tamil",
          batchId: "missing",
        })
      ).length,
      0,
    );
    assert.equal(
      (
        await preparedReviewQueue(client, {
          bookId,
          chapterId: `tb-${bookId}-ch-1`,
        })
      ).length,
      251,
    );
    const csv = reviewQueueCsv(entries);
    assert.ok(csv.startsWith("\uFEFF"));
    assert.ok(csv.includes('தமிழ் வினா, ""ஆதாரம்""\nஇரண்டாம் வரி'));
    assert.ok(csv.includes("fixture-tamil-250"));
    assert.ok(csv.includes(`/textbooks/${bookId}?page=18`));
    assert.ok(csv.includes("Two exercises use question number 1"));
    assert.ok(csv.includes("needs_teacher_review"));
    assert.ok(
      reviewIssues(entries[0].candidate).some((i) => i.includes("ambiguous")),
    );
    const states = await fixture.db.query<{ pending: number; audited: number }>(
      `select
      (select count(*)::integer from public.textbook_mcq_candidates where book_id=$1 and review_state='needs_teacher_review') pending,
      (select count(*)::integer from public.avs_audit_logs where data->>'action' in ('MODERATE_TEXTBOOK_MCQ','REVIEW_TEXTBOOK_MCQ')) audited`,
      [bookId],
    );
    assert.deepEqual(states.rows[0], { pending: 251, audited: 0 });
  } finally {
    await fixture.close();
  }
});

test("CSV quotes multiline text and neutralises spreadsheet formulas without mutating source data", () => {
  const rows = [
    { question: '=HYPERLINK("evil")', option: " \t+1", source: "தமிழ்\nவரி,2" },
  ];
  const original = structuredClone(rows);
  const csv = csvReference(rows, ["question", "option", "source"]);
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.ok(csv.includes("' \t+1"));
  assert.ok(csv.includes('"தமிழ்\nவரி,2"'));
  assert.deepEqual(rows, original);
});
