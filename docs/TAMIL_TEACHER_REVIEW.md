# Tamil-medium teacher verification queue

Read-only live database audit: 2026-10-10T16:13:50.936Z. Medium is joined from **public.textbooks.source_medium**, not inferred from filenames. Catalog/packet inconsistencies: 0/0.

**386 prepared questions / 43 batches / 42 detected chapters / 9 textbooks.** Pending 386; reviewed 0; approved 0; rejected 0. Page-wide key matches 212; ambiguous 174. No automated match constitutes teacher approval.

All 42 Tamil PDF records have 6206 extraction candidates; 5820 unpublished, non-rejected candidates have no prepared packet. Tamil student-ready count 0. All textbooks combined: 995 existing published questions. Legacy samples held 12; published legacy samples 0.

Reviewed counts mean candidate IDs with at least one authenticated edit/approve/reject event; approved/rejected are current states. A saved draft can therefore be both reviewed and pending. Counts are not summed as unique questions. Only explicit individual approval publishes a prepared question. Existing English printed-key publications predate this teacher-review milestone.

## How to record a teacher decision

Run `npm run dev`, sign in with an authorised admin email/password, and open `/admin/textbook-questions`. Select **Textbook medium → Tamil medium**, then the textbook, chapter and **Teacher review batch**. Keep **Question status → Needs review** to see held questions. Click **Review MCQ** for one row.

Read the original question/options, PDF source link, PDF and printed-page labels, printed-key link/text and each warning. Page-wide key matches need chapter/exercise confirmation too. Edit only against the original source. Choose the verified answer. Enter a review note identifying the evidence and how any ambiguity was resolved. **Save edits for review** keeps the question held. **Reject question** requires a reason and records rejection. To approve, tick the source/options/answer confirmation and click **Publish reviewed MCQ**. This uses your authenticated admin identity, saves before/after history and makes only that question available. Reload to confirm; use Published/Rejected filters and Review history to inspect the saved decision. Stale simultaneous changes require reopening the row.

Teachers currently require an authorised admin account; the app has no separate teacher role. Each reviewer should use their own authorised account for attribution. Do not share credentials in a CSV or report. CSV exports are reference-only; there is no decision importer. A teacher's spreadsheet entry does not change database state.

The updated filter/export UI is local and **has not been deployed to production**. Admin evidence may open the PDF; student practice displays text MCQs only.

## All Tamil textbooks

Coverage chapter detection is from the independent parser snapshot dated 2026-10-10T15:56:38.123Z; it is not a teacher-approved contents inventory. Prepared queue and publication counts were reread live above.

