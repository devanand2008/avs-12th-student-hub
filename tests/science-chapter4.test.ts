import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {chromium} from '@playwright/test';
import catalog from '../src/lib/textbooks-catalog.json';
import {extractSourceBoundedCandidates} from '../scripts/lib/source-bounded-extraction';
import {loadSharedSourceReviewBatches} from '../scripts/lib/shared-source-review';
import {reconcileManifest,recordDecision,requiredSourcePages} from '../scripts/lib/local-physics-review';
import {auditTeacherManifest} from '../scripts/lib/teacher-decision-audit';
import {startLocalPhysicsReview,provisionReviewer} from '../scripts/lib/local-physics-review-server';
import {questionContentSignature} from '../scripts/lib/extraction-progress';
import type {Textbook} from '../src/lib/textbooks';
const json=async(p:string)=>JSON.parse(await fs.readFile(p,'utf8'));

test('Chapter 4 recovers 47 actual source occurrences, retaining 30 prior identities, all printed choices and deterministic reruns',async()=>{
 const cases=[['12-bio-botany-english-f15d4524',16,[95,96],14],['12-bio-botany-tamil-51160855',16,[103,104],15],['12-basic-electrical-engineering-english-13c7fc7b',15,[78,79,80],13]] as const;
 let reused=0;const ids=new Set<string>(),signatures=new Set<string>();
 for(const [id,total,pages,mapped] of cases){const packet=await json(`.local/teacher-review/extracted-books/${id}.json`),text=await json(`.local/textbook-text/${id}.json`),book=catalog.books.find(b=>b.id===id) as Textbook;
  const fresh=await extractSourceBoundedCandidates(book,text,packet.candidates,packet.candidates);assert.deepEqual(fresh.candidates,packet.sourceBoundedProposals);
  const candidates=fresh.candidates.filter(c=>c.chapterId.endsWith('-ch-4'));assert.equal(candidates.length,total);assert.deepEqual(candidates.map(c=>c.number),Array.from({length:total},(_,i)=>i+1));assert.equal(fresh.summaries.find(s=>s.chapterNumber===4)!.completeTextOptionMappings,mapped);
  for(const c of candidates){assert(!ids.has(c.id));ids.add(c.id);signatures.add(questionContentSignature(c));assert(pages.some(p=>p===c.page));assert.equal(c.sourceSha256,book.sha256);assert.equal(c.correctAnswer,null);assert.equal(c.reviewStatus,'needs_teacher_review');assert.equal(c.practicePublished,false);assert.equal(c.options.length,id.includes('bio-botany')&&c.number===12?5:4);assert(c.options.every(o=>o.trim()));assert(c.originalExtraction);assert('approvalBlocked' in c.extractionEvidence&&c.extractionEvidence.approvalBlocked);reused+=Number(c.extractionEvidence.reusedExistingId);assert(!c.options.some(o=>/PART-[ABCD]|Marks|Answer the questions/.test(o)));}
 }
 assert.equal(ids.size,47);assert.equal(signatures.size,47);assert.equal(reused,30);
});

