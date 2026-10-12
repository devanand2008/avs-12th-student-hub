# Next Tamil extraction inventory

## Local teacher review ready (October 12, 2026)

The Unit 1 held packet now has a [dedicated local teacher review workflow](LOCAL_TAMIL_PHYSICS_REVIEW.md), separate from the production Supabase admin panel. Run `npm run mcqs:physics-review` and open `http://127.0.0.1:4312`. The project owner must provision each actual teacher using `-- --add-reviewer teacher@example.com --name "Actual teacher name"`; sign in with those private local credentials. No real teacher was provisioned by the coding agent.

All 15 questions can be selected individually, with original extraction/options separated from proposed Tamil, actual locally rendered PDF pages, printed/PDF references and printed-key evidence. Teacher notes and pending/correction/rejection/approval decisions persist in `.local/teacher-review/physics-unit1-workflow/decisions.json`, separately from the held queue. Approval requires explicit source/key and diagram checks and resolved issues; Question 10 cannot be approved while graph choices are incomplete. There is no automatic wording correction, graph reconstruction or publication.

**Actual outcome: pending 15, reviewed 0, approved 0, rejected 0, decision events 0.** Export decision manifest downloads all stable IDs, source references/hashes, reviewer decisions, correction notes, warnings and history. All candidate records remain held even after a local reference approval; export never imports anything. Authentication and same-origin/host checks apply to decisions, queue, images and exports. Existing production admin code is unchanged and must not be used to submit this local batch.

**Validation passed:** 96 automated tests (0 failures/skips), including all 15 questions in desktop/mobile browsers, actual rendered image loading, protected routes, explicit diagram checks, blocked graph approval, save/reload/export, stale-action rejection and restart persistence. Two actual extraction reruns preserve saved isolated-fixture decisions and add no duplicate candidates. Typecheck, lint (0 warnings), build (74/74 pages), bounded extraction audit and global parser audit passed. The full Next.js browser suite was not rerun. No test decisions were inserted in the real manifest. Source packet/queue/transcription and live-admin code hashes remain unchanged.

Production was **not accessed, written or deployed** in this task. The October 10 live baseline (995 English questions, Tamil 0, 13 practice sessions) is historical and was not remeasured. Next priority remains real teacher verification of this Unit 1 packet and resolving its seven diagram-dependent questions, especially Question 10's incomplete graph choices; no next extraction batch was started.

[Local workflow guide](LOCAL_TAMIL_PHYSICS_REVIEW.md) · [Verification receipts](local-physics-review-verification.json) · [Preservation checks](local-physics-review-preservation.json)

## Completed local extraction: Physics Volume 1 Unit 1

October 10, 2026: freshly extracted and visually inspected PDF **9, 79, 80, 81** of `12-physics-tamil-v1-c1623725`, source `12th_Std_Physics_Vol_1_TM_optimised.pdf`. Live metadata confirms Physics / Tamil / Volume 1; source SHA-256 `300fa5cf7d911467dfbc031ca5bb397d7c8d831a11724c64d1a173403a3db9ba`. Unit 1 is **நிலை மின்னியல்**, starting PDF 9 / printed 1; Unit 2 starts PDF 88. This resolves the local proposal's front-matter chapter title without changing production mapping.

The real section contains **15 MCQs**: questions 1–6 start on PDF 79 / printed 71; questions 7–12 on PDF 80 / printed 72; questions 13–15 on PDF 81 / printed 73. Question 6's diagram/options continue onto PDF 80. The printed numbered answer key on PDF 81 precedes section II and agrees with all 15 proposed letters. **Pending 15; reviewed 0; approved 0; rejected 0; published 0.** All remain held for teacher verification.