| Textbook | Volume | PDF ID | Batches | Prepared | Pending | Reviewed | Approved | Rejected | Key matches / ambiguous | Unprepared pending | No detected book-back chapters |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---:|---|
| Accountancy | — | 12-accountancy-tamil-6e7f5476 | 6 | 58 | 58 | 0 | 0 | 0 | 28 / 30 | 103 | 3, 7 |
| Advanced Tamil | — | 12-advanced-tamil-tamil-6679b417 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 98 | 1 |
| Agricultural Science | — | 12-agricultural-science-tamil-1d871464 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 147 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 |
| Auditing | — | 12-auditing-tamil-e1982513 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 140 | 1, 3, 6, 7, 9, 10 |
| Basic Automobile Engineering | — | 12-basic-automobile-engineering-tamil-e76f29d2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 102 | 1, 3, 4, 5, 7, 8, 9 |
| Basic Civil Engineering | — | 12-basic-civil-engineering-tamil-122addb5 | 1 | 6 | 6 | 0 | 0 | 0 | 6 / 0 | 88 | 1, 2, 3, 4, 5, 6 |
| Basic Electrical Engineering | — | 12-basic-electrical-engineering-tamil-029f513a | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 170 | 1, 2, 3, 4, 5, 6, 8 |
| Basic Electronics Engineering | — | 12-basic-electronics-engineering-tamil-96fcb4f2 | 3 | 39 | 39 | 0 | 0 | 0 | 39 / 0 | 112 | 1, 2, 3, 5, 8, 9 |
| Basic Mechanical Engineering | — | 12-basic-mechanical-engineering-tamil-49be34e2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 100 | 2, 3, 4, 5, 6, 7, 8, 9, 10 |
| Bio-Botany | — | 12-bio-botany-tamil-51160855 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 308 | 1, 3, 4, 6, 7, 8, 10 |
| Bio-Zoology | — | 12-bio-zoology-tamil-2631f8e3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 238 | 1, 2, 5, 8, 12 |
| Biochemistry | — | 12-biochemistry-tamil-910cca11 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 150 | 1, 2, 6, 7, 8, 9 |
| Botany | — | 12-botany-tamil-37a9b740 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 340 | 1, 3, 6, 7, 8, 9, 10 |
| Business Mathematics & Statistics | — | 12-business-mathematics-statistics-tamil-a77e8ce0 | 1 | 12 | 12 | 0 | 0 | 0 | 12 / 0 | 230 | 1, 2, 3, 4, 7, 8, 9 |
| Chemistry | 1 | 12-chemistry-tamil-v1-5fcd65a9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 156 | 2, 3, 4, 5, 6 |
| Chemistry | 2 | 12-chemistry-tamil-v2-52192807 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 178 | 10, 11, 12, 13 |
| Commerce | — | 12-commerce-tamil-d9e013d8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 133 | 1, 2, 4, 8, 9, 10, 11, 12, 13, 15, 20, 21, 22, 23, 24, 26, 27, 28 |
| Computer Applications | — | 12-computer-applications-tamil-e51fbdf6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 182 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| Computer Applications | — | 12-computer-applications-tamil-f43670d1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 183 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| Computer Science | — | 12-computer-science-tamil-d5aa7dd4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 152 | 3, 4, 5, 7, 8, 11, 12, 14, 16 |
| Computer Technology | — | 12-computer-technology-tamil-c66e9089 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 72 | 1, 2, 3, 4, 5, 6 |
| Computer Technology | — | 12-computer-technology-tamil-cff5867a | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 72 | 1, 2, 3, 4, 5, 6 |
| Economics | — | 12-economics-tamil-c7590e3f | 1 | 20 | 20 | 0 | 0 | 0 | 20 / 0 | 228 | 1, 2, 3, 4, 5, 7, 8, 10, 12 |
| Ethics and Indian Culture | — | 12-ethics-and-indian-culture-tamil-f49cc8fe | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 92 | 1 |
| Food Service Management | — | 12-food-service-management-tamil-e2061fb1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 148 | 1, 3, 4, 6, 8 |
| General Nursing | — | 12-general-nursing-tamil-b39f5ab1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 179 | 4, 5, 6, 7, 8, 10, 11 |
| Geography | — | 12-geography-tamil-ba849e46 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 82 | 2, 3, 4, 8, 9, 10, 11, 12, 13 |
| History | — | 12-history-tamil-3c88c869 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 205 | 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15 |
| Home Science | — | 12-home-science-tamil-0cbbe34e | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 88 | 1, 2, 3, 4, 5, 6, 8 |
| Mathematics | 1 | 12-mathematics-tamil-v1-96fc1e8d | 3 | 35 | 35 | 0 | 0 | 0 | 25 / 10 | 90 | 2, 4, 5, 6 |
| Mathematics | 2 | 12-mathematics-tamil-v2-f8732624 | 4 | 74 | 74 | 0 | 0 | 0 | 20 / 54 | 43 | 10, 12 |
| Microbiology | — | 12-microbiology-tamil-a879259a | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 124 | 1, 2, 4, 5, 6, 8, 9 |
| Nursing Vocational | — | 12-nursing-vocational-tamil-7f44a760 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 121 | 1, 3, 5, 6, 7, 8 |
| Office Management, Secretaryship & Typography | — | 12-office-management-secretaryship-typography-tamil-241b6edf | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 102 | 1, 2, 3, 4, 5, 7, 8, 9, 10 |
| Physics | 1 | 12-physics-tamil-v1-c1623725 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 76 | 1, 2, 3, 4, 5, 7, 10 |
| Physics | 2 | 12-physics-tamil-v2-fb1fa4de | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 86 | 7, 8, 10, 11 |
| Political Science | — | 12-political-science-tamil-5da94964 | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 149 | 1, 3, 4, 6, 8, 10, 11 |
| Statistics | — | 12-statistics-tamil-c1143d1d | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 159 | 1, 3, 4, 6, 7, 8, 9 |
| Tamil | — | 12-tamil-tamil-7db1698f | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 67 | 1 |
| Textile Technology | — | 12-textile-technology-tamil-648797c8 | 12 | 71 | 71 | 0 | 0 | 0 | 31 / 40 | 33 | 1, 6, 8 |
| Textiles and Dress Designing | — | 12-textiles-and-dress-designing-tamil-3650ec00 | 12 | 71 | 71 | 0 | 0 | 0 | 31 / 40 | 33 | 1, 6, 8 |
| Zoology | — | 12-zoology-tamil-3c154dab | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 261 | 1, 2, 5, 8, 9, 13 |

