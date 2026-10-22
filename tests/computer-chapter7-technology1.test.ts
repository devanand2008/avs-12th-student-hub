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

const selected = definitions.filter(
  (d) =>
    (d.subject === "Computer Applications" && d.chapterNumber === 7) ||
    (d.subject === "Computer Technology" && d.chapterNumber === 1),
);

test("Applications Chapter 7 and Technology Chapter 1 retain 21 source IDs, cross-page choices, printed PHP defects and explicit nonstandard-item boundaries on rerun", async () => {
  const ids = new Set<string>(),
    signatures = new Set<string>();
  for (const d of selected) {
    const book = catalog.books.find((b) => b.id === d.bookId) as Textbook;
    const saved = JSON.parse(
      await readFile(
        `.local/teacher-review/extracted-books/${d.bookId}.json`,
        "utf8",
      ),
    );
    const source = JSON.parse(
      await readFile(`.local/textbook-text/${d.bookId}.json`, "utf8"),
    );
    const result = await extractComputerSourceSections(
      book,
      source,
      saved.candidates,
    );
    assert.deepEqual(
      result,
      await extractComputerSourceSections(book, source, saved.candidates),
    );
    assert.deepEqual(result.candidates, saved.sourceBoundedProposals);
    const cs = result.candidates.filter((c) =>
      c.chapterId.endsWith(`-ch-${d.chapterNumber}`),
    );
    assert.deepEqual(
      cs.map((c) => c.number),
      Array.from({ length: d.chapterNumber === 7 ? 9 : 12 }, (_, i) => i + 1),
    );
    for (const c of cs) {
      assert(!ids.has(c.id));
      ids.add(c.id);
      signatures.add(
        JSON.stringify([c.questionText, ...c.options]).replace(/\s+/gu, " "),
      );
      assert(saved.candidates.some((old: { id: string }) => old.id === c.id));
      assert.equal(c.extractionEvidence.reusedExistingId, true);
      assert.equal(c.correctAnswer, null);
      assert.equal(c.extractionEvidence.keyMatched, false);
      assert.equal(c.reviewStatus, "needs_teacher_review");
      assert.equal(c.practicePublished, false);
      assert.equal(c.options.length, 4);
      assert(c.options.every((o) => o.trim()));
      assert(c.qualityFlags.some((f) => /Tamil/.test(f)));
      assert(!c.options.join(" ").includes(".indd"));
    }
    if (d.chapterNumber === 7) {
      assert(cs[1].options[1].endsWith("(Bounded)")); // Decorative title fragment is outside the bounded source region.
      assert(cs[1].options[2].startsWith("While"));
      assert(
        cs[3].questionText.includes(
          "$counter = 20; $counter < 10;\n$counter++",
        ),
      );
      assert(cs[3].options[2].includes("Cunter"));
      assert(cs[3].options[3].includes("Counder"));
      assert(
        cs[4].questionText.includes(
          "$counter = $counter + 5){\nEcho “Hello”;\n?>",
        ),
      );
      assert(!cs[4].questionText.includes("}"));
      assert(cs[4].qualityFlags.some((f) => /no closing brace/.test(f)));
      assert(cs[6].questionText.includes("<? php"));
      assert.deepEqual(cs[6].options.slice(0, 3), [
        "12 squared 141",
        "12 squared=141",
        "“12 squared=141”",
      ]);
      assert(cs[7].questionText.includes("print “*\\t ”;"));
      assert.deepEqual(
        cs[7].options.slice(0, 3).map((o) => o.length),
        [10, 9, 12],
      );
      assert.equal(cs[8].originalExtraction.options.length, 0);
      assert.equal(cs[8].page, 138);
      assert.equal(cs[8].endPage, 139);
      assert.deepEqual(cs[8].extractionEvidence.printedPages, [128, 129]);
      assert.deepEqual(cs[8].options.slice(0, 3), [
        "123456713910412",
        "123456713910",
        "1234567139104",
      ]);
      assert(!cs[8].options.join(" ").includes("பகுதி"));
      assert(!cs.some((c) => c.id.endsWith("88402c487effcff3"))); // Saved open-response artifact remains outside this source batch.
    } else {
      assert.equal(d.chapterStartPdfPage, 7);
      assert.equal(d.chapterEndPdfPage, 50);
      assert.equal(cs[4].originalExtraction.options.length, 0);
      assert.deepEqual(cs[4].options, [
        "Ctrl+A",
        "Ctrl +B",
        "Ctrl+C",
        "Ctrl+W",
      ]);
      assert.deepEqual(cs[11].options, [
        "Ctrl+A",
        "Ctrl +P",
        "Ctrl+C",
        "Ctrl+V",
      ]);
      const excluded = result.summaries.find(
        (s) => s.chapterNumber === 1,
      )!.excludedItems;
      assert.deepEqual(
        excluded.flatMap((i) => i.numbers),
        [13, 14, 15, 16, 17, 18, 19, 20, 21],
      );
      assert(
        excluded
          .find((i) => i.numbers.includes(19))!
          .kind.includes("Composite odd-one-out"),
      );
      assert(
        saved.candidates.some((c: { id: string }) =>
          c.id.endsWith("08aed39e520e0670"),
        ),
      );
      assert(!cs.some((c) => c.id.endsWith("08aed39e520e0670")));
    }
  }
  assert.equal(ids.size, 21);
  assert.equal(signatures.size, 21);
});

test("New source batches keep unknown-answer approval blocked while isolated correction history and cross-page source references remain audit-valid", async () => {
  const batches = (await loadComputerReviewBatches(process.cwd())).filter((b) =>
    selected.some(
      (d) => b.candidates[0].bookId === d.bookId && b.unit === d.chapterNumber,
    ),
  );
  assert.equal(batches.length, 2);
  const reviewer = {
    id: "isolated-source-fixture",
    name: "Isolated fixture",
    email: "source-fixture@example.test",
  };
  for (const b of batches) {
    const c = b.candidates.at(-1)!;
    if (b.unit === 7) assert.deepEqual(requiredSourcePages(c), [138, 139]);
    const manifest = reconcileManifest(b.candidates);
    const input = {
      id: c.id,
      expectedRevision: 0,
      decision: "needs_correction" as const,
      notes:
        "Isolated test fixture only: inspect source wording and answer evidence",
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
    const corrected = recordDecision(manifest, b.candidates, input, reviewer);
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
          { ...input, decision: "approved" },
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
