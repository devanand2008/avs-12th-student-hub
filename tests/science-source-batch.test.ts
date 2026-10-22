import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import catalog from "../src/lib/textbooks-catalog.json";
import { extractSourceBoundedCandidates } from "../scripts/lib/source-bounded-extraction";
import type { Textbook } from "../src/lib/textbooks";

test("Bio-Botany both media and Electrical chapter 1 retain 53 unique held source occurrences and stable reruns",async()=>{
  const cases=[['12-bio-botany-english-f15d4524',20,[32,33]],['12-bio-botany-tamil-51160855',20,[35,36]],['12-basic-electrical-engineering-english-13c7fc7b',13,[24,25]]] as const;
  const ids=new Set<string>();
  for(const [id,count,pages] of cases){
    const packet=JSON.parse(await fs.readFile(`.local/teacher-review/extracted-books/${id}.json`,'utf8'));
    const text=JSON.parse(await fs.readFile(`.local/textbook-text/${id}.json`,'utf8'));
    const book=catalog.books.find(b=>b.id===id) as Textbook;
    const all=await extractSourceBoundedCandidates(book,text,packet.candidates,packet.candidates);
    assert.deepEqual(all.candidates,packet.sourceBoundedProposals);
    const fresh={...all,candidates:all.candidates.filter(c=>c.chapterId.endsWith('-ch-1'))};assert.equal(fresh.candidates.length,count);
    assert.deepEqual(fresh.candidates.map(c=>c.number),Array.from({length:count},(_,i)=>i+1));
    for(const c of fresh.candidates){assert(!ids.has(c.id));ids.add(c.id);assert(pages.includes(c.page as never));assert(c.chapterId.endsWith('-ch-1'));assert.equal(c.correctAnswer,null);assert.equal(c.reviewStatus,'needs_teacher_review');assert.equal(c.practicePublished,false);assert.equal(c.options.length,4);assert(c.options.every(o=>o.trim()));assert(c.originalExtraction);assert(c.extractionEvidence.approvalBlocked);}
    if(book.subject==='Bio-Botany'){
      assert.deepEqual(fresh.candidates[12].options,['8','12','6','2']);
      assert.match(fresh.candidates[16].questionText,/i\).*ii\).*iii\).*iv\)/);
      if(book.sourceMedium==='Tamil'){const q7=fresh.candidates[6];assert(q7.qualityFlags.some(f=>f.includes('tabular')));assert(q7.qualityFlags.some(f=>f.includes('Damaged Tamil')));assert.deepEqual(q7.options,['iv i ii iii','iii iv i ii','iii iv ii i','iii i iv ii']);}
      else assert.equal(fresh.candidates[4].options[3],'2000 micrometer');
    }else{
      assert.deepEqual(fresh.candidates[0].options,['6.6 KV','9.9 KV','11 KV','13.2 KV']);
      assert.deepEqual(fresh.candidates[3].options,['132 KV','220 KV','33 KV','400 KV']);
      assert(!fresh.candidates.some(c=>c.options.some(o=>o.includes('Marks')||o.includes('Activities'))));
    }
  }
  assert.equal(ids.size,53);
});
