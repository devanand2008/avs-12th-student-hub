import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import catalog from "../src/lib/textbooks-catalog.json";
import { extractComputerSourceSections } from "../scripts/lib/computer-source-extraction";
import { loadComputerReviewBatches } from "../scripts/lib/computer-review-batches";
import {
  reconcileManifest,
  recordDecision,
  requiredSourcePages,
} from "../scripts/lib/local-physics-review";
import type { Textbook } from "../src/lib/textbooks";

const bookId = "12-computer-applications-tamil-e51fbdf6";
const chapters = [10, 11, 12, 14];
test("network source batch preserves matching premises, recovered assertion/reason MCQ and original IDs on exact rerun", async () => {
  const packet = JSON.parse(
    await readFile(
      `.local/teacher-review/extracted-books/${bookId}.json`,
      "utf8",
    ),
  );
  const original = JSON.stringify(packet.candidates);
  const source = JSON.parse(
    await readFile(`.local/textbook-text/${bookId}.json`, "utf8"),
  );
  const book = catalog.books.find((b) => b.id === bookId) as Textbook;
  const fresh = await extractComputerSourceSections(
    book,
    source,
    packet.candidates,
  );
  assert.deepEqual(
    fresh,
    await extractComputerSourceSections(book, source, packet.candidates),
  );
  assert.deepEqual(fresh.candidates, packet.sourceBoundedProposals);
  assert.equal(JSON.stringify(packet.candidates), original);
  const selected = fresh.candidates.filter((c) =>
    chapters.some((n) => c.chapterId.endsWith(`-ch-${n}`)),
  );
  assert.equal(selected.length, 51);
  assert.equal(new Set(selected.map((c) => c.id)).size, 51);
  assert.equal(
    selected.filter((c) => !c.extractionEvidence.reusedExistingId).length,
    3,
  );
  for (const [number, count] of [
    [10, 16],
    [11, 10],
    [12, 15],
    [14, 10],
  ]) {
    const cs = selected.filter((c) => c.chapterId.endsWith(`-ch-${number}`));
    assert.deepEqual(
      cs.map((c) => c.number),
      Array.from({ length: count }, (_, i) => i + 1),
    );
  }
  for (const c of selected) {
    assert.equal(c.correctAnswer, null);
    assert.equal(c.practicePublished, false);
    assert.equal(c.reviewStatus, "needs_teacher_review");
    assert.equal(c.options.length, 4);
    assert(c.options.every((o) => o.trim()));
    assert.deepEqual(c.extractionEvidence.printedPages, [c.page - 10]);
    assert(c.qualityFlags.some((f) => /Tamil/.test(f)));
    assert(!c.options.some((o) => /\.indd|II\./.test(o)));
  }
  const question = (chapter: number, n: number) =>
    selected.find(
      (c) => c.chapterId.endsWith(`-ch-${chapter}`) && c.number === n,
    )!;
  const matching = question(11, 3);
  assert.equal(matching.id, `textbook-section-${bookId}-7e9b7b99498d3c78`);
  for (const protocol of ["HTTP", "FTP", "SMTP", "DNS"])
    assert(matching.questionText.includes(protocol));
  assert.deepEqual(matching.options, [
    "1, 2, 3, 4",
    "2, 3, 4, 1",
    "3, 4, 1, 2",
    "4, 3, 2, 1",
  ]);
  assert.equal(question(11, 9).page, 193);
  assert.equal(question(12, 14).page, 208);
  assert(question(12, 14).questionText.includes("128"));
  assert.equal(question(12, 15).page, 209);
  assert.deepEqual(question(12, 15).options, [
    "1, 4, 3, 2",
    "3,4,2,1",
    "3,2,1,4",
    "3,4,1,2",
  ]);
  assert.deepEqual(question(12, 7).options.slice(2), [":", "Null"]);
  assert.deepEqual(question(14, 5).options, ["13", "3", "2", "4"]);
  assert.deepEqual(question(14, 6).options, [
    "UNIX & TCL",
    "UNIX & a. C++",
    "C++ & OTcl",
    "C++ & NS2",
  ]);
  assert.equal(question(14, 6).extractionEvidence.reusedExistingId, false);
  assert.equal(question(14, 10).extractionEvidence.reusedExistingId, true);
});

test("all 51 newly bounded questions remain blocked from approval without known answers", async () => {
  const batches = (await loadComputerReviewBatches(process.cwd())).filter(
    (b) => b.candidates[0].bookId === bookId && chapters.includes(b.unit),
  );
  assert.equal(batches.length, 4);
  const actor = {
    id: "isolated-network-fixture",
    name: "Test fixture",
    email: "fixture@example.test",
  };
  for (const batch of batches) {
    const manifest = reconcileManifest(batch.candidates);
    for (const c of batch.candidates) {
      assert.throws(() =>
        recordDecision(
          manifest,
          batch.candidates,
          {
            id: c.id,
            expectedRevision: 0,
            decision: "approved",
            notes: "Isolated attempted bypass",
            unresolvedIssues: [],
            inspectedPages: requiredSourcePages(c),
            textConfirmed: true,
            keyConfirmed: true,
            diagramConfirmed: true,
          },
          actor,
        ),
      );
    }
    assert(
      manifest.entries.every(
        (e) => e.decision === "pending" && !e.history.length,
      ),
    );
  }
});
