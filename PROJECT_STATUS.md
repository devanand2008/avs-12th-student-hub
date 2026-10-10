# Class 12 MCQ platform — Tamil Accountancy Chapter 1 follow-up

## Current persisted-decision audit (October 10, 2026)

The live read-only follow-up at 2026-10-10T16:19:02.685Z found **0 reviewed, 10 pending, 0 approved, 0 rejected, 0 decision audit rows, and 0 student-ready questions** for Tamil Accountancy Chapter 1. All ten candidate IDs remain held with no reviewer identity or history event. No authorised teacher has recorded a decision yet; the coding-agent source checks are not teacher verification. Rejected/ambiguous/unreviewed records were not promoted. The final database proof at 2026-10-10T16:14:10.831007+00:00 corroborates the same zero-decision state.

Inspected the existing Git changes, admin interface, moderation SQL/RPC permissions, live candidate/bank records, history and audits before adding the follow-up. Existing user changes and architecture were preserved. No runtime app change was necessary. Added the reproducible SELECT-only command `npm run mcqs:accountancy-followup` and updated the Tamil report generator to show actual Accountancy Chapter 1 outcomes and link the next inventory. The audit verifies preserved extraction/packet text against the original PDF, source hash, chapter, current bank wording/options/answer, individual review history and matching audit events. It reports inconsistencies instead of changing records.

Original Accountancy PDF pages **9, 38 and 39** were freshly extracted and visually inspected. Chapter 1 is the unit on accounts from incomplete records; Chapter 2 begins at PDF 47. Questions 1–9 are on PDF 38 / printed 30, question 10 and its numbered key on PDF 39 / printed 31. All ten original question/option packets match the fresh extraction and chapter mapping. The scoped key agrees with all ten stored proposed answers, but the whole-page parser reports conflicting matches. **All ten stored key checks remain ambiguous.** The visibly broken Tamil words and stray option parentheses still need faithful teacher transcription and an individual decision. No wording, option, answer or status was changed in Supabase.

Actual student-ready totals remain **995 existing English textbook publications; Tamil 0; newly individually approved Accountancy Chapter 1 0.** The existing English printed-key publications predate the teacher-review workflow; they are not retroactively described as human teacher approvals. All 12 legacy samples remain held and excluded. The refreshed Tamil queue has 386 held candidates in 43 batches, reviewed 0. The full coverage audit still reports 856 parser entries and 733 with no publication. Those are parser counts, not a teacher-confirmed academic chapter total.

Prepared the next extraction inventory from original PDF bookmarks, actual database medium/subject/volume metadata, and **all 1584 pages of 5 PDF records**: Physics Volume 1 (352 pages), Computer Applications full/optimised (352/336), and Computer Technology full/optimised (272/272). Hashes and fresh page text all match; failed/unprocessed pages 0. All 53 academic chapter records have zero published questions: Physics units 1–5, Applications chapters 1–18 in each PDF, Technology chapters 1–6 in each PDF. The source section-I exercise headings are located for each, but existing candidates are classified In-text and book-back transcription/reconciliation remains unfinished. No candidates were added or deleted. All distinct edition IDs are retained.

The inventory excludes Physics practicals and acknowledgement bookmarks that the existing parser incorrectly lists as chapters 7 and 10. No live mapping was altered; the global 733 zero-publication entries must not be treated as 733 confirmed academic chapters. Original text extraction succeeds on every target page, but sparse pages, damaged Tamil, two-column reading order, mathematics and diagram-dependent questions still need source inspection and faithful representation. Source images were used privately for this audit only; student practice stays text-only.

**Verification this turn:** 87/87 unit tests passed (0 failures, 0 skips); 4 moderation browser cases and 2 actual-book practice browser cases passed across desktop/mobile. These are six browser cases, not a rerun of the complete browser suite. Practice covered three subjects, answer feedback, navigation, retry, history and empty chapters using actual extracted records in isolated fixtures. Typecheck and lint exited 0; build completed 74/74 generated pages. Coverage, Tamil review, Accountancy follow-up and backlog audits exited 0. The source audit freshly compared all 1,584 target pages plus the three Accountancy source pages; 13 representative rendered source pages were also visually inspected. No test fixture decision is a real teacher decision. Supabase history (13 sessions), published content and extraction digests still match the previous proof. **No live database writes or production deployment.**

