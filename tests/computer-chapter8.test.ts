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

const bookId = "12-computer-applications-tamil-e51fbdf6";

test("Applications Chapter 8 reuses ten source IDs, preserves cross-page choice D and printed defects, and excludes glossary and open responses on rerun", async () => {
  const definition = definitions.find(
    (d) => d.bookId === bookId && d.chapterNumber === 8,
  )!;
  assert.equal(definition.chapterStartPdfPage, 140);
  assert.equal(definition.chapterEndPdfPage, 150);
  assert.equal(definition.chapterTitle, "படிவங்கள் மற்றும் கோப்புகள்");
  const book = catalog.books.find((b) => b.id === bookId) as Textbook;
  const saved = JSON.parse(
    await readFile(
      `.local/teacher-review/extracted-books/${bookId}.json`,
      "utf8",
    ),
  );
  const source = JSON.parse(
    await readFile(`.local/textbook-text/${bookId}.json`, "utf8"),
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
  const cs = result.candidates.filter((c) => c.chapterId.endsWith("-ch-8"));
  assert.deepEqual(
    cs.map((c) => c.number),
    Array.from({ length: 10 }, (_, i) => i + 1),
  );
  assert.equal(new Set(cs.map((c) => c.id)).size, 10);
  for (const c of cs) {
    assert(saved.candidates.some((old: { id: string }) => old.id === c.id));
    assert(c.extractionEvidence.reusedExistingId);
    assert.equal(c.correctAnswer, null);
    assert.equal(c.extractionEvidence.keyMatched, false);
    assert.equal(c.reviewStatus, "needs_teacher_review");
    assert.equal(c.practicePublished, false);
    assert.equal(c.options.length, 4);
    assert(c.options.every((o) => o.trim()));
    assert(c.qualityFlags.some((f) => /Tamil/.test(f)));
    assert(!c.options.join(" ").includes(".indd"));
  }
  assert(cs[0].questionText.includes("$ -GET"));
  assert.equal(cs[1].options[2], "REGUEST");
  assert.deepEqual(cs[2].options, [
    "file – uploads",
    "file – upload",
    "file – insert",
    "file –intalic",
  ]);
  assert.equal(cs[3].originalExtraction.options.length, 3);
  assert.equal(cs[3].page, 148);
  assert.equal(cs[3].endPage, 149);
  assert.deepEqual(cs[3].extractionEvidence.printedPages, [138, 139]);
  assert(cs[3].questionText.includes("linput type = “text”>"));
  assert(cs[4].options[2].startsWith("Janscript"));
  assert.deepEqual(cs[5].options, [
    "f open ()",
    "fr end ()",
    "fgdc ()",
    "dile ()",
  ]);
  assert.equal(cs[7].options[0], cs[7].options[2]);
  assert(cs[7].qualityFlags.some((f) => /identical/.test(f)));
  assert.deepEqual(cs[9].options, [
    "fgets()",
    "file – get-contents()",
    "freed()",
    "readsia()",
  ]);
  assert(
    cs[9].extractionEvidence.proposedColumnOrderedSpan.endsWith("readsia()"),
  );
  assert(
    result.summaries
      .find((s) => s.chapterNumber === 8)!
      .excludedItems.some((i) => i.page === 150),
  );
});

test("Chapter 8 unknown answers block approval and forged approvals while isolated correction decisions retain cross-page source history", async () => {
  const batch = (await loadComputerReviewBatches(process.cwd())).find(
    (b) => b.candidates[0].bookId === bookId && b.unit === 8,
  )!;
  assert.equal(batch.candidates.length, 10);
  const c = batch.candidates[3];
  assert.deepEqual(requiredSourcePages(c), [148, 149]);
  const reviewer = {
    id: "isolated-ch8-fixture",
    name: "Isolated fixture",
    email: "ch8-fixture@example.test",
  };
  const manifest = reconcileManifest(batch.candidates);
  const input = {
    id: c.id,
    expectedRevision: 0,
    decision: "needs_correction" as const,
    notes: "Isolated test only: inspect both pages and retain unknown answer",
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
  const corrected = recordDecision(manifest, batch.candidates, input, reviewer);
  assert(
    auditTeacherManifest(corrected, {
      candidates: batch.candidates,
      persisted: corrected,
      reviewers: [reviewer],
      requireExport: false,
    }).valid,
  );
  assert.throws(
    () =>
      recordDecision(
        manifest,
        batch.candidates,
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
      candidates: batch.candidates,
      persisted: forged,
      reviewers: [reviewer],
      requireExport: false,
    }).valid,
    false,
  );
});