test('Chapter 4 retains five-choice assertions, source-specific names, paired DNA strands, matching tables, Roman premises and displaced units',async()=>{
 const em=await json('.local/teacher-review/extracted-books/12-bio-botany-english-f15d4524.json'),tm=await json('.local/teacher-review/extracted-books/12-bio-botany-tamil-51160855.json'),bee=await json('.local/teacher-review/extracted-books/12-basic-electrical-engineering-english-13c7fc7b.json');
 const get=(p:typeof em,n:number)=>p.sourceBoundedProposals.find((c:{chapterId:string;number:number})=>c.chapterId.endsWith('-ch-4')&&c.number===n);
 for(const p of[em,tm]){assert.equal(get(p,12).options.length,5);assert.equal(get(p,12).extractionEvidence.completeTextOptions,false);assert(get(p,12).qualityFlags.some((s:string)=>s.includes('FIVE choices')));assert.deepEqual(get(p,10).options,['a b c d','c d b a','a c b d','c d a b']);assert.equal(get(p,10).extractionEvidence.requiresDiagram,true);assert(get(p,5).questionText.includes('III.'));assert(get(p,6).questionText.includes('IV.'));assert.equal(get(p,7).extractionEvidence.requiresDiagram,true);}
 assert.deepEqual(get(em,12).extractionEvidence.printedOptionLabels,['a','b','c','d','e']);assert.deepEqual(get(tm,12).extractionEvidence.printedOptionLabels,['அ','ஆ','இ','ஈ','உ']);assert.equal(get(em,12).options[4],'Both assertion and reason are false.');
 assert.equal(get(em,7).endPage,96);assert.equal(get(em,7).extractionEvidence.completeTextOptions,false);assert(!get(em,7).options.some((s:string)=>s.includes("'")));assert(get(tm,7).options.every((s:string)=>s.includes("5'")&&s.includes("3'")));assert.equal(get(tm,7).extractionEvidence.completeTextOptions,true);
 assert(get(tm,3).questionText.includes('ஈ.'));assert.deepEqual(get(tm,3).options,['AGGGTT','GTATATC','GAATTC','TATAGC']);assert(get(tm,3).qualityFlags.some((s:string)=>s.includes('English counterpart names EcoRI')));assert(get(tm,9).extractionEvidence.proposedColumnOrderedSpan.includes('அ,'));
 assert(get(tm,13).options[2].length>20);assert(get(tm,13).qualityFlags.some((s:string)=>s.includes('top of the right column')));for(let n=1;n<=16;n++){assert(get(tm,n).qualityFlags.some((s:string)=>s.includes('Damaged Tamil')));assert(get(tm,n).qualityFlags.some((s:string)=>s.includes(`english-f15d4524 Chapter 4 Q${n},`)));}
 for(const n of[14,15]){const c=get(bee,n);assert.equal(c.extractionEvidence.completeTextOptions,false);assert(c.qualityFlags.some((s:string)=>s.includes('superscript 2')));assert(c.extractionEvidence.proposedColumnOrderedSpan.includes('2'));assert(!c.options.some((s:string)=>s.includes('²')));}
 assert.deepEqual(get(bee,2).options,['Capacitor start induction motor','Capacitor start and capacitor run induction motor','Shaded pole motor','Universal motor']);
});

test('Chapter 4 five-choice corrections preserve the fifth choice and actor/history in isolated storage and audit; removing it or approving fails',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'skillup-science-ch4-decision-fixture-'));
 try{const batches=(await loadSharedSourceReviewBatches(process.cwd())).filter(b=>b.unit===4&&b.id.includes('bio-botany'));assert.equal(batches.length,2);
  for(const b of batches){const c=b.candidates.find(c=>c.number===12)!,manifest=reconcileManifest(b.candidates),reviewer={id:'isolated-fixture',name:'Isolated fixture only',email:'fixture@example.test'},input={id:c.id,expectedRevision:0,decision:'needs_correction' as const,notes:'Isolated fixture; not an actual teacher decision',unresolvedIssues:[...c.qualityFlags],inspectedPages:requiredSourcePages(c),textConfirmed:true,keyConfirmed:false,diagramConfirmed:false,correction:{questionText:c.questionText,options:c.options,correctAnswer:null,sourceMappingConfirmed:true}};
   assert.throws(()=>recordDecision(manifest,b.candidates,{...input,correction:{...input.correction,options:c.options.slice(0,4)}},reviewer),/all five printed choices/);
   assert.throws(()=>recordDecision(manifest,b.candidates,{...input,decision:'approved'},reviewer),/Answer evidence is unavailable/);
   const saved=recordDecision(manifest,b.candidates,input,reviewer),file=path.join(directory,b.id+'.json');await fs.writeFile(file,JSON.stringify(saved));const restored=reconcileManifest(b.candidates,await json(file)),entry=restored.entries.find(e=>e.id===c.id)!;
   assert.equal(entry.history.length,1);assert.equal(entry.history[0].correction!.options.length,5);assert.equal(entry.reviewer!.id,reviewer.id);assert.equal(entry.practicePublished,false);assert.equal(manifest.entries.find(e=>e.id===c.id)!.history.length,0);
   assert.equal(auditTeacherManifest(restored,{candidates:b.candidates,persisted:restored,reviewers:[reviewer],requireExport:false}).valid,true);
   const altered=structuredClone(restored);altered.entries.find(e=>e.id===c.id)!.history[0].correction!.options.pop();assert(auditTeacherManifest(altered,{candidates:b.candidates,persisted:altered,reviewers:[reviewer],requireExport:false}).issues.some(i=>i.code==='source_choice_count'));
  }
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});

