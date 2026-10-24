# Final Learning Lab and textbook coverage — local continuation

Completed October 24, 2026; source inspection began October 23. Existing main worktree, based on commit 3e3a173, with extensive pre-existing and concurrent changes preserved. No production access, deployment, Git push, migration application or question publication. This is a bounded continuation, not all-subject academic completion.

## Verified extraction work

The requested Chapter 2 batches were already processed: English/Tamil Bio-Zoology 16 each and Tamil Electrical 15, 47 held occurrences, six printed answer mappings and 41 unknown answers. Existing Chapter 3 contains 8/8/18 occurrences, 34 held with unknown answers. Focused rerun tests freshly check the Chapter 2/3 records alongside Chapter 4. Neither earlier batch was duplicated.

| New source batch | Chapter PDF span | Exercise PDF / printed pages | Held occurrences | IDs reused / recovered | Printed answer matches |
|---|---|---|---:|---:|---:|
| Bio-Zoology English, Chapter 4, Principles of Inheritance and Variation | 53–65 | 63–64 / 55–56 | 21 | 18 / 3 | 0 |
| Bio-Zoology Tamil, Chapter 4, மரபுக் கடத்தல் கொள்கைகள் மற்றும் மாறுபாடுகள் | 60–75 | 72–74 / 64–66 | 21 | 21 / 0 | 0 |
| Basic Electrical Engineering Tamil, Chapter 4, இயந்திர மின்சாதனங்கள் | 67–90 | 86–88 / 78–80 | 15 | 15 / 0 | 0 |

Exact filenames and SHA256s are retained in scripts/data/shared-source-sections.json and portal-coverage.json. Source opening, exercise and ending pages were inspected visually/textually. English Zoology 65/66 and Tamil 75/76 establish mind-map endings and next chapter. Electrical 89/90 contain descriptive/end material and 91 opens Chapter 5. Intervening lesson pages were not all transcribed. Private inspection renders are under .local/final-lab-source; review images are in the established source-evidence/systematic-computer-batch directory. Existing renderer now records 343 pages, previously 328.

All 57 are distinct source occurrences/IDs in these batches, not 57 additional student publications. All answers remain unknown, all 57 held, zero teacher decisions/approvals/rejections/publications. Bold options are typography, not an explicit answer key. Zoology Evaluation does not state an individual mark allocation; Electrical Part A explicitly prints one mark. Only the four-choice section is included: Zoology Q22 onward and Electrical Parts B/C/D are excluded. English/Tamil Zoology remain independent transcriptions, not translations copied between editions. Raw extraction, proposed column-ordered transcription, source hashes and page references remain separate.

Genotype superscripts, probabilities and damaged Tamil text remain flagged for teacher verification. Tamil Zoology Q9 lacks its closing option-label parenthesis in extraction; a narrowly scoped label parser preserves the original text, with a warning. Tamil Q13 crosses PDF73–74. Initial source checks stopped on a dropped right-column Q6, label mismatch and clipped Electrical Q15 option; boundaries were corrected against the source, not bypassed. An initial PowerShell-to-Python encoding problem in new configuration text was corrected through a UTF-8 file before the Tamil packet was accepted. No old source wording was rewritten.

Concurrent work introduced preparationStatus and the shared-source-definitions gate. These three inventories now say source_checked after the actual page reconciliation; this means source inventory readiness only. It does not approve any question or bypass authenticated moderation. Source-bounded extraction uses the existing pipeline and shared review schema.

## Integrity and idempotency

| Quantity | Before | After |
|---|---:|---:|
| Saved candidate records | 17,335 | 17,338 |
| Active occurrences | 12,744 | 12,747 |
| Inactive preserved artifacts | 4,591 | 4,591 |
| General bounded proposals | 987 | 1,044 |
| Pending local review entries | 1,002 | 1,059 |
| Dated eligible English / Tamil | 995 / 0 | 995 / 0 |
| Reviewed / approved / rejected | 0 / 0 / 0 | 0 / 0 / 0 |

All 17,335 prior raw candidate objects and all 987 prior bounded proposals retain exact content hashes. Of 586 protected paths, 585 retain byte hashes; the sole changed path is the derived source-pages.json receipt expanded by the existing asset renderer. All previously snapshotted PDFs, PNGs, decisions and history bytes remain unchanged. The 103-resource catalogue, ten-tool AI catalogue and nine prompt definitions are unchanged. The dated database snapshot and thirteen practice-session snapshots remain intact; these are local evidence, not a new live database count. Full receipt: final-learning-lab-integrity.json. The previous 198-file audit is historical; this pass uses its own larger starting snapshot.

Repeated source extraction and deep comparison show no new IDs after the first recovery and no changes to saved decisions. Three recovered raw IDs:

