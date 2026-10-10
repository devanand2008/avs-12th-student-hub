# Independent textbook extraction audit

Replaces the previous unverified completion narrative. Current coverage measured 2026-10-10T15:04:31.814Z; live content read 2026-10-10T15:04:02.380Z. See [project status](../PROJECT_STATUS.md) for test results, repairs and deployment limits.

## Method and evidence

Inspected the initial worktree and preserved user changes, then inspected the catalogs, raw generated banks, original sample bank, review gate, PDF/text parser, printed-key matcher, import scripts, HTML practice pages, scoring/session routes, local history and admin review. Opened and SHA-256 hashed every physical PDF, checked cache IDs/hashes/page sequences/counts, reran the actual parser and existing audit, and fully paginated the live question/candidate/import/curriculum tables. Did not treat a first 1,000-row response or a completion report as the full dataset. Fresh PDF extraction matched 713 sampled original page texts; the method and exact pages are recorded in [PDF evidence](independent-pdf-text-check.json). This is not a visual proof of every equation, glyph or answer.

## Count reconciliation

- 82 physical PDF records; 82 unique hashes; 24088 pages; no failed/unprocessed files or cache provenance mismatches.
- 12229 extraction candidate IDs; 6311 classified Book-back, 5918 in-text/uncertain. Candidate IDs are not synonymous with unique official MCQs.
- 985 auto-eligible printed-key questions and 11244 parser review entries. Live candidate statuses reproduce these numbers.
- **995 student-ready live questions**, all existing printed-key textbook entries. The 12 previously published, unverified legacy samples were withdrawn into Teacher Review; all 14 raw original sample rows are held by the seed/export gate. The textbook total includes 985 auto-eligible entries and ten retained Electronics questions classified In-text/Needs Review by the current parser. Their source exercises and retained printed-key answers were checked separately. Classification and publication counts overlap; existing publication does not prove human approval of every textbook question.
- 11234 candidate IDs are excluded from practice, rather than 11244. **896** have source-review packets in Supabase, leaving **10338** without prepared packets. Rejected candidates: **0**. The 896 are a subset of the pending queue, not additional unique questions.
- The held 896 candidates were rechecked against 273 freshly extracted original PDF pages across 23 books and 101 detected chapters. Source text/options matched all 896. Conservative page-wide key parsing matched 411 proposed answers; 485 remain ambiguous due to key scope or unreadable layout; none disagreed. Four potential duplicate/overlap records are flagged. Printed page labels were conservatively detected for 710, with 186 unknown. No translation, missing option, answer or approval was invented.
- All 896 remain `needs_teacher_review` in 110 batches (386 Tamil / 510 English). [Review evidence](teacher-review-batches.json), [batch table](TEACHER_REVIEW_BATCHES.md), and [database before/after verification](teacher-review-database-proof.json) distinguish automated checks from human approval. **Zero new human approvals.** All 13 existing practice sessions and snapshots, the 995 published textbook rows, and original candidate extraction fields are unchanged.
- 625 generated raw IDs: 155 Computer Science, 100 Bio-Botany, 120 Bio-Zoology, 250 Mathematics. Twelve IDs overlap the sample bank; 613 legacy generated drafts remain Teacher Review. The gated exported generated bank and live generated drafts contribute zero additional published questions.
- Zero duplicate candidate IDs and zero duplicate published content within a chapter. Four duplicate-content candidate pairs (four extra normalized-content rows) are held for review: two Mechanical Engineering Tamil chapter 2 pairs, one Computer Applications Tamil chapter 6 pair, one English chapter 6 pair. These may include actual repeated printed items; do not delete without source comparison. Full IDs/pages/statuses are in the coverage JSON.
- All ready options and answer letters pass structural checks. Automatically published text/options and parser printed-key answers match the live questions. These structural checks do not establish academic completeness or teacher approval.

## Coverage and gaps

Only 16 English-medium PDF records have published textbook questions. All 42 Tamil-medium records and 66 records overall have zero ready textbook entries. 856 chapter/unit entries are parser detections; 733 have no published questions, and 309 have no identified book-back candidates. 72 books yielded book-back candidates; ten yielded none. No book is marked complete. Generic Computer Science/Biology sample questions are not evidence that their corresponding textbooks were extracted and published.

