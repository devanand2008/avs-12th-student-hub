import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import catalog from '../src/lib/textbooks-catalog.json';
import {extractSourceBoundedCandidates} from '../scripts/lib/source-bounded-extraction';
import {loadSharedSourceReviewBatches} from '../scripts/lib/shared-source-review';
import {reconcileManifest,recordDecision,requiredSourcePages} from '../scripts/lib/local-physics-review';
import {questionContentSignature} from '../scripts/lib/extraction-progress';
import type {Textbook} from '../src/lib/textbooks';
const json=async(p:string)=>JSON.parse(await fs.readFile(p,'utf8'));

test('Chapter 3 preserves 38 source occurrences, 32 existing identities and stable reruns across three independently paginated books',async()=>{
 const cases=[['12-bio-botany-english-f15d4524',12,[71,72],12],['12-bio-botany-tamil-51160855',8,[76,77],8],['12-basic-electrical-engineering-english-13c7fc7b',18,[58,59],17]] as const;
 let reused=0;const ids=new Set<string>(),signatures=new Set<string>();
 for(const [id,total,pages,mapped] of cases){const packet=await json(`.local/teacher-review/extracted-books/${id}.json`),text=await json(`.local/textbook-text/${id}.json`),book=catalog.books.find(b=>b.id===id) as Textbook;
  const fresh=await extractSourceBoundedCandidates(book,text,packet.candidates,packet.candidates);assert.deepEqual(fresh.candidates,packet.sourceBoundedProposals);
  const candidates=fresh.candidates.filter(c=>c.chapterId.endsWith('-ch-3'));assert.equal(candidates.length,total);assert.deepEqual(candidates.map(c=>c.number),Array.from({length:total},(_,i)=>i+1));assert.equal(fresh.summaries.find(s=>s.chapterNumber===3)!.completeTextOptionMappings,mapped);
  for(const c of candidates){assert(!ids.has(c.id));ids.add(c.id);signatures.add(questionContentSignature(c));assert(pages.some(p=>p===c.page));assert.equal(c.sourceSha256,book.sha256);assert.equal(c.correctAnswer,null);assert.equal(c.reviewStatus,'needs_teacher_review');assert.equal(c.practicePublished,false);assert.equal(c.options.length,4);assert(c.options.every(o=>o.trim()));assert(c.originalExtraction);assert('approvalBlocked' in c.extractionEvidence&&c.extractionEvidence.approvalBlocked);reused+=Number(c.extractionEvidence.reusedExistingId);}
 }
 assert.equal(ids.size,38);assert.equal(signatures.size,38);assert.equal(reused,32);
});

