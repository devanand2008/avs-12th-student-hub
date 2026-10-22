<!-- BEGIN reconciliation-20261018 -->
## Latest local Tamil milestone — October 18, 2026

**42 held source occurrences**: Applications 13 (12), 15 (10), Computer Science Tamil 1 (10), 2 (10); 40 IDs reused, two new IDs, zero new answers/reviews/approvals/publications. Chapter 13 now preserves both printed Q9 labels through explicit source-occurrence metadata rather than renumbering. Q2 remains incomplete; the earlier Q5 duplicate-choice claim is corrected (ஒளி versus ஒலி). The earlier 51 questions have 18 separate proposed Unicode transcriptions and 33 uncertain items, without altering original proposals/decisions.

Current totals **17,274 saved / 12,688 active / 4,586 inactive**, 305 general bounded proposals, 27 sections; **320 pending review items / 28 batches / zero recorded decisions**. The dated 995 English / zero Tamil eligible snapshot, twelve excluded samples and history remain unchanged. Inventory still 82 PDFs / 24,088 cached pages / 856 detected entries / 733 zero-publication detections; full coverage is incomplete. Final **156/156 tests, six scoped browser cases**, typecheck/lint/build/audits passed; two reruns per source added zero IDs. No production/import/publish/push/deploy.

Open the same local queue using `npm run mcqs:physics-review` → http://127.0.0.1:4312 → authorised local sign-in → select the chapter → inspect original/earlier/supplementary text and source pages → record/export one real individual decision. Unknown answers remain blocked. Next: Computer Science Tamil Chapter 3 and Applications Chapter 16 source inventory. [Complete current report and review instructions](TAMIL_CORRECTION_RECONCILIATION.md) · [Verification](reconciliation-verification.json) · [Preservation](reconciliation-preservation.json).

Earlier milestone text below is historical and is superseded where this entry explicitly corrects it.
<!-- END reconciliation-20261018 -->

# Tamil Computer Applications Chapters 10–12 and 14 — local source/review guide

October 18, 2026. All 51 items are held, all answers unknown, zero actual teacher decisions. This guide never authorises publication or answers questions on a teacher's behalf.

## Exact source

Catalog ID `12-computer-applications-tamil-e51fbdf6`; Computer Applications, Class 12, Tamil medium, no volume designation, edition unknown. File `public/textbooks/12-computer-applications-tamil-e51fbdf6.pdf`, original filename `12th Std Computer Applications Tamil Medium.pdf`, 352 PDF pages, SHA-256 `4a9e2932f822c9aa3f5075743fea3fd6cd54d349ad7fc22e100dc839e093ac26`.

| Tamil Applications chapter | Chapter PDF / printed range | MCQ PDF / printed pages | Occurrences / IDs reused / IDs added | Key matches / unknown | Held / reviewed / approved / published |
| --- | --- | --- | --- | --- | --- |
| 10 · கணினி வலையமைப்பு ஓர் அறிமுகம் | 158–176 / 148–166 | 174–175 / 164–165 | 16 / 16 / 0 | 0 / 16 | 16 / 0 / 0 / 0 |
| 11 · வலையமைப்பு எடுத்துக்காட்டுகள் மற்றும் நெறிமுறைகள் | 177–193 / 167–183 | 192–193 / 182–183 | 10 / 10 / 0 | 0 / 10 | 10 / 0 / 0 / 0 |
| 12 · களப்பெயர் முறைமை | 194–210 / 184–200 | 207–209 / 197–199 | 15 / 13 / 2 | 0 / 15 | 15 / 0 / 0 / 0 |
| 14 · திறந்த மூல கருத்துருக்கள் | 226–234 / 216–224 | 233 / 223 | 10 / 9 / 1 | 0 / 10 | 10 / 0 / 0 / 0 |

PDF numbers are one-based; printed references in this part of the book are ten lower. Contents PDF 9 and source/neighbor pages **9,10,158,173,174,175,176,177,191,192,193,194,206,207,208,209,210,211,223,224,225,226,232,233,234,235** were rendered and visually inspected. PDF 10 is blank front matter, not a failed exercise. This is 26 inspected page images, not every lesson page. The new batch's images and Chapter 13 evidence are in `.local/teacher-review/source-evidence/systematic-computer-batch/`, with SHA receipts in `source-pages.json`.

## Reading-order and source warnings

All candidates preserve the original damaged extraction separately from proposed column/reading-order recovery. The proposed text is **not** teacher-corrected Tamil. Four identified option positions do not establish readable/faithful transcription. All 51 have explicit Tamil correction and unknown-answer blocks; printed keys were not found on these inspected exercise/neighbor ending pages. No required standalone program or diagram-choice gap was identified in these 51 MCQs; this does not resolve diagram warnings in earlier batches.