## Chapter and batch register

| Textbook / volume | Chapter | Batch ID | Pending | Reviewed | Approved | Rejected | Key matches | Ambiguous | Pending with unresolved flags |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Accountancy  | Chapter 1 (1) | tb-12-accountancy-tamil-6e7f5476-ch-1-review-01 | 10 | 0 | 0 | 0 | 0 | 10 | 10 |
| Accountancy  | Chapter 10 (10) | tb-12-accountancy-tamil-6e7f5476-ch-10-review-01 | 10 | 0 | 0 | 0 | 0 | 10 | 10 |
| Accountancy  | Chapter 2 (2) | tb-12-accountancy-tamil-6e7f5476-ch-2-review-01 | 10 | 0 | 0 | 0 | 10 | 0 | 10 |
| Accountancy  | Chapter 4 (4) | tb-12-accountancy-tamil-6e7f5476-ch-4-review-01 | 8 | 0 | 0 | 0 | 8 | 0 | 8 |
| Accountancy  | Chapter 5 (5) | tb-12-accountancy-tamil-6e7f5476-ch-5-review-01 | 10 | 0 | 0 | 0 | 0 | 10 | 10 |
| Accountancy  | Chapter 8 (8) | tb-12-accountancy-tamil-6e7f5476-ch-8-review-01 | 10 | 0 | 0 | 0 | 10 | 0 | 10 |
| Basic Civil Engineering  | Chapter 7 (7) | tb-12-basic-civil-engineering-tamil-122addb5-ch-7-review-01 | 6 | 0 | 0 | 0 | 6 | 0 | 6 |
| Basic Electronics Engineering  | Chapter 10 (10) | tb-12-basic-electronics-engineering-tamil-96fcb4f2-ch-10-review-01 | 4 | 0 | 0 | 0 | 4 | 0 | 4 |
| Basic Electronics Engineering  | Chapter 6 (6) | tb-12-basic-electronics-engineering-tamil-96fcb4f2-ch-6-review-01 | 20 | 0 | 0 | 0 | 20 | 0 | 20 |
| Basic Electronics Engineering  | Chapter 7 (7) | tb-12-basic-electronics-engineering-tamil-96fcb4f2-ch-7-review-01 | 15 | 0 | 0 | 0 | 15 | 0 | 15 |
| Business Mathematics & Statistics  | XII Std - Business Maths & Stat TM Chapter 5 (5) | tb-12-business-mathematics-statistics-tamil-a77e8ce0-ch-5-review-01 | 12 | 0 | 0 | 0 | 12 | 0 | 12 |
| Economics  | Chapter 11 (11) | tb-12-economics-tamil-c7590e3f-ch-11-review-01 | 20 | 0 | 0 | 0 | 20 | 0 | 20 |
| Mathematics 1 | Chapter 1 Matrices (1) | tb-12-mathematics-tamil-v1-96fc1e8d-ch-1-review-01 | 20 | 0 | 0 | 0 | 20 | 0 | 20 |
| Mathematics 1 | Chapter 1 Matrices (1) | tb-12-mathematics-tamil-v1-96fc1e8d-ch-1-review-02 | 5 | 0 | 0 | 0 | 5 | 0 | 5 |
| Mathematics 1 | Chapter 3 Theory of Equation (3) | tb-12-mathematics-tamil-v1-96fc1e8d-ch-3-review-01 | 10 | 0 | 0 | 0 | 0 | 10 | 10 |
| Mathematics 2 | Chapter 11 Probability (11) | tb-12-mathematics-tamil-v2-f8732624-ch-11-review-01 | 20 | 0 | 0 | 0 | 0 | 20 | 20 |
| Mathematics 2 | Chapter 7 Applications of Diff Calculus1 (7) | tb-12-mathematics-tamil-v2-f8732624-ch-7-review-01 | 20 | 0 | 0 | 0 | 20 | 0 | 20 |
| Mathematics 2 | Chapter 8 Differentials and Partial Derivatives (8) | tb-12-mathematics-tamil-v2-f8732624-ch-8-review-01 | 15 | 0 | 0 | 0 | 0 | 15 | 15 |
| Mathematics 2 | Chapter 9 Applications of Integration (9) | tb-12-mathematics-tamil-v2-f8732624-ch-9-review-01 | 19 | 0 | 0 | 0 | 0 | 19 | 19 |
| Textile Technology  | Chapter 10 (10) | tb-12-textile-technology-tamil-648797c8-ch-10-review-01 | 4 | 0 | 0 | 0 | 0 | 4 | 4 |
| Textile Technology  | Chapter 11 (11) | tb-12-textile-technology-tamil-648797c8-ch-11-review-01 | 4 | 0 | 0 | 0 | 0 | 4 | 4 |
| Textile Technology  | Chapter 12 (12) | tb-12-textile-technology-tamil-648797c8-ch-12-review-01 | 5 | 0 | 0 | 0 | 5 | 0 | 5 |
| Textile Technology  | Chapter 13 (13) | tb-12-textile-technology-tamil-648797c8-ch-13-review-01 | 5 | 0 | 0 | 0 | 0 | 5 | 5 |
| Textile Technology  | Chapter 14 (14) | tb-12-textile-technology-tamil-648797c8-ch-14-review-01 | 5 | 0 | 0 | 0 | 5 | 0 | 5 |
| Textile Technology  | Chapter 15 (15) | tb-12-textile-technology-tamil-648797c8-ch-15-review-01 | 17 | 0 | 0 | 0 | 11 | 6 | 17 |
| Textile Technology  | Chapter 2 (2) | tb-12-textile-technology-tamil-648797c8-ch-2-review-01 | 5 | 0 | 0 | 0 | 0 | 5 | 5 |
| Textile Technology  | Chapter 3 (3) | tb-12-textile-technology-tamil-648797c8-ch-3-review-01 | 5 | 0 | 0 | 0 | 5 | 0 | 5 |
| Textile Technology  | Chapter 4 (4) | tb-12-textile-technology-tamil-648797c8-ch-4-review-01 | 5 | 0 | 0 | 0 | 5 | 0 | 5 |
| Textile Technology  | Chapter 5 (5) | tb-12-textile-technology-tamil-648797c8-ch-5-review-01 | 6 | 0 | 0 | 0 | 0 | 6 | 6 |
| Textile Technology  | Chapter 7 (7) | tb-12-textile-technology-tamil-648797c8-ch-7-review-01 | 5 | 0 | 0 | 0 | 0 | 5 | 5 |
| Textile Technology  | Chapter 9 (9) | tb-12-textile-technology-tamil-648797c8-ch-9-review-01 | 5 | 0 | 0 | 0 | 0 | 5 | 5 |
| Textiles and Dress Designing  | Chapter 10 (10) | tb-12-textiles-and-dress-designing-tamil-3650ec00-ch-10-review-01 | 4 | 0 | 0 | 0 | 0 | 4 | 4 |
| Textiles and Dress Designing  | Chapter 11 (11) | tb-12-textiles-and-dress-designing-tamil-3650ec00-ch-11-review-01 | 4 | 0 | 0 | 0 | 0 | 4 | 4 |
| Textiles and Dress Designing  | Chapter 12 (12) | tb-12-textiles-and-dress-designing-tamil-3650ec00-ch-12-review-01 | 5 | 0 | 0 | 0 | 5 | 0 | 5 |
| Textiles and Dress Designing  | Chapter 13 (13) | tb-12-textiles-and-dress-designing-tamil-3650ec00-ch-13-review-01 | 5 | 0 | 0 | 0 | 0 | 5 | 5 |
| Textiles and Dress Designing  | Chapter 14 (14) | tb-12-textiles-and-dress-designing-tamil-3650ec00-ch-14-review-01 | 5 | 0 | 0 | 0 | 5 | 0 | 5 |
| Textiles and Dress Designing  | Chapter 15 (15) | tb-12-textiles-and-dress-designing-tamil-3650ec00-ch-15-review-01 | 17 | 0 | 0 | 0 | 11 | 6 | 17 |
| Textiles and Dress Designing  | Chapter 2 (2) | tb-12-textiles-and-dress-designing-tamil-3650ec00-ch-2-review-01 | 5 | 0 | 0 | 0 | 0 | 5 | 5 |
| Textiles and Dress Designing  | Chapter 3 (3) | tb-12-textiles-and-dress-designing-tamil-3650ec00-ch-3-review-01 | 5 | 0 | 0 | 0 | 5 | 0 | 5 |
| Textiles and Dress Designing  | Chapter 4 (4) | tb-12-textiles-and-dress-designing-tamil-3650ec00-ch-4-review-01 | 5 | 0 | 0 | 0 | 5 | 0 | 5 |
| Textiles and Dress Designing  | Chapter 5 (5) | tb-12-textiles-and-dress-designing-tamil-3650ec00-ch-5-review-01 | 6 | 0 | 0 | 0 | 0 | 6 | 6 |
| Textiles and Dress Designing  | Chapter 7 (7) | tb-12-textiles-and-dress-designing-tamil-3650ec00-ch-7-review-01 | 5 | 0 | 0 | 0 | 0 | 5 | 5 |
| Textiles and Dress Designing  | Chapter 9 (9) | tb-12-textiles-and-dress-designing-tamil-3650ec00-ch-9-review-01 | 5 | 0 | 0 | 0 | 0 | 5 | 5 |