- [All ten candidate outcomes and teacher instructions](docs/TAMIL_ACCOUNTANCY_FOLLOWUP.md), [source/decision JSON](docs/tamil-accountancy-followup.json).
- [Updated Tamil teacher-review report](docs/TAMIL_TEACHER_REVIEW.md), [reference queue CSV](docs/tamil-teacher-review-queue.csv).
- [Next textbook/chapter inventory with exercise and key pages](docs/TAMIL_NEXT_EXTRACTION.md), [inventory CSV](docs/tamil-next-extraction-inventory.csv).
- [Actual verification receipts and limits](docs/tamil-accountancy-verification.json), [unchanged live database proof](docs/tamil-accountancy-database-proof.json).

**Teacher action:** run `npm run dev`, sign in with your own authorised admin account and open `http://localhost:3000/admin/textbook-questions`. Select **Tamil medium → Accountancy → Chapter 1 → tb-12-accountancy-tamil-6e7f5476-ch-1-review-01 → Needs review**. Open one **Review MCQ**, inspect the original pages and numbered key, correct the wording/options from source, select the verified answer and enter the teacher evidence note. **Save edits for review** keeps it held; **Reject question** records a reason; the explicit verification checkbox plus **Publish reviewed MCQ** records approval of that individual question. Reload and inspect Review history and the Published/Rejected filters. After actual teacher actions, rerun coverage with `--live`, Tamil review and Accountancy follow-up to recalculate persisted counts. CSV entries cannot approve records.

**Highest-priority extraction task:** Tamil Physics Volume 1 Unit 1, PDF pages **79–81**, printed **71–73**, key page **81**. Preserve diagrams and notation; hold questions requiring a diagram until a faithful structured representation is available. Continue Units 2–5 at PDF 126–127, 197–199, 267–269 and 291–292 (keys 127, 199, 269, 292), then the computer-book chapter ranges in the inventory. Full textbook coverage is not complete.

## Previous Tamil-medium interface milestone (historical)

## Tamil-medium verification milestone (October 10, 2026)

Completed locally; production has not been redeployed. The live read-only audit at 2026-10-10T15:43:11.101Z joins **public.textbooks.source_medium** with actual candidate records. All 42 Tamil PDF metadata records match the local catalog medium, volume and source hash; prepared packets also match. Medium is not inferred from filenames.

**386 Tamil candidates remain held in 43 batches across 9 textbooks and 42 detected chapters.** Pending 386; reviewed 0; approved 0; rejected 0. Printed-key checks are 212 page-wide matches and 174 ambiguous mappings, not teacher approvals. All pending candidates have unresolved source/quality warnings; 100 printed-page labels need confirmation. Another 5820 Tamil candidate IDs have no prepared packet, out of 6206 Tamil extraction candidates. These populations do not establish complete textbook coverage.

The admin queue now has a dedicated Tamil/English medium selector backed by database metadata, textbook/chapter/batch filters, approved/rejected batch counts, and CSV export for the selected prepared queue or all Tamil prepared batches. Export includes every matching record across API pages, including reviewed records, with candidate IDs, source hashes/pages, original wording/options, warnings, decisions and history. CSV is UTF-8 with BOM and neutralises spreadsheet formulas. It is reference-only: there is no decision importer and downloading or editing a CSV never approves records.

Original PDF/key links and extracted evidence, subject/volume/chapter/page information, candidate and batch IDs, proposed answers and ambiguity reasons are visible in each review dialog. Save-edit/approve/reject actions require a live authenticated admin identity; publication additionally requires explicit source/options/answer confirmation, and rejection requires a reason. Tests verify persistence after reload, immutable extraction/preparation evidence, correct Tamil publication fields and before/after audit records. Stale versions still reject correctly. A confirmed timing bug is fixed: review actions wait for queue refresh and filters wait for an in-progress save, preventing an old row from reopening immediately after publication. Distinct candidates with equal wording retain separate IDs.