test('Chapter 3 distinguishes numbered premises, decimal 0.09, matching tables, Tamil counterparts and displaced formula superscripts',async()=>{
 const em=await json('.local/teacher-review/extracted-books/12-bio-botany-english-f15d4524.json'),tm=await json('.local/teacher-review/extracted-books/12-bio-botany-tamil-51160855.json'),bee=await json('.local/teacher-review/extracted-books/12-basic-electrical-engineering-english-13c7fc7b.json');
 const get=(p:typeof em,n:number)=>p.sourceBoundedProposals.find((c:{chapterId:string;number:number})=>c.chapterId.endsWith('-ch-3')&&c.number===n);
 assert(get(em,12).questionText.includes('0.09'));assert.deepEqual(get(em,12).options,['900 cM','90 cM','9 cM','0.9 cM']);
 for(const [p,n,wrongId] of [[em,4,'textbook-q-12-bio-botany-english-f15d4524-64dd0aaae8b0a718'],[tm,3,'textbook-q-12-bio-botany-tamil-51160855-c2d8281b5a9354f3']] as const){const c=get(p,n);for(const i of [1,2,3,4])assert(c.questionText.includes(`\n${i}.`));assert.notEqual(c.id,wrongId);assert(p.candidates.some((c:{id:string})=>c.id===wrongId));}
 assert.equal(get(tm,4).id,'textbook-q-12-bio-botany-tamil-51160855-a68cddd4dcf7c079');
 for(const [p,n] of [[em,3],[tm,2]] as const){assert.equal(get(p,n).extractionEvidence.requiresDiagram,true);assert(get(p,n).qualityFlags.some((s:string)=>s.includes('Matching table')));assert.equal(get(p,n).options.length,4);}
 const pairs=[[1,1],[2,3],[3,4],[4,6],[5,8],[6,9],[7,10],[8,11]];for(const [tn,en] of pairs){assert(get(tm,tn).qualityFlags.some((s:string)=>s.includes(`english-f15d4524 Chapter 3 Q${en},`)));assert(get(em,en).qualityFlags.some((s:string)=>s.includes(`tamil-51160855 Chapter 3 Q${tn},`)));}
 for(const n of [2,5,7,12])assert(get(em,n).qualityFlags.some((s:string)=>s.includes('No corresponding MCQ')));
 assert(get(tm,5).options.every((s:string)=>s.includes('\uF0E0')));assert(get(tm,5).qualityFlags.some((s:string)=>s.includes('private-use glyphs')));for(let n=1;n<=8;n++)assert(get(tm,n).qualityFlags.some((s:string)=>s.includes('Damaged Tamil')));
 assert.deepEqual(get(bee,5).options,['non-conductive material.','non-resistive to heat.','conductive material.','easily combustible.']);assert.deepEqual(get(bee,10).options,['Incandescent lamp','Light emitting diode lamp','Tube light','Compact fluorescent lamp']);
 const q8=get(bee,8);assert.equal(q8.extractionEvidence.completeTextOptions,false);assert(q8.qualityFlags.some((s:string)=>s.includes('B I²R²t')));assert(q8.extractionEvidence.proposedColumnOrderedSpan.includes('2 2 2'));assert(!q8.options.some((s:string)=>s.includes('²')));
 assert(!get(bee,18).options.some((s:string)=>s.includes('PART')||s.includes('Marks')));
});

test('Chapter 3 isolated individual corrections preserve actor/history and cannot turn unknown answers into approval',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'skillup-science-ch3-decision-fixture-'));
 try{const batches=(await loadSharedSourceReviewBatches(process.cwd())).filter(b=>b.unit===3&&/bio-botany|basic-electrical-engineering-english/.test(b.id));assert.equal(batches.length,3);
  for(const b of batches){const c=b.candidates.find(c=>c.number===(b.id.includes('electrical')?8:b.id.includes('tamil')?2:3))!,manifest=reconcileManifest(b.candidates),reviewer={id:'isolated-fixture',name:'Isolated fixture only',email:'fixture@example.test'};
   const input={id:c.id,expectedRevision:0,decision:'approved' as const,notes:'Isolated fixture; not an authentic teacher decision',unresolvedIssues:[],inspectedPages:requiredSourcePages(c),textConfirmed:true,keyConfirmed:true,diagramConfirmed:true,correction:{questionText:c.questionText,options:c.options,correctAnswer:'A' as const,sourceMappingConfirmed:true}};
   assert.throws(()=>recordDecision(manifest,b.candidates,input,reviewer),/Answer evidence is unavailable/);
   const saved=recordDecision(manifest,b.candidates,{...input,decision:'needs_correction',unresolvedIssues:[...c.qualityFlags],correction:{...input.correction,correctAnswer:null}},reviewer),file=path.join(directory,b.id+'.json');await fs.writeFile(file,JSON.stringify(saved));
   const restored=reconcileManifest(b.candidates,await json(file)),entry=restored.entries.find(e=>e.id===c.id)!;assert.equal(entry.decision,'needs_correction');assert.equal(entry.history.length,1);assert.equal(entry.reviewer!.id,reviewer.id);assert.equal(entry.notes,input.notes);assert.equal(entry.source.pdfPage,c.page);assert.equal(entry.practicePublished,false);assert.equal(manifest.entries.find(e=>e.id===c.id)!.history.length,0);
  }
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});