## Accountancy Chapter 1 follow-up

Actual live outcome: pending 10; reviewed 0; approved 0; rejected 0; published 0; decision audit rows 0. Reviewed means a candidate has a recorded teacher-action history, not a source-key match.

[The independent per-candidate source/decision audit](TAMIL_ACCOUNTANCY_FOLLOWUP.md) checks original PDF pages 9, 38 and 39, chapter mapping, preserved wording/options, scoped printed-key evidence and matching persisted audit events. It has its own explicit read timestamp; rerun `npm run mcqs:accountancy-followup` after teachers act. A printed-key correspondence never changes the held status automatically.

[Next Tamil extraction inventory](TAMIL_NEXT_EXTRACTION.md) and [its chapter CSV](tamil-next-extraction-inventory.csv) locate missing book-back sections in Physics Volume 1 and the two Computer Applications / two Computer Technology PDF records. Its 53 academic chapter records exclude practical/front/back matter; the existing parser's Physics chapters 7 and 10 are practicals and acknowledgement bookmarks, not academic units. No live mapping was changed by the inventory.

## Evidence and unresolved work

Missing source/key packets: 0; unmatched recorded decision audits: 0; prepared questions published without recorded approval: 0; published legacy samples: 0.

Every candidate's ambiguity/quality reason, immutable ID, source hash and page references are in [the JSON report](tamil-teacher-review.json) and [the teacher queue CSV](tamil-teacher-review-queue.csv). Group counts and IDs are in [the batch CSV](tamil-teacher-review-batches.csv). The UI exports the selected prepared chapter/batch or all Tamil prepared batches, including previously reviewed records; it does not export only the visible 25-row page.

**Highest-priority next task:** an authorised Accountancy teacher should verify Chapter 1 batch `tb-12-accountancy-tamil-6e7f5476-ch-1-review-01` (10 held questions), including chapter-specific printed-key scope and OCR/options, and record each decision individually. Continue the remaining prepared batches; no question was approved by this audit.

Next extraction priorities are Tamil Physics Vol 1 and the Tamil Computer Applications / Computer Technology PDF records that have no detected book-back sections. Locate exercises and verify the chapter inventory before transcription; the absence of parser candidates is not proof that a book has no MCQs. Tamil mathematics also needs source-confirmed notation before the prepared volume 1/2 candidates can be published. The table above gives exact detected missing chapter numbers; [the full chapter backlog](textbook-coverage-backlog.csv) contains all 856 detected entries, including 733 without published questions. None is claimed complete.

Verification results and limits are recorded in PROJECT_STATUS.md. This script executes SELECT requests only; it creates local reports and never approves, rejects, deletes or imports a candidate.
