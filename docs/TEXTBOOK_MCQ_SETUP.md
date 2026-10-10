# Textbook questions and student access

Students register with their name, school, register/roll number, mobile number, medium, stream, email and chosen password. With `STUDENT_ACTIVATION_MODE=direct`, registration sends them to the email/password login page. SMS and administrator approval are not required. Administrators may deactivate accounts or reset passwords from the user directory. Existing accounts retain their credentials.

The user directory offers an Excel workbook with two sheets: **Users** contains profile/account/learning fields; **Students** uses the exact roster-import columns. Passwords, hashes, sessions and service keys are excluded. The student import reads Students when present. Importing existing register numbers skips those records.

## Official books and extraction

The SCERT catalog supplies the book records and original PDF URLs. Verify the edition with the student's school: the catalog does not state the academic edition for every PDF. The library includes language, science, commerce, arts and vocational books in the available Tamil/English mediums. Book volumes and catalog versions remain separate records.

Apply all existing migrations, then `supabase/migrations/20261010_textbook_mcq_bank.sql`. Run:

```sh
npm run books:sync
npm run mcqs:prepare
npm run mcqs:audit
npm run mcqs:import
```

The MCQ importer runs locally against verified PDF checksums and caches extracted text under ignored `.local/textbook-text`. It creates book subjects/chapters, source-page references, review candidates and import coverage in Supabase. Raw PDFs and extraction caches are excluded from deployment. Report: `.local/textbook-mcq-import-report.json`. The maintained per-book extraction audit is `docs/textbook-question-audit.json`. Version 2 recognizes inline, tabular, numeric, explained, Tamil and book-end exercise/unit answer keys, and maps them to their source chapters. `--resume` only reuses a completed version-2 import report. Repeated imports preserve administrator reviews and withdrawn questions. Source metadata can refresh previously imported questions only when their verified answer is unchanged.

Printed exercise numbers and choice labels must match an unambiguous printed answer key before automatic publication. Missing and conflicting keys are held for review. When a verified question's letters or formulas cannot be extracted accurately, the quiz displays its original PDF page with choices corresponding to the four printed options. Original pages are also used for Tamil and mathematical/science notation. Answer-key references identify the actual printed key page for each question. Extracted candidates are not a complete, independently verified answer bank. Some books lack structured MCQs; the full exercises remain accessible in the reader. No answer is filled in arbitrarily.

Suspected printed-key errors can be held using `scripts/lib/textbook-review-holds.json`. Holds match a source checksum, PDF page and question number, so another edition is unaffected. The importer withholds automatic publication; a teacher must verify the answer using the review panel. A newly discovered error in an already published question must also be withdrawn from the live question bank through administrator review.

## Student and administrator routes

Students open `/textbook-practice`, find their subject, select the book medium and chapter, then start a quiz. They can select up to 100 questions or all available questions (up to 500 per attempt). Each chapter offers its original exercises, including chapters whose answers are pending review. Only published questions enter scored quizzes. PDF questions include page navigation and continuation notices. Practice reveals the printed answer-key link after answering; timed exams keep answers hidden until submission. Results link to the original question and key. **Practice Again** starts a new session with the same subject, chapter and count, so students can repeat practice at any time. Existing save/resume and server-side scoring continue to apply.

Administrators open `/admin/textbook-questions`, select the book/chapter/status, inspect the exercise and printed answer-key pages, correct text/options and choose the verified answer. Publishing saves both the review record and quiz question together. Review dialogs support keyboard focus and Escape. Admin APIs and tables are inaccessible to student and anonymous sessions.

For additional reviewed questions, use `/admin/questions/import`. Download the CSV template, copy the subject's chapter IDs, and upload CSV or Excel (.xlsx) with the same columns. Required columns: `chapter_id,question,option_a,option_b,correct_answer`. Optional: `option_c,option_d,explanation,source_type,difficulty`. Choices must be distinct and the answer must refer to a present choice. Files are limited to 2 MB and 100 questions per batch. Excel formulas are rejected. Each batch saves atomically; duplicates are skipped based on chapter and question text. Teacher imports count toward textbook practice when mapped to a textbook chapter.

## Verification

Run lint, typecheck, unit tests, build, and the browser suites. The default browser server uses SMS mode to exercise existing OTP behavior. Test the current registration flow separately:

```powershell
$env:AVS_TEST_ACTIVATION_MODE='direct'
npx playwright test tests/e2e/direct-accounts.spec.ts
```

Tests use isolated PostgreSQL fixtures and test-only credentials. They do not alter real student profiles. Teacher review of academic answers, edition confirmation and ongoing content maintenance are separate from software testing.
