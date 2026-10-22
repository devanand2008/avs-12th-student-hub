# Tamil correction, Chapter 13 reconciliation and continued extraction

October 18, 2026. Local-only source preparation and fixture verification. **Full Class 12 extraction is incomplete. All new questions remain held; no teacher decisions, approvals, imports or publications were invented.** No production database access, Git push or deployment occurred.

## Verified current state

82 physical PDF checksums verified, 24,088 cached text pages, 856 provisional chapter entries and 733 entries with zero eligible publications. Those 733 entries are not 733 confirmed missing one-mark sections. Current saved candidate records **17274**, active IDs **12688**, inactive artifacts **4586**. General bounded proposals **305** in **27** sections, plus the separate 15 Physics Unit 1 items. The local workflow contains **320 pending questions across 28 batches**, reviewed/approved/needs-correction/rejected/history events **0 / 0 / 0 / 0 / 0**.

The saved publication snapshot dated **2026-10-10T15:56:21.193Z**, SHA-256 `2b353c35dabec50c349918da09c19d2c1e74042848efaeb9163ea5a4f0f1bd8a`, still selects **995 English / 0 Tamil**. It is not a fresh live count. The exact existing English rows retain the explicit user-authorised exception; all new questions require individual authorised review and valid publication. Twelve legacy samples remain excluded and the dated 13-session practice snapshot is preserved.

## Earlier 51 Tamil questions: inspected versus corrected

| Applications chapter | Source-inspected items | Complete supplementary proposals | Still uncertain | Key matches / unknown answers | Teacher-approved / published |
| --- | --- | --- | --- | --- | --- |
| 10 | 16 | 4 | 12 | 0 / 16 | 0 / 0 |
| 11 | 10 | 4 | 6 | 0 / 10 | 0 / 0 |
| 12 | 15 | 4 | 11 | 0 / 15 | 0 / 0 |
| 14 | 10 | 6 | 4 | 0 / 10 | 0 / 0 |

All 51 stems and ordered options were compared to original page images: Applications Chapter 10 PDF 174–175 / printed 164–165, Chapter 11 PDF 192–193 / printed 182–183, Chapter 12 PDF 207–209 / printed 197–199, Chapter 14 PDF 233 / printed 223. Matching premises, assertion/reason structures, mathematical/technical delimiters and unusual printed spellings remain in source evidence. **18 complete proposed Unicode/spacing transcriptions** are supplied separately. **33 still lack a defensible complete correction** and remain explicitly uncertain; they were not silently rewritten. Unknown answers remain null for all 51. These are proposals, not academically or teacher-verified corrections.

The versioned supplement is `scripts/data/tamil-computer-transcription-proposals.json`. Each entry binds a stable candidate ID to the original proposal SHA-256, source PDF/hash, chapter, printed number, PDF/printed pages, status, proposed text/options or explicit null, and unresolved issues. It contains no reviewer identity or teacher history. Existing raw records, earlier proposed transcription/options and all 198 previous computer-review evidence digests remain unchanged. The queue exposes the supplement as a **separate source-supported transcription proposal** panel. It never auto-fills teacher corrections, changes the authoritative candidate digest, supplies an answer, changes a decision or publishes anything. A mismatched candidate/source/evidence digest fails validation rather than applying the proposal.

No printed key was located on the inspected exercise/neighbor pages. Selected back pages were also checked (Applications PDF 349 and 352 are notes pages; Computer Science PDF 358 is appendix instructions and 360 credits). A whole-book answer-key absence is **not** claimed. No external OCR/AI service received the PDFs.

## Chapter 13: source numbering reconciled without renumbering

The actual heading and contents identify **வலையமைப்பு வடமிடல்**, beginning PDF 211 / printed 201; next chapter starts PDF 226 / printed 216. Section I is PDF 224–225 / printed 214–215. The physical printed sequence is **1,2,3,4,5,6,7,9,9,10,11,12**. Both Q9 labels are within the same Section I on PDF 224. This is a source-level numbering inconsistency; its publishing cause or intended replacement number is not established. They are different questions with different stems/choice sets, not duplicate questions or separate numbered sections. Label 8 is absent in the printed source; it was not inserted into the data.

| Printed label | Physical occurrence | Actual source topic | Stable ID retained |
| --- | --- | --- | --- |
| 9 | 8 | Connector called செம்ப் இணைப்பு | textbook-q-12-computer-applications-tamil-e51fbdf6-b1fda7f304e58746 |
| 9 | 9 | RJ45 pin count | textbook-q-12-computer-applications-tamil-e51fbdf6-66da55f33a275a50 |

All twelve Chapter 13 proposals now have explicit `sourceOccurrence` metadata: section, physical ordinal, original printed number, PDF page and reason. Internal IDs are the unique keys; ordinals are source positions, never replacement printed question numbers. The review dropdown/title disambiguates both Q9 items by occurrence. The saved/exported manifest includes occurrence metadata under `source.occurrence`; strict audit rejects altered, duplicated or incomplete source-occurrence metadata and changed physical ordinals. Older manifests without occurrence fields keep their existing schema and bytes. Eleven existing IDs are reused; Q12's full matching parent is a new deterministic ID while the old inner-premise artifact remains intact. Q12's newly created record and proposed title were corrected against the literal heading before final validation; its raw extraction was unchanged, and no pre-existing teacher history was edited.