**Student-ready questions remain 995 existing English textbook publications; Tamil-ready 0.** Existing printed-key English publications predate this teacher-review milestone and are not retroactively claimed teacher-approved. All 12 held legacy samples remain excluded. All 896 prepared candidates across both media remain pending; real teacher review audits remain 0. No candidate was approved, rejected, edited, deleted or imported in the live database during this task. No schema/Auth configuration was changed. The 13 real practice sessions and their snapshots, published textbook content and original extraction digests match the prior database proof. Review functions remain inaccessible to browser database roles.

**Final verification:** 87/87 unit tests passed (0 failures, 0 skips); 56 desktop/mobile browser scenarios passed (0 failures, 12 intentional mode/opt-in skips); typecheck and lint exited 0; production build completed 74/74 generated pages. The two focused Tamil browser cases also passed separately and are repeats, not extra unique tests. The default suite was rerun successfully after fixing fixture/locator issues and the actual review-refresh bug. These moderation decisions occurred only in isolated PostgreSQL fixtures. Activation-specific, real-book and local-Gemma opt-ins were not rerun in this milestone; their prior results below are historical, not new checks. Supabase advisors still report the pre-existing [leaked-password-protection warning](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); Auth settings were left unchanged.

- [Tamil review guide, all 42 books and 43 chapter/batch entries](docs/TAMIL_TEACHER_REVIEW.md).
- [Teacher-reference queue CSV](docs/tamil-teacher-review-queue.csv), [batch counts/IDs CSV](docs/tamil-teacher-review-batches.csv) and [per-candidate unresolved issues](docs/tamil-teacher-review.json).
- [Actual test receipts and limitations](docs/tamil-teacher-review-verification.json), [live database digest proof](docs/tamil-teacher-review-database-proof.json) and [security advisor results](docs/tamil-teacher-review-security.json).

**Open the queue:** run `npm run dev`, sign in with your own authorised admin email/password, complete any required password change, and open `http://localhost:3000/admin/textbook-questions` (sidebar: **Textbook MCQ review**). Select **Textbook medium → Tamil medium**, textbook, chapter, and **Teacher review batch**. Click **Review MCQ**. Compare the original PDF/options with the correct chapter's printed-key evidence, resolve the warnings, edit only from source, select the verified answer and enter a review note. **Save edits for review** keeps it held; **Reject question** requires a reason; ticking the verification checkbox then **Publish reviewed MCQ** records individual approval. Reload and use Published/Rejected plus Review history to check the saved decision. Teachers currently need authorised admin accounts; there is no separate teacher role. The new filter/export interface is local, not deployed.

**Highest-priority next task:** an authorised Accountancy teacher should verify Tamil Chapter 1 batch `tb-12-accountancy-tamil-6e7f5476-ch-1-review-01` (10 held questions; all key mappings ambiguous) individually, then continue the remaining prepared batches. Next extraction priorities: Tamil Physics Vol 1 (detected entries 1–5, plus 7/10 whose chapter inventory needs confirmation), Computer Applications (both PDF records, detected entries 1–18) and Computer Technology (both records, detected entries 1–6). They have no parser-identified book-back sections; locate the actual exercises and confirm the inventory before transcription. Mathematics volumes 1/2 need source-confirmed notation and key scope. Coverage remains incomplete: the independent coverage baseline still has **733 detected chapters without published questions**; publication/source digests are unchanged. No book or chapter is claimed complete.

## Previous evidence-preparation milestone (October 10, 2026)

The 896 held printed-key candidates are now prepared in Supabase as `needs_teacher_review`, in 110 batches across 23 textbooks and 101 detected chapters. Fresh source extraction checked 273 original PDF pages: all stored text/options matched; the conservative key-page check found 411 matches, 485 ambiguous mappings and zero disagreements. These are automated evidence checks, **not teacher approvals**. Four potential duplicates/overlaps are flagged. Printed-page labels were detected for 710 candidates; 186 remain unknown. All 896 still require individual human review, including 386 Tamil-medium candidates.

The current student-ready count is **995 published textbook questions**. All 12 previously published, unverified legacy samples are held; all 14 raw original samples are also held by the seed/export gate. The 13 existing practice sessions and their question snapshots are unchanged. The published textbook content and original extraction data are unchanged. [Database verification](docs/teacher-review-database-proof.json) records the before/after counts and digests.

