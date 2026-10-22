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

test("Chapter 5 source sections preserve 22 unique occurrences, recover missing Applications Q7 once, retain PHP line order and English choices, and stop before dotless fill-ins", async () => {
  const signatures = new Set<string>();
  let count = 0,
    recovered = 0;
  for (const d of definitions.filter((d) => d.chapterNumber === 5)) {
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
    const cs = result.candidates.filter((c) => c.chapterId.endsWith("-ch-5"));
    assert.deepEqual(
      cs.map((c) => c.number),
      Array.from(
        { length: book.subject === "Computer Applications" ? 10 : 12 },
        (_, i) => i + 1,
      ),
    );
    for (const c of cs) {
      count++;
      assert.ok(
        saved.candidates.some((old: { id: string }) => old.id === c.id),
      );
      assert.equal(c.options.length, 4);
      assert.equal(c.correctAnswer, null);
      assert.equal(c.extractionEvidence.keyMatched, false);
      assert.equal(c.practicePublished, false);
      assert.equal(c.status, "Needs Review");
      assert.ok(c.qualityFlags.some((f) => f.includes("Tamil")));
      assert.equal(c.extractionEvidence.completeTextOptions, true);
      assert.ok(!c.options.join(" ").includes(".indd"));
      assert.ok(!c.options.join(" ").includes("II."));
      if (!c.extractionEvidence.reusedExistingId) recovered++;
      const signature = JSON.stringify([c.questionText, ...c.options]).replace(
        /\s+/gu,
        " ",
      );
      assert.ok(!signatures.has(signature));
      signatures.add(signature);
    }
    if (book.subject === "Computer Applications") {
      const code = cs[4].questionText;
      const tokens = [
        "<?php",
        "$a=array(",
        "$b=array(",
        "$c=array_combine($a,$b);",
        "print_r(array_count_values($c));",
        "?>",
      ];
      let offset = -1;
      for (const token of tokens) {
        const index = code.indexOf(token);
        assert.ok(index > offset, token);
        offset = index;
      }
      assert.ok(code.split("\n").length >= 7);
      assert.deepEqual(cs[4].options, [
        "Array ( [A] => 5 [Cat] => 2 [Dog] => 2 [Tiger] => 1 )",
        "Array ( [A] => 2 [Cat] => 2 [Dog] => 1 [Tiger] => 1 )",
        "Array ( [A] => 6 [Cat] => 1 [Dog] => 2 [Tiger] => 1 )",
        "Array ( [A] => 2 [Cat] => 1 [Dog] => 4 [Tiger] => 1 )",
      ]);
      assert.ok(cs[3].questionText.includes("\ni."));
      assert.ok(cs[3].questionText.includes("$state[]"));
      assert.ok(cs[3].questionText.includes("State[0]"));
      assert.equal(cs[6].extractionEvidence.reusedExistingId, false);
      assert.ok(cs[6].id.startsWith("textbook-bounded-"));
      assert.ok(cs[6].options[0].includes("$my_array {4}"));
      assert.ok(cs[6].options[1].includes("$my_array [4]"));
      assert.ok(
        cs[1].qualityFlags.some((f) => f.includes("double underscore")),
      );
      // A recovered source record becoming saved must not change its evidence digest.
      const withoutRecovery = saved.candidates.filter(
        (c: { id: string }) => c.id !== cs[6].id,
      );
      assert.deepEqual(
        (await extractComputerSourceSections(book, text, withoutRecovery))
          .candidates,
        result.candidates,
      );
    } else {
      assert.deepEqual(cs[2].options, [
        "Insert → New",
        "Ctrl+W",
        "File → New",
        "Ctrl+D",
      ]);
      assert.deepEqual(cs[6].options, [".shw", ".doc", ".xls", ".fla"]);
      assert.ok(cs[10].options[3].startsWith("Shift"));
      assert.ok(!cs[11].options.join(" ").includes("II"));
      assert.ok(
        result.summaries
          .find((s) => s.chapterNumber === 5)!
          .excludedItems.some((e) => e.kind.includes("fill-in")),
      );
    }
  }
  assert.equal(count, 22);
  assert.equal(signatures.size, 22);
  assert.equal(recovered, 1);
});

test("Chapter 5 local decisions remain pending; explicit isolated corrections can retain unknown answers but cannot pass approval/audit", async () => {
  const batches = (await loadComputerReviewBatches(process.cwd())).filter(
    (b) => b.unit === 5,
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
    const c = b.candidates.find((c) => c.number === 5)!;
    const input = {
      id: c.id,
      expectedRevision: 0,
      decision: "needs_correction" as const,
      notes:
        "Isolated fixture only: original code and source punctuation require verification",
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
      /answer evidence/i,
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
