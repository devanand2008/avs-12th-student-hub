import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import catalog from "../src/lib/textbooks-catalog.json";
import definitions from "../scripts/data/computer-source-sections.json";
import { extractComputerSourceSections } from "../scripts/lib/computer-source-extraction";
import { loadComputerReviewBatches } from "../scripts/lib/computer-review-batches";
import {
  reconcileManifest,
  recordDecision,
  requiredSourcePages,
} from "../scripts/lib/local-physics-review";
import { auditTeacherManifest } from "../scripts/lib/teacher-decision-audit";
import type { Textbook } from "../src/lib/textbooks";

test("Both Chapter 4 sections preserve 19 existing IDs, source punctuation, missing program, duplicate choices and matching premises on rerun", async () => {
  for (const d of definitions.filter((d) => d.chapterNumber === 4)) {
    const book = catalog.books.find((b) => b.id === d.bookId) as Textbook;
    const saved = JSON.parse(
      await readFile(
        `.local/teacher-review/extracted-books/${book.id}.json`,
        "utf8",
      ),
    );
    const text = JSON.parse(
      await readFile(`.local/textbook-text/${book.id}.json`, "utf8"),
    );
    const result = await extractComputerSourceSections(
      book,
      text,
      saved.candidates,
    );
    assert.deepEqual(
      result,
      await extractComputerSourceSections(book, text, saved.candidates),
    );
    assert.deepEqual(result.candidates, saved.sourceBoundedProposals);
    const cs = result.candidates.filter((c) => c.chapterId.endsWith("-ch-4"));
    assert.deepEqual(
      cs.map((c) => c.number),
      Array.from(
        { length: book.subject === "Computer Applications" ? 9 : 10 },
        (_, i) => i + 1,
      ),
    );
    for (const c of cs) {
      assert.ok(
        saved.candidates.some((old: { id: string }) => old.id === c.id),
      );
      assert.equal(c.options.length, 4);
      assert.equal(c.correctAnswer, null);
      assert.equal(c.extractionEvidence.keyMatched, false);
      assert.equal(c.practicePublished, false);
      assert.equal(c.status, "Needs Review");
      assert.ok(c.qualityFlags.some((f) => f.includes("Tamil")));
      assert.ok(!c.options.join(" ").includes("II."));
      assert.ok(!c.options.join(" ").includes(".indd"));
    }
    if (book.subject === "Computer Applications") {
      assert.equal(cs[2].options[1], cs[2].options[3]);
      assert.equal(cs[2].options[1], "<?php?>");
      assert.ok(cs[2].qualityFlags.some((f) => f.includes("not distinct")));
      assert.equal(cs[5].extractionEvidence.completeTextOptions, false);
      assert.ok(
        cs[5].qualityFlags.some((f) => f.includes("supplies no program")),
      );
      assert.ok(cs[4].questionText.includes("**/"));
      assert.ok(cs[7].options[0].includes("\\$x"));
      assert.deepEqual(cs[8].options, ["\\r;", "\\n;", "/n;", "/r;"]);
      assert.ok(
        cs[0].extractionEvidence.originalPageText[0].text.includes("\u0007"),
      );
      assert.ok(!cs[0].questionText.includes("\u0007"));
    } else {
      assert.deepEqual(cs[4].options, [
        "1, 2, 3, 4",
        "2, 3, 4, 1",
        "4, 1, 2, 3",
        "3, 4, 1, 2",
      ]);
      for (const token of ["TGA", "MIDI", "MPEG", "RTF"])
        assert.ok(cs[4].questionText.includes(token));
      assert.equal(
        cs[3].id,
        "textbook-q-12-computer-technology-tamil-c66e9089-f48ce5b631165614",
      );
      assert.ok(
        !cs.some(
          (c) =>
            c.id ===
            "textbook-q-12-computer-technology-tamil-c66e9089-7932776597725b4e",
        ),
      );
      assert.equal(cs[9].options[1], "Micorsoft");
    }
  }
});

test("Chapter 4 missing-program item stays held; local correction decisions and audit preserve source evidence and reject approvals", async () => {
  const batches = (await loadComputerReviewBatches(process.cwd())).filter(
    (b) => b.unit === 4,
  );
  assert.equal(batches.length, 2);
  const reviewer = {
    id: "fixture",
    name: "Isolated fixture",
    email: "fixture@example.test",
  };
  for (const b of batches) {
    const m = reconcileManifest(b.candidates);
    assert.ok(
      auditTeacherManifest(m, {
        candidates: b.candidates,
        persisted: m,
        reviewers: [],
        requireExport: false,
      }).valid,
    );
    const c = b.candidates.find((c) => c.number === 6)!;
    const input = {
      id: c.id,
      expectedRevision: 0,
      decision: "needs_correction" as const,
      notes: "Isolated fixture only",
      unresolvedIssues: c.qualityFlags,
      inspectedPages: requiredSourcePages(c),
      textConfirmed: false,
      keyConfirmed: false,
      diagramConfirmed: false,
      correction: {
        questionText: c.questionText,
        options: c.options,
        correctAnswer: null,
        sourceMappingConfirmed: false,
      },
    };
    const changed = recordDecision(m, b.candidates, input, reviewer);
    assert.ok(
      auditTeacherManifest(changed, {
        candidates: b.candidates,
        persisted: changed,
        reviewers: [reviewer],
        requireExport: false,
      }).valid,
    );
    assert.throws(
      () =>
        recordDecision(
          m,
          b.candidates,
          { ...input, decision: "approved" },
          reviewer,
        ),
      /answer evidence|incomplete/i,
    );
    const forged = structuredClone(changed),
      entry = forged.entries.find((e) => e.id === c.id)!;
    entry.decision = "approved";
    entry.history[0].decision = "approved";
    assert.equal(
      auditTeacherManifest(forged, {
        candidates: b.candidates,
        persisted: forged,
        reviewers: [reviewer],
        requireExport: false,
      }).valid,
      false,
    );
  }
});
