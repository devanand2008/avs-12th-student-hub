# Textbook questions and student access

Students register with their name, school, register/roll number, mobile number, medium, stream, email and chosen password. With `STUDENT_ACTIVATION_MODE=direct`, registration sends them to the email/password login page. SMS and administrator approval are not required. Administrators may deactivate accounts or reset passwords from the user directory. Existing accounts retain their credentials.

The user directory offers an Excel workbook with two sheets: **Users** contains profile/account/learning fields; **Students** uses the exact roster-import columns. Passwords, hashes, sessions and service keys are excluded. The student import reads Students when present. Importing existing register numbers skips those records.

## Official books and extraction

The teacher-review milestone uses `supabase/migrations/20261010140320_textbook_teacher_review.sql` after the chapter-consistency migration. The live database has **995 published textbook questions**, **12 held legacy samples**, and **896 prepared candidates** in 110 review batches. Prepared candidates remain `needs_teacher_review`; no human approval was invented. See [batch evidence](TEACHER_REVIEW_BATCHES.md) and the [chapter backlog](TEXTBOOK_COVERAGE_BACKLOG.md).

The SCERT catalog supplies the book records and original PDF URLs. Verify the edition with the student's school: the catalog does not state the academic edition for every PDF. The library includes language, science, commerce, arts and vocational books in the available Tamil/English mediums. Book volumes and catalog versions remain separate records.

Apply all existing migrations, including `supabase/migrations/20261010_textbook_mcq_bank.sql`, then `supabase/migrations/20261010_textbook_mcq_text_only.sql`, then `supabase/migrations/20261010_textbook_chapter_consistency.sql`. The last migration makes catalog counts follow the chapter actually used by quiz selection and corrects ten retained Electronics questions from chapter 9 to their source chapters 2/4. It leaves question wording, options, answers, source pages and review statuses intact. Run:

```sh
npm run books:sync
npm run mcqs:prepare
npm run mcqs:audit
npm run mcqs:import
```

The MCQ importer runs locally against verified PDF checksums and caches extracted text under ignored `.local/textbook-text`. It creates book subjects/chapters, source-page references, review candidates and import coverage in Supabase. Raw PDFs and extraction caches are excluded from deployment. Report: `.local/textbook-mcq-import-report.json`. The maintained per-book extraction audit is `docs/textbook-question-audit.json`. Version 3 retains the printed-key matching and extracts the full question and separate choices as text. Programming line breaks and indentation are preserved. `--resume` only reuses a completed version-3 import report; `--book-id <catalog-id>` refreshes one book while retaining the report for the other books. Repeated imports preserve administrator reviews and withdrawn questions. Automatically published source metadata can refresh only when the verified answer is unchanged.

Printed exercise numbers and choice labels are checked against printed keys for extraction eligibility. **New imports stay in teacher review even when the key matches.** Existing published records can refresh while retaining their status and verified answer. Reimports preserve prepared evidence, rejected records and human edits. Missing/conflicting keys, unreadable Tamil glyphs, ambiguous formulas, essential figures and incomplete options require source comparison or transcription. A proposed printed answer is retained without teacher approval. Student practice displays text only, with separate options and genuine source references. No missing answer or option is invented.

Suspected printed-key errors can be held using `scripts/lib/textbook-review-holds.json`. Holds match a source checksum, PDF page and question number, so another edition is unaffected. The importer withholds automatic publication; a teacher must verify the answer using the review panel. A newly discovered error in an already published question must also be withdrawn from the live question bank through administrator review.

## Student and administrator routes

Students open `/textbook-practice`, find their subject, select the book medium and chapter, then start a quiz. They can select up to 100 questions or all available questions (up to 500 per attempt). Each chapter links to its original exercises, including chapters awaiting review. Only published, readable text questions enter scored quizzes. The full stem and each A/B/C/D option appear separately, preserving multiline programming examples. Practice offers an optional printed answer-key link after answering; timed exams keep answers hidden until submission. Results link to source references without embedding PDF pages. **Practice Again** starts a new session with the same subject, chapter and count. Saved text sessions resume normally; an unfinished legacy image attempt asks the student to start a new text attempt. Existing snapshots, completed scores and activity are preserved.

