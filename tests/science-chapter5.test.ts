import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import catalog from '../src/lib/textbooks-catalog.json';
import {extractSourceBoundedCandidates} from '../scripts/lib/source-bounded-extraction';
import {loadSharedSourceReviewBatches} from '../scripts/lib/shared-source-review';
import {reconcileManifest,recordDecision,requiredSourcePages} from '../scripts/lib/local-physics-review';
import {auditTeacherManifest} from '../scripts/lib/teacher-decision-audit';
import {questionContentSignature} from '../scripts/lib/extraction-progress';
import {selectPracticeQuestions} from '../src/lib/textbook-practice-selection';
import type {Textbook} from '../src/lib/textbooks';
import type {Question} from '../src/types';
const json=async(p:string)=>JSON.parse(await fs.readFile(p,'utf8'));

test('Chapter 5 preserves 28 authentic source occurrences, 27 original IDs and stable reruns including a reused parent table identity',async()=>{
 const cases=[['12-bio-botany-english-f15d4524',10,[111,112],9],['12-bio-botany-tamil-51160855',10,[120,121],9],['12-basic-electrical-engineering-english-13c7fc7b',8,[91,92],8]] as const;
 let reused=0;const ids=new Set<string>(),signatures=new Set<string>();
 for(const [id,total,pages,mapped] of cases){const packet=await json(`.local/teacher-review/extracted-books/${id}.json`),text=await json(`.local/textbook-text/${id}.json`),book=catalog.books.find(b=>b.id===id) as Textbook;
  const fresh=await extractSourceBoundedCandidates(book,text,packet.candidates,packet.candidates);assert.deepEqual(fresh.candidates,packet.sourceBoundedProposals);
  const candidates=fresh.candidates.filter(c=>c.chapterId.endsWith('-ch-5'));assert.equal(candidates.length,total);assert.deepEqual(candidates.map(c=>c.number),Array.from({length:total},(_,i)=>i+1));assert.equal(fresh.summaries.find(s=>s.chapterNumber===5)!.completeTextOptionMappings,mapped);
  for(const c of candidates){assert(!ids.has(c.id));ids.add(c.id);signatures.add(questionContentSignature(c));assert(pages.some(p=>p===c.page));assert.equal(c.sourceSha256,book.sha256);assert.equal(c.correctAnswer,null);assert.equal(c.reviewStatus,'needs_teacher_review');assert.equal(c.practicePublished,false);assert.equal(c.options.length,4);assert(c.options.every(o=>o.trim()));assert(c.originalExtraction);assert('approvalBlocked' in c.extractionEvidence&&c.extractionEvidence.approvalBlocked);reused+=Number(c.extractionEvidence.reusedExistingId);assert(!c.options.some(o=>/PART-|Part–|Marks|Answer the questions|Write its 4 types/.test(o)));}
 }
 assert.equal(ids.size,28);assert.equal(signatures.size,28);assert.equal(reused,27);
});

test('Chapter 5 retains matching premises, page/column continuations, damaged raised H, printed missing Tamil range and edition-specific units',async()=>{
 const em=await json('.local/teacher-review/extracted-books/12-bio-botany-english-f15d4524.json'),tm=await json('.local/teacher-review/extracted-books/12-bio-botany-tamil-51160855.json'),bee=await json('.local/teacher-review/extracted-books/12-basic-electrical-engineering-english-13c7fc7b.json');
 const get=(p:typeof em,n:number)=>p.sourceBoundedProposals.find((c:{chapterId:string;number:number})=>c.chapterId.endsWith('-ch-5')&&c.number===n);
 for(const p of[em,tm]){const q=get(p,3);assert.equal(q.extractionEvidence.requiresDiagram,true);for(let n=1;n<=4;n++)assert(q.questionText.includes(`${n})`));assert.deepEqual(q.options,['C A D B','A C B D','B A D C','D B C A']);}
 assert.equal(get(em,3).id,'textbook-section-12-bio-botany-english-f15d4524-3efd7a5a7992a520');assert(em.candidates.some((c:{id:string})=>c.id==='textbook-section-12-bio-botany-english-f15d4524-da73c1ea3a134c29'));assert.notEqual(get(em,3).id,'textbook-section-12-bio-botany-english-f15d4524-da73c1ea3a134c29');
 assert.equal(get(em,1).endPage,112);assert.deepEqual(get(em,1).extractionEvidence.printedPages,[105,106]);assert(get(em,1).options[3].includes('healthy plants'));
 assert.equal(get(em,5).extractionEvidence.completeTextOptions,false);assert(get(em,5).qualityFlags.some((s:string)=>s.includes('misattaches that H to choice C')));assert(get(em,5).options[2].endsWith('H'));assert(get(em,5).options[3].startsWith('P of'));
 const missing=get(tm,4);assert.equal(missing.extractionEvidence.completeTextOptions,false);assert(missing.options[2].includes('15 முத ல நிமிடங்கள்'));assert(!missing.options[2].includes('20'));assert(missing.qualityFlags.some((s:string)=>s.includes('upper time bound missing')));
 assert(!get(em,9).options[2].includes('°C'));assert(get(tm,9).options[2].includes('-196°C'));assert(get(em,6).options[0].includes('Digitalis purpuria'));assert(get(em,8).questionText.includes('interity'));
 for(let n=1;n<=10;n++){assert(get(tm,n).qualityFlags.some((s:string)=>s.includes('Damaged Tamil')));assert(get(tm,n).qualityFlags.some((s:string)=>s.includes(`english-f15d4524 Chapter 5 Q${n},`)));}
 assert.deepEqual(get(bee,2).options,['mechanical energy converted into electrical energy','electrical energy converted into Mechanical energy','electrical energy converted into chemical energy','mechanical energy converted into sound energy']);assert.deepEqual(get(bee,6).options,['400-440V','200-230V','150-180V','Above 11KV']);assert.deepEqual(get(bee,8).options,['wireless','Direct coupling exchange','with wire','remote control']);
});

