import assert from "node:assert/strict";
import test from "node:test";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import catalog from "../src/lib/textbooks-catalog.json";
import { extractSourceBoundedCandidates } from "../scripts/lib/source-bounded-extraction";
import { loadSharedSourceReviewBatches } from "../scripts/lib/shared-source-review";
import {
  reconcileManifest,
  requiredSourcePages,
  recordDecision,
} from "../scripts/lib/local-physics-review";
import { startLocalPhysicsReview } from "../scripts/lib/local-physics-review-server";
import type { Textbook } from "../src/lib/textbooks";
const json = async (p: string) => JSON.parse(await readFile(p, "utf8"));
const ids = [
  "12-bio-zoology-english-7e848813",
  "12-bio-zoology-tamil-2631f8e3",
  "12-basic-electrical-engineering-tamil-029f513a",
];
test("Chapter 3 reconciles eight authentic Zoology items in each medium and all eighteen Electrical items including the last page", async () => {
  let total = 0,
    reused = 0;
  for (const [i, id] of ids.entries()) {
    const packet = await json(
      `.local/teacher-review/extracted-books/${id}.json`,
    );
    const source = await json(`.local/textbook-text/${id}.json`);
    const fresh = await extractSourceBoundedCandidates(
      catalog.books.find((b) => b.id === id) as Textbook,
      source,
      packet.candidates,
      packet.candidates,
    );
    assert.deepEqual(fresh.candidates, packet.sourceBoundedProposals);
    const rows = fresh.candidates.filter((c) => c.chapterId.endsWith("-ch-3"));
    assert.equal(rows.length, i === 2 ? 18 : 8);
    assert.deepEqual(
      rows.map((c) => c.number),
      Array.from({ length: rows.length }, (_, n) => n + 1),
    );
    for (const c of rows) {
      assert.equal(c.correctAnswer, null);
      assert.equal(c.practicePublished, false);
      assert.equal(c.reviewStatus, "needs_teacher_review");
      assert.equal(c.options.length, 4);
      assert(c.options.every(Boolean));
      reused += Number(c.extractionEvidence.reusedExistingId);
      total++;
    }
    if (i === 2) {
      assert.equal(rows.at(-1)!.page, 65);
      assert("printedOptionLabels" in rows[10].extractionEvidence);
      assert.deepEqual(rows[10].extractionEvidence.printedOptionLabels, [
        "அ",
        "அ",
        "இ",
        "ஈ",
      ]);
    } else {
      assert(rows[4].extractionEvidence.requiresDiagram);
      assert(rows[6].extractionEvidence.requiresDiagram);
    }
  }
  assert.equal(total, 34);
  assert.equal(reused, 28);
});
test("Chapter 3 uses the genuine held review workflow with immutable pending manifests and table crops", async () => {
  const batches = (await loadSharedSourceReviewBatches(process.cwd())).filter(
    (b) => b.unit === 3 && ids.includes(b.candidates[0].bookId),
  );
  assert.equal(batches.length, 3);
  for (const b of batches) {
    const saved = await json(
        `.local/teacher-review/physics-unit1-workflow/${b.id}/decisions.json`,
      ),
      m = reconcileManifest(b.candidates, saved);
    assert.equal(m.entries.length, b.candidates.length);
    assert(
      m.entries.every(
        (e) => e.decision === "pending" && !e.reviewer && !e.history.length,
      ),
    );
    for (const c of b.candidates)
      for (const p of requiredSourcePages(c))
        await readFile(
          `.local/teacher-review/source-evidence/systematic-computer-batch/${c.bookId}-pdf-${p}.png`,
        );
  }
});

test("resuming a source batch appends a missing pending occurrence without changing an existing correction or history", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "skillup-portal-append-"),
  );
  let app: Awaited<ReturnType<typeof startLocalPhysicsReview>> | undefined;
  try {
    const batch = (await loadSharedSourceReviewBatches(process.cwd())).find(
      (b) => b.unit === 3 && b.candidates[0].bookId === ids[2],
    )!;
    const candidate = batch.candidates[0];
    let saved = reconcileManifest(batch.candidates.slice(0, -1));
    saved = recordDecision(
      saved,
      batch.candidates.slice(0, -1),
      {
        id: candidate.id,
        expectedRevision: 0,
        decision: "needs_correction",
        notes: "Isolated fixture only",
        unresolvedIssues: [...candidate.qualityFlags],
        inspectedPages: requiredSourcePages(candidate),
        textConfirmed: false,
        keyConfirmed: false,
        diagramConfirmed: false,
      },
      { id: "fixture", name: "Fixture", email: "fixture@example.test" },
    );
    const { mkdir } = await import("node:fs/promises");
    await mkdir(path.join(directory, batch.id), { recursive: true });
    const file = path.join(directory, batch.id, "decisions.json");
    await writeFile(file, JSON.stringify(saved));
    app = await startLocalPhysicsReview({
      root: process.cwd(),
      directory,
      port: 0,
    });
    const after = await json(file);
    assert.equal(after.entries.length, 18);
    for (const entry of saved.entries)
      assert.deepEqual(
        after.entries.find((e: { id: string }) => e.id === entry.id),
        entry,
      );
    assert.equal(after.entries.at(-1).decision, "pending");
    assert.deepEqual(after.entries.at(-1).history, []);
  } finally {
    await app?.close();
    assert(
      directory.startsWith(path.join(os.tmpdir(), "skillup-portal-append-")),
    );
    await rm(directory, { recursive: true, force: true });
  }
});