**Corrected prior report:** Q5's original options C **ஒளி** and D **ஒலி** are distinct Tamil words. The previous “same printed word twice” assertion was wrong. The fresh finding supersedes that assertion in the source-inspection register; the historical entry is retained and explicitly labelled superseded here. No answer is inferred from this correction.

**Still incomplete:** Q2 has four printed choices but the C label/text boundary is lost in PDF extraction, merged into another span. Three extracted spans are retained and clearly marked incomplete. No fourth choice or missing label was fabricated. Source positions and warnings remain available for manual transcription. Structural identity is resolved; Tamil/options/answers and the source's numbering defect are not academically resolved.

## Newly bounded sections

| Tamil textbook/chapter | Chapter PDF / printed range | One-mark PDF / printed pages | Bounded / reused IDs / new IDs | Key matches / unknown | Held / reviewed / approved / published |
| --- | --- | --- | --- | --- | --- |
| Applications 13 · வலையமைப்பு வடமிடல் | 211–225 / 201–215 | 224–225 / 214–215 | 12 / 11 / 1 | 0 / 12 | 12 / 0 / 0 / 0 |
| Applications 15 · மின்-வணிகம் | 235–262 / 225–252 | 260–261 / 250–251 | 10 / 9 / 1 | 0 / 10 | 10 / 0 / 0 / 0 |
| Computer Science 1 · செயற்கூறு | 7–17 / 1–11 | 15–16 / 9–10 | 10 / 10 / 0 | 0 / 10 | 10 / 0 / 0 / 0 |
| Computer Science 2 · தரவு அருவமாக்கம் | 18–27 / 12–21 | 26 / 20 | 10 / 10 / 0 | 0 / 10 | 10 / 0 / 0 / 0 |

These are **42 source occurrences / 42 stable IDs, with 40 IDs reused and only two new saved IDs**. The two new records are Applications Chapter 13 matching Q12 and Chapter 15 Q10. A previously inactive saved Chapter 15 Q7 record is reused/reactivated with a separate recovered four-choice proposal; its original zero-option extraction is unchanged. This explains why active IDs increased by three while saved records increased by two. No task-start active ID was removed.

Applications Chapter 15's glossary above the exercise banner was excluded. Q2 prints all four option labels as **அ**; the original labels are retained in extraction evidence and order is preserved as internal A/B/C/D positions, not a silent source correction. Q7's choices continue between columns on the same page. Q10 has no printed dot after number 10; a source-specific anchor recognises it without editing raw text. Assertion/reason Q6 and printed chronology anomalies remain held. PDF 262 starts the longer-answer Section II; no extra one-mark questions were manufactured from it.

Computer Science contents PDF 6 and actual chapter headings establish Chapter 1 **செயற்கூறு** (PDF 7–17 / printed 1–11) and Chapter 2 **தரவு அருவமாக்கம்** (PDF 18–27 / printed 12–21). Their Part A headings explicitly say **one mark**. Parenthesized Tamil option markers and single-column reading order are preserved. Chapter 1 Q6's delimiter choices remain literal `{ }`, `( )`, `[ ]`, `< >`; no program was invented. Chapter 2 Q5/Q6 repeat the printed wording/options with punctuation differences. Both source records remain separate with duplicate-content warnings. Parts B/C/D are explicitly 2/3/5 marks and were inventoried as exclusions, not converted into MCQs. No additional standalone non-MCQ one-mark section was identified in these four inspected exercise spans.

There are **42 exact whitespace-normalized stem/ordered-option signatures** within the 42-item batch and **5 cross-record exact groups involving it**. The collection-wide active diagnostic is **11492 signatures**, **1115 duplicate groups** and **1196 occurrences beyond first**. This is not semantic deduplication or an official unique-question total. Printed occurrences and distinct PDF provenance are preserved rather than deleted or counted as new student publications. Visual duplicate warnings can remain even when punctuation prevents an exact signature match.

## Source PDFs and page evidence

Applications source: `public/textbooks/12-computer-applications-tamil-e51fbdf6.pdf`, original `12th Std Computer Applications Tamil Medium.pdf`, Tamil, no catalog volume designation, edition unknown; SHA-256 `4a9e2932f822c9aa3f5075743fea3fd6cd54d349ad7fc22e100dc839e093ac26`.

Computer Science source: `public/textbooks/12-computer-science-tamil-d5aa7dd4.pdf`, original `12th_Std_Computer_Science_TM_optimised.pdf`, Tamil, no catalog volume designation, edition unknown; SHA-256 `4b30dcadc6963d081d1513462bc5429788cfeb4c4d0d051994a0bb5ba87ed031`.

This task visually checked Applications PDF **9,174,175,192,193,207,208,209,211,223,224,225,226,233,235,259,260,261,262,263,349,352** (22 pages) and Computer Science PDF **4,5,6,7,14,15,16,17,18,25,26,27,28,358,360** (15 pages). The 37 pages include contents, headings, original exercises, lesson/long-answer exclusions, and selected ending pages; not every intermediate lesson page was visually inspected. PDF page references are one-based. Applications printed pages in these chapters are PDF minus 10; Computer Science printed pages are PDF minus 6. Front-matter Roman pages are kept distinct.

