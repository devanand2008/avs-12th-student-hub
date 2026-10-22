import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import catalog from "../src/lib/textbooks-catalog.json";
import { extractComputerSourceSections } from "../scripts/lib/computer-source-extraction";
import { loadComputerReviewBatches } from "../scripts/lib/computer-review-batches";
import {
  reconcileManifest,
  recordDecision,
  requiredSourcePages,
  evidenceDigest,
} from "../scripts/lib/local-physics-review";
import { auditTeacherManifest } from "../scripts/lib/teacher-decision-audit";
import { localTranscriptionProposals } from "../scripts/lib/tamil-transcription-proposals";
import type { Textbook } from "../src/lib/textbooks";

const app = "12-computer-applications-tamil-e51fbdf6";
const cs = "12-computer-science-tamil-d5aa7dd4";
const read = async (p: string) => JSON.parse(await fs.readFile(p, "utf8"));

test("source occurrence identities retain both printed Q9 stems, original IDs, lost option boundary and authentic Computer Science sections on rerun", async () => {
  for (const id of [app, cs]) {
    const packet = await read(
      `.local/teacher-review/extracted-books/${id}.json`,
    );
    const text = await read(`.local/textbook-text/${id}.json`);
    const book = catalog.books.find((b) => b.id === id) as Textbook;
    const fresh = await extractComputerSourceSections(
      book,
      text,
      packet.candidates,
    );
    assert.deepEqual(fresh.candidates, packet.sourceBoundedProposals);
    assert.deepEqual(
      fresh,
      await extractComputerSourceSections(book, text, packet.candidates),
    );
    const selected = fresh.candidates.filter(
      (c) =>
        id === cs || [13, 15].some((n) => c.chapterId.endsWith(`-ch-${n}`)),
    );
    assert.equal(selected.length, id === cs ? 20 : 22);
    assert.equal(new Set(selected.map((c) => c.id)).size, selected.length);
    for (const c of selected) {
      assert.equal(c.correctAnswer, null);
      assert.equal(c.status, "Needs Review");
      assert.equal(c.practicePublished, false);
      assert(c.page <= c.endPage && c.sourceSha256 === book.sha256);
    }
    if (id === app) {
      const thirteen = selected.filter((c) => c.chapterId.endsWith("-ch-13"));
      assert.deepEqual(
        thirteen.map((c) => c.number),
        [1, 2, 3, 4, 5, 6, 7, 9, 9, 10, 11, 12],
      );
      assert.deepEqual(
        thirteen.map((c) => c.sourceOccurrence?.ordinal),
        Array.from({ length: 12 }, (_, i) => i + 1),
      );
      assert.equal(thirteen[7].id, `textbook-q-${app}-b1fda7f304e58746`);
      assert.equal(thirteen[8].id, `textbook-q-${app}-66da55f33a275a50`);
      assert.notEqual(thirteen[7].questionText, thirteen[8].questionText);
      assert.equal(thirteen[1].options.length, 3);
      assert.equal(thirteen[1].extractionEvidence.completeTextOptions, false);
      assert.deepEqual(thirteen[4].options.slice(2), ["ஒளி", "ஒலி"]);
      assert(thirteen[11].questionText.includes("802.3"));
      const fifteen = selected.filter((c) => c.chapterId.endsWith("-ch-15"));
      assert.deepEqual(fifteen[1].extractionEvidence.printedOptionLabels, [
        "அ",
        "அ",
        "அ",
        "அ",
      ]);
      assert.equal(fifteen[9].number, 10);
      assert.equal(fifteen[9].page, 261);
      assert(!fifteen[9].options[3].includes("II."));
    }
  }
});

test("two printed Q9 records are independently reviewable and audited; forged occurrence metadata and unknown-answer approvals fail", async () => {
  const batch = (await loadComputerReviewBatches(process.cwd())).find(
    (b) => b.candidates[0].bookId === app && b.unit === 13,
  )!;
  const original = reconcileManifest(batch.candidates),
    q9 = batch.candidates.filter((c) => c.number === 9);
  const actor = {
    id: "isolated-occurrence-fixture",
    name: "Test fixture only",
    email: "fixture@example.test",
  };
  let manifest = original;
  for (const [i, c] of q9.entries()) {
    manifest = recordDecision(
      manifest,
      batch.candidates,
      {
        id: c.id,
        expectedRevision: 0,
        decision: i === 0 ? "needs_correction" : "rejected",
        notes: `Isolated fixture occurrence ${c.sourceOccurrence!.ordinal}; not a real teacher decision`,
        unresolvedIssues: c.qualityFlags,
        inspectedPages: requiredSourcePages(c),
        textConfirmed: false,
        keyConfirmed: false,
        diagramConfirmed: false,
      },
      actor,
    );
  }
  assert.equal(
    manifest.entries.filter((e) => e.number === 9 && e.history.length === 1)
      .length,
    2,
  );
  assert(
    auditTeacherManifest(manifest, {
      candidates: batch.candidates,
      persisted: manifest,
      reviewers: [actor],
      requireExport: false,
    }).valid,
  );
  const forged = structuredClone(manifest);
  forged.entries.find((e) => e.id === q9[0].id)!.source.occurrence!.ordinal = 9;
  assert.equal(
    auditTeacherManifest(forged, {
      candidates: batch.candidates,
      persisted: forged,
      reviewers: [actor],
      requireExport: false,
    }).valid,
    false,
  );
  const invalid = structuredClone(batch.candidates);
  invalid[8].sourceOccurrence!.ordinal = 8;
  assert.throws(() => reconcileManifest(invalid), /occurrence/);
  for (const c of batch.candidates)
    assert.throws(() =>
      recordDecision(
        original,
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
});

test("all 51 inspected Tamil records retain original evidence; 18 supplementary Unicode proposals and 33 uncertain items cannot imply answers or decisions", async () => {
  const batches = (await loadComputerReviewBatches(process.cwd())).filter(
    (b) => b.candidates[0].bookId === app && [10, 11, 12, 14].includes(b.unit),
  );
  const candidates = batches.flatMap((b) => b.candidates),
    before = candidates.map(evidenceDigest),
    proposals = localTranscriptionProposals(candidates);
  assert.equal(proposals.length, 51);
  assert.equal(proposals.filter((p) => p.proposedQuestionText).length, 18);
  assert.equal(
    proposals.filter((p) => p.proposedQuestionText === null).length,
    33,
  );
  assert.deepEqual(candidates.map(evidenceDigest), before);
  for (const entry of proposals) {
    assert.equal(entry.proposedAnswer, null);
    assert.equal(entry.teacherVerified, false);
    assert.equal(entry.reviewDecision, null);
    assert(entry.unresolvedIssues.length);
  }
  const drift = structuredClone(candidates);
  drift[0].localReviewRequirements!.originalProposalSha256 = "invalid";
  assert.throws(() => localTranscriptionProposals(drift));
});