- `textbook-bounded-12-bio-zoology-english-7e848813-6a5c8c90e059ac7b`
- `textbook-bounded-12-bio-zoology-english-7e848813-1768cb37df5253e8`
- `textbook-bounded-12-bio-zoology-english-7e848813-0850e6a27d3bae29`

## All-subject coverage matrix

All 82 registered source PDFs and 24,088 cached pages are inventoried across 40 subject names, 40 English and 42 Tamil textbook records. There are 856 provisional detected chapter entries, not 856 source-certified chapters. No book/chapter is certified academically complete. Full per-book/volume/chapter matrix: [portal-chapter-coverage.csv](portal-chapter-coverage.csv), with richer evidence in [portal-coverage.json](portal-coverage.json). It now distinguishes inspected chapter titles from parser labels, exercise/printed pages, raw candidates, unique signatures, unknown answers, incomplete/uncertain option mappings, warnings and actual review outcomes. Missing-question counts remain null where no exhaustive source reconciliation supports a number.

| Subject | Medium | Textbooks | Detected chapters | Bounded held proposals | Dated eligible |
|---|---|---:|---:|---:|---:|
| Accountancy | English | 1 | 10 | 0 | 94 |
| Accountancy | Tamil | 1 | 10 | 0 | 0 |
| Advanced Tamil | Tamil | 1 | 1 | 0 | 0 |
| Agricultural Science | Tamil | 1 | 14 | 0 | 0 |
| Auditing | English | 1 | 10 | 0 | 91 |
| Auditing | Tamil | 1 | 10 | 0 | 0 |
| Basic Automobile Engineering | English | 1 | 10 | 0 | 0 |
| Basic Automobile Engineering | Tamil | 1 | 10 | 0 | 0 |
| Basic Civil Engineering | English | 1 | 8 | 0 | 47 |
| Basic Civil Engineering | Tamil | 1 | 8 | 0 | 0 |
| Basic Electrical Engineering | English | 1 | 10 | 156 | 0 |
| Basic Electrical Engineering | Tamil | 1 | 10 | 61 | 0 |
| Basic Electronics Engineering | English | 1 | 10 | 0 | 93 |
| Basic Electronics Engineering | Tamil | 1 | 10 | 0 | 0 |
| Basic Mechanical Engineering | English | 1 | 10 | 0 | 0 |
| Basic Mechanical Engineering | Tamil | 1 | 10 | 0 | 0 |
| Bio-Botany | English | 1 | 10 | 158 | 0 |
| Bio-Botany | Tamil | 1 | 10 | 154 | 0 |
| Bio-Zoology | English | 1 | 12 | 50 | 0 |
| Bio-Zoology | Tamil | 1 | 12 | 50 | 0 |
| Biochemistry | English | 1 | 10 | 0 | 0 |
| Biochemistry | Tamil | 1 | 10 | 0 | 0 |
| Botany | English | 1 | 10 | 0 | 0 |
| Botany | Tamil | 1 | 10 | 0 | 0 |
| Business Mathematics & Statistics | English | 1 | 10 | 0 | 28 |
| Business Mathematics & Statistics | Tamil | 1 | 10 | 0 | 0 |
| Chemistry | English | 2 | 15 | 0 | 88 |
| Chemistry | Tamil | 2 | 15 | 0 | 0 |
| Commerce | English | 1 | 28 | 0 | 135 |
| Commerce | Tamil | 1 | 22 | 5 | 0 |
| Communicative English | English | 1 | 6 | 0 | 0 |
| Computer Applications | English | 2 | 36 | 0 | 0 |
| Computer Applications | Tamil | 2 | 36 | 153 | 0 |
| Computer Science | English | 1 | 16 | 0 | 0 |
| Computer Science | Tamil | 1 | 16 | 20 | 0 |
| Computer Technology | English | 2 | 12 | 0 | 0 |
| Computer Technology | Tamil | 2 | 12 | 67 | 0 |
| Economics | English | 1 | 12 | 0 | 186 |
| Economics | Tamil | 1 | 12 | 0 | 0 |
| English | English | 1 | 6 | 0 | 0 |
| Ethics and Indian Culture | Tamil | 1 | 1 | 0 | 0 |
| Food Service Management | English | 1 | 9 | 0 | 0 |
| Food Service Management | Tamil | 1 | 9 | 0 | 0 |
| General Nursing | English | 1 | 13 | 0 | 16 |
| General Nursing | Tamil | 1 | 13 | 0 | 0 |
| Geography | English | 1 | 13 | 0 | 0 |
| Geography | Tamil | 1 | 13 | 0 | 0 |
| History | English | 1 | 15 | 30 | 0 |
| History | Tamil | 1 | 15 | 21 | 0 |
| Home Science | English | 1 | 8 | 0 | 0 |
| Home Science | Tamil | 1 | 8 | 0 | 0 |
| Mathematics | English | 2 | 12 | 0 | 8 |
| Mathematics | Tamil | 2 | 12 | 0 | 0 |
| Microbiology | English | 1 | 12 | 25 | 0 |
| Microbiology | Tamil | 1 | 12 | 0 | 0 |
| Nursing Vocational | English | 1 | 11 | 0 | 0 |
| Nursing Vocational | Tamil | 1 | 11 | 0 | 0 |
| Nutrition and Dietetics | English | 1 | 11 | 0 | 0 |
| Office Management, Secretaryship & Typography | English | 1 | 10 | 0 | 0 |
| Office Management, Secretaryship & Typography | Tamil | 1 | 10 | 0 | 0 |
| Physics | English | 2 | 11 | 0 | 49 |
| Physics | Tamil | 2 | 14 | 60 | 0 |
| Political Science | English | 1 | 12 | 34 | 0 |
| Political Science | Tamil | 1 | 12 | 0 | 0 |
| Statistics | English | 1 | 9 | 0 | 99 |
| Statistics | Tamil | 1 | 9 | 0 | 0 |
| Tamil | Tamil | 1 | 1 | 0 | 0 |
| Textile Technology | Tamil | 1 | 15 | 0 | 0 |
| Textiles and Dress Designing | English | 1 | 15 | 0 | 61 |
| Textiles and Dress Designing | Tamil | 1 | 15 | 0 | 0 |
| Zoology | English | 1 | 13 | 0 | 0 |
| Zoology | Tamil | 1 | 13 | 0 | 0 |

