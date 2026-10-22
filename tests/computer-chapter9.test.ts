import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
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

test("Applications Chapter 9 recovers Q1 with a deterministic ID, preserves ten existing IDs and all eleven printed choice sequences without glossary/footer contamination on rerun", async () => {
  const definition = definitions.find(
    (d) => d.bookId === bookId && d.chapterNumber === 9,
  )!;
  assert.equal(definition.chapterTitle, "PHP-உடன் MySQL-ஐ இணைத்தல்");
  assert.equal(definition.chapterStartPdfPage, 151);
  assert.equal(definition.chapterEndPdfPage, 157);
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
  const cs = result.candidates.filter((c) => c.chapterId.endsWith("-ch-9"));
  assert.deepEqual(
    cs.map((c) => c.number),
    Array.from({ length: 11 }, (_, i) => i + 1),
  );
  assert.equal(new Set(cs.map((c) => c.id)).size, 11);
  const recovered = `textbook-bounded-${bookId}-${createHash("sha256").update(`${book.sha256}:9:1:155`).digest("hex").slice(0, 16)}`;
  assert.equal(cs[0].id, recovered);
  assert.equal(cs[0].extractionEvidence.reusedExistingId, false);
  assert.equal(
    saved.candidates.filter((c: { id: string }) => c.id === recovered).length,
    1,
  );
  assert.equal(
    cs.filter((c) => c.extractionEvidence.reusedExistingId).length,
    10,
  );
  assert.deepEqual(
    cs.map((c) => c.page),
    [155, 156, 156, 156, 156, 156, 156, 156, 156, 157, 157],
  );
  for (const c of cs) {
    assert.equal(c.correctAnswer, null);
    assert.equal(c.extractionEvidence.keyMatched, false);
    assert.equal(c.practicePublished, false);
    assert.equal(c.reviewStatus, "needs_teacher_review");
    assert.equal(c.options.length, 4);
    assert.equal(new Set(c.options).size, 4);
    assert(c.options.every((o) => o.trim()));
    assert(c.qualityFlags.some((f) => /Tamil/.test(f)));
    assert.equal(c.endPage, c.page);
    assert.deepEqual(c.extractionEvidence.printedPages, [c.page - 10]);
    assert(!c.options.join(" ").includes(".indd"));
    if (c.number >= 4)
      assert(c.qualityFlags.some((f) => /Overlap for manual review/.test(f)));
  }
  assert.deepEqual(cs[0].options, [
    "mysqli = new mysqli()",
    "$mysqli = new mysqli()",
    "$mysqli->new.mysqli()",
    "mysqli->new.mysqli()",
  ]);
  assert.deepEqual(cs[1].options, [
    "mysql_fetch_row.",
    "mysql_fetch_array",
    "mysql_fetch_object",
    "All the above",
  ]);
  assert(cs[2].options[0].startsWith("mysqli_create_db("));
  assert(cs[3].options[0].startsWith("mysqli_query("));
  assert(cs[5].options[3].includes("Database Object"));
  assert.equal(cs[6].options[2], "mysqli_select_data() Function");
  assert.deepEqual(cs[7].options, ["2", "3", "4", "5"]);
  assert.deepEqual(cs[8].options, ["2", "3", "4", "5"]);
  assert(cs[8].originalExtraction.options[3].length > cs[8].options[3].length);
  assert.deepEqual(cs[9].options, ["1", "2", "3", "5"]);
  assert.deepEqual(cs[10].options, [
    "Version 2.0",
    "Version 3.0",
    "Version 4.0",
    "Version 5.0",
  ]);
  assert(
    cs[10].originalExtraction.options[3].length > cs[10].options[3].length,
  );
  assert.equal(result.summaries.find((s) => s.chapterNumber === 9)!.newIds, 1);
  assert(
    definition.excludedItems.some(
      (i) => i.page === 155 && /glossary/.test(i.kind),
    ),
  );
});

test("Chapter 9 stores isolated authenticated corrections without choosing an unknown answer; save and audit reject approvals for both recovered and reused candidates", async () => {
  const batch = (await loadComputerReviewBatches(process.cwd())).find(
    (b) => b.candidates[0].bookId === bookId && b.unit === 9,
  )!;
  assert.equal(batch.candidates.length, 11);
  const reviewer = {
    id: "isolated-ch9-fixture",
    name: "Isolated fixture",
    email: "ch9-fixture@example.test",
  };
  for (const c of [
    batch.candidates[0],
    batch.candidates[5],
    batch.candidates[10],
  ]) {
    assert.deepEqual(requiredSourcePages(c), [c.page]);
    const manifest = reconcileManifest(batch.candidates);
    const input = {
      id: c.id,
      expectedRevision: 0,
      decision: "needs_correction" as const,
      notes:
        "Isolated test only: verify Tamil, code punctuation, overlap and missing answer evidence",
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
      batch.candidates,
      input,
      reviewer,
    );
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
  }
});
