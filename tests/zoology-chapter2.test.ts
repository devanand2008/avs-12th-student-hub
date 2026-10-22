import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import catalog from "../src/lib/textbooks-catalog.json";
import { extractSourceBoundedCandidates } from "../scripts/lib/source-bounded-extraction";
import { loadSharedSourceReviewBatches } from "../scripts/lib/shared-source-review";
import {
  reconcileManifest,
  requiredSourcePages,
} from "../scripts/lib/local-physics-review";
import { selectPracticeQuestions } from "../src/lib/textbook-practice-selection";
import type { Textbook } from "../src/lib/textbooks";
import type { Question } from "../src/types";
const json = async (p: string) => JSON.parse(await fs.readFile(p, "utf8"));
const ids = [
  "12-bio-zoology-english-7e848813",
  "12-bio-zoology-tamil-2631f8e3",
  "12-basic-electrical-engineering-tamil-029f513a",
];
test("Chapter 2 preserves 47 authentic occurrences with stable IDs, six printed answer entries and separate raw transcription", async () => {
  let total = 0,
    reused = 0,
    keys = 0;
  for (const [i, id] of ids.entries()) {
    const packet = await json(
        `.local/teacher-review/extracted-books/${id}.json`,
      ),
      original = await json(`.local/textbook-text/${id}.json`),
      fresh = await extractSourceBoundedCandidates(
        catalog.books.find((b) => b.id === id) as Textbook,
        original,
        packet.candidates,
        packet.candidates,
      );
    assert.deepEqual(fresh.candidates, packet.sourceBoundedProposals);
    const rows = fresh.candidates.filter((c) => c.chapterId.endsWith("-ch-2"));
    assert.equal(rows.length, i === 2 ? 15 : 16);
    assert.deepEqual(
      rows.map((c) => c.number),
      Array.from({ length: rows.length }, (_, n) => n + 1),
    );
    assert.equal(new Set(rows.map((c) => c.id)).size, rows.length);
    for (const c of rows) {
      assert.equal(c.practicePublished, false);
      assert.equal(c.reviewStatus, "needs_teacher_review");
      assert.equal(c.options.length, 4);
      assert(c.options.every(Boolean));
      assert(c.originalExtraction);
      assert(c.extractionEvidence.originalPageText.length);
      total++;
      reused += Number(c.extractionEvidence.reusedExistingId);
      keys += Number(c.extractionEvidence.keyMatched);
    }
    if (i < 2) {
      const q13 = rows.find((c) => c.number === 13)!;
      assert(!q13.options[3].includes("Assertion"));
      const selected = rows.filter((c) => c.number >= 14);
      assert.deepEqual(
        selected.map((c) => c.correctAnswer),
        ["A", "C", "D"],
      );
      assert(
        selected.every(
          (c) =>
            "sharedSourceOptions" in c.extractionEvidence &&
            c.extractionEvidence.sharedSourceOptions &&
            c.keyPage,
        ),
      );
      assert(
        selected.every(
          (c) => !c.questionText.includes(i === 0 ? "(a)" : "வி ண்ட"),
        ),
      );
      if (i === 1) {
        assert.match(selected[0].questionText, /20/);
        assert.deepEqual(
          "sourcePageReferences" in selected[2].extractionEvidence
            ? selected[2].extractionEvidence.sourcePageReferences
            : undefined,
          [
            { pdfPage: 40, printedPage: 32 },
            { pdfPage: 41, printedPage: 33 },
          ],
        );
      }
    } else {
      assert(rows.every((c) => c.correctAnswer === null));
      assert.equal(rows.find((c) => c.number === 3)!.options.length, 4);
      assert.equal(rows.find((c) => c.number === 6)!.endPage, 46);
    }
  }
  assert.equal(total, 47);
  assert.equal(reused, 39);
  assert.equal(keys, 6);
});
test("Chapter 2 keys do not create teacher decisions or student publications, and source evidence includes earlier rubric pages", async () => {
  const batches = (await loadSharedSourceReviewBatches(process.cwd())).filter(
    (b) => b.unit === 2 && ids.includes(b.candidates[0].bookId),
  );
  assert.equal(batches.length, 3);
  const held = batches.flatMap((b) => b.candidates);
  assert.equal(held.length, 47);
  for (const batch of batches) {
    const saved = await json(
        `.local/teacher-review/physics-unit1-workflow/${batch.id}/decisions.json`,
      ),
      m = reconcileManifest(batch.candidates, saved);
    assert(
      m.entries.every(
        (e) =>
          e.decision === "pending" && !e.reviewer && e.history.length === 0,
      ),
    );
  }
  const q16 = held.find((c) => c.bookId === ids[1] && c.number === 16)!;
  assert.deepEqual(requiredSourcePages(q16), [40, 41]);
  const snapshot = (
    await json(".local/independent-live-content.json")
  ).tables.avs_questions.map((r: { data: Question }) => r.data);
  const fake = held.map(
    (c) =>
      ({
        ...c,
        status: "Published",
        sourceTextbookId: c.bookId,
        sourceType: "Book-In",
        optionA: c.options[0],
        optionB: c.options[1],
        optionC: c.options[2],
        optionD: c.options[3],
      }) as unknown as Question,
  );
  const eligible = selectPracticeQuestions([...snapshot, ...fake], {});
  assert.equal(eligible.length, 995);
  assert(eligible.every((q) => !held.some((c) => c.id === q.id)));
});
