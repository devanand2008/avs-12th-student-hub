import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import catalog from "../src/lib/textbooks-catalog.json";
import definitions from "../scripts/data/shared-source-sections.json";
import { extractSourceBoundedCandidates } from "../scripts/lib/source-bounded-extraction";
import { expandSharedOptionSubitems, type SharedOptionGroup } from "../scripts/lib/shared-option-subitems";
import { loadSharedSourceReviewBatches } from "../scripts/lib/shared-source-review";
import { reconcileManifest, recordDecision, requiredSourcePages } from "../scripts/lib/local-physics-review";
import { auditTeacherManifest } from "../scripts/lib/teacher-decision-audit";
import { questionContentSignature } from "../scripts/lib/extraction-progress";
import { selectPracticeQuestions } from "../src/lib/textbook-practice-selection";
import type { Textbook } from "../src/lib/textbooks";
import type { Question } from "../src/types";
const json=async(p:string)=>JSON.parse(await fs.readFile(p,"utf8"));
const ids=["12-bio-zoology-english-7e848813","12-bio-zoology-tamil-2631f8e3","12-basic-electrical-engineering-tamil-029f513a"];
const batches=async()=> (await loadSharedSourceReviewBatches(process.cwd())).filter(b=>b.unit===1&&ids.includes(b.candidates[0].bookId));

test("Zoology/Tamil Electrical Chapter 1 preserves 23 source occurrences, 19 retained IDs and four deterministic shared-rubric recoveries",async()=>{
  const all=[];
  for(const[index,id]of ids.entries()){
    const packet=await json(`.local/teacher-review/extracted-books/${id}.json`),text=await json(`.local/textbook-text/${id}.json`);
    const extracted=await extractSourceBoundedCandidates(catalog.books.find(b=>b.id===id) as Textbook,text,packet.candidates,packet.candidates);
    assert.deepEqual(extracted.candidates,packet.sourceBoundedProposals);
    const fresh={...extracted,candidates:extracted.candidates.filter(c=>c.chapterId.endsWith('-ch-1'))};
    assert.equal(fresh.candidates.length,index===2?13:5);
    assert.equal(fresh.candidates.filter(c=>c.extractionEvidence.reusedExistingId).length,index===2?13:3);
    assert.deepEqual(fresh.candidates.map(c=>c.number),index===2?Array.from({length:13},(_,i)=>i+1):[1,2,3,4,4]);
    if(index<2)assert.deepEqual(fresh.candidates.map(c=>"sourceOccurrence" in c ? c.sourceOccurrence!.ordinal : undefined),[1,2,3,4,5]);
    for(const c of fresh.candidates){assert.equal(c.correctAnswer,null);assert.equal(c.practicePublished,false);assert.equal(c.reviewStatus,"needs_teacher_review");assert.equal(c.extractionEvidence.keyMatched,false);assert.equal(c.options.length,4);assert(c.options.every(o=>o.trim()));all.push(c);}
  }
  assert.equal(new Set(all.map(c=>c.id)).size,23);assert.equal(new Set(all.map(questionContentSignature)).size,23);
});

test("Shared Q4 options are literal printed choices with independent Roman subitems, earlier rubric pages and matching original crops",async()=>{
  const all=await batches();
  for(const[index,id]of ids.slice(0,2).entries()){
    const b=all.find(b=>b.candidates[0].bookId===id)!,subs=b.candidates.filter(c=>c.number===4);
    assert.notEqual(subs[0].id,subs[1].id);assert.deepEqual(subs[0].options,subs[1].options);
    assert(subs[0].questionText.startsWith(index===0?"I.":"i."));assert(subs[1].questionText.startsWith(index===0?"II.":"ii."));
    assert(!subs[0].questionText.includes(index===0?"II.":"ii."));
    for(const c of subs){assert(c.extractionEvidence.sharedSourceOptions!.originalRubric.length>20);assert(c.extractionEvidence.sharedSourceOptions!.responseRow);assert(c.extractionEvidence.requiresDiagram);assert.equal(c.localReviewRequirements!.figures.length,index===0?2:3);assert.equal(c.correctAnswer,null);}
    assert.deepEqual(requiredSourcePages(subs[1]),index===0?[16,17]:[17,18]);
    assert.deepEqual(subs[1].extractionEvidence.sourcePageReferences,index===0?[{pdfPage:16,printedPage:8},{pdfPage:17,printedPage:9}]:[{pdfPage:17,printedPage:9},{pdfPage:18,printedPage:10}]);
  }
  const en=all.find(b=>b.candidates[0].bookId===ids[0])!,tm=all.find(b=>b.candidates[0].bookId===ids[1])!,ee=all.find(b=>b.candidates[0].bookId===ids[2])!;
  assert.equal(en.candidates[0].options[3],"Both a and b");assert(tm.candidates[0].options[3].includes("இ"));
  assert.equal(en.candidates[3].options[1],"If both A and R are true but R is not the correct explanation for A");
  assert.equal(en.candidates[3].options[3],"If both A and R are false.");
  assert.deepEqual(ee.candidates.find(c=>c.number===7)!.options,["3","6","8","12"]);
  assert(ee.candidates.find(c=>c.number===10)!.options[0].startsWith("440"));
  assert(ee.candidates.every(c=>c.qualityFlags.some(f=>f.includes("Damaged Tamil"))));
});

