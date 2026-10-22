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
  ["12-bio-botany-english-f15d4524", 18, 17, [187, 188]],
  ["12-bio-botany-tamil-51160855", 18, 16, [202, 203]],
  ["12-basic-electrical-engineering-english-13c7fc7b", 22, 22, [157, 158, 159]],
] as const;

test("Chapter 9 recovers exactly 58 source occurrences with 55 retained IDs and three recoveries and stable extraction reruns", async () => {
  const ids = new Set<string>(), signatures = new Set<string>();
  for (const [id, count, reused, pages] of cases) {
    const packet = await json(`.local/teacher-review/extracted-books/${id}.json`);
    const text = await json(`.local/textbook-text/${id}.json`);
    const book = catalog.books.find(b => b.id === id) as Textbook;
    const fresh = await extractSourceBoundedCandidates(book, text, packet.candidates, packet.candidates);
    assert.deepEqual(fresh.candidates, packet.sourceBoundedProposals);
    const selected = fresh.candidates.filter(c => c.chapterId.endsWith("-ch-9"));
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
  assert.equal(ids.size, 58); assert.equal(signatures.size, 58);
});

test("Chapter 9 preserves matching rows, repeated source labels, duplicate choices, units and column continuations", async () => {
  const batches=(await loadSharedSourceReviewBatches(process.cwd())).filter(b=>b.unit===9&&/bio-botany|basic-electrical/.test(b.id));
  const get=(i:number,n:number)=>batches.find(b=>b.id.includes(cases[i][0]))!.candidates.find(c=>c.number===n)!;
  for(const i of [0,1])for(const n of [4,14,16,18]){
    const c=get(i,n);assert(c.extractionEvidence.requiresDiagram);assert.equal(c.localReviewRequirements!.figures.length,i===1&&n===14?2:1);
    assert(c.questionText.includes('\n'));assert.equal(c.options.length,4);
  }
  assert.deepEqual(get(0,14).options,['iv iii ii i','ii i iii iv','ii iv i iii','i iii iv ii']);
  assert.deepEqual(get(1,14).options,get(0,14).options);
  assert(get(0,18).questionText.includes('Aspergillus'));assert.equal(get(0,18).options[3],'ib, iia, iiid, ivc.');
  assert.deepEqual(batches.find(b=>b.id.includes('bio-botany-english'))!.printedOptionLabels![get(0,18).id],['a','b','c','c']);
  assert.equal(get(2,11).options[1],get(2,11).options[2]);
  assert.deepEqual(get(2,3).options,['3 \u00bc inches','3 \u00bd inches','3 \u00be inches','4 \u00be inches']);
  assert.deepEqual(get(2,18).options,['60\u00b0','120\u00b0','180\u00b0','360\u00b0']);
  assert.deepEqual(get(2,21).options,['Half coil winding','Whole coil winding','Unbalanced winding','Balanced winding']);
  for(let n=1;n<=18;n++){assert(get(1,n).qualityFlags.some(s=>s.includes('Damaged Tamil')));assert(get(1,n).qualityFlags.some(s=>s.includes('Chapter 9 Q'+n+',')));}
  for(const [i,n]of [[0,18],[1,2],[2,11]])assert.equal(get(i,n).extractionEvidence.completeTextOptions,false);
  assert(batches.flatMap(b=>b.candidates).every(c=>! /Marks|PART[–-]B|Answer the questions/.test(c.options.join(' '))));
});

test("Chapter 9 individual correction history survives reload/export in isolated fixtures while unknown answers block approval", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "skillup-science-ch9-fixture-"));
  try {
    const batches = (await loadSharedSourceReviewBatches(process.cwd())).filter(b => b.unit === 9 && /bio-botany|basic-electrical/.test(b.id));
    assert.equal(batches.length, 3);
    for (const b of batches) {
      const c = b.candidates.find(c => c.number === (b.id.includes("electrical") ? 11 : 18))!;
      const manifest = reconcileManifest(b.candidates), reviewer = { id: "isolated-fixture", name: "Isolated fixture only", email: "fixture@example.test" };
      const input = { id: c.id, expectedRevision: 0, decision: "needs_correction" as const, notes: "Isolated test only; not an authentic teacher review", unresolvedIssues: [...c.qualityFlags], inspectedPages: requiredSourcePages(c), textConfirmed: true, keyConfirmed: false, diagramConfirmed: false, correction: { questionText: c.questionText, options: c.options, correctAnswer: null, sourceMappingConfirmed: true } };
      if(c.options.length===5)assert.throws(()=>recordDecision(manifest,b.candidates,{...input,correction:{...input.correction,options:c.options.slice(0,4)}},reviewer),/Preserve all five printed choices/);
      assert.throws(() => recordDecision(manifest, b.candidates, { ...input, decision: "approved" }, reviewer), /Answer evidence is unavailable/);
      const saved = recordDecision(manifest, b.candidates, input, reviewer), file = path.join(dir, b.id + ".json");
      await fs.writeFile(file, JSON.stringify(saved)); const restored = reconcileManifest(b.candidates, await json(file));
      const entry = restored.entries.find(e => e.id === c.id)!;
      assert.equal(entry.history.length, 1); assert.equal(entry.reviewer!.id, reviewer.id); assert.equal(entry.practicePublished, false);
      assert.deepEqual(entry.history[0].correction!.options,c.options);
      assert.deepEqual(entry.source.printedPages, c.extractionEvidence.printedPages);
      assert.equal(manifest.entries.find(e => e.id === c.id)!.history.length, 0);
      assert.equal(auditTeacherManifest(restored, { candidates: b.candidates, persisted: restored, reviewers: [reviewer], requireExport: false }).valid, true);
    }
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test("Chapter 9 held records cannot inflate the retained dated student bank even with accidental publication flags", async () => {
  const batches = (await loadSharedSourceReviewBatches(process.cwd())).filter(b => b.unit === 9 && /bio-botany|basic-electrical/.test(b.id));
  const existing = (await json(".local/independent-live-content.json")).tables.avs_questions.map((r: { data: Question }) => r.data) as Question[];
  const held = batches.flatMap(b => b.candidates).map(c => ({ ...c, status: "Published", sourceTextbookId: c.bookId, sourceType: "Book-In", optionA: c.options[0], optionB: c.options[1], optionC: c.options[2], optionD: c.options[3], correctAnswer: "A" }) as unknown as Question);
  const ready = selectPracticeQuestions(existing, {}); assert.equal(ready.length, 995);
  assert.deepEqual(selectPracticeQuestions([...existing, ...held], {}).map(q => q.id), ready.map(q => q.id));
});