The review source-image receipt grew from **87 to 103** entries: all original entries/images retain their SHA-256 and 16 images were appended. Rerendering verifies existing images instead of overwriting them. More inspection-only images are under `.local/reconciliation-source/`, with earlier reviewed pages retained under `.local/collection-20261018-source-inspection/`. No diagram crops were replaced.

## Open and use the same local teacher workflow

1. From `D:\avs-12-hub`, run `npm run mcqs:physics-review` and open **http://127.0.0.1:4312**. Restart an older local process to load new definitions. This workflow has no Supabase connection or publication command.
2. Sign in as a real authorised local reviewer. Select **Computer Applications · Tamil · Chapter 13/15**, **Computer Science · Tamil · Chapter 1/2**, or earlier Applications 10/11/12/14. A provisioned profile is not itself evidence of a human review.
3. For Chapter 13 select the two **Question 9 · occurrence 8/9 · PDF 224** entries separately. Compare original raw extraction, earlier proposed text/options, source pages and warnings. Original printed labels remain 9. For earlier 51 questions, inspect the **separate source-supported transcription proposal** panel: 18 proposed transcriptions, 33 explicit uncertain states, all unknown answers. It does not overwrite the teacher's fields or notes.
4. Enter real correction notes and an explicit individual pending/needs-correction/rejected decision. Unknown answers and incomplete source options block approval. Printed-key agreement alone never records approval. Physics Unit 1 Q10's incomplete graph choices and all prior diagram/code warnings remain held.
5. **Save this individual local decision** writes the authenticated actor/history under `.local/teacher-review/physics-unit1-workflow/<batch-ID>/decisions.json`. Batch IDs are `computer-<catalog-ID>-ch-<chapter>`. All 320 current items remain pending; this task did not record any teacher decisions.
6. **Export decision manifest** exports only that batch, saves a server copy under its `exports` folder and displays the absolute path. Candidate IDs, raw evidence digests, original printed numbers and Chapter 13 occurrence metadata survive export. Audit a real export with `npm run mcqs:systematic-audit -- --manifest "D:\actual\teacher-export.json"`. Saving/exporting does not import or publish. Supplementary proposals stay separate from teacher decision history.

The existing student route `/textbook-practice` still offers medium → subject → book → chapter → Start Practice with HTML choices, feedback, marks, results and retries. Held questions, unknown answers and incomplete options cannot inflate eligible counts or enter a new session even with a mistaken Published flag. Students do not need PDF pages to answer. Source images are for the local teacher queue, and the library reader remains separate.

## Preservation and real tests

All **17,272 task-start candidate objects**, **263 prior bounded proposals**, **198 previous computer-review digests** and **194 protected file checks** passed preservation. The append-only source-image receipt is the sole existing protected file whose bytes grow; all original 87 entries remain unchanged. The 51 earlier records, Physics Unit 1/Units 2–5, saved decisions, diagram/option proposals, twelve legacy exclusions, the 995-row English snapshot and 13-session practice snapshot remain intact. Four newly created pending manifests contain no decisions. The initial short Chapter 13 title was corrected from its original heading in the new held Q12 metadata/empty pending manifest before final validation; no pre-task record or human history was changed.

| Actual check | Final outcome |
| --- | --- |
| Full npm test | 156/156 passed; 0 failed, 0 skipped, 0 cancelled |
| Focused reconciliation regression tests | 3/3 passed |
| Scoped student/admin Playwright | 6 passed, zero failed; desktop/mobile Accountancy, Commerce and Chemistry |
| Typecheck / lint / build | Exit 0 / 0 / 0 |
| Extraction/integrity, Physics review, systematic, progress and source audits | All exit 0 |
| Source/cache comparison | 82 PDFs, 713 fresh sampled pages, 0 mismatches |
| Extraction reruns | Both source PDFs rerun twice; all four jobs added zero IDs |
| Unrelated full browser suite / academic teacher verification / fresh production database checks | Not run |

The initial typecheck failed because TypeScript's JSON inference introduced optional record keys with undefined values. Configuration types now accept the actual optional keys; the final check passes. The first full test run passed 155 and failed one: an older twelve-item PageMaker/InDesign regression also selected the newly configured ten-item Computer Science chapter. The original regression now explicitly targets its original two subjects; dedicated new tests retain Computer Science coverage, followed by a full rerun. The initial failing log is preserved. No successful check was hardcoded. [Actual verification and log SHA-256](reconciliation-verification.json), [preservation proof](reconciliation-preservation.json), and [prior evidence-digest proof](reconciliation-review-digests.json) are saved. Source comparisons are sampled provenance checks, not academic verification of all 24,088 cached pages. Synthetic authenticated decisions used inside tests exist only in isolated fixtures; they are not included in the real local review count.

## Remaining coverage and next priority

