import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import catalog from "../src/lib/textbooks-catalog.json";
import { extractSourceBoundedCandidates } from "../scripts/lib/source-bounded-extraction";
import { loadSharedSourceReviewBatches } from "../scripts/lib/shared-source-review";
import { reconcileManifest, recordDecision, requiredSourcePages } from "../scripts/lib/local-physics-review";
import { auditTeacherManifest } from "../scripts/lib/teacher-decision-audit";
import { questionContentSignature } from "../scripts/lib/extraction-progress";
import { selectPracticeQuestions } from "../src/lib/textbook-practice-selection";
import type { Textbook } from "../src/lib/textbooks";
import type { Question } from "../src/types";
const json = async (file: string) => JSON.parse(await fs.readFile(file, "utf8"));
const cases = [
  ["12-bio-botany-english-f15d4524", 21, 17, [136, 137, 138]],
  ["12-bio-botany-tamil-51160855", 21, 20, [147, 148, 149]],
  ["12-basic-electrical-engineering-english-13c7fc7b", 17, 17, [107, 108]],
] as const;

test("Chapter 6 preserves all 59 printed occurrences, 54 existing IDs, source pages and stable extraction reruns", async () => {
  const ids = new Set<string>(), signatures = new Set<string>();
  for (const [id, count, reused, pages] of cases) {
    const packet = await json(`.local/teacher-review/extracted-books/${id}.json`);
    const text = await json(`.local/textbook-text/${id}.json`);
    const book = catalog.books.find(b => b.id === id) as Textbook;
    const fresh = await extractSourceBoundedCandidates(book, text, packet.candidates, packet.candidates);
    assert.deepEqual(fresh.candidates, packet.sourceBoundedProposals);
    const selected = fresh.candidates.filter(c => c.chapterId.endsWith("-ch-6"));
    assert.equal(selected.length, count);
    assert.equal(selected.filter(c => c.extractionEvidence.reusedExistingId).length, reused);
    assert.deepEqual(selected.map(c => c.number), Array.from({ length: count }, (_, i) => i + 1));
    for (const c of selected) {
      assert(!ids.has(c.id)); ids.add(c.id); signatures.add(questionContentSignature(c));
      assert(pages.some(p => p === c.page)); assert.equal(c.sourceSha256, book.sha256);
      assert.equal(c.correctAnswer, null); assert.equal(c.reviewStatus, "needs_teacher_review");
      assert.equal(c.practicePublished, false); assert.equal(c.options.length, 4); assert(c.options.every(o => o.trim()));
      assert(c.originalExtraction); assert(c.extractionEvidence.approvalBlocked);
      assert.equal(c.extractionEvidence.keyMatched, false); assert.equal(c.extractionEvidence.keyPdfPage, null);
    }
  }
  assert.equal(ids.size, 59); assert.equal(signatures.size, 59);
});

test("Chapter 6 retains ecological tables, cross-page choices, source spelling and damaged Tamil labels without inferred repairs", async () => {
  const packets = await Promise.all(cases.map(([id]) => json(`.local/teacher-review/extracted-books/${id}.json`)));
  const get = (index: number, n: number) => packets[index].sourceBoundedProposals.find((c: { chapterId: string; number: number }) => c.chapterId.endsWith("-ch-6") && c.number === n);
  assert.equal(get(0, 1).extractionEvidence.completeTextOptions, false);
  assert(get(0, 1).options[0].includes("Population Landscape")); assert(!get(0, 1).options[0].includes("Population → Landscape"));
  assert.deepEqual(get(0, 9).options, ["Holard Echard Chresard", "Echard Holard Chresard", "Chresard Echard Holard", "Holard Chresard Echard"]);
  assert(get(0, 10).questionText.includes("Slit soil")); assert(get(0, 12).options[1].includes("Mutalism"));
  assert.equal(get(0, 19).endPage, 138); assert.deepEqual(get(0, 19).extractionEvidence.printedPages, [131, 132]);
  assert(get(0, 19).questionText.includes("Diaonaea")); assert.deepEqual(get(0, 19).options[3], "iv iii ii v i");
  assert.equal(get(1, 14).endPage, 149); assert.deepEqual(get(1, 14).extractionEvidence.printedPages, [142, 143]);
  assert.deepEqual(get(1, 9).extractionEvidence.printedOptionLabels, ["அ", "அ", "இ", "ஈ"]);
  for (const n of [9, 19]) assert.equal(get(1, n).extractionEvidence.completeTextOptions, false);
  assert(get(1, 19).qualityFlags.some((s: string) => s.includes("fifth example label")));
  for (const index of [0, 1]) for (const n of [9, 10, 12, 19]) assert.equal(get(index, n).extractionEvidence.requiresDiagram, true);
  for (let n = 1; n <= 21; n++) {
    assert(get(1, n).qualityFlags.some((s: string) => s.includes("Damaged Tamil")));
    assert(get(1, n).qualityFlags.some((s: string) => s.includes(`Chapter 6 Q${n},`)));
  }
  assert.equal(get(2, 8).endPage, 108); assert.deepEqual(get(2, 8).extractionEvidence.printedPages, [99, 100]);
  assert.deepEqual(get(2, 8).options, ["reducing the spring tension of the deflecting system", "using series capacitor and a series inductor", "using multiplier and shunt", "using shunt and multiplier"]);
  assert.deepEqual(get(2, 13).options, ["voltage coil is the moving coil", "current coil is the moving coil", "both are moving coils", "none are moving coils"]);
  assert(packets[2].candidates.some((c: { page: number }) => c.page === 99));
  assert(packets[2].sourceBoundedProposals.filter((c: { chapterId: string }) => c.chapterId.endsWith("-ch-6")).every((c: { page: number }) => c.page >= 107));
});