test('Chapter 4 local browser retains fifth correction field after save/reload/export and leaves real review stores untouched',{timeout:120000},async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'skillup-science-ch4-browser-fixture-')),browser=await chromium.launch({headless:true});let app:Awaited<ReturnType<typeof startLocalPhysicsReview>>|undefined;
 try{const account=await provisionReviewer(directory,'ch4-fixture@example.test','Isolated Chapter 4 fixture'),password=(await fs.readFile(account.credentialsFile,'utf8')).match(/Password: (.+)/)![1];app=await startLocalPhysicsReview({root:process.cwd(),directory,port:0});const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto(app.origin);await page.locator('#email').fill('ch4-fixture@example.test');await page.locator('#password').fill(password);await page.getByRole('button',{name:'Sign in locally'}).click();await page.locator('#review').waitFor({state:'visible'});
  const batches=(await loadSharedSourceReviewBatches(process.cwd())).filter(b=>b.unit===4&&b.id.includes('bio-botany'));
  for(const b of batches){const c=b.candidates.find(c=>c.number===12)!;await page.locator('#batch').selectOption(b.id);await page.waitForFunction(id=>document.getElementById('references')!.textContent!.includes(id),b.candidates[0].id);await page.locator('#question').selectOption(c.id);await page.waitForFunction(id=>document.getElementById('references')!.textContent!.includes(id),c.id);assert.equal(await page.locator('#proposedOptions li').count(),5);assert(await page.locator('#correctedE').isVisible());await page.locator('#correctedQuestion').fill(c.questionText);for(const [i,s]of c.options.entries())await page.locator('#corrected'+String.fromCharCode(65+i)).fill(s);await page.locator('#decision').selectOption('needs_correction');await page.locator('#notes').fill('Isolated browser fixture only; no academic verification');await page.locator('#save').click();await page.waitForFunction(()=>document.getElementById('history')!.textContent!.includes('E)'));
   await page.reload();await page.locator('#review').waitFor({state:'visible'});await page.locator('#batch').selectOption(b.id);await page.waitForFunction(id=>document.getElementById('references')!.textContent!.includes(id),b.candidates[0].id);await page.locator('#question').selectOption(c.id);await page.waitForFunction(id=>document.getElementById('references')!.textContent!.includes(id),c.id);assert.equal(await page.locator('#correctedE').inputValue(),c.options[4]);assert(!(await page.locator('#history').innerText()).includes('undefined)'));
   const queue=await(await page.request.get(app.origin+'/api/queue?batch='+b.id)).json(),entry=queue.manifest.entries.find((e:{id:string})=>e.id===c.id);assert.equal(entry.history[0].correction.options.length,5);assert.equal(entry.decision,'needs_correction');await page.waitForFunction(()=>document.querySelector<HTMLOptionElement>('#decision option[value="approved"]')!.disabled);
   const exported=await(await page.request.get(app.origin+'/api/export?batch='+b.id)).json();assert(exported.entries.find((e:{id:string})=>e.id===c.id).history[0].correction.options[4]===c.options[4]);
   const table=b.candidates.find(c=>c.number===10)!;await page.locator('#question').selectOption(table.id);await page.waitForFunction(id=>document.getElementById('references')!.textContent!.includes(id),table.id);assert((await page.locator('#diagramEvidence').innerText()).includes('Required diagram, table or notation'));assert(await page.locator('#diagramLabel').isVisible());
  }
 }finally{await app?.close();await browser.close();await fs.rm(directory,{recursive:true,force:true});}
});