777 provisional entries lack general bounded proposals; 733 lack dated publications. Other specialised Physics review packets are separately counted by the progress audit. Absence of a proposal does not prove absence of an exercise.

## Learning Lab and integration

Existing `/models` and its `/interactive-3d` alias are retained. There are 15 procedural models, no new framework or downloaded assets: Biology 6, Physics 3, Chemistry 4, Mathematics 1, Computer Science 1. The current renderer provides lazy scene loading, part selection/labels, orbit/zoom, keyboard and touch controls, rotation pause/reset, fullscreen where supported, WebGL fallback and reduced-motion handling. Mathematics has a meaningful scalar-vector timeline with speed, play/pause and a length readout. Geometry is schematic, not a scientific simulation or official exam diagram. Molecular lone pairs, biological detail and physical edge effects are simplified as already disclosed. No artificial model was added for an unrelated subject.

| Model | Subject | Verified curriculum context |
|---|---|---|
| Vectors in three dimensions | Mathematics | 12-mathematics-english-v1-e33ceed7 Chapter 6, PDF 230 / printed 222 |
| Replicated chromosome | Biology | General concept; chapter mapping unverified |
| Bacterial cell | Biology | General concept; chapter mapping unverified |
| Electric dipole | Physics | 12-physics-english-v1-1b1de8f8 Chapter 1, PDF 28 / printed 20 |
| Ammonia molecule · NH₃ | Chemistry | General concept; chapter mapping unverified |
| Carbon dioxide · CO₂ | Chemistry | General concept; chapter mapping unverified |
| Inside an animal cell | Biology | General concept; chapter mapping unverified |
| Structure of a neuron | Biology | General concept; chapter mapping unverified |
| Parallel-plate capacitor | Physics | 12-physics-english-v1-1b1de8f8 Chapter 1, PDF 62 / printed 54 |
| Solenoid coil | Physics | 12-physics-english-v1-1b1de8f8 Chapter 3, PDF 172 / printed 164 |
| Water molecule · H₂O | Chemistry | General concept; chapter mapping unverified |
| Methane molecule · CH₄ | Chemistry | General concept; chapter mapping unverified |
| DNA double helix | Bio-Zoology | 12-bio-zoology-english-7e848813 Chapter 5, PDF 70 / printed 62 |
| Inside a plant cell | Bio-Botany | General concept; chapter mapping unverified |
| Binary search tree | Computer Science | General concept; chapter mapping unverified |

Added “Build an AI study prompt” on the lab. Verified model contexts pass the existing tb-book subject ID and genuine chapter ID to /ai-study-tools. The prompt page validates both against its registry; unknown IDs are discarded. General models link without invented mappings. Clear filters clears even a prefilled subject. All nine original prompt templates and ten tool metadata records remain unchanged. The resources hub links the AI page; breadcrumbs retain resources, models and book-back practice. No new top-level navigation system or duplicate lab route.

## Practice portal and moderation

The shared eligibility gate and explicitly retained 995-row legacy publication exception remain unchanged. Held/unknown/legacy sample exclusions remain. No held candidate enters practice through tool/model metadata. Practice remains HTML/CSS with answer options and explicit submission, hidden solutions before submission, existing scoring, retry and saved history. Existing answer-lock migration is not applied to production by this task; persistent deployments still need its separately authorised application.