The local moderation page now includes original extraction, source and answer-key text, medium/volume/chapter/PDF and printed pages, OCR and duplicate warnings, batch selection, explicit approve/reject/save-edit actions and a reviewer audit trail. Editing a published question withdraws it until reapproval; stale edits are rejected. Admin publication/review filters now count actual student-facing records, including the ten retained Electronics entries, and retain standing published chapter mappings during review. Mobile dialog fields and actions fit the viewport and remain above the bottom navigation. New textbook imports cannot automatically publish, and reimports preserve prepared packets and human work. The existing deployed review RPC remains compatible and now records approval state, original extraction and before/after history when an administrator explicitly publishes. No deployment configuration was changed and production was not redeployed; these UI/importer changes are local.

- [Prepared batches and evidence](docs/TEACHER_REVIEW_BATCHES.md): all 110 batches; every candidate ID and page check is in the accompanying JSON.
- [Full current textbook coverage](docs/INDEPENDENT_COVERAGE.md) and [chapter coverage](docs/independent-chapter-coverage.csv).
- [Prioritized chapter backlog](docs/TEXTBOOK_COVERAGE_BACKLOG.md) and [CSV](docs/textbook-coverage-backlog.csv): all 856 detected entries, with overlapping extraction/verification/review/publication/OCR states. No chapter is marked complete.

Current coverage remains incomplete: 733 detected chapter entries have no published questions, 309 have no identified book-back candidates, and all 42 Tamil-medium textbooks remain unpublished. Of 11,234 candidate IDs excluded from practice, 896 have review packets and 10,338 still need preparation/source or answer verification. Rejected candidates: 0. The 12 held legacy samples and 613 held generated drafts are separate from the candidate queue; held legacy textbook question rows may overlap candidates and must not be summed as extra unique questions.

Final checks: **85 unit tests passed**, typecheck and lint exited 0, and production build completed. Browser suites passed **64 distinct scenarios**: 54 default (12 mode/opt-in skips), 4 direct-account, 4 administrator-approval and 2 real-book desktop/mobile scenarios across Accountancy, Commerce and Chemistry. After the final admin count fix, 6 relevant review/account scenarios passed again. The two local-Gemma inference opt-ins remain unrun. Earlier failures exposed an exact-label test locator issue and a real mobile dialog overflow/hit-target bug; both were reproduced, fixed and rerun. Tests use isolated PostgreSQL fixtures; actual student records were preserved. [Machine-readable verification](docs/teacher-review-verification.json) records actual results and raw-log checksums.

**Highest-priority next task:** individually verify the first zero-ready Tamil review batch against its original PDF and chapter-specific printed key, repair the text where needed, and approve or reject each question explicitly. Continue the remaining batches and inventory missing book-back sections. Preparation alone does not establish full textbook coverage.

## Previous independent audit (historical baseline)

The following records the earlier audit snapshot before the legacy hold and evidence preparation above. Its 1,007-ready and test counts describe that earlier snapshot, not the current database.

Audited October 10, 2026. Live content read: 2026-10-10T13:46:14.701Z. Coverage measurement: 2026-10-10T13:46:32.812Z. Project: rqsymozgslwwupxmyido.supabase.co.

**Verdict: the practice implementation passes the completed checks, but complete textbook coverage is NOT achieved.** Final verification completed. App UI fixes remain in the local worktree. The targeted database chapter repair is applied live; no pending question was approved.

## Verified numbers and their meanings

| Measure | Independent result | Meaning |
|---|---:|---|
| Physical PDF files / unique SHA-256 hashes | 82 / 82 | 24,088 pages; 40 subjects, 42 Tamil-medium and 40 English-medium PDF records |
| Fresh parser candidates | 12,229 | Candidate IDs, not approved questions; four duplicate-content pairs remain for review |
| Parser-classified book-back candidates | 6,311 | Other 5,918 candidates are in-text/uncertain sections |
| Auto-eligible candidates | 985 | Readable four-option text matched to a printed key; INCLUDED in the live published count |
| Candidate review status | 11,244 | Extraction/moderation classification; ten retained questions also exist in the published bank |
| Candidate IDs excluded from practice | 11,234 | Count obtained by comparing IDs with actual student-ready rows |
| Student-ready questions | **1,007** | **995 printed-key textbook questions + 12 legacy samples without textbook-verification metadata** |
| Parser-classified book-back among ready questions | 985 | Ten retained Electronics questions are currently classified In-text by the parser, although their source pages show one-mark exercises |
| Generated raw dataset | 625 | 613 unverified legacy drafts; 12 IDs overlap the original sample bank; no additional generated drafts published |
| Known printed keys, excluded from practice | 896 | Text/layout/section issues still require individual transcription and teacher review |

