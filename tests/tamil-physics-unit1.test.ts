import assert from "node:assert/strict";
import test from "node:test";
import catalog from "../src/lib/textbooks-catalog.json";
import baseline from "../docs/tamil-physics-unit1-baseline.json";
import packet from "../docs/tamil-physics-unit1-candidates.json";
import transcription from "../scripts/data/tamil-physics-unit1-transcription.json";
import type { Textbook } from "../src/lib/textbooks";
import type {
  TextbookMcqCandidate,
  TextbookMcqCoverage,
} from "../src/lib/textbook-question-types";
import {
  mergeLocalReviewQueue,
  preparePhysicsUnit1,
} from "../scripts/lib/tamil-physics-unit1";
import { startPostgrestFixture } from "./helpers/postgrest";

const book = catalog.books.find(
  (b) => b.id === transcription.bookId,
)! as Textbook;
const prepare = (proposed = transcription, metadata = baseline.book) =>
  preparePhysicsUnit1(
    book,
    metadata,
    packet.sourcePages,
    baseline.candidates as TextbookMcqCandidate[],
    proposed,
    packet.preparedAt,
  );

test("Physics Unit 1 preserves source identities, raw extraction, cross-page evidence and held status", () => {
  const candidates = prepare();
  assert.deepEqual(candidates, packet.candidates);
  assert.equal(candidates.length, 15);
  assert.deepEqual(
    candidates.map((c) => c.number),
    Array.from({ length: 15 }, (_, i) => i + 1),
  );
  assert.deepEqual(
    candidates
      .filter((c) => !c.extractionEvidence.reusedExistingId)
      .map((c) => c.number),
    [8, 10, 13, 14],
  );
  for (const candidate of candidates) {
    assert.equal(candidate.section, "Book-back");
    assert.equal(candidate.chapterId, `tb-${book.id}-ch-1`);
    assert.equal(candidate.status, "Needs Review");
    assert.equal(candidate.reviewStatus, "needs_teacher_review");
    assert.equal(candidate.practicePublished, false);
    assert.ok(
      !candidate.reviewedBy &&
        !candidate.reviewedAt &&
        !candidate.reviewHistory?.length,
    );
    assert.equal(candidate.keyPage, 81);
    assert.equal(candidate.reviewPreparation!.keyCheck, "matched");
    assert.equal(candidate.reviewPreparation!.sourceCheck, "uncertain");
    assert.ok(
      candidate.qualityFlags.some((w) =>
        w.includes("Tamil extraction is damaged"),
      ),
    );
    assert.equal(
      candidate.options["ABCD".indexOf(candidate.correctAnswer!)].length > 0,
      true,
    );
    const original = baseline.candidates.find(
      (c) => c.page === candidate.page && c.number === candidate.number,
    );
    if (original) {
      assert.equal(candidate.id, original.id);
      assert.deepEqual(candidate.originalExtraction, original);
    }
  }
  const crossPage = candidates.find((c) => c.number === 6)!;
  assert.equal(crossPage.page, 79);
  assert.equal(crossPage.endPage, 80);
  assert.deepEqual(crossPage.extractionEvidence.printedPages, [71, 72]);
  assert.ok(
    crossPage.reviewPreparation!.sourcePageText.includes("PDF 79") &&
      crossPage.reviewPreparation!.sourcePageText.includes("PDF 80"),
  );
  assert.deepEqual(crossPage.options, [
    "80q/ε₀",
    "q/(40ε₀)",
    "q/(80ε₀)",
    "q/(160ε₀)",
  ]);
  assert.equal(
    candidates.find((c) => c.number === 11)!.options[1],
    "−8.80 × 10⁻¹⁷ J",
  );
  assert.equal(candidates.find((c) => c.number === 9)!.correctAnswer, "C");
});

test("Physics diagram and graph choices remain explicitly incomplete for publication", () => {
  const candidates = prepare();
  assert.deepEqual(
    candidates
      .filter((c) => c.extractionEvidence.requiresDiagram)
      .map((c) => c.number),
    [1, 3, 5, 6, 8, 10, 14],
  );
  const graph = candidates.find((c) => c.number === 10)!;
  assert.equal(graph.extractionEvidence.completeTextOptions, false);
  assert.deepEqual(graph.options, ["(a)", "(b)", "(c)", "(d)"]);
  assert.ok(
    graph.qualityFlags.some((w) =>
      w.includes("labels alone must never be published"),
    ),
  );
  assert.ok(
    candidates
      .find((c) => c.number === 8)!
      .qualityFlags.some((w) => w.includes("labels are a–d")),
  );
});