test("Chapter 6 individual correction decisions persist only in isolated fixtures; unknown answers and source issues block approval", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "skillup-science-ch6-fixture-"));
  try {
    const batches = (await loadSharedSourceReviewBatches(process.cwd())).filter(b => b.unit === 6 && /bio-botany|basic-electrical/.test(b.id));
    assert.equal(batches.length, 3);
    for (const b of batches) {
      const c = b.candidates.find(c => c.number === (b.id.includes("electrical") ? 8 : 19))!;
      const manifest = reconcileManifest(b.candidates), reviewer = { id: "isolated-fixture", name: "Isolated fixture only", email: "fixture@example.test" };
      const input = { id: c.id, expectedRevision: 0, decision: "needs_correction" as const, notes: "Isolated test, not an authentic teacher decision", unresolvedIssues: [...c.qualityFlags], inspectedPages: requiredSourcePages(c), textConfirmed: true, keyConfirmed: false, diagramConfirmed: false, correction: { questionText: c.questionText, options: c.options, correctAnswer: null, sourceMappingConfirmed: true } };
      assert.throws(() => recordDecision(manifest, b.candidates, { ...input, decision: "approved" }, reviewer), /Answer evidence is unavailable/);
      const saved = recordDecision(manifest, b.candidates, input, reviewer), file = path.join(dir, b.id + ".json");
      await fs.writeFile(file, JSON.stringify(saved)); const restored = reconcileManifest(b.candidates, await json(file));
      const entry = restored.entries.find(e => e.id === c.id)!;
      assert.equal(entry.history.length, 1); assert.equal(entry.reviewer!.id, reviewer.id); assert.equal(entry.practicePublished, false);
      assert.deepEqual(entry.source.printedPages, c.extractionEvidence.printedPages);
      assert.equal(manifest.entries.find(e => e.id === c.id)!.history.length, 0);
      assert.equal(auditTeacherManifest(restored, { candidates: b.candidates, persisted: restored, reviewers: [reviewer], requireExport: false }).valid, true);
    }
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test("Chapter 6 held data cannot inflate the dated 995-publication bank even with accidental Published flags", async () => {
  const batches = (await loadSharedSourceReviewBatches(process.cwd())).filter(b => b.unit === 6 && /bio-botany|basic-electrical/.test(b.id));
  const existing = (await json(".local/independent-live-content.json")).tables.avs_questions.map((r: { data: Question }) => r.data) as Question[];
  const held = batches.flatMap(b => b.candidates).map(c => ({ ...c, status: "Published", sourceTextbookId: c.bookId, sourceType: "Book-In", optionA: c.options[0], optionB: c.options[1], optionC: c.options[2], optionD: c.options[3], correctAnswer: "A" }) as unknown as Question);
  const ready = selectPracticeQuestions(existing, {}); assert.equal(ready.length, 995);
  assert.deepEqual(selectPracticeQuestions([...existing, ...held], {}).map(q => q.id), ready.map(q => q.id));
});
