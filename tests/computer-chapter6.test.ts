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

test("Chapter 6 preserves all 16 existing source IDs, cross-page PHP, genuine printed duplicates and seven AutoCAD choices without importing lesson/practical text", async () => {
  const allIds = new Set<string>();
  const signatures = new Set<string>();
  for (const d of definitions.filter((d) => d.chapterNumber === 6)) {
    const book = catalog.books.find((b) => b.id === d.bookId) as Textbook;
    const saved = JSON.parse(
      await readFile(
        `.local/teacher-review/extracted-books/${d.bookId}.json`,
        "utf8",
      ),
    );
    const cache = JSON.parse(
      await readFile(`.local/textbook-text/${d.bookId}.json`, "utf8"),
    );
    const result = await extractComputerSourceSections(
      book,
      cache,
      saved.candidates,
    );
    assert.deepEqual(
      result,
      await extractComputerSourceSections(book, cache, saved.candidates),
    );
    assert.deepEqual(result.candidates, saved.sourceBoundedProposals);
    const cs = result.candidates.filter((c) => c.chapterId.endsWith("-ch-6"));
    assert.deepEqual(
      cs.map((c) => c.number),
      Array.from(
        { length: d.subject === "Computer Applications" ? 9 : 7 },
        (_, i) => i + 1,
      ),
    );
    for (const c of cs) {
      assert(!allIds.has(c.id));
      allIds.add(c.id);
      signatures.add(
        JSON.stringify([c.questionText, ...c.options]).replace(/\s+/gu, " "),
      );
      assert(saved.candidates.some((old: { id: string }) => old.id === c.id));
      assert.equal(c.extractionEvidence.reusedExistingId, true);
      assert.equal(c.correctAnswer, null);
      assert.equal(c.reviewStatus, "needs_teacher_review");
      assert.equal(c.practicePublished, false);
      assert.equal(c.options.length, 4);
      assert(c.options.every((o) => o.trim()));
      assert.equal(c.extractionEvidence.keyMatched, false);
      assert.equal(c.extractionEvidence.completeTextOptions, true);
      assert(c.qualityFlags.some((f) => /Tamil/.test(f)));
      assert(!c.questionText.includes(".indd"));
      assert(!c.options.join(" ").includes("II."));
    }
    if (d.subject === "Computer Applications") {
      assert.equal(cs[0].originalExtraction.options.length, 0);
      assert(!cs[0].options.join(" ").includes("●"));
      assert.deepEqual(cs[2].extractionEvidence.printedPages, [120, 121]);
      assert.deepEqual(
        cs[2].extractionEvidence.originalPageText.map((p) => p.page),
        [130, 131],
      );
      assert.equal(cs[2].endPage, 131);
      assert(cs[2].questionText.includes("$x ;\nif ($x==0)"));
      assert(cs[2].questionText.includes("print “hello”\n?>"));
      assert.equal(cs[2].options[1], "hig hello");
      assert.equal(cs[4].questionText, cs[5].questionText);
      assert.deepEqual(cs[4].options, cs[5].options);
      assert.notEqual(cs[4].id, cs[5].id);
      assert(cs[4].qualityFlags.some((f) => /printed duplicate/.test(f)));
      assert(cs[5].qualityFlags.some((f) => /printed duplicate/.test(f)));
      assert(
        cs[5].questionText.includes("print “all”;\nif else\nprint “some”;\n?>"),
      );
      assert(cs[6].questionText.includes("$x>$y+$y!=3"));
      assert(cs[7].questionText.includes("$x>$y&&1||1"));
      assert(cs[8].questionText.includes("pring"));
      assert(!cs[8].options.join(" ").includes("பகுதி"));
    } else {
      assert(cs.every((c) => c.page === 230 && c.endPage === 230));
      assert.deepEqual(cs[4].options, [
        "Ctrl + 1",
        "Ctrl + 9",
        "Ctrl + 8",
        "Ctrl + 7",
      ]);
      assert.deepEqual(cs[6].options, ["F1", "F2", "F3", "F7"]);
      assert.equal(cs[5].options[0], "User Coordinate System");
      assert(!cs.some((c) => c.id.endsWith("9dc4d59234292072")));
      assert(
        result.summaries
          .find((s) => s.chapterNumber === 6)!
          .excludedItems.some((e) => e.page === 232),
      );
    }
  }
  assert.equal(allIds.size, 16);
  assert.equal(signatures.size, 15); // Q5/Q6 are an actual printed duplicate pair.
});

test("Chapter 6 unknown-answer review can save isolated correction notes, requires both Q3 pages, and rejects approval in save and manifest audit", async () => {
  const batches = (await loadComputerReviewBatches(process.cwd())).filter(
    (b) => b.unit === 6,
  );
  assert.equal(batches.length, 2);
  const reviewer = {
    id: "fixture-ch6",
    name: "Isolated Chapter 6 fixture",
    email: "ch6-fixture@example.test",
  };
  for (const b of batches) {
    const c = b.candidates.find((c) => c.number === 3)!;
    if (b.title.startsWith("Computer Applications"))
      assert.deepEqual(requiredSourcePages(c), [130, 131]);
    const manifest = reconcileManifest(b.candidates);
    const decision = {
      id: c.id,
      expectedRevision: 0,
      decision: "needs_correction" as const,
      notes:
        "Isolated test fixture only: check original Tamil, code and source mapping",
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
    const corrected = recordDecision(
      manifest,
      b.candidates,
      decision,
      reviewer,
    );
    assert(
      auditTeacherManifest(corrected, {
        candidates: b.candidates,
        persisted: corrected,
        reviewers: [reviewer],
        requireExport: false,
      }).valid,
    );
    assert.throws(
      () =>
        recordDecision(
          manifest,
          b.candidates,
          { ...decision, decision: "approved" },
          reviewer,
        ),
      /answer evidence/i,
    );
    const forged = structuredClone(corrected),
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