Administrators open `/admin/textbook-questions`, select the book/chapter/review batch/status, and compare the preserved original extraction with the source PDF and printed-key evidence. The dialog displays medium, volume, chapter, PDF/printed page, proposed answer, OCR and duplicate warnings and review history. **Save edits for review** never publishes; editing a published question withdraws it until reapproval. **Reject question** requires a reason. **Publish reviewed MCQ** requires a human confirmation checkbox, readable text, distinct options and a valid answer. Approval/edit/rejection are transactional and preserve reviewer identity, timestamps, before/after records and original evidence. Stale edits are rejected. Keyboard focus, Escape and mobile review are supported. APIs and tables remain inaccessible to students and anonymous sessions.

Prepare source packets with `npm run mcqs:review-prepare` (dry run). `npm run mcqs:review-prepare -- --apply` writes only evidence and pending-review metadata in chapter batches of at most 20; it never publishes. `npm run mcqs:coverage -- --live` refreshes actual published counts, then `npm run mcqs:backlog` creates the prioritized chapter backlog. The preparation script checks fresh PDF text and source hashes, without claiming visual or academic verification. Ambiguous chapter/exercise key mappings remain flagged. Printed-page detection is conservative and needs teacher confirmation.

For Tamil-medium verification, select **Textbook medium → Tamil medium** on `/admin/textbook-questions`, then a textbook/chapter/batch. This selector uses `public.textbooks.source_medium`. The **Export selected prepared queue (CSV)** and **Export all Tamil prepared batches (CSV)** actions export all matching prepared records, including reviewed records, with IDs, source hashes/pages, original text, warnings and history. Exports are UTF-8 with BOM for Tamil in Excel and protect against spreadsheet formulas. They are reference files; they cannot import decisions or change review states. Record decisions individually under your own authorised admin account. There is currently no separate teacher role. Run `npm run mcqs:tamil-review` for a read-only live report covering all Tamil metadata records, prepared batches and unprepared queue counts; see [the review guide](TAMIL_TEACHER_REVIEW.md).

For additional reviewed questions, use `/admin/questions/import`. Download the CSV template, copy the subject's chapter IDs, and upload CSV or Excel (.xlsx) with the same columns. Required columns: `chapter_id,question,option_a,option_b,correct_answer`. Optional: `option_c,option_d,explanation,source_type,difficulty`. Choices must be distinct and the answer must refer to a present choice. Files are limited to 2 MB and 100 questions per batch. Excel formulas are rejected. Each batch saves atomically; duplicates are skipped based on chapter and question text. Teacher imports count toward textbook practice when mapped to a textbook chapter. This existing content importer is not a review-decision importer and does not accept the teacher-reference export format.

## Verification

Run lint, typecheck, unit tests, build, and the browser suites. The default browser server uses SMS mode to exercise existing OTP behavior. Test the current registration flow separately:

```powershell
$env:AVS_TEST_ACTIVATION_MODE='direct'
npx playwright test tests/e2e/direct-accounts.spec.ts
```

Tests use isolated PostgreSQL fixtures and test-only credentials. They do not alter real student profiles. Teacher review of academic answers, edition confirmation and ongoing content maintenance are separate from software testing.

## Generated questions

Generated question files are unverified review drafts. Estimated page numbers and model-written explanations do not establish an answer source. The review gate strips those citation claims and prevents drafts from entering student quizzes or published counts. Use the admin review/import flow to check and correct their text and answers before publication. `scripts/publish-textbook-candidates.ts` intentionally rejects bulk publication from generated answers; `npm run mcqs:import` imports printed-key evidence while keeping new candidates held for individual teacher approval.