| Source textbook | Chapter | Detected start PDF | Provisional exercise PDF pages | Current bounded proposals | Eligible published |
| --- | --- | --- | --- | --- | --- |
| 12-computer-applications-tamil-e51fbdf6 | 1 | 11 | 27, 28 | 0 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 2 | 29 | 70, 71 | 12 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 3 | 73 | 103, 104 | 10 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 4 | 105 | 117, 118 | 9 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 5 | 119 | 125, 126 | 10 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 6 | 127 | 130, 132 | 9 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 7 | 133 | 137, 139 | 9 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 8 | 140 | 148, 149 | 10 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 9 | 151 | 155, 157 | 11 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 10 | 158 | 174, 175 | 16 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 11 | 177 | 192, 193 | 10 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 12 | 194 | 207, 209 | 15 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 13 | 211 | 224, 225 | 12 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 14 | 226 | 233, 234 | 10 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 15 | 235 | 260, 262 | 10 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 16 | 263 | 282, 283 | 0 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 17 | 285 | 298, 298 | 0 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | 18 | 300 | 310, 310 | 0 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | 1 | 7 | 15, 16 | 10 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | 2 | 18 | 26, 26 | 10 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | 3 | 28 | Not detected | 0 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | 4 | 38 | Not detected | 0 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | 5 | 55 | Not detected | 0 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | 6 | 77 | Not detected | 0 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | 7 | 99 | Not detected | 0 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | 8 | 124 | Not detected | 0 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | 9 | 142 | Not detected | 0 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | 10 | 180 | Not detected | 0 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | 11 | 198 | Not detected | 0 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | 12 | 214 | Not detected | 0 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | 13 | 242 | Not detected | 0 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | 14 | 277 | Not detected | 0 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | 15 | 301 | Not detected | 0 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | 16 | 329 | Not detected | 0 | 0 |

Applications Chapter 1 still needs its nonstandard one-mark evaluation handled without fabricated choices; Chapters **16–18** are not newly bounded here. Chapter 16's actual heading **மின்னணு செலுத்தல் முறைகள்** is visible on PDF 263 / printed 253; provisional exercise pages **282–283** must be inspected before processing. Tamil Computer Science Chapters **3–16** remain unbounded; Chapter 3 **வரையெல்லை** starts PDF 28 / printed 22, and its one-mark boundaries still require source inventory. Prepare that next to continue broader subject coverage, alongside Applications Chapter 16. Current local general extraction includes lesson/short-answer/artifact records; it does not prove genuine complete coverage.

The immediate human priority is source-faithful Tamil correction and authorised answer verification for the existing held queue, especially Chapter 13 Q2, before any publication. Known Chapter 4 duplicate choices/missing program, earlier PHP/source issues and Physics graph/diagram requirements remain unresolved. Full Class 12 coverage, including other subjects, non-MCQ formats, Tamil correction and genuine teacher decisions, is still unfinished. This bounded milestone does not claim otherwise.

## Full current per-book publication and extraction inventory