Live table totals: avs_questions 3039 (1007 Published; 2032 Teacher Review), textbook_mcq_candidates 12229, textbook_mcq_imports 82, avs_curriculum 7222. These tables overlap by IDs and must not be added together as unique question counts.

All 1007 ready rows have four nonempty, distinct options and valid A-D answers. No published duplicate content within a chapter, no duplicate candidate IDs, no missing source IDs, no printed-key answer mismatch, and no auto-published text/choice mismatch were found. Ten retained key answers were additionally checked directly against their printed key pages. Matching a key does not constitute teacher approval of the entire collection.

## Actual subject and chapter coverage

Only **16 of 82 PDF records** have published questions; all are English-medium. The other 66 records have none. All 42 Tamil-medium records have zero student-ready questions. 856 chapter/unit entries were detected by the parser: 733 have zero published questions and 309 have no identified book-back candidates. This is not an independently approved chapter inventory. No textbook is marked complete.

In the table, "chapter: count" counts live published textbook questions, including the ten retained Electronics entries. Unlisted chapters have zero ready questions; see the full chapter CSV for their candidates, known keys and exercise-page evidence.

| English-medium textbook / volume | Ready | Parser book-back ready | Chapter: published count |
|---|---:|---:|---|
| Accountancy | 94 | 94 | 1: 10; 2: 10; 3: 9; 4: 8; 5: 9; 6: 10; 7: 9; 8: 9; 9: 10; 10: 10 |
| Auditing | 91 | 91 | 1: 10; 2: 6; 4: 29; 6: 10; 7: 10; 8: 9; 10: 17 |
| Basic Civil Engineering | 47 | 47 | 1: 6; 2: 6; 3: 7; 4: 7; 5: 5; 6: 6; 7: 6; 8: 4 |
| Basic Electronics Engineering | 93 | 83 | 1: 13; 2: 8; 3: 10; 4: 19; 5: 12; 6: 8; 7: 8; 8: 9; 9: 3; 10: 3 |
| Business Mathematics & Statistics | 28 | 28 | 1: 3; 3: 2; 5: 1; 9: 22 |
| Chemistry Vol 1 | 34 | 34 | 1: 10; 2: 12; 3: 5; 4: 7 |
| Chemistry Vol 2 | 54 | 54 | 9: 5; 10: 8; 11: 7; 12: 14; 14: 20 |
| Commerce | 135 | 135 | 1: 5; 2: 4; 3: 5; 4: 5; 5: 5; 6: 5; 7: 5; 8: 5; 9: 3; 10: 5; 11: 5; 12: 5; 13: 5; 14: 5; 15: 5; 16: 5; 17: 5; 18: 5; 19: 4; 20: 5; 21: 4; 22: 5; 23: 5; 24: 5; 25: 5; 26: 5; 27: 5; 28: 5 |
| Economics | 186 | 186 | 1: 20; 2: 19; 3: 20; 5: 14; 6: 14; 7: 17; 8: 19; 9: 12; 10: 19; 11: 18; 12: 14 |
| General Nursing | 16 | 16 | 8: 16 |
| Mathematics Vol 1 | 1 | 1 | 3: 1 |
| Mathematics Vol 2 | 7 | 7 | 8: 2; 11: 5 |
| Physics Vol 1 | 20 | 20 | 1: 3; 2: 4; 3: 1; 4: 4; 5: 8 |
| Physics Vol 2 | 29 | 29 | 6: 3; 7: 4; 8: 3; 9: 5; 10: 4; 11: 10 |
| Statistics | 99 | 99 | 1: 6; 2: 7; 3: 13; 4: 16; 5: 14; 6: 9; 7: 15; 8: 19 |
| Textiles and Dress Designing | 61 | 61 | 1: 3; 2: 5; 3: 5; 4: 3; 5: 6; 6: 3; 7: 3; 8: 9; 9: 5; 10: 4; 11: 4; 12: 5; 15: 6 |