- Chapter 10 Q3 retains its matching table, years and protocol names. Q4 joins a left-column stem to right-column choices. Q16 retains the printed `a & b` choice.
- Chapter 11 Q3 is a single matching question containing four numbered premises (HTTP/FTP/SMTP/DNS), not four extra questions. Source-specific premise counts preserve that structure. The existing parent ID is reused; its old inner SMTP parser artifact remains unchanged, outside this identity match. Q9–10 occur on PDF 193 after the generic start-page inventory.
- Chapter 12 Q1 excludes the glossary above the Section I banner and joins choices across columns. Q13 retains its Roman premises/combined choices. Q14 preserves assertion/reason text; Q15 preserves matching premises and all four printed permutations. Q14 and Q15 are the two new stable candidate recoveries.
- Chapter 14 Q5 preserves numeric choices 13/3/2/4. Q6 preserves the printed `UNIX & TCL`, `UNIX & a. C++`, `C++ & OTcl`, `C++ & NS2` tokens and needs teacher/source correction; it is the only new candidate in this chapter. Q1 and Q10 already had saved IDs. Q10 retains the printed author-name/“All of them” choices rather than guessed spellings. PDF 234's Section II boundary excludes unrelated questions.
- Chapter 13 remains outside this new batch: PDF 224–225 prints 12 physical occurrences with two Q9 labels and no Q8; Q5 duplicates C/D. See [progress report](CLASS12_PLATFORM_PROGRESS.md). Do not silently renumber or combine records.

All cross-record exact overlaps keep their source IDs and hashes in [verification JSON](collection-verification-20261018.json). Exact raw-text agreement is not proof that both source transcriptions are accurate. No candidate was deleted or copied into student practice.

## Open the existing local teacher workflow

1. In `D:\avs-12-hub`, run `npm run mcqs:physics-review` and open **http://127.0.0.1:4312**. Restart an older local review process to load new definitions. This local server is separate from production moderation.
2. Sign in using a real authorised local teacher account already provisioned through the existing local workflow. An allowlisted profile by itself does not prove that a human teacher reviewed anything.
3. Select **Computer Applications · Tamil · Chapter 10, 11, 12 or 14**. Stable batch IDs are `computer-12-computer-applications-tamil-e51fbdf6-ch-10`, `...-ch-11`, `...-ch-12`, `...-ch-14`.
4. Open an individual question. Compare original extraction, separate proposed transcription and ordered options, original source-page images, source SHA/pages, key evidence and warnings. Read every component of a matching/assertion question. Enter evidence-based correction notes; do not guess missing Tamil or answers.
5. Choose an explicit individual **Still pending**, **Needs correction**, **Rejected with reason**, or **Approved after verification** decision. Unknown answers and unresolved source requirements block approval in this batch. Printed-key agreement alone cannot approve. The seven earlier Unit 1 diagram items still require original-diagram inspection; Q10 cannot be approved with incomplete graph choices.
6. Use **Save this individual local decision**. The authenticated actor and decision history persist separately from the held candidate data under `.local/teacher-review/physics-unit1-workflow/<batch-ID>/decisions.json`. This audit recorded none: approved 0, needs correction 0, rejected 0, pending 278 across all local batches.
7. Use **Export decision manifest** for the selected batch. The server saves an audit copy under that batch's `exports` folder and shows its absolute path; the browser's downloaded copy may be in a different directory. Preserve both the stable candidate IDs and source/evidence digests. Audit a real exported file using `npm run mcqs:systematic-audit -- --manifest "D:\actual\teacher-export.json"`. Saving/exporting does not import or publish any question and must not write production tables.

The definitions are `scripts/data/computer-source-sections.json`; extraction uses `scripts/lib/computer-source-extraction.ts`; the actual packet is `.local/teacher-review/extracted-books/12-computer-applications-tamil-e51fbdf6.json`. Original candidate objects and separate `sourceBoundedProposals` remain distinguishable. Both full 82-book reruns added zero IDs and preserved saved decisions.

## Every source candidate