test("Physics preparation rejects wrong metadata, question pages and incomplete source sections", () => {
  assert.throws(() =>
    prepare(transcription, { ...baseline.book, source_medium: "English" }),
  );
  assert.throws(() =>
    prepare(transcription, { ...baseline.book, volume: "2" }),
  );
  const wrongPage = structuredClone(transcription);
  wrongPage.questions[0].page = 80;
  wrongPage.questions[0].endPage = 80;
  wrongPage.questions[0].printedPage = 72;
  assert.throws(() => prepare(wrongPage), /fresh source question boundary/);
  const lostOption = structuredClone(transcription);
  lostOption.questions[0].options.pop();
  assert.throws(() => prepare(lostOption), /four printed choice/);
  const lostQuestion = structuredClone(transcription);
  lostQuestion.questions.splice(7, 1);
  assert.throws(() => prepare(lostQuestion));
  const damagedKey = structuredClone(packet.sourcePages);
  damagedKey.find((p) => p.page === 81)!.text = damagedKey
    .find((p) => p.page === 81)!
    .text.replace("9) c", "9) b");
  assert.throws(
    () =>
      preparePhysicsUnit1(
        book,
        baseline.book,
        damagedKey,
        baseline.candidates as TextbookMcqCandidate[],
        transcription,
      ),
    /Rendered key comparison/,
  );
});

test("Local reruns insert no duplicates and preserve edits, rejection and reviewer history", () => {
  const candidates = prepare();
  const first = mergeLocalReviewQueue([], candidates);
  const edited = structuredClone(first);
  edited[0].questionText = "Local teacher transcription retained";
  edited[0].reviewStatus = "rejected";
  edited[0].reviewedBy = "isolated-fixture-reviewer";
  edited[0].reviewHistory = [
    {
      action: "reject",
      actorId: "isolated-fixture-reviewer",
      at: new Date().toISOString(),
      reason: "Fixture only",
      before: {
        questionText: first[0].questionText,
        options: first[0].options,
        correctAnswer: first[0].correctAnswer,
      },
      after: {
        questionText: edited[0].questionText,
        options: edited[0].options,
        correctAnswer: edited[0].correctAnswer,
      },
    },
  ];
  assert.deepEqual(mergeLocalReviewQueue(edited, candidates), edited);
  const overlap = structuredClone(candidates[0]);
  overlap.id = "duplicate-source-id";
  assert.throws(() => mergeLocalReviewQueue(first, [overlap]), /overlap/);
});

test("Real Physics held packets cannot enter student catalog; local schema and practice history stay intact", async () => {
  const fixture = await startPostgrestFixture();
  try {
    const db = fixture.db;
    const proof = async () =>
      (
        await db.query<{ n: number; digest: string }>(
          "select count(*)::int as n,md5(coalesce(string_agg(data::text,'|' order by id),'')) as digest from public.avs_questions",
        )
      ).rows[0];
    const history = async () =>
      (
        await db.query<{ n: number; digest: string }>(
          "select count(*)::int as n,md5(coalesce(string_agg(data::text||question_snapshot::text,'|' order by id),'')) as digest from public.avs_quiz_sessions",
        )
      ).rows[0];
    const before = await proof(),
      historyBefore = await history();
    await db.query(
      "insert into public.textbooks(id,title,subject,medium,source_medium,category,source_title,source_file,source_url,source_page) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [
        book.id,
        book.title,
        book.subject,
        book.medium,
        book.sourceMedium,
        book.category,
        book.sourceTitle,
        book.sourceFile,
        book.sourceUrl,
        book.sourcePage,
      ],
    );
    const candidates = prepare();
    const chapter = {
      id: candidates[0].chapterId,
      number: 1,
      title: transcription.chapterTitle,
      page: 9,
      exercisePage: 79,
      published: 0,
      review: 15,
    };
    const coverage = {
      bookId: book.id,
      subjectId: candidates[0].subjectId,
      chapters: [chapter],
      total: candidates.length,
      published: 0,
      review: candidates.length,
      pages: 352,
      sourceSha256: book.sha256,
      importedAt: new Date().toISOString(),
      notes: [],
    };
    await db.query(
      "insert into public.textbook_mcq_imports(book_id,data) values($1,$2)",
      [book.id, JSON.stringify(coverage)],
    );
    for (const candidate of candidates) {
      const statement =
        "insert into public.textbook_mcq_candidates(id,book_id,data) values($1,$2,$3) on conflict(id) do nothing";
      await db.query(statement, [
        candidate.id,
        book.id,
        JSON.stringify(candidate),
      ]);
      await db.query(statement, [
        candidate.id,
        book.id,
        JSON.stringify(candidate),
      ]);
    }
    const result = (
      await db.query<{ data: TextbookMcqCoverage[] }>(
        "select public.avs_textbook_mcq_catalog() as data",
      )
    ).rows[0].data.find((b) => b.bookId === book.id)!;
    assert.equal(result.total, 15);
    assert.equal(result.review, 15);
    assert.equal(result.published, 0);
    assert.equal(result.chapters[0].published, 0);
    const held = (
      await db.query<{ n: number }>(
        "select count(*)::int as n from public.textbook_mcq_candidates where book_id=$1 and review_state='needs_teacher_review'",
        [book.id],
      )
    ).rows[0].n;
    assert.equal(held, 15);
    assert.deepEqual(await proof(), before);
    assert.deepEqual(await history(), historyBefore);
  } finally {
    await fixture.close();
  }
});