The full [82-record book table](docs/INDEPENDENT_COVERAGE.md), [856-row chapter table](docs/independent-chapter-coverage.csv), and [JSON evidence](docs/independent-textbook-coverage.json) include volumes, source pages, known-key held counts, zero-ready/missing-exercise chapters and flagged PDF pages. Computer Science, Bio-Botany and Bio-Zoology textbook records have zero ready extracted questions; the generic practice bank still exposes 8/1/3 legacy samples respectively. Mathematics has only 1 ready textbook question in volume 1 and 7 in volume 2.

All PDFs opened and all caches matched their file hashes, IDs, page counts and page sequences; zero unprocessed pages or failed PDF files were found. Fresh extraction independently matched the saved text on 713 selected original PDF pages across all 82 records, including every detected exercise-start page. A further two source pages were freshly checked for the Electronics repair. 1821 question-bearing pages were flagged for text/formula/figure/boundary issues; this is not an exhaustive count of unreadable pages. Zero pages were below the chosen 40-character sparse-text threshold, which does not establish usable Tamil or mathematical extraction.

Printed chapter headers/footers corroborate the stored chapter for 467 published textbook questions; the simple check cannot corroborate the remaining 528. No printed-header contradiction remains. Chapter tables count actual database assignments; they are not a teacher-confirmed chapter-boundary inventory. The unresolved mappings require contents/exercise source review.

## Verification results

| Command / suite | Actual result |
|---|---|
| Initial npm test | 79/79 PASS, independently reproduced before fixes |
| Final npm test | 81/81 PASS; account-scoped history and guarded chapter repair regression tests added |
| npm run typecheck | PASS (exit 0) |
| npm run lint | PASS (exit 0; no lint errors/warnings) |
| npm run build | PASS (production Next.js build) |
| npm run mcqs | FAIL: missing script in package.json; no success result invented |
| npm run mcqs:audit | PASS: 82 records, 985 auto-eligible, 11,244 review |
| npm run mcqs:coverage -- --live | PASS after chapter repair; original run correctly failed on three count mismatches |
| PDF source audit | PASS: 713 fresh page texts matched; zero mismatches |
| Default Playwright | 52 passed, 12 skipped |
| Direct-account Playwright | 4 passed |
| Administrator-approval Playwright | 4 passed |
| Actual-book Playwright | 2 passed; desktop/mobile Accountancy, Commerce and Chemistry |

Total completed browser scenarios: 62. Default-mode skips include alternative activation modes and the opt-in actual-book scenarios, run separately above. The two installed-Gemma inference opt-ins were not executed. Browser tests use local PostgreSQL/PGlite with the real Supabase SDK, isolated accounts and selected real extracted question data, not the live student database.

The real-book tests check exact stems and option strings, no main PDF viewer/canvas/iframe/image, green/red feedback, marks without double-counting, Previous/Next, early Finish with correct/wrong/skipped arithmetic, immutable submitted scores, fresh Retry/Practice Again session IDs, a fresh timed deadline, concealed timed answers/key pages, seven completed attempts, refresh persistence, ownership separation, re-take filters and local clearing without deletion of server attempts. Empty chapters disable starting and explain that review is needed. Subject API failures surface an alert. Existing suites also test administrator review, unknown-answer rejection, CSV/XLSX import/export, authentication, content, reader, video, models and offline-shell restrictions. This does not academically validate every published question or every textbook chapter.

## Incorrect or unsupported prior claims

