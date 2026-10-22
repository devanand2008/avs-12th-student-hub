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

test('Chapter 2 Bio-Botany and Electrical recover 59 distinct source occurrences with 56 retained IDs and stable reruns',async()=>{
 const cases=[['12-bio-botany-english-f15d4524',22,[52,53,54],21],['12-bio-botany-tamil-51160855',22,[56,57],22],['12-basic-electrical-engineering-english-13c7fc7b',15,[42,43],14]] as const;
 let reused=0;const ids=new Set<string>(),signatures=new Set<string>();
 for(const [id,total,pages,mapped] of cases){const packet=await json(`.local/teacher-review/extracted-books/${id}.json`),text=await json(`.local/textbook-text/${id}.json`),book=catalog.books.find(b=>b.id===id) as Textbook;
  const fresh=await extractSourceBoundedCandidates(book,text,packet.candidates,packet.candidates);assert.deepEqual(fresh.candidates,packet.sourceBoundedProposals);
  const candidates=fresh.candidates.filter(c=>c.chapterId.endsWith('-ch-2'));assert.equal(candidates.length,total);assert.deepEqual(candidates.map(c=>c.number),Array.from({length:total},(_,i)=>i+1));
  assert.equal(fresh.summaries.find(s=>s.chapterNumber===2)!.completeTextOptionMappings,mapped);
  for(const c of candidates){assert(!ids.has(c.id));ids.add(c.id);signatures.add(questionContentSignature(c));assert(pages.some(p=>p===c.page));assert.equal(c.sourceSha256,book.sha256);assert.equal(c.correctAnswer,null);assert.equal(c.reviewStatus,'needs_teacher_review');assert.equal(c.practicePublished,false);assert.equal(c.options.length,4);assert(c.options.every(o=>o.trim()));assert(c.originalExtraction);assert('approvalBlocked' in c.extractionEvidence&&c.extractionEvidence.approvalBlocked);reused+=Number(c.extractionEvidence.reusedExistingId);}
 }
 assert.equal(ids.size,59);assert.equal(signatures.size,59);assert.equal(reused,56);
});

test('Chapter 2 retains duplicate printed labels, cross-column choices and displaced unit superscripts without treating four text positions as valid mappings',async()=>{
 const em=await json('.local/teacher-review/extracted-books/12-bio-botany-english-f15d4524.json'),tm=await json('.local/teacher-review/extracted-books/12-bio-botany-tamil-51160855.json'),bee=await json('.local/teacher-review/extracted-books/12-basic-electrical-engineering-english-13c7fc7b.json');
 const get=(p:typeof em,n:number)=>p.sourceBoundedProposals.find((c:{chapterId:string;number:number})=>c.chapterId.endsWith('-ch-2')&&c.number===n);
 const q7=get(em,7);assert.deepEqual(q7.extractionEvidence.printedOptionLabels,['a','b','b','d']);assert.deepEqual(q7.options,['9:1','1:3','3:1','50:50']);assert.equal(q7.extractionEvidence.completeTextOptions,false);assert(q7.qualityFlags.some((s:string)=>s.includes('duplicated b')));
 const q19=get(em,19);assert.deepEqual(q19.options,['Dominance','Inheritance','Codominance','Heredity']);assert(!q19.questionText.includes('Select the period'));
 const q6=get(tm,6);assert(q6.options[2].includes('மரபணு'));assert(q6.qualityFlags.some((s:string)=>s.includes('top right column')));assert(q6.qualityFlags.some((s:string)=>s.includes('Damaged Tamil')));
 assert.deepEqual(get(bee,11).options,['Frequency','Wave length','Speed of light','Both a) and b)']);assert.deepEqual(get(bee,13).options,['Red','Green','Bluish green','Yellow']);
 const q15=get(bee,15);assert.equal(q15.extractionEvidence.completeTextOptions,false);assert(q15.qualityFlags.some((s:string)=>s.includes('A 10-20 lumen/m; B 30-50 lumen/m²')));assert(q15.extractionEvidence.proposedColumnOrderedSpan.includes('2'));assert(!q15.options.some((s:string)=>s.includes('PART-B')||s.includes('Marks')||s.includes('Define solid angle')));
});

test('Chapter 2 correction decisions persist in an isolated fixture with actor/history while both malformed questions cannot approve',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'skillup-science-ch2-decision-fixture-'));
 try{const batches=(await loadSharedSourceReviewBatches(process.cwd())).filter(b=>b.unit===2&&['12-bio-botany-english-f15d4524','12-bio-botany-tamil-51160855','12-basic-electrical-engineering-english-13c7fc7b'].includes(b.candidates[0].bookId));assert.equal(batches.length,3);
  for(const b of batches){const c=b.candidates.find(c=>c.number===(b.id.includes('electrical')?15:7))!,manifest=reconcileManifest(b.candidates),reviewer={id:'isolated-fixture',name:'Isolated fixture only',email:'fixture@example.test'};
   const input={id:c.id,expectedRevision:0,decision:'approved' as const,notes:'Isolated fixture; not a teacher decision',unresolvedIssues:[],inspectedPages:requiredSourcePages(c),textConfirmed:true,keyConfirmed:true,diagramConfirmed:false,correction:{questionText:c.questionText,options:c.options,correctAnswer:'A' as const,sourceMappingConfirmed:true}};
   assert.throws(()=>recordDecision(manifest,b.candidates,input,reviewer),/Answer evidence is unavailable/);
   const saved=recordDecision(manifest,b.candidates,{...input,decision:'needs_correction',unresolvedIssues:[...c.qualityFlags],correction:{...input.correction,correctAnswer:null}},reviewer),file=path.join(directory,b.id+'.json');await fs.writeFile(file,JSON.stringify(saved));
   const restored=reconcileManifest(b.candidates,await json(file)),entry=restored.entries.find(e=>e.id===c.id)!;assert.equal(entry.decision,'needs_correction');assert.equal(entry.history.length,1);assert.equal(entry.reviewer!.id,reviewer.id);assert.equal(entry.notes,input.notes);assert.equal(entry.source.pdfPage,c.page);assert.equal(entry.practicePublished,false);assert.equal(manifest.entries.find(e=>e.id===c.id)!.history.length,0);
  }
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});