Review locally: `npm run mcqs:review`, then open http://127.0.0.1:4312. Sign in using an existing authorised teacher account. Select source-12-bio-zoology-english-7e848813-ch-4, source-12-bio-zoology-tamil-2631f8e3-ch-4 or source-12-basic-electrical-engineering-tamil-029f513a-ch-4. Inspect original page/text alongside proposed transcription and warnings. Save an individual correction/pending/rejection decision with notes; unknown answers cannot be approved merely by confirming bold print. No teacher account or decision was invented here.

## Remaining work

Next verified unfinished sequence: English Bio-Zoology Chapter 5, Molecular Genetics, opens PDF66/printed58; Tamil Chapter 5, மூலக்கூறு மரபியல், opens PDF76/printed68; Tamil Electrical Chapter 5, மின் இயக்கிகளும் அதன் கட்டுப்பாடுகளும், opens PDF91/printed83. These openings are checked, but next exercise page ranges are not yet bounded. The earlier backlog incorrectly named Tamil Electrical Chapter 4 as alternators; this report corrects it.

All-subject completion still requires source inspection/reconciliation, faithful Tamil/formula/code transcription, unknown-answer evidence, individual teacher decisions and wider verified lab mappings. The active extraction audit still diagnoses duplicate source occurrences, non-four-choice/incomplete choices and an old invalid answer mapping; none are silently published or repaired. Provider-policy/source gaps in the resources and AI reports remain.

## Actual verification

| Check | Actual result |
|---|---|
| Initial `npm test` during preparation changes | 218 tests: 196 passed, 22 failed; not a clean baseline |
| Subsequent complete `npm test` | 221 tests: 219 passed, 2 failed, zero skipped |
| Affected `tests/shared-source-batch.test.ts` after fixing both failures | 4/4 passed; zero failed/skipped |
| Focused Chapter 2/3/4 extraction/review tests | 7/7 passed |
| Selected Playwright desktop/mobile cases | 24/24 passed |
| Production build | Passed, exit 0 |
| Full lint and final affected-file lint | Passed, exit 0 |
| Final typecheck | Passed, exit 0 |
| Source audit | 82 books / 713 sampled pages, zero mismatches |
| Portal coverage, progress, parser, systematic and resource audits | Passed |
| Diff whitespace check | Passed |

The complete-suite failures were old literal expectations of 49 shared review batches and 682 items; current source-checked inventory has 52 batches and 739 items. The assertions now derive expected counts from the source inventory while retaining all individual evidence/approval checks. The affected file then actually inspected all 739 items at both desktop and mobile widths with authenticated isolated review fixtures, source images, raw/proposed text and disabled unknown-answer approvals. The full suite was **not run a third time**; do not describe it as a clean 221/221 run. Detailed machine-readable receipts: [final-learning-lab-verification.json](final-learning-lab-verification.json).

Browser coverage includes all 15 models and their selectable parts, vector controls, keyboard operation, reduced motion, no-WebGL fallback, source filters, empty selections, resources/PDF links/YouTube failure UI, all nine prompt templates, actual clipboard copy/reset, valid/invalid context IDs, practice refresh/scoring and timed autosave/access boundaries. This is local software-WebGL testing, not physical-device certification or fresh playback checks of every external video.

Initial preparation runs deliberately failed on source-layout assertions until Q6, Tamil label punctuation and the final Electrical option were reconciled. An initial build found a missing TypeScript annotation in the expanded audit; it was fixed. The new test-count helper also required an explicit Array.isArray type guard; final typecheck passed afterward. Draft preparation blockers were retained in preparationHistory and cleared only after verified source reconciliation. No teacher decision history was altered. Existing Gzip-listener, colour-environment and line-ending warnings are retained in logs; they did not fail final selected browser cases.

Logs: `.local/final-lab-*.log`; preservation baseline: `.local/final-lab-baseline.json`. The tests and audits used loopback-only guards/isolated fixtures. No production calls, installed-model inference or genuine teacher approvals are claimed. Earlier report test numbers remain historical.

Changes in this continuation: three appended source definitions/readiness histories; expanded `scripts/audit-portal-coverage.ts` and its JSON/CSV outputs; contextual links in `src/app/models/page.tsx`; validated subject/chapter prefilling in the AI route and client component; Chapter 4 tests and extended browser tests; maintained source-inventory count assertions in `tests/shared-source-batch.test.ts`; this report, verification/integrity receipts and project status. Private candidate packets gained three raw IDs and 57 bounded proposals, plus three pending review manifests and 15 source page images. Pre-existing practice, SQL, lab, source-readiness gate and resource work remains intact.