- "625 verified/published curriculum questions" was false: the raw generated data has 625 IDs, 12 overlap samples, and 613 legacy drafts remain Teacher Review. No generated draft is an additional ready question.
- "985 additional questions across all 82 books" confused extraction classifications with coverage and publication. The 985 are already part of the 995 textbook count, drawn from 16 records.
- "100% complete", bilingual core textbook coverage and broad humanities/science readiness were unsupported. All Tamil records and 66 PDF records have zero published textbook questions.
- Reports mixed 50 generated-dataset chapters and 55 curriculum chapters without defining their scopes. Neither proves coverage of the 856 parser-detected entries.
- The review count is not a disjoint unpublished total: ten retained Electronics questions have published question rows while their source candidates remain Needs Review. Four duplicate-content draft pairs also prevent equating candidates with unique official questions.
- The original retry reset only browser state while reusing a completed server session; it did not create a fresh graded attempt. The original global localStorage history mixed owners and initialized client history before hydration.
- mcqs:audit writes the JSON extraction report only; it does not generate the previous human completion report. Production assets inspected on October 10 had Practice Again but lacked the new Retry Practice/running-marks/history markers, so the current UI work must not be described as deployed.

## Bugs fixed and preserved data

- Retry and Practice Again now request a new server session with the same filters, cleared answers/flags/results, and a fresh timed deadline. They may choose a different randomized subset/order; exact-same-question replay is not promised.
- Recent history is loaded after authenticated hydration, validated, capped at 50, deduplicated by session ID and separated by owner. It records server identity/timing and preserves source filters for fresh re-takes. Unowned legacy storage is left untouched and hidden. Browser history remains device-local; Supabase attempts remain durable.
- Practice loading failures are visible, empty selections cannot launch fabricated tests, mobile question-count buttons wrap, history controls have usable touch targets, and textbook history shows readable names rather than raw IDs.
- Source citations distinguish PDF page numbers from printed page numbers and retain answer-key references as plain text. No practice PDF image/viewer was reintroduced.
- 10 live Electronics chapter IDs were corrected (five PDF-page-55 questions to chapter 2; five PDF-page-121 questions to chapter 4). The catalog RPC now counts the same published chapters that quizzes select. Question wording, options, answers, source pages, publication status and candidate review data were compared before/after and are unchanged; [repair evidence](docs/independent-chapter-repair.json). The migration is guarded, idempotent and covered by a PostgreSQL regression test.
- Stale browser assertions were updated for the existing user-changed heading/button text and plain-text source citation. Initial failures (stale locators, test cookie handling, and real mobile hit targets) were reproduced, corrected and rerun; no assertions were removed to fabricate a pass.

Live RLS/access checks confirmed the question, quiz, candidate and import tables deny direct anon/authenticated reads; review/start/submit/catalog functions are service-role-only. Admin review remains role-protected and paginated. The content audit performed read-only paginated queries; the only content mutation was the explicitly documented chapter-ID repair. No extraction candidate was automatically approved, no official answer was invented, and no duplicate draft was silently deleted.

## Remaining work and highest priority

Ten PDF records have no parser-identified book-back candidates:
- Advanced Tamil (Tamil), record 12-advanced-tamil-tamil-6679b417
- Agricultural Science (Tamil), record 12-agricultural-science-tamil-1d871464
- Communicative English (English), record 12-communicative-english-english-10e4b8ba
- Computer Applications (Tamil), record 12-computer-applications-tamil-e51fbdf6
- Computer Applications (Tamil), record 12-computer-applications-tamil-f43670d1
- Computer Technology (Tamil), record 12-computer-technology-tamil-c66e9089
- Computer Technology (Tamil), record 12-computer-technology-tamil-cff5867a
- Ethics and Indian Culture (Tamil), record 12-ethics-and-indian-culture-tamil-f49cc8fe
- Physics (Tamil, Vol 1), record 12-physics-tamil-v1-c1623725
- Tamil (Tamil), record 12-tamil-tamil-7db1698f

The one-chapter fallback for Advanced Tamil, Ethics and Indian Culture, and Tamil is not a reliable chapter inventory. Compare original contents/exercise sections before calling any chapters processed. Other zero-candidate chapters and the 733 zero-ready chapter entries are listed individually in the CSV. Tamil text/layout repair, unkeyed Computer Science/Biology and other subjects, mathematical layouts, essential diagrams and four possible duplicate pairs still require source-based extraction or teacher review. PDF/cache processing alone is not exercise completion.

**Single highest-priority next task:** perform source-based transcription and individual teacher verification of the 896 held candidates with known printed keys, retaining their source references and publishing only the entries whose text, four choices and source chapter have been checked. This is the most direct existing queue for improving real coverage; it will not complete all books. Afterward, the remaining unkeyed/missing exercise inventory still needs work.