| Textbook/catalog ID | Medium / volume | Cached PDF pages | Detected entries | Active IDs | General bounded proposals | Eligible published | Chapter: published count |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 12-accountancy-english-c0f4ded3 · Accountancy | English / — | 368 | 10 | 162 | 0 | 94 | 1: 10; 2: 10; 3: 9; 4: 8; 5: 9; 6: 10; 7: 9; 8: 9; 9: 10; 10: 10 |
| 12-accountancy-tamil-6e7f5476 · Accountancy | Tamil / — | 368 | 10 | 161 | 0 | 0 | None |
| 12-advanced-tamil-tamil-6679b417 · Advanced Tamil | Tamil / — | 288 | 1 | 98 | 0 | 0 | None |
| 12-agricultural-science-tamil-1d871464 · Agricultural Science | Tamil / — | 336 | 14 | 147 | 0 | 0 | None |
| 12-auditing-english-cb18c74c · Auditing | English / — | 184 | 10 | 161 | 0 | 91 | 1: 10; 2: 6; 4: 29; 6: 10; 7: 10; 8: 9; 10: 17 |
| 12-auditing-tamil-e1982513 · Auditing | Tamil / — | 200 | 10 | 140 | 0 | 0 | None |
| 12-basic-automobile-engineering-english-69f8e9f9 · Basic Automobile Engineering | English / — | 280 | 10 | 112 | 0 | 0 | None |
| 12-basic-automobile-engineering-tamil-e76f29d2 · Basic Automobile Engineering | Tamil / — | 288 | 10 | 102 | 0 | 0 | None |
| 12-basic-civil-engineering-english-fc2d4128 · Basic Civil Engineering | English / — | 248 | 8 | 105 | 0 | 47 | 1: 6; 2: 6; 3: 7; 4: 7; 5: 5; 6: 6; 7: 6; 8: 4 |
| 12-basic-civil-engineering-tamil-122addb5 · Basic Civil Engineering | Tamil / — | 280 | 8 | 94 | 0 | 0 | None |
| 12-basic-electrical-engineering-english-13c7fc7b · Basic Electrical Engineering | English / — | 216 | 10 | 184 | 0 | 0 | None |
| 12-basic-electrical-engineering-tamil-029f513a · Basic Electrical Engineering | Tamil / — | 232 | 10 | 170 | 0 | 0 | None |
| 12-basic-electronics-engineering-english-983efd90 · Basic Electronics Engineering | English / — | 304 | 10 | 151 | 0 | 93 | 1: 13; 2: 8; 3: 10; 4: 19; 5: 12; 6: 8; 7: 8; 8: 9; 9: 3; 10: 3 |
| 12-basic-electronics-engineering-tamil-96fcb4f2 · Basic Electronics Engineering | Tamil / — | 352 | 10 | 151 | 0 | 0 | None |
| 12-basic-mechanical-engineering-english-e15ca391 · Basic Mechanical Engineering | English / — | 224 | 10 | 110 | 0 | 0 | None |
| 12-basic-mechanical-engineering-tamil-49be34e2 · Basic Mechanical Engineering | Tamil / — | 248 | 10 | 100 | 0 | 0 | None |
| 12-bio-botany-english-f15d4524 · Bio-Botany | English / — | 248 | 10 | 305 | 0 | 0 | None |
| 12-bio-botany-tamil-51160855 · Bio-Botany | Tamil / — | 272 | 10 | 308 | 0 | 0 | None |
| 12-bio-zoology-english-7e848813 · Bio-Zoology | English / — | 264 | 12 | 232 | 0 | 0 | None |
| 12-bio-zoology-tamil-2631f8e3 · Bio-Zoology | Tamil / — | 312 | 12 | 238 | 0 | 0 | None |
| 12-biochemistry-english-dfd867ac · Biochemistry | English / — | 304 | 10 | 151 | 0 | 0 | None |
| 12-biochemistry-tamil-910cca11 · Biochemistry | Tamil / — | 320 | 10 | 159 | 0 | 0 | None |
| 12-botany-english-da5635aa · Botany | English / — | 304 | 10 | 356 | 0 | 0 | None |
| 12-botany-tamil-37a9b740 · Botany | Tamil / — | 320 | 10 | 340 | 0 | 0 | None |
| 12-business-mathematics-statistics-english-5710bd23 · Business Mathematics & Statistics | English / — | 296 | 10 | 255 | 0 | 28 | 1: 3; 3: 2; 5: 1; 9: 22 |
| 12-business-mathematics-statistics-tamil-a77e8ce0 · Business Mathematics & Statistics | Tamil / — | 312 | 10 | 242 | 0 | 0 | None |
| 12-chemistry-english-v1-2d0e27cb · Chemistry — Volume 1 | English / 1 | 296 | 7 | 222 | 0 | 34 | 1: 10; 2: 12; 3: 5; 4: 7 |
| 12-chemistry-english-v2-0010d706 · Chemistry — Volume 2 | English / 2 | 328 | 8 | 191 | 0 | 54 | 9: 5; 10: 8; 11: 7; 12: 14; 14: 20 |
| 12-chemistry-tamil-v1-5fcd65a9 · Chemistry — Volume 1 | Tamil / 1 | 328 | 7 | 156 | 0 | 0 | None |
| 12-chemistry-tamil-v2-52192807 · Chemistry — Volume 2 | Tamil / 2 | 344 | 8 | 178 | 0 | 0 | None |
| 12-commerce-english-4f83c61b · Commerce | English / — | 288 | 28 | 157 | 0 | 135 | 1: 5; 2: 4; 3: 5; 4: 5; 5: 5; 6: 5; 7: 5; 8: 5; 9: 3; 10: 5; 11: 5; 12: 5; 13: 5; 14: 5; 15: 5; 16: 5; 17: 5; 18: 5; 19: 4; 20: 5; 21: 4; 22: 5; 23: 5; 24: 5; 25: 5; 26: 5; 27: 5; 28: 5 |
| 12-commerce-tamil-d9e013d8 · Commerce | Tamil / — | 288 | 22 | 138 | 5 | 0 | None |
| 12-communicative-english-english-10e4b8ba · Communicative English | English / — | 192 | 6 | 95 | 0 | 0 | None |
| 12-computer-applications-english-627c1490 · Computer Applications | English / — | 304 | 18 | 196 | 0 | 0 | None |
| 12-computer-applications-english-ccd483a9 · Computer Applications | English / — | 304 | 18 | 196 | 0 | 0 | None |
| 12-computer-applications-tamil-e51fbdf6 · Computer Applications | Tamil / — | 352 | 18 | 199 | 153 | 0 | None |
| 12-computer-applications-tamil-f43670d1 · Computer Applications | Tamil / — | 336 | 18 | 191 | 0 | 0 | None |
| 12-computer-science-english-37bdae5b · Computer Science | English / — | 360 | 16 | 156 | 0 | 0 | None |
| 12-computer-science-tamil-d5aa7dd4 · Computer Science | Tamil / — | 360 | 16 | 152 | 20 | 0 | None |
| 12-computer-technology-english-293bf656 · Computer Technology | English / — | 256 | 6 | 89 | 0 | 0 | None |
| 12-computer-technology-english-cf787554 · Computer Technology | English / — | 256 | 6 | 89 | 0 | 0 | None |
| 12-computer-technology-tamil-c66e9089 · Computer Technology | Tamil / — | 272 | 6 | 75 | 67 | 0 | None |
| 12-computer-technology-tamil-cff5867a · Computer Technology | Tamil / — | 272 | 6 | 76 | 0 | 0 | None |
| 12-economics-english-5418ce45 · Economics | English / — | 296 | 12 | 252 | 0 | 186 | 1: 20; 2: 19; 3: 20; 5: 14; 6: 14; 7: 17; 8: 19; 9: 12; 10: 19; 11: 18; 12: 14 |
| 12-economics-tamil-c7590e3f · Economics | Tamil / — | 336 | 12 | 248 | 0 | 0 | None |
| 12-english-english-b9d1c4c3 · English | English / — | 248 | 6 | 91 | 0 | 0 | None |
| 12-ethics-and-indian-culture-tamil-f49cc8fe · Ethics and Indian Culture | Tamil / — | 264 | 1 | 92 | 0 | 0 | None |
| 12-food-service-management-english-111451e7 · Food Service Management | English / — | 264 | 9 | 187 | 0 | 0 | None |
| 12-food-service-management-tamil-e2061fb1 · Food Service Management | Tamil / — | 328 | 9 | 149 | 0 | 0 | None |
| 12-general-nursing-english-5c87aafc · General Nursing | English / — | 336 | 13 | 202 | 0 | 16 | 8: 16 |
| 12-general-nursing-tamil-b39f5ab1 · General Nursing | Tamil / — | 360 | 13 | 181 | 0 | 0 | None |
| 12-geography-english-24059775 · Geography | English / — | 216 | 13 | 89 | 0 | 0 | None |
| 12-geography-tamil-ba849e46 · Geography | Tamil / — | 232 | 13 | 83 | 0 | 0 | None |
| 12-history-english-3cd2e4c2 · History | English / — | 272 | 15 | 215 | 0 | 0 | None |
| 12-history-tamil-3c88c869 · History | Tamil / — | 312 | 15 | 205 | 0 | 0 | None |
| 12-home-science-english-e5c3e008 · Home Science | English / — | 248 | 8 | 98 | 0 | 0 | None |
| 12-home-science-tamil-0cbbe34e · Home Science | Tamil / — | 272 | 8 | 88 | 0 | 0 | None |
| 12-mathematics-english-v1-e33ceed7 · Mathematics — Volume 1 | English / 1 | 304 | 6 | 131 | 0 | 1 | 3: 1 |
| 12-mathematics-english-v2-d4925ec0 · Mathematics — Volume 2 | English / 2 | 272 | 6 | 122 | 0 | 7 | 8: 2; 11: 5 |
| 12-mathematics-tamil-v1-96fc1e8d · Mathematics — Volume 1 | Tamil / 1 | 336 | 6 | 125 | 0 | 0 | None |
| 12-mathematics-tamil-v2-f8732624 · Mathematics — Volume 2 | Tamil / 2 | 288 | 6 | 117 | 0 | 0 | None |
| 12-microbiology-english-6a36a404 · Microbiology | English / — | 320 | 12 | 166 | 0 | 0 | None |
| 12-microbiology-tamil-a879259a · Microbiology | Tamil / — | 312 | 12 | 128 | 0 | 0 | None |
| 12-nursing-vocational-english-6c60782a · Nursing Vocational | English / — | 344 | 11 | 121 | 0 | 0 | None |
| 12-nursing-vocational-tamil-7f44a760 · Nursing Vocational | Tamil / — | 360 | 11 | 121 | 0 | 0 | None |
| 12-nutrition-and-dietetics-english-3d2e918e · Nutrition and Dietetics | English / — | 240 | 11 | 86 | 0 | 0 | None |
| 12-office-management-secretaryship-typography-english-6b7b27b2 · Office Management, Secretaryship & Typography | English / — | 208 | 10 | 119 | 0 | 0 | None |
| 12-office-management-secretaryship-typography-tamil-241b6edf · Office Management, Secretaryship & Typography | Tamil / — | 224 | 10 | 102 | 0 | 0 | None |
| 12-physics-english-v1-1b1de8f8 · Physics — Volume 1 | English / 1 | 352 | 5 | 76 | 0 | 20 | 1: 3; 2: 4; 3: 1; 4: 4; 5: 8 |
| 12-physics-english-v2-0ce6704c · Physics — Volume 2 | English / 2 | 296 | 6 | 116 | 0 | 29 | 6: 3; 7: 4; 8: 3; 9: 5; 10: 4; 11: 10 |
| 12-physics-tamil-v1-c1623725 · Physics — Volume 1 | Tamil / 1 | 352 | 7 | 82 | 60 | 0 | None |
| 12-physics-tamil-v2-fb1fa4de · Physics — Volume 2 | Tamil / 2 | 312 | 7 | 86 | 0 | 0 | None |
| 12-political-science-english-db4a2e0c · Political Science | English / — | 328 | 12 | 153 | 0 | 0 | None |
| 12-political-science-tamil-5da94964 · Political Science | Tamil / — | 360 | 12 | 149 | 0 | 0 | None |
| 12-statistics-english-1489a12e · Statistics | English / — | 280 | 9 | 164 | 0 | 99 | 1: 6; 2: 7; 3: 13; 4: 16; 5: 14; 6: 9; 7: 15; 8: 19 |
| 12-statistics-tamil-c1143d1d · Statistics | Tamil / — | 296 | 9 | 159 | 0 | 0 | None |
| 12-tamil-tamil-7db1698f · Tamil | Tamil / — | 240 | 1 | 67 | 0 | 0 | None |
| 12-textile-technology-tamil-648797c8 · Textile Technology | Tamil / — | 336 | 15 | 104 | 0 | 0 | None |
| 12-textiles-and-dress-designing-english-1ceb8fbe · Textiles and Dress Designing | English / — | 288 | 15 | 107 | 0 | 61 | 1: 3; 2: 5; 3: 5; 4: 3; 5: 6; 6: 3; 7: 3; 8: 9; 9: 5; 10: 4; 11: 4; 12: 5; 15: 6 |
| 12-textiles-and-dress-designing-tamil-3650ec00 · Textiles and Dress Designing | Tamil / — | 336 | 15 | 104 | 0 | 0 | None |
| 12-zoology-english-788d2d32 · Zoology | English / — | 280 | 13 | 252 | 0 | 0 | None |
| 12-zoology-tamil-3c154dab · Zoology | Tamil / — | 336 | 13 | 261 | 0 | 0 | None |