Eleven records retain existing candidate IDs; four missed questions (8, 10, 13, 14) have new local IDs. Raw/source text and options remain separate from proposed visual Tamil transcription. Source filename/hash, question numbers, printed/PDF pages, scoped key and per-question uncertainties are preserved. Seven diagram-dependent questions (1, 3, 5, 6, 8, 10, 14) require faithful representation; question 10 retains graph labels only and has **incomplete text options**. Damaged Tamil/notation remains flagged in every record. Printed inconsistencies or conditions in 7, 8, 9 and 13 require teacher resolution; no wording/answer is academically corrected by the coding agent.

Run `npm run mcqs:physics-unit1` to reproduce the local packet, or add `-- --render` to render the source images again. Queue: `.local/teacher-review/tamil-physics-unit1.json`, batch `tb-12-physics-tamil-v1-c1623725-ch-1-review-01`. The command has no database client or production import switch. Reruns add 0 duplicates and preserve existing local edits/history. **No records were imported into Supabase or the live admin queue.** The historical inventory below still describes the actual production candidate population, including 14 Physics Unit 1 parser rows and 0 book-back classifications; 11 of those overlap this packet and three outside the bounded section remain untouched.

Validation: **92 unit tests passed, 0 failed/skipped**, plus a repeated run of the five new focused cases after the final notation transcription fix; typecheck, lint (0 warnings), build (74/74 pages), bounded extraction and existing global parser audits passed. Source hash/pages and key mappings validate; 15 questions remain held. Browser end-to-end suites were not rerun. Read-only before/after database proofs match: **995 existing English publications, Tamil 0, 12 held legacy samples, 13 unchanged practice sessions**, with identical complete question/candidate digests.

[Per-question teacher review packet](TAMIL_PHYSICS_UNIT1_REVIEW.md) · [Candidates with original evidence](tamil-physics-unit1-candidates.json) · [Extraction audit](tamil-physics-unit1-extraction-audit.json) · [Validation receipts](tamil-physics-unit1-verification.json) · [Preservation proof](tamil-physics-unit1-database-proof.json)

**Next priority:** teacher verification and faithful diagram/graph representation for these 15 local Unit 1 candidates, followed by authorised reconciliation of the retained IDs. Unit 1 extraction is bounded and complete as a held packet, not complete student coverage. Physics Units 2–5 and the computer books remain unprocessed at the MCQ transcription/reconciliation stage; no next batch was started in this task.

## Previous inventory snapshot

Original PDFs checked 2026-10-10T16:19:48.018Z; live publication snapshot 2026-10-10T16:19:02.685Z. Selection uses actual database subject, volume and source_medium metadata. Each distinct PDF ID/hash is preserved, including optimised/full computer-book editions.

**5 PDF records; 53 academic chapter records; 1584 freshly extracted pages; 0 failed/unprocessed pages; 53 chapter records with zero published questions.** Text extraction is not a claim of complete/readable MCQ transcription. Sparse/diagram pages and cache checks are listed per book in the JSON.

Section-I headings and source page spans below identify book-back one-mark sections provisionally. A span includes its ending page even when section II starts midway. Numbered answer-line detections are potential key evidence, not verified answers. Existing parser candidates in these PDFs are classified In-text, so book-back coverage remains missing. Locate each source section, preserve/reconcile existing IDs, transcribe Tamil/options/notation, scope any key, then submit to individual teacher review. Never duplicate optimised/full editions into a shared student chapter silently.

