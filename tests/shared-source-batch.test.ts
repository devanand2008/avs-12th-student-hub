import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { chromium } from "@playwright/test";
import definitions from "../scripts/data/shared-source-sections.json";
import catalog from "../src/lib/textbooks-catalog.json";
import { extractSourceBoundedCandidates } from "../scripts/lib/source-bounded-extraction";
import { loadSharedSourceReviewBatches } from "../scripts/lib/shared-source-review";
import { reconcileManifest, recordDecision, requiredSourcePages } from "../scripts/lib/local-physics-review";
import { startLocalPhysicsReview, provisionReviewer } from "../scripts/lib/local-physics-review-server";
import type { Textbook } from "../src/lib/textbooks";
import { practiceQuestionResponse } from "../src/lib/practice-question-response";
import type { Question } from "../src/types";
const json = async (p: string) => JSON.parse(await fs.readFile(p, "utf8"));
const reviewDefinitions=definitions.filter(d=>!("preparationStatus" in d)||d.preparationStatus==="source_checked");
const expectedReviewItems=reviewDefinitions.reduce((total,d)=>total+(
  "sourceOccurrences" in d && d.sourceOccurrences ? d.sourceOccurrences.length :
  d.pages.reduce((n,p)=>n+("numbers" in p && Array.isArray(p.numbers) ? p.numbers.length : p.last-p.first+1),0)
),0);

test("shared source extraction across three subjects and two media is stable, retains nested statements and excludes lesson prose", async () => {
  let count=0;
  for (const id of new Set(definitions.filter(d=>["History","Microbiology","Political Science"].includes(d.subject)).map(d=>d.bookId))) {
    const packet=await json(`.local/teacher-review/extracted-books/${id}.json`), text=await json(`.local/textbook-text/${id}.json`);
    const book=catalog.books.find(b=>b.id===id) as Textbook;
    const fresh=await extractSourceBoundedCandidates(book,text,packet.candidates,packet.candidates);
    assert.deepEqual(fresh.candidates,packet.sourceBoundedProposals);
    assert.equal(new Set(fresh.candidates.map(c=>c.id)).size,fresh.candidates.length);
    for (const c of fresh.candidates) {
      assert.equal(c.correctAnswer,null);assert.equal(c.practicePublished,false);assert.equal(c.reviewStatus,"needs_teacher_review");
      assert.equal(c.options.length,4);assert(c.options.every(o=>o.trim()));assert("printedOptionLabels" in c.extractionEvidence);assert.equal(c.extractionEvidence.printedOptionLabels!.length,4);
      assert(!c.options[3].includes("Answer the following"));assert(!c.options[3].includes("Write brief answers"));
    }
    if(book.subject==="History"&&book.sourceMedium==="English"){
      const q=fresh.candidates.find(c=>c.chapterId.endsWith("ch-3")&&c.number===2)!;
      assert.match(q.questionText,/She started a weekly The Commonweal/);
      assert.match(q.questionText,/She published a book/);
      assert.deepEqual(q.options,["1 and 2","2 and 3","1 and 3","1, 2 and 3"]);
      assert.match(fresh.candidates.find(c=>c.chapterId.endsWith("ch-3")&&c.number===3)!.questionText,/Sarojini/);
    }
    if(book.subject==="Microbiology"){
      assert.match(fresh.candidates[0].questionText,/Nono/);
      const q=fresh.candidates.find(c=>c.chapterId.endsWith("ch-2")&&c.number===7)!;
      assert.deepEqual(q.options,["Objective lens","Electromagnetic lens","Glass lenses","Condensor lenses"]);
    }
    if(book.subject==="Political Science"){
      const q=fresh.candidates[1];assert.match(q.questionText,/Members of Cabinet/);assert.equal(q.options[0],"1 and 2 only");
    }
    count+=fresh.candidates.length;
  }
  assert.equal(count,110);
});

test("all new source candidates have pending individual review and cannot obtain approval from unknown answers", async()=>{
  const batches=await loadSharedSourceReviewBatches(process.cwd());assert(reviewDefinitions.length>0);assert.equal(batches.length,reviewDefinitions.length);
  for(const batch of batches){const manifest=reconcileManifest(batch.candidates);assert(manifest.entries.every(e=>e.decision==="pending"&&e.history.length===0));
    const c=batch.candidates[0];assert.throws(()=>recordDecision(manifest,batch.candidates,{id:c.id,expectedRevision:0,decision:"approved",notes:"Isolated test fixture only",unresolvedIssues:[],inspectedPages:requiredSourcePages(c),textConfirmed:true,keyConfirmed:true,diagramConfirmed:false,correction:{questionText:c.questionText,options:c.options,correctAnswer:"A",sourceMappingConfirmed:true}},{id:"fixture",name:"Fixture only",email:"fixture@example.test"}),/Answer evidence is unavailable/);
  }
});