test("Shared-rubric extraction rejects invented page mappings, missing response rows and altered option labels",async()=>{
  for(const id of ids.slice(0,2)){
    const packet=await json(`.local/teacher-review/extracted-books/${id}.json`),c=packet.sourceBoundedProposals.find((c:{number:number})=>c.number===4);
    const d=definitions.find(d=>d.bookId===id&&d.chapterNumber===1)!;
    const groups=d.sharedOptionSubitems as SharedOptionGroup[],occ=d.sourceOccurrences!;
    const span={number:4,pdfPage:d.pages[0].page,pdfEndPage:d.pages[1].page,raw:c.extractionEvidence.sharedSourceOptions.originalGroupSpan};
    const cached=await json(`.local/textbook-text/${id}.json`);
    const pages=cached.pages.filter((p:{page:number})=>d.pages.some(g=>g.page===p.page)).map((p:{page:number;text:string})=>({page:p.page,columnOrderedText:p.text}));
    // Occurrence 1..3 are ordinary source spans; isolate the shared group with local ordinals only for this helper fixture.
    const subocc=occ.slice(3).map((o,i)=>({...o,ordinal:i+1}));
    assert.equal(expandSharedOptionSubitems([span],groups,subocc,pages).length,2);
    const badPage=structuredClone(groups);badPage[0].subitems[1].page=9;
    assert.throws(()=>expandSharedOptionSubitems([span],badPage,subocc,pages),/source page changed/);
    const badResponse=structuredClone(groups);badResponse[0].subitems[0].responsePattern="^NONEXISTENT$";
    assert.throws(()=>expandSharedOptionSubitems([span],badResponse,subocc,pages),/response row/);
    const badLabels=structuredClone(groups);badLabels[0].labels.reverse();
    assert.throws(()=>expandSharedOptionSubitems([span],badLabels,subocc,pages),/rubric labels changed/);
  }
});

test("Individual shared-subitem correction history round-trips and exports independently while unknown answers cannot approve",async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),"skillup-zoology-ch1-fixture-"));
  try{for(const b of await batches()){
    const manifest=reconcileManifest(b.candidates),c=b.candidates.at(-1)!,reviewer={id:"isolated-fixture",name:"Isolated fixture only",email:"fixture@example.test"};
    const data={id:c.id,expectedRevision:0,decision:"needs_correction" as const,notes:"Isolated test only, not a genuine teacher decision",unresolvedIssues:[...c.qualityFlags],inspectedPages:requiredSourcePages(c),textConfirmed:true,keyConfirmed:false,diagramConfirmed:false,correction:{questionText:c.questionText,options:c.options,correctAnswer:null,sourceMappingConfirmed:true}};
    assert.throws(()=>recordDecision(manifest,b.candidates,{...data,decision:"approved"},reviewer),/Answer evidence is unavailable/);
    const saved=recordDecision(manifest,b.candidates,data,reviewer),file=path.join(dir,b.id+".json");await fs.writeFile(file,JSON.stringify(saved));
    const restored=reconcileManifest(b.candidates,await json(file));assert.equal(restored.entries.find(e=>e.id===c.id)!.history.length,1);assert(restored.entries.filter(e=>e.id!==c.id).every(e=>e.history.length===0));
    assert.equal(auditTeacherManifest(restored,{candidates:b.candidates,persisted:restored,reviewers:[reviewer],requireExport:false}).valid,true);
    if(c.number===4){const forged=structuredClone(restored);forged.entries.find(e=>e.id===c.id)!.source.sourcePageReferences=[{pdfPage:c.page,printedPage:c.extractionEvidence.printedPages.at(-1)!}];assert.equal(auditTeacherManifest(forged,{candidates:b.candidates,persisted:restored,reviewers:[reviewer],requireExport:false}).valid,false);}
  }}finally{assert(dir.startsWith(path.join(os.tmpdir(),"skillup-zoology-ch1-fixture-")));await fs.rm(dir,{recursive:true,force:true});}
});

test("All 23 held Zoology/Tamil Electrical records remain outside the protected student bank even with accidental publication flags",async()=>{
  const existing=(await json(".local/independent-live-content.json")).tables.avs_questions.map((r:{data:Question})=>r.data) as Question[];
  const held=(await batches()).flatMap(b=>b.candidates).map(c=>({...c,status:"Published",sourceTextbookId:c.bookId,sourceType:"Book-In",optionA:c.options[0],optionB:c.options[1],optionC:c.options[2],optionD:c.options[3],correctAnswer:"A"}) as unknown as Question);
  const ready=selectPracticeQuestions(existing,{});assert.equal(ready.length,995);assert.deepEqual(selectPracticeQuestions([...existing,...held],{}).map(q=>q.id),ready.map(q=>q.id));
});