| Textbook / volume | PDF ID | Chapter | PDF range | Section-I start | One-mark page span | Potential numbered key pages | Existing candidates / book-back | Published |
|---|---|---:|---|---|---|---|---|---:|
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 1 | 11–28 | 27 | 27, 28 | not detected | 10 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 2 | 29–72 | 70 | 70, 71 | not detected | 12 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 3 | 73–104 | 103 | 103, 104 | not detected | 9 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 4 | 105–118 | 117 | 117, 118 | not detected | 9 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 5 | 119–126 | 125 | 125, 126 | not detected | 9 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 6 | 127–132 | 130 | 130, 131, 132 | not detected | 8 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 7 | 133–139 | 137 | 137, 138, 139 | not detected | 9 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 8 | 140–150 | 148 | 148, 149 | not detected | 10 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 9 | 151–157 | 155 | 155, 156, 157 | not detected | 10 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 10 | 158–176 | 174 | 174, 175 | not detected | 16 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 11 | 177–193 | 192 | 192, 193 | not detected | 9 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 12 | 194–210 | 207 | 207, 208, 209 | not detected | 16 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 13 | 211–225 | 224 | 224, 225 | not detected | 12 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 14 | 226–234 | 233 | 233, 234 | not detected | 9 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 15 | 235–262 | 260 | 260, 261, 262 | not detected | 5 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 16 | 263–284 | 282 | 282, 283, 284 | not detected | 11 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 17 | 285–299 | 298 | 298, 299 | not detected | 10 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-e51fbdf6 | 18 | 300–311 | 310 | 310, 311 | not detected | 8 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 1 | 11–28 | 27 | 27, 28 | not detected | 10 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 2 | 29–72 | 70 | 70, 71 | not detected | 12 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 3 | 73–104 | 103 | 103, 104 | not detected | 10 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 4 | 105–118 | 117 | 117, 118 | not detected | 10 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 5 | 119–126 | 125 | 125, 126 | not detected | 9 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 6 | 127–132 | 130 | 130, 131, 132 | not detected | 8 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 7 | 133–139 | 137 | 137, 138, 139 | not detected | 10 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 8 | 140–147 | 145 | 145, 146, 147 | not detected | 10 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 9 | 148–154 | 152 | 152, 153 | not detected | 8 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 10 | 155–169 | 167 | 167, 168, 169 | not detected | 14 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 11 | 170–186 | 185 | 185, 186 | not detected | 9 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 12 | 187–203 | 200 | 200, 201, 202 | not detected | 16 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 13 | 204–218 | 217 | 217, 218 | not detected | 12 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 14 | 219–227 | 226 | 226, 227 | not detected | 9 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 15 | 228–250 | 249 | 249, 250 | not detected | 7 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 16 | 251–270 | 268 | 268, 269, 270 | not detected | 11 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 17 | 271–285 | 284 | 284, 285 | not detected | 10 / 0 | 0 |
| Computer Applications  | 12-computer-applications-tamil-f43670d1 | 18 | 286–297 | 296 | 296, 297 | not detected | 8 / 0 | 0 |
| Computer Technology  | 12-computer-technology-tamil-c66e9089 | 1 | 7–50 | 48 | 48, 49 | not detected | 12 / 0 | 0 |
| Computer Technology  | 12-computer-technology-tamil-c66e9089 | 2 | 51–98 | 96 | 96, 97, 98 | not detected | 14 / 0 | 0 |
| Computer Technology  | 12-computer-technology-tamil-c66e9089 | 3 | 99–144 | 142 | 142, 143 | not detected | 14 / 0 | 0 |
| Computer Technology  | 12-computer-technology-tamil-c66e9089 | 4 | 145–162 | 161 | 161, 162 | not detected | 10 / 0 | 0 |
| Computer Technology  | 12-computer-technology-tamil-c66e9089 | 5 | 163–188 | 187 | 187, 188 | not detected | 14 / 0 | 0 |
| Computer Technology  | 12-computer-technology-tamil-c66e9089 | 6 | 189–231 | 230 | 230 | not detected | 8 / 0 | 0 |
| Computer Technology  | 12-computer-technology-tamil-cff5867a | 1 | 7–50 | 48 | 48, 49 | not detected | 12 / 0 | 0 |
| Computer Technology  | 12-computer-technology-tamil-cff5867a | 2 | 51–98 | 96 | 96, 97, 98 | not detected | 14 / 0 | 0 |
| Computer Technology  | 12-computer-technology-tamil-cff5867a | 3 | 99–144 | 142 | 142, 143 | not detected | 14 / 0 | 0 |
| Computer Technology  | 12-computer-technology-tamil-cff5867a | 4 | 145–162 | 161 | 161, 162 | not detected | 10 / 0 | 0 |
| Computer Technology  | 12-computer-technology-tamil-cff5867a | 5 | 163–188 | 187 | 187, 188 | not detected | 14 / 0 | 0 |
| Computer Technology  | 12-computer-technology-tamil-cff5867a | 6 | 189–231 | 230 | 230 | not detected | 8 / 0 | 0 |
| Physics 1 | 12-physics-tamil-v1-c1623725 | 1 | 9–87 | 79 | 79, 80, 81 | 81 | 14 / 0 | 0 |
| Physics 1 | 12-physics-tamil-v1-c1623725 | 2 | 88–132 | 126 | 126, 127 | 127 | 13 / 0 | 0 |
| Physics 1 | 12-physics-tamil-v1-c1623725 | 3 | 133–202 | 197 | 197, 198, 199 | 199 | 15 / 0 | 0 |
| Physics 1 | 12-physics-tamil-v1-c1623725 | 4 | 203–274 | 267 | 267, 268, 269 | 269 | 14 / 0 | 0 |
| Physics 1 | 12-physics-tamil-v1-c1623725 | 5 | 275–294 | 291 | 291, 292 | 292 | 16 / 0 | 0 |