- [Full textbook/volume table](INDEPENDENT_COVERAGE.md): all 82 records, detected chapters, publication, known-key held counts, missing exercise/ready chapters and processing flags.
- [Full chapter table](independent-chapter-coverage.csv): all 856 detected entries, including chapter titles/IDs, source start and exercise pages, candidate counts, published book-back/other counts, known-key held counts and gap statuses.
- [Machine-readable evidence](independent-textbook-coverage.json): exact PDF hashes and page lists, per-chapter results, duplicate groups, live count comparisons and answer/text/reference mismatch checks.
- [Prioritized chapter backlog](TEXTBOOK_COVERAGE_BACKLOG.md) and [CSV](textbook-coverage-backlog.csv): all 856 detected entries with distinct, overlapping extraction, answer verification, teacher review, partial publication and manual/OCR states. Zero-ready books and Tamil-medium gaps are prioritized.

All saved pages exist, but 1821 question-bearing pages have parser text/layout/figure flags. Zero sparse-text pages under the chosen threshold does not mean all content is readable. Tamil legacy-font fragmentation, column order and mathematical layouts still need source review/OCR/transcription. Some books do not supply printed keys, and some may not contain conventional four-choice one-mark sections. The parser fallback chapter is particularly unreliable for the language/culture books; a contents-page and exercise inventory is required before completeness can be measured.

Printed chapter headers/footers corroborate the stored chapter for 467 published textbook questions; the simple check cannot corroborate the remaining 528. No printed-header contradiction remains. Chapter tables count actual database assignments; they are not a teacher-confirmed chapter-boundary inventory. The unresolved mappings require contents/exercise source review.

## Confirmed inconsistency and targeted repair

The catalog initially advertised Electronics chapter totals 2:8, 4:19, 9:3 while actual question selection used 2:3, 4:14, 9:13. Ten retained page-55/page-121 entries were incorrectly assigned to chapter 9. Fresh source pages confirmed chapters 2 and 4; their printed keys are on PDF pages 56 and 122. The guarded migration corrects only those chapter IDs and fixes catalog counting to follow published question chapters. Statuses, source pages, wording, options, answers and candidate reviews remain unchanged. No pending entry was approved. Final live catalog-to-question mismatches: 0. See [repair evidence](independent-chapter-repair.json).

## Reproduce

Run npm test, npm run typecheck, npm run lint, npm run build and npm run mcqs:audit. There is no npm run mcqs script; the requested command failed with Missing script. The existing audit writes only docs/textbook-question-audit.json, not this narrative.

Run npm run mcqs:coverage -- --live for the read-only live coverage measurement. It requires private server environment settings and saves its full database snapshot only in ignored .local. Running without --live explicitly leaves publication unchecked. Run npm run mcqs:source-audit for fresh sampled original-PDF text comparison. Both commands produce actual measured output; no successful counts are substituted.

Playwright uses a production build and isolated PostgreSQL/Supabase SDK fixture. Default, direct-account and admin-approval suites run separately. Set AVS_TEST_ACTIVATION_MODE=direct and AVS_TEST_REAL_BOOKS=true to run tests/e2e/independent-practice.spec.ts; it needs the private live content snapshot produced by coverage and uses real extracted Accountancy/Commerce/Chemistry questions locally. All fixture mutations stay local. Two local-Gemma inference opt-ins remain unrun.

Run `npm run mcqs:review-prepare` to collect source packets without writing to the database, or append `-- --apply` to save evidence and pending-review metadata. Rerunning the preparation left all 896 existing packets and stable batch IDs unchanged (0 updated, 896 skipped). It never approves questions. Then run `npm run mcqs:backlog` after a fresh live coverage audit.

**Next priority:** individually compare and transcribe the first zero-ready Tamil review batch against the original PDF and chapter/exercise-specific printed key, then explicitly approve or reject each item. The remaining 485 ambiguous key mappings, damaged text, essential diagrams and possible duplicates still require teacher assessment. Continue the unkeyed/missing exercise inventory afterward.
