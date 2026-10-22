import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import catalog from "../src/lib/textbooks-catalog.json";
import { extractComputerSourceSections } from "../scripts/lib/computer-source-extraction";
import { loadComputerReviewBatches } from "../scripts/lib/computer-review-batches";
import {
  reconcileManifest,
  recordDecision,
} from "../scripts/lib/local-physics-review";
import { auditTeacherManifest } from "../scripts/lib/teacher-decision-audit";
import type { Textbook } from "../src/lib/textbooks";

test("Chapter 3 source inventory preserves all 24 existing IDs, binary choices, printed numbering gap and unknown answers on repeat extraction", async () => {
  for (const id of [
    "12-computer-applications-tamil-e51fbdf6",
    "12-computer-technology-tamil-c66e9089",
  ]) {
    const book = catalog.books.find((b) => b.id === id) as Textbook;
    const saved = JSON.parse(
      await readFile(
        `.local/teacher-review/extracted-books/${id}.json`,
        "utf8",
      ),
    );
    const text = JSON.parse(
      await readFile(`.local/textbook-text/${id}.json`, "utf8"),
    );
    const first = await extractComputerSourceSections(
      book,
      text,
      saved.candidates,
    );
    const repeated = await extractComputerSourceSections(
      book,
      text,
      saved.candidates,
    );
    assert.deepEqual(first, repeated);
    assert.deepEqual(first.candidates, saved.sourceBoundedProposals);
    const chapter = first.candidates.filter((c) =>
      c.chapterId.endsWith("-ch-3"),
    );
    assert.deepEqual(
      chapter.map((c) => c.number),
      id.includes("applications")
        ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15],
    );
    for (const c of chapter) {
      assert.ok(
        saved.candidates.some((old: { id: string }) => old.id === c.id),
      );
      assert.equal(c.correctAnswer, null);
      assert.equal(c.status, "Needs Review");
      assert.equal(c.practicePublished, false);
      assert.equal(c.extractionEvidence.keyMatched, false);
      assert.equal(c.extractionEvidence.reusedExistingId, true);
      assert.ok(c.extractionEvidence.originalPageText.length);
      assert.ok(c.qualityFlags.some((f) => f.includes("Tamil")));
      assert.ok(!c.options.join(" ").includes("பகுதி"));
      assert.ok(!c.options.join(" ").includes(".indd"));
    }
    if (id.includes("applications")) {
      assert.equal(chapter[5].options.length, 2);
      assert.equal(chapter[5].extractionEvidence.completeTextOptions, false);
      assert.deepEqual(chapter[3].options, [
        "Delete database database_name",
        "Delete database_name",
        "Drop database database_name",
        "Drop database_name",
      ]);
      assert.ok(chapter[1].options[0].includes("Entity – Relationship"));
    } else {
      assert.deepEqual(chapter[0].options, [
        "Pagemaker",
        "photoshop",
        "Corel Draw",
        "Ms Word",
      ]);
      assert.deepEqual(chapter.find((c) => c.number === 8)!.options, [
        "5",
        "3",
        "2",
        "7",
      ]);
      assert.ok(!chapter[0].questionText.includes("Bitmaps"));
    }
  }
});

test("Chapter 3 review manifest preserves source numbering; binary item cannot approve or audit as approved", async () => {
  const batches = (await loadComputerReviewBatches(process.cwd())).filter(
    (b) => b.unit === 3,
  );
  assert.equal(batches.length, 2);
  for (const b of batches) {
    const m = reconcileManifest(b.candidates);
    assert.equal(m.entries.length, b.candidates.length);
    assert.ok(
      m.entries.every((e) => e.decision === "pending" && !e.history.length),
    );
    assert.ok(
      auditTeacherManifest(m, {
        candidates: b.candidates,
        persisted: m,
        reviewers: [],
        requireExport: false,
      }).valid,
    );
  }
  const batch = batches.find((b) =>
    b.candidates.some((c) => c.number === 6 && c.options.length === 2),
  )!;
  const c = batch.candidates.find((c) => c.number === 6)!;
  const manifest = reconcileManifest(batch.candidates);
  const reviewer = {
    id: "fixture",
    name: "Isolated fixture",
    email: "fixture@example.test",
  };
  const saved = recordDecision(
    manifest,
    batch.candidates,
    {
      id: c.id,
      expectedRevision: 0,
      decision: "needs_correction",
      notes:
        "Isolated fixture only: retain unknown answer and two printed choices",
      unresolvedIssues: c.qualityFlags,
      inspectedPages: [103],
      textConfirmed: false,
      keyConfirmed: false,
      diagramConfirmed: false,
      correction: {
        questionText: c.questionText,
        options: c.options,
        correctAnswer: null,
        sourceMappingConfirmed: false,
      },
    },
    reviewer,
  );
  assert.equal(
    saved.entries.find((e) => e.id === c.id)!.history[0].correction!
      .correctAnswer,
    null,
  );
  assert.ok(
    auditTeacherManifest(saved, {
      candidates: batch.candidates,
      persisted: saved,
      reviewers: [reviewer],
      requireExport: false,
    }).valid,
  );
  const forged = structuredClone(saved);
  const entry = forged.entries.find((e) => e.id === c.id)!;
  entry.decision = "approved";
  entry.history[0].decision = "approved";
  assert.equal(
    auditTeacherManifest(forged, {
      candidates: batch.candidates,
      persisted: forged,
      reviewers: [reviewer],
      requireExport: false,
    }).valid,
    false,
  );
  assert.throws(
    () =>
      recordDecision(
        manifest,
        batch.candidates,
        {
          id: c.id,
          expectedRevision: 0,
          decision: "approved",
          notes: "Isolated adversarial test only",
          unresolvedIssues: [],
          inspectedPages: [103],
          textConfirmed: true,
          keyConfirmed: true,
          diagramConfirmed: false,
        },
        {
          id: "fixture",
          name: "Isolated fixture",
          email: "fixture@example.test",
        },
      ),
    /incomplete|unknown|answer/i,
  );
});