| Chapter / printed question | Stable candidate ID | PDF pages | Printed pages | Options / answer / status |
| --- | --- | --- | --- | --- |
| 10 / 1 | textbook-q-12-computer-applications-tamil-e51fbdf6-2b5548d4c148cf31 | 174 | 164 | 4 printed positions / unknown / held |
| 10 / 2 | textbook-q-12-computer-applications-tamil-e51fbdf6-d40ed71a17a9a970 | 174 | 164 | 4 printed positions / unknown / held |
| 10 / 3 | textbook-q-12-computer-applications-tamil-e51fbdf6-2c51b3a59c75e6d8 | 174 | 164 | 4 printed positions / unknown / held |
| 10 / 4 | textbook-q-12-computer-applications-tamil-e51fbdf6-da8be1ed58d6a26c | 174 | 164 | 4 printed positions / unknown / held |
| 10 / 5 | textbook-q-12-computer-applications-tamil-e51fbdf6-d031defa3ef0c07b | 174 | 164 | 4 printed positions / unknown / held |
| 10 / 6 | textbook-q-12-computer-applications-tamil-e51fbdf6-e2324f6d76c6e7fc | 174 | 164 | 4 printed positions / unknown / held |
| 10 / 7 | textbook-q-12-computer-applications-tamil-e51fbdf6-5ca48ff674f8b297 | 174 | 164 | 4 printed positions / unknown / held |
| 10 / 8 | textbook-q-12-computer-applications-tamil-e51fbdf6-1ecccc31b62e7cbb | 174 | 164 | 4 printed positions / unknown / held |
| 10 / 9 | textbook-q-12-computer-applications-tamil-e51fbdf6-75d4d8a65e072566 | 175 | 165 | 4 printed positions / unknown / held |
| 10 / 10 | textbook-q-12-computer-applications-tamil-e51fbdf6-892ef04705726ea7 | 175 | 165 | 4 printed positions / unknown / held |
| 10 / 11 | textbook-q-12-computer-applications-tamil-e51fbdf6-15cabced9629412c | 175 | 165 | 4 printed positions / unknown / held |
| 10 / 12 | textbook-q-12-computer-applications-tamil-e51fbdf6-75a647de01060d70 | 175 | 165 | 4 printed positions / unknown / held |
| 10 / 13 | textbook-q-12-computer-applications-tamil-e51fbdf6-932afbf4d88ec71f | 175 | 165 | 4 printed positions / unknown / held |
| 10 / 14 | textbook-q-12-computer-applications-tamil-e51fbdf6-a5a7c5aaea0e7608 | 175 | 165 | 4 printed positions / unknown / held |
| 10 / 15 | textbook-q-12-computer-applications-tamil-e51fbdf6-51e1fbd76fb41f13 | 175 | 165 | 4 printed positions / unknown / held |
| 10 / 16 | textbook-q-12-computer-applications-tamil-e51fbdf6-bee2c6ac45035a7b | 175 | 165 | 4 printed positions / unknown / held |
| 11 / 1 | textbook-q-12-computer-applications-tamil-e51fbdf6-361464fb44059fa2 | 192 | 182 | 4 printed positions / unknown / held |
| 11 / 2 | textbook-q-12-computer-applications-tamil-e51fbdf6-acc69e77b329696b | 192 | 182 | 4 printed positions / unknown / held |
| 11 / 3 | textbook-section-12-computer-applications-tamil-e51fbdf6-7e9b7b99498d3c78 | 192 | 182 | 4 printed positions / unknown / held |
| 11 / 4 | textbook-q-12-computer-applications-tamil-e51fbdf6-be969d823641e6af | 192 | 182 | 4 printed positions / unknown / held |
| 11 / 5 | textbook-q-12-computer-applications-tamil-e51fbdf6-a2a398c7a06c7e55 | 192 | 182 | 4 printed positions / unknown / held |
| 11 / 6 | textbook-q-12-computer-applications-tamil-e51fbdf6-6aa94f1dae6dddd2 | 192 | 182 | 4 printed positions / unknown / held |
| 11 / 7 | textbook-q-12-computer-applications-tamil-e51fbdf6-ef0d04c55e018103 | 192 | 182 | 4 printed positions / unknown / held |
| 11 / 8 | textbook-q-12-computer-applications-tamil-e51fbdf6-0c6024da4148a42f | 192 | 182 | 4 printed positions / unknown / held |
| 11 / 9 | textbook-q-12-computer-applications-tamil-e51fbdf6-8181c6d6f4e4e5c1 | 193 | 183 | 4 printed positions / unknown / held |
| 11 / 10 | textbook-q-12-computer-applications-tamil-e51fbdf6-6245f642c03ca2bb | 193 | 183 | 4 printed positions / unknown / held |
| 12 / 1 | textbook-q-12-computer-applications-tamil-e51fbdf6-cef5e32cbdbc49a9 | 207 | 197 | 4 printed positions / unknown / held |
| 12 / 2 | textbook-q-12-computer-applications-tamil-e51fbdf6-67528d66295f8250 | 207 | 197 | 4 printed positions / unknown / held |
| 12 / 3 | textbook-q-12-computer-applications-tamil-e51fbdf6-17e9cf48a54b64cd | 208 | 198 | 4 printed positions / unknown / held |
| 12 / 4 | textbook-q-12-computer-applications-tamil-e51fbdf6-9b185c94bf8ed043 | 208 | 198 | 4 printed positions / unknown / held |
| 12 / 5 | textbook-q-12-computer-applications-tamil-e51fbdf6-1a82e1fd38b1cc8e | 208 | 198 | 4 printed positions / unknown / held |
| 12 / 6 | textbook-q-12-computer-applications-tamil-e51fbdf6-c9c3ee14d4af8deb | 208 | 198 | 4 printed positions / unknown / held |
| 12 / 7 | textbook-q-12-computer-applications-tamil-e51fbdf6-1f41b0949de2020d | 208 | 198 | 4 printed positions / unknown / held |
| 12 / 8 | textbook-q-12-computer-applications-tamil-e51fbdf6-8a5bab2963115b07 | 208 | 198 | 4 printed positions / unknown / held |
| 12 / 9 | textbook-q-12-computer-applications-tamil-e51fbdf6-9a78df45fcafa5d6 | 208 | 198 | 4 printed positions / unknown / held |
| 12 / 10 | textbook-q-12-computer-applications-tamil-e51fbdf6-36d3b1fc1374c29f | 208 | 198 | 4 printed positions / unknown / held |
| 12 / 11 | textbook-q-12-computer-applications-tamil-e51fbdf6-5a697386907a46f2 | 208 | 198 | 4 printed positions / unknown / held |
| 12 / 12 | textbook-q-12-computer-applications-tamil-e51fbdf6-e4a3052521996aff | 208 | 198 | 4 printed positions / unknown / held |
| 12 / 13 | textbook-q-12-computer-applications-tamil-e51fbdf6-19cebbc5417cfc6a | 208 | 198 | 4 printed positions / unknown / held |
| 12 / 14 | textbook-bounded-12-computer-applications-tamil-e51fbdf6-933c9b6c3dae9c92 | 208 | 198 | 4 printed positions / unknown / held |
| 12 / 15 | textbook-bounded-12-computer-applications-tamil-e51fbdf6-f0b2ea6e83a64853 | 209 | 199 | 4 printed positions / unknown / held |
| 14 / 1 | textbook-q-12-computer-applications-tamil-e51fbdf6-dc9af36aaae3d481 | 233 | 223 | 4 printed positions / unknown / held |
| 14 / 2 | textbook-q-12-computer-applications-tamil-e51fbdf6-054a50fe021a8d9a | 233 | 223 | 4 printed positions / unknown / held |
| 14 / 3 | textbook-q-12-computer-applications-tamil-e51fbdf6-99c2bb76f2907dbe | 233 | 223 | 4 printed positions / unknown / held |
| 14 / 4 | textbook-q-12-computer-applications-tamil-e51fbdf6-f072199c23f70b6b | 233 | 223 | 4 printed positions / unknown / held |
| 14 / 5 | textbook-q-12-computer-applications-tamil-e51fbdf6-01e3513e2251e9e9 | 233 | 223 | 4 printed positions / unknown / held |
| 14 / 6 | textbook-bounded-12-computer-applications-tamil-e51fbdf6-78e565468912fc58 | 233 | 223 | 4 printed positions / unknown / held |
| 14 / 7 | textbook-q-12-computer-applications-tamil-e51fbdf6-41d9315b0bf09678 | 233 | 223 | 4 printed positions / unknown / held |
| 14 / 8 | textbook-q-12-computer-applications-tamil-e51fbdf6-d5bba8a08139eb06 | 233 | 223 | 4 printed positions / unknown / held |
| 14 / 9 | textbook-q-12-computer-applications-tamil-e51fbdf6-0f272a5702641f2f | 233 | 223 | 4 printed positions / unknown / held |
| 14 / 10 | textbook-q-12-computer-applications-tamil-e51fbdf6-a4dfc877c40d4a47 | 233 | 223 | 4 printed positions / unknown / held |

## Tests and next work

| Check | Actual final result |
| --- | --- |
| npm test | 153/153 passed; 0 failed; 0 skipped; 0 cancelled |
| Scoped Playwright desktop/mobile cases | 6 passed, 0 failed; Accountancy, Commerce, Chemistry and account/admin workflows |
| New focused tests / final audit-unit recheck | 4/4; 2/2 |
| Typecheck / lint / production build | Exit 0 / 0 / 0 |
| MCQ integrity / Physics review / systematic / progress / source audits | All exit 0 |
| Full 82-book extraction reruns | Round 1: 82 books, 0 new IDs; Round 2: 82 books, 0 new IDs |
| Full unrelated browser suite / academic teacher verification / fresh production query | Not run |

[Full preservation proof](collection-preservation-20261018.json) · [Actual verification/log hashes](collection-verification-20261018.json) · [All-book/chapter coverage](CLASS12_PLATFORM_PROGRESS.md).

No production access, publication, push or deployment occurred. Resolve Chapter 13 physical-occurrence identity next; the next straightforward source batch is Chapter 15, whose provisional PDF 260–261 exercise must first be inspected. Broad-subject follow-up: Computer Science English/Tamil Chapter 1. Do not interpret indexed pages or held records as approved coverage.