The [856-row chapter CSV](book-back-chapter-coverage.csv), [coverage JSON](book-back-extraction-coverage.json) and [processing manifest](textbook-processing-manifest.json) contain the current per-chapter details and source references. General bounded totals exclude the separate Physics Unit 1 packet; published counts always come from eligible records in the preserved dated snapshot.

## Every newly bounded candidate

| Textbook/chapter · printed question | Physical occurrence | Stable ID | PDF / printed pages | Extracted option positions / held issues |
| --- | --- | --- | --- | --- |
| Applications 13 · வலையமைப்பு வடமிடல் · 1 | 1 | textbook-q-12-computer-applications-tamil-e51fbdf6-23f4ec7c7f761048 | 224 / 214 | 4 · Tamil/answer verification pending |
| Applications 13 · வலையமைப்பு வடமிடல் · 2 | 2 | textbook-q-12-computer-applications-tamil-e51fbdf6-4bfc5b10c31577e6 | 224 / 214 | 3 · C boundary missing; held |
| Applications 13 · வலையமைப்பு வடமிடல் · 3 | 3 | textbook-q-12-computer-applications-tamil-e51fbdf6-c94744edcb84deca | 224 / 214 | 4 · Tamil/answer verification pending |
| Applications 13 · வலையமைப்பு வடமிடல் · 4 | 4 | textbook-q-12-computer-applications-tamil-e51fbdf6-dadae6cc5dda0921 | 224 / 214 | 4 · Tamil/answer verification pending |
| Applications 13 · வலையமைப்பு வடமிடல் · 5 | 5 | textbook-q-12-computer-applications-tamil-e51fbdf6-eb7f7e71f0629ee5 | 224 / 214 | 4 · Tamil/answer verification pending |
| Applications 13 · வலையமைப்பு வடமிடல் · 6 | 6 | textbook-q-12-computer-applications-tamil-e51fbdf6-a211c07ad797ea60 | 224 / 214 | 4 · Tamil/answer verification pending |
| Applications 13 · வலையமைப்பு வடமிடல் · 7 | 7 | textbook-q-12-computer-applications-tamil-e51fbdf6-eddee9b7315a6201 | 224 / 214 | 4 · Tamil/answer verification pending |
| Applications 13 · வலையமைப்பு வடமிடல் · 9 | 8 | textbook-q-12-computer-applications-tamil-e51fbdf6-b1fda7f304e58746 | 224 / 214 | 4 · Tamil/answer verification pending |
| Applications 13 · வலையமைப்பு வடமிடல் · 9 | 9 | textbook-q-12-computer-applications-tamil-e51fbdf6-66da55f33a275a50 | 224 / 214 | 4 · Tamil/answer verification pending |
| Applications 13 · வலையமைப்பு வடமிடல் · 10 | 10 | textbook-q-12-computer-applications-tamil-e51fbdf6-5946803e221b56de | 224 / 214 | 4 · Tamil/answer verification pending |
| Applications 13 · வலையமைப்பு வடமிடல் · 11 | 11 | textbook-q-12-computer-applications-tamil-e51fbdf6-4d1441c28422bbb4 | 225 / 215 | 4 · Tamil/answer verification pending |
| Applications 13 · வலையமைப்பு வடமிடல் · 12 | 12 | textbook-bounded-12-computer-applications-tamil-e51fbdf6-a299a929ef762f69 | 225 / 215 | 4 · Tamil/answer verification pending |
| Applications 15 · மின்-வணிகம் · 1 | normal printed order | textbook-q-12-computer-applications-tamil-e51fbdf6-3bc61fb7215907bf | 260 / 250 | 4 · Tamil/answer verification pending |
| Applications 15 · மின்-வணிகம் · 2 | normal printed order | textbook-section-12-computer-applications-tamil-e51fbdf6-139f74f6ccc75e55 | 260 / 250 | 4 · Tamil/answer verification pending |
| Applications 15 · மின்-வணிகம் · 3 | normal printed order | textbook-section-12-computer-applications-tamil-e51fbdf6-2e879afd7c45b36c | 260 / 250 | 4 · Tamil/answer verification pending |
| Applications 15 · மின்-வணிகம் · 4 | normal printed order | textbook-q-12-computer-applications-tamil-e51fbdf6-89117ce26df5bb27 | 261 / 251 | 4 · Tamil/answer verification pending |
| Applications 15 · மின்-வணிகம் · 5 | normal printed order | textbook-q-12-computer-applications-tamil-e51fbdf6-50288a61ab2ce2d7 | 261 / 251 | 4 · Tamil/answer verification pending |
| Applications 15 · மின்-வணிகம் · 6 | normal printed order | textbook-q-12-computer-applications-tamil-e51fbdf6-a47bab7d9c5d2631 | 261 / 251 | 4 · Tamil/answer verification pending |
| Applications 15 · மின்-வணிகம் · 7 | normal printed order | textbook-section-12-computer-applications-tamil-e51fbdf6-50d9522ea5c264cc | 261 / 251 | 4 · Tamil/answer verification pending |
| Applications 15 · மின்-வணிகம் · 8 | normal printed order | textbook-q-12-computer-applications-tamil-e51fbdf6-21e22d71f5694037 | 261 / 251 | 4 · Tamil/answer verification pending |
| Applications 15 · மின்-வணிகம் · 9 | normal printed order | textbook-section-12-computer-applications-tamil-e51fbdf6-706489f05a737581 | 261 / 251 | 4 · Tamil/answer verification pending |
| Applications 15 · மின்-வணிகம் · 10 | normal printed order | textbook-bounded-12-computer-applications-tamil-e51fbdf6-a480304eeb6b3fc6 | 261 / 251 | 4 · Tamil/answer verification pending |
| Computer Science 1 · செயற்கூறு · 1 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-4e78ffd9d6a23390 | 15 / 9 | 4 · Tamil/answer verification pending |
| Computer Science 1 · செயற்கூறு · 2 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-5fc831ddaf173786 | 15 / 9 | 4 · Tamil/answer verification pending |
| Computer Science 1 · செயற்கூறு · 3 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-51ba6ff07ebf7fd6 | 15 / 9 | 4 · Tamil/answer verification pending |
| Computer Science 1 · செயற்கூறு · 4 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-500600cf7bb2b540 | 15 / 9 | 4 · Tamil/answer verification pending |
| Computer Science 1 · செயற்கூறு · 5 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-75dcc0a4b88761d7 | 15 / 9 | 4 · Tamil/answer verification pending |
| Computer Science 1 · செயற்கூறு · 6 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-3ad6c8944070c13c | 15 / 9 | 4 · Tamil/answer verification pending |
| Computer Science 1 · செயற்கூறு · 7 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-ae4fcc7c63095f47 | 15 / 9 | 4 · Tamil/answer verification pending |
| Computer Science 1 · செயற்கூறு · 8 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-579f04328033fe8f | 15 / 9 | 4 · Tamil/answer verification pending |
| Computer Science 1 · செயற்கூறு · 9 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-fd7e2c4f3fc89366 | 16 / 10 | 4 · Tamil/answer verification pending |
| Computer Science 1 · செயற்கூறு · 10 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-839b368a89fcceca | 16 / 10 | 4 · Tamil/answer verification pending |
| Computer Science 2 · தரவு அருவமாக்கம் · 1 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-3c55d0d76519909e | 26 / 20 | 4 · Tamil/answer verification pending |
| Computer Science 2 · தரவு அருவமாக்கம் · 2 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-75d01946b4d73f0f | 26 / 20 | 4 · Tamil/answer verification pending |
| Computer Science 2 · தரவு அருவமாக்கம் · 3 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-bf7521417e079cd4 | 26 / 20 | 4 · Tamil/answer verification pending |
| Computer Science 2 · தரவு அருவமாக்கம் · 4 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-e40718f77b30f9bf | 26 / 20 | 4 · Tamil/answer verification pending |
| Computer Science 2 · தரவு அருவமாக்கம் · 5 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-356e4b07ebbc6242 | 26 / 20 | 4 · Tamil/answer verification pending |
| Computer Science 2 · தரவு அருவமாக்கம் · 6 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-663e11cfcbba0520 | 26 / 20 | 4 · Tamil/answer verification pending |
| Computer Science 2 · தரவு அருவமாக்கம் · 7 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-a541d9bad2b5fefd | 26 / 20 | 4 · Tamil/answer verification pending |
| Computer Science 2 · தரவு அருவமாக்கம் · 8 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-2da780e6ace8ef86 | 26 / 20 | 4 · Tamil/answer verification pending |
| Computer Science 2 · தரவு அருவமாக்கம் · 9 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-6d8450d7deb74c9d | 26 / 20 | 4 · Tamil/answer verification pending |
| Computer Science 2 · தரவு அருவமாக்கம் · 10 | normal printed order | textbook-q-12-computer-science-tamil-d5aa7dd4-4ac14696fe7fe8e6 | 26 / 20 | 4 · Tamil/answer verification pending |