test("practice response withholds all solutions until explicit submission and does not mutate the question",()=>{
  const q={id:"fixture",correctAnswer:"B",explanation:"Fixture explanation",explanationTamil:"Fixture Tamil",sourceAnswerPage:10,optionA:"first",optionB:"second"} as Question;
  const before=JSON.stringify(q),safe=practiceQuestionResponse(q);
  for(const field of ["correctAnswer","explanation","explanationTamil","sourceAnswerPage"])assert(!Object.hasOwn(safe,field));
  assert.equal(JSON.stringify(q),before);assert.equal(practiceQuestionResponse(q,true).correctAnswer,"B");
});

test("all shared-source items display independently on desktop/mobile with authenticated evidence and individual review gates", {timeout:300000}, async()=>{
  const root=process.cwd(),directory=await fs.mkdtemp(path.join(os.tmpdir(),"skillup-shared-source-fixture-")),browser=await chromium.launch({headless:true});
  let app:Awaited<ReturnType<typeof startLocalPhysicsReview>>|undefined;
  try{
    const account=await provisionReviewer(directory,"shared-fixture@example.test","Isolated test fixture"),password=(await fs.readFile(account.credentialsFile,"utf8")).match(/Password: (.+)/)![1];
    const batches=await loadSharedSourceReviewBatches(root);assert(expectedReviewItems>0);assert.equal(batches.flatMap(b=>b.candidates).length,expectedReviewItems);app=await startLocalPhysicsReview({root,directory,port:0});
    for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
      const context=await browser.newContext({viewport}),page=await context.newPage(),errors:string[]=[];
      page.on("pageerror",e=>errors.push(e.message));
      await page.goto(app.origin);await page.locator("#email").fill("shared-fixture@example.test");await page.locator("#password").fill(password);await page.getByRole("button",{name:"Sign in locally"}).click();await page.locator("#review").waitFor({state:"visible"});
      for(const batch of batches){console.info(`Shared source review ${viewport.width}px: ${batch.id}`);await page.locator("#batch").selectOption(batch.id);await page.waitForFunction(id=>document.getElementById("references")!.textContent!.includes(id),batch.candidates[0].id);
        for(const c of batch.candidates){await page.locator("#question").selectOption(c.id);await page.waitForFunction(id=>document.getElementById("references")!.textContent!.includes(id),c.id);assert.equal(await page.locator("#original").innerText(),c.originalExtraction!.questionText);assert.equal(await page.locator("#proposed").innerText(),c.questionText);assert.equal(await page.locator("#proposedOptions li").count(),c.options.length);assert.equal(await page.locator("#correctedAnswer").inputValue(),c.correctAnswer ?? c.localReviewRequirements?.proposedPrintedAnswer ?? "");assert.equal(await page.locator("#keyConfirmed").isChecked(),false);assert.equal(await page.locator("#mappingConfirmed").isChecked(),false);assert.equal(await page.locator("#decision").inputValue(),"pending");if(!c.correctAnswer)await page.waitForFunction(()=>document.querySelector<HTMLOptionElement>('#decision option[value="approved"]')!.disabled);
          await page.locator('#images img').evaluateAll((images) => images.forEach((image) => (image as HTMLImageElement).loading = "eager"));
          await page.waitForFunction(()=>[...document.querySelectorAll('#images img')].length>0&&[...document.querySelectorAll<HTMLImageElement>('#images img')].every(i=>i.complete&&i.naturalWidth>0));
          if(c.extractionEvidence.sourcePageReferences){
            for(const ref of c.extractionEvidence.sourcePageReferences)assert.equal(await page.locator(`#images img[alt="Original textbook PDF page ${ref.pdfPage}, printed page ${ref.printedPage}"]`).count(),1);
            assert((await page.locator('#raw').textContent())!.includes(c.extractionEvidence.sharedSourceOptions!.originalRubric));if(c.keyPage&&/^\d+$/.test(c.extractionEvidence.sharedSourceOptions!.label))assert((await page.locator('#raw').textContent())!.includes("Original printed answer entry (evidence only; not teacher approval)"));
          }
          if(batch.printedOptionLabels?.[c.id])assert((await page.locator('#printedLabels').innerText()).includes(batch.printedOptionLabels[c.id].join(" / ")));
          if(c.localReviewRequirements?.figures.length){
            assert.equal(await page.locator('#figures img').count(),c.localReviewRequirements.figures.length);
            await page.locator('#figures img').evaluateAll(images=>images.forEach(image=>(image as HTMLImageElement).loading="eager"));
            await page.waitForFunction(()=>[...document.querySelectorAll<HTMLImageElement>('#figures img')].every(i=>i.complete&&i.naturalWidth>0));
            for(const [index,asset] of c.localReviewRequirements.figures.entries()){
              const printed=c.extractionEvidence.sourcePageReferences?.find(p=>p.pdfPage===asset.page)?.printedPage ?? c.extractionEvidence.printedPages[asset.page-c.page];
              const rendered=page.locator(`#figures img[data-candidate-id="${c.id}"]`).nth(index);
              assert((await rendered.getAttribute('src'))!.includes(asset.file));
              assert((await rendered.getAttribute('alt'))!.includes(`PDF ${asset.page}, printed ${printed}`));
            }
          }
        }
      }
      assert.deepEqual(errors,[]);await context.close();
    }
  }finally{await app?.close();await browser.close();await fs.rm(directory,{recursive:true,force:true});}
});