test('Chapter 5 isolated individual corrections persist actor/history/source while unknown-answer approvals remain blocked',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'skillup-science-ch5-decision-fixture-'));
 try{const batches=(await loadSharedSourceReviewBatches(process.cwd())).filter(b=>b.unit===5&&/bio-botany|basic-electrical/.test(b.id));assert.equal(batches.length,3);
  for(const b of batches){const c=b.candidates.find(c=>c.number===(b.id.includes('electrical')?6:b.id.includes('tamil')?4:5))!,manifest=reconcileManifest(b.candidates),reviewer={id:'isolated-fixture',name:'Isolated fixture only',email:'fixture@example.test'},input={id:c.id,expectedRevision:0,decision:'needs_correction' as const,notes:'Isolated fixture; not an actual teacher decision',unresolvedIssues:[...c.qualityFlags],inspectedPages:requiredSourcePages(c),textConfirmed:true,keyConfirmed:false,diagramConfirmed:false,correction:{questionText:c.questionText,options:c.options,correctAnswer:null,sourceMappingConfirmed:true}};
   assert.throws(()=>recordDecision(manifest,b.candidates,{...input,decision:'approved'},reviewer),/Answer evidence is unavailable/);const saved=recordDecision(manifest,b.candidates,input,reviewer),file=path.join(directory,b.id+'.json');await fs.writeFile(file,JSON.stringify(saved));const restored=reconcileManifest(b.candidates,await json(file)),entry=restored.entries.find(e=>e.id===c.id)!;
   assert.equal(entry.history.length,1);assert.equal(entry.reviewer!.id,reviewer.id);assert.deepEqual(entry.source.printedPages,c.extractionEvidence.printedPages);assert.equal(entry.practicePublished,false);assert.equal(manifest.entries.find(e=>e.id===c.id)!.history.length,0);assert.equal(auditTeacherManifest(restored,{candidates:b.candidates,persisted:restored,reviewers:[reviewer],requireExport:false}).valid,true);
  }
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});

test('Chapter 5 held items cannot inflate 995 dated publications; both prior five-choice sources and unsupported answer E remain excluded',async()=>{
 const batches=(await loadSharedSourceReviewBatches(process.cwd())).filter(b=>b.unit===5&&/bio-botany|basic-electrical/.test(b.id)),existing=(await json('.local/independent-live-content.json')).tables.avs_questions.map((r:{data:Question})=>r.data) as Question[],ready=selectPracticeQuestions(existing,{});assert.equal(ready.length,995);
 const held=batches.flatMap(b=>b.candidates).map(c=>({...c,status:'Published',sourceTextbookId:c.bookId,sourceType:'Book-In',optionA:c.options[0],optionB:c.options[1],optionC:c.options[2],optionD:c.options[3],correctAnswer:'A'}) as unknown as Question);assert.deepEqual(selectPracticeQuestions([...existing,...held],{}).map(q=>q.id),ready.map(q=>q.id));
 const five=(await loadSharedSourceReviewBatches(process.cwd())).filter(b=>b.unit===4&&b.id.includes('bio-botany')).flatMap(b=>b.candidates.filter(c=>c.number===12));assert.equal(five.length,2);for(const c of five){assert.equal(c.options.length,5);assert.equal(c.extractionEvidence.proposedTranscription.options.length,5);assert.equal(c.extractionEvidence.completeTextOptions,false);assert.equal(c.practicePublished,false);const unsupported={...c,status:'Published',reviewStatus:'approved',reviewedBy:'isolated-fixture',reviewedAt:'2026-10-19T00:00:00Z',sourceTextbookId:c.bookId,sourceType:'Book-In',optionA:c.options[0],optionB:c.options[1],optionC:c.options[2],optionD:c.options[3],correctAnswer:'E'} as unknown as Question;assert.deepEqual(selectPracticeQuestions([unsupported],{}),[]);}
});