## Back matter and parser discrepancies

The inventory excludes front matter, practicals, appendices, glossary and acknowledgement bookmarks from academic chapters. No live chapter or candidate was deleted or remapped. Existing coverage counts are parser entries, not a confirmed academic contents inventory.

- `12-computer-applications-tamil-e51fbdf6`: PDF page 1, 1_XII CompApp_Tamil version FM.
- `12-computer-applications-tamil-e51fbdf6`: PDF page 312, z_XII CompApp_Tamil version Practicals.
- `12-computer-applications-tamil-f43670d1`: PDF page 1, FM-viii-ix.
- `12-computer-applications-tamil-f43670d1`: PDF page 298, z_XII CompApp_Tamil version Practicals.
- `12-computer-technology-tamil-c66e9089`: PDF page 1, 1_XII CompTech_Tamil version FM.
- `12-computer-technology-tamil-c66e9089`: PDF page 232, z_XII CompTech_Tamil version Practicals.
- `12-computer-technology-tamil-cff5867a`: PDF page 1, 1_XII CompTech_Tamil version FM.
- `12-computer-technology-tamil-cff5867a`: PDF page 232, z_XII CompTech_Tamil version Practicals.
- `12-physics-tamil-v1-c1623725`: PDF page 1, 1_PHYSICS_FM_Tamil; currently appears as parser chapter 1 and needs a separate mapping repair.
- `12-physics-tamil-v1-c1623725`: PDF page 295, 7_XII - PHYSICS PRACTICAL SECOND YEAR; currently appears as parser chapter 7 and needs a separate mapping repair.
- `12-physics-tamil-v1-c1623725`: PDF page 330, 8_Appendix-1.
- `12-physics-tamil-v1-c1623725`: PDF page 339, 9_Glossary.
- `12-physics-tamil-v1-c1623725`: PDF page 352, 10_PH XI Std Acknowledgement; currently appears as parser chapter 10 and needs a separate mapping repair.

## Priority

The original Unit 1 extraction priority is now completed as the 15-record local held packet above. The immediate remaining work is teacher verification, resolution of the source ambiguities and faithful diagram/graph representation, followed by an authorised reconciliation/import. Physics Units 2–5, Computer Applications chapters 1–18 in each PDF record and Computer Technology chapters 1–6 in each record remain subsequent extraction work. No subsequent batch was processed, no question was approved, and none of these books has published Tamil questions.

[Machine-readable candidate/source checks](tamil-accountancy-followup.json) · [chapter CSV](tamil-next-extraction-inventory.csv)
