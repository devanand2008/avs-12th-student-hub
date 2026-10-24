import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import catalog from "../src/lib/textbooks-catalog.json";
import { extractSourceBoundedCandidates } from "../scripts/lib/source-bounded-extraction";
import type { Textbook } from "../src/lib/textbooks";
import { loadSharedSourceReviewBatches } from "../scripts/lib/shared-source-review";
import {
  reconcileManifest,
  requiredSourcePages,
  recordDecision,
} from "../scripts/lib/local-physics-review";
const ids = [
  "12-bio-zoology-english-7e848813",
  "12-bio-zoology-tamil-2631f8e3",
  "12-basic-electrical-engineering-tamil-029f513a",
];
const json = async (p: string) => JSON.parse(await readFile(p, "utf8"));
test("Chapter 4 source rerun retains 57 numbered held occurrences and all prior question identities", async () => {
  const counts = [21, 21, 15],
    pages = [
      [63, 64],
      [72, 73, 74],
      [86, 87, 88],
    ],
    all = new Set<string>();
  let reused = 0;
  for (const [i, id] of ids.entries()) {
    const packet = await json(
        `.local/teacher-review/extracted-books/${id}.json`,
      ),
      source = await json(`.local/textbook-text/${id}.json`);
    const fresh = await extractSourceBoundedCandidates(
      catalog.books.find((b) => b.id === id) as Textbook,
      source,
      packet.candidates,
      packet.candidates,
    );
    assert.deepEqual(fresh.candidates, packet.sourceBoundedProposals);
    const rows = fresh.candidates.filter((c) => c.chapterId.endsWith("-ch-4"));
    assert.equal(rows.length, counts[i]);
    assert.deepEqual(
      rows.map((c) => c.number),
      Array.from({ length: counts[i] }, (_, n) => n + 1),
    );
    for (const c of rows) {
      assert(!all.has(c.id));
      all.add(c.id);
      assert.equal(c.correctAnswer, null);
      assert.equal(c.practicePublished, false);
      assert.equal(c.reviewStatus, "needs_teacher_review");
      assert.equal(c.options.length, 4);
      assert(c.options.every(Boolean));
      assert(pages[i].includes(c.page));
      assert(c.originalExtraction);
      reused += Number(c.extractionEvidence.reusedExistingId);
    }
  }
  assert.equal(all.size, 57);
  assert.equal(reused, 54);
});
test("all three Chapter 4 review batches require source inspection and cannot approve unknown answers", async () => {
  const batches = (await loadSharedSourceReviewBatches(process.cwd())).filter(
    (b) => b.unit === 4 && ids.includes(b.candidates[0].bookId),
  );
  assert.equal(batches.length, 3);
  for (const b of batches) {
    const c = b.candidates[0],
      m = reconcileManifest(b.candidates);
    for (const p of requiredSourcePages(c))
      await readFile(
        `.local/teacher-review/source-evidence/systematic-computer-batch/${c.bookId}-pdf-${p}.png`,
      );
    assert.throws(
      () =>
        recordDecision(
          m,
          b.candidates,
          {
            id: c.id,
            expectedRevision: 0,
            decision: "approved",
            notes: "Isolated assertion, never a teacher decision",
            unresolvedIssues: [],
            inspectedPages: requiredSourcePages(c),
            textConfirmed: true,
            keyConfirmed: true,
            diagramConfirmed: true,
            correction: {
              questionText: c.questionText,
              options: c.options,
              correctAnswer: "A",
              sourceMappingConfirmed: true,
            },
          },
          {
            id: "fixture",
            name: "Isolated fixture",
            email: "fixture@example.test",
          },
        ),
      /Answer evidence is unavailable/,
    );
  }
});
