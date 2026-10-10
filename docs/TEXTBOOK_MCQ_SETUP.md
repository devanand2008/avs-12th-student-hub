# Textbook questions and student access

Students register with their name, school, register/roll number, mobile number, medium, stream, email and chosen password. With `STUDENT_ACTIVATION_MODE=direct`, registration sends them to the email/password login page. SMS and administrator approval are not required. Administrators may deactivate accounts or reset passwords from the user directory. Existing accounts retain their credentials.

The user directory offers an Excel workbook with two sheets: **Users** contains profile/account/learning fields; **Students** uses the exact roster-import columns. Passwords, hashes, sessions and service keys are excluded. The student import reads Students when present. Importing existing register numbers skips those records.

## Official books and extraction

The SCERT catalog supplies the book records and original PDF URLs. Verify the edition with the student's school: the catalog does not state the academic edition for every PDF. The library includes language, science, commerce, arts and vocational books in the available Tamil/English mediums. Book volumes and catalog versions remain separate records.

Apply all existing migrations, then `supabase/migrations/20261010_textbook_mcq_bank.sql`. Run:

```sh
npm run books:sync
npm run mcqs:prepare
npm run mcqs:import
```

The MCQ importer runs locally against verified PDF checksums and caches extracted text under ignored `.local/textbook-text`. It creates book subjects/chapters, source-page references, review candidates and import coverage in Supabase. Raw PDFs and extraction caches are excluded from deployment. Report: `.local/textbook-mcq-import-report.json`. Repeated imports skip existing published questions and preserve administrator-reviewed candidates.

Printed exercise numbers and choice labels must match a complete, unambiguous printed answer key before automatic publication. Extraction defects, duplicate choices, missing keys and mathematical layout problems are held for review. Extracted candidates are not a complete, independently verified answer bank. Some books lack structured MCQs; the full exercises remain accessible in the reader. No answer is filled in arbitrarily.

## Student and administrator routes

Students open `/textbook-practice`, find their subject, select the book medium and chapter, then start a quiz. Only published questions appear; an honest empty state explains when review is pending. Question references open the exact PDF page. Existing practice modes and server-side scoring continue to apply.

Administrators open `/admin/textbook-questions`, select the book/chapter/status, inspect the exercise and printed answer-key pages, correct text/options and choose the verified answer. Publishing saves both the review record and quiz question together. Review dialogs support keyboard focus and Escape. Admin APIs and tables are inaccessible to student and anonymous sessions.

For additional reviewed questions, use `/admin/questions/import`. Download the CSV template, copy the subject's chapter IDs, and upload CSV or Excel (.xlsx) with the same columns. Required columns: `chapter_id,question,option_a,option_b,correct_answer`. Optional: `option_c,option_d,explanation,source_type,difficulty`. Choices must be distinct and the answer must refer to a present choice. Files are limited to 2 MB and 100 questions per batch. Excel formulas are rejected. Each batch saves atomically; duplicates are skipped based on chapter and question text. Teacher imports count toward textbook practice when mapped to a textbook chapter.

## Verification

Run lint, typecheck, unit tests, build, and the browser suites. The default browser server uses SMS mode to exercise existing OTP behavior. Test the current registration flow separately:

```powershell
$env:AVS_TEST_ACTIVATION_MODE='direct'
npx playwright test tests/e2e/direct-accounts.spec.ts
```

Tests use isolated PostgreSQL fixtures and test-only credentials. They do not alter real student profiles. Teacher review of academic answers, edition confirmation and ongoing content maintenance are separate from software testing.
