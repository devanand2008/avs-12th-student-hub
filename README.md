<!-- BEGIN allsubject-20261018 -->
## Latest all-subject checkpoint — October 18, 2026

**110 held book-back MCQs across ten chapters / four PDFs / three subjects:** English History 1–3 (30), Tamil History 1–2 (21), English Microbiology 1–3 (25), English Political Science 1–2 (34). 103 IDs reused, seven new records; all answers unknown, zero teacher decisions/approvals/publications. Full collection coverage remains incomplete.

Current inventory: **17,281 saved / 12,690 active / 4,591 inactive**, 415 general bounded proposals in 37 sections; with separate Physics Unit 1, **430 pending items / 38 batches / zero history events**. Both 82-book passes completed, rerun added zero IDs. All 17,274 earlier candidate objects, 305 proposals, 218 protected files and 103 earlier images remain unchanged; five false generic short-answer associations are retained as inactive artifacts.

82 PDFs / 24,088 cached pages / 856 detected entries / 733 zero-publication entries. There are 819 entries without a general bounded section, including separately inventoried/prior-inspected artifacts; this is not a confirmed missing-section count. The dated 2026-10-10 publication snapshot remains **995 English / zero Tamil**, twelve legacy samples excluded, 13 saved sessions unchanged. No production/import/publish/push/deploy.

HTML practice now uses explicit Submit Answer, with unanswered solutions withheld by the API; marks, navigation, retries and history use the existing architecture. Admin coverage adds subject/volume/chapter/extraction/answer/review/publication filters. **160/160 unit/integration tests; six scoped browser cases; additional refresh/outage checks passed per device; typecheck/lint/build/audits passed.** Initial source-config/test-wait/type issues, a fixed duplicate error and one desktop loading timeout with successful rerun are documented.

Run npm run mcqs:review → http://127.0.0.1:4312 → authorised local sign-in → select the source subject/chapter batch → review/save/export each question individually. Unknown answers block approval. Next: original section inventory for Bio-Botany Chapter 1 in both media, then Basic Electrical Engineering English Chapter 1; use actual PDF boundaries. [Full source, per-book/subject coverage and teacher instructions](docs/ALL_SUBJECT_EXTRACTION_PROGRESS.md) · [Verification](docs/all-subject-verification.json) · [Preservation](docs/all-subject-preservation.json). Earlier entries below are historical.
<!-- END allsubject-20261018 -->

<!-- BEGIN reconciliation-20261018 -->
## Latest local Tamil milestone — October 18, 2026

**42 held source occurrences**: Applications 13 (12), 15 (10), Computer Science Tamil 1 (10), 2 (10); 40 IDs reused, two new IDs, zero new answers/reviews/approvals/publications. Chapter 13 now preserves both printed Q9 labels through explicit source-occurrence metadata rather than renumbering. Q2 remains incomplete; the earlier Q5 duplicate-choice claim is corrected (ஒளி versus ஒலி). The earlier 51 questions have 18 separate proposed Unicode transcriptions and 33 uncertain items, without altering original proposals/decisions.

Current totals **17,274 saved / 12,688 active / 4,586 inactive**, 305 general bounded proposals, 27 sections; **320 pending review items / 28 batches / zero recorded decisions**. The dated 995 English / zero Tamil eligible snapshot, twelve excluded samples and history remain unchanged. Inventory still 82 PDFs / 24,088 cached pages / 856 detected entries / 733 zero-publication detections; full coverage is incomplete. Final **156/156 tests, six scoped browser cases**, typecheck/lint/build/audits passed; two reruns per source added zero IDs. No production/import/publish/push/deploy.

Open the same local queue using `npm run mcqs:physics-review` → http://127.0.0.1:4312 → authorised local sign-in → select the chapter → inspect original/earlier/supplementary text and source pages → record/export one real individual decision. Unknown answers remain blocked. Next: Computer Science Tamil Chapter 3 and Applications Chapter 16 source inventory. [Complete current report and review instructions](docs/TAMIL_CORRECTION_RECONCILIATION.md) · [Verification](docs/reconciliation-verification.json) · [Preservation](docs/reconciliation-preservation.json).

Earlier milestone text below is historical and is superseded where this entry explicitly corrects it.
<!-- END reconciliation-20261018 -->

<!-- BEGIN collection-20261018 -->
## Current verified local milestone — October 18, 2026

The saved eligible bank remains **995 English / 0 Tamil**. Portal medium → Subject → book/volume → chapter selection, HTML answers/feedback/scoring, retries and account-scoped history are verified on desktop/mobile. Home/dashboard now show authenticated eligible counts rather than invented marketing totals. Mobile banner/input-focus obstructions were fixed; the admin extraction page now shows processing diagnostics and exports its manifest.

82 PDF checksums / 24,088 cached pages; 856 detected chapter entries, 733 zero-publication entries requiring investigation. **17,272 saved candidate records, 12,685 active IDs, 4,587 inactive artifacts**. **51** Tamil Applications Chapter 10/11/12/14 questions were newly source-bounded (48 IDs reused, three added), all held/unknown. There are **278 local review items in 24 batches**, all pending, zero actual decisions. Full collection extraction and academic verification remain incomplete.

**153/153 tests and 6 scoped browser cases passed**; typecheck/lint/build/audits exited 0; two all-book reruns added zero IDs. No production/import/publish/push/deploy. [Full coverage, real counts, commands and navigation](docs/CLASS12_PLATFORM_PROGRESS.md) · [Teacher source/review guide](docs/TAMIL_COMPUTER_NETWORK_REVIEW.md) · [Verification receipt](docs/collection-verification-20261018.json). Earlier dated results below are historical.

Start the configured app: `$env:AI_PROVIDER="excerpts"; npm run dev:web -- --hostname 127.0.0.1`; open http://127.0.0.1:3000. Start local-only teacher review separately: `npm run mcqs:physics-review`; open http://127.0.0.1:4312. Refresh read-only local processing counts: `npm run mcqs:progress-audit`.
<!-- END collection-20261018 -->

# Skill Up — Class 12 Learning Hub

A Tamil Nadu Class 12 learning portal with Tamil/English textbook libraries, HTML MCQ practice, notes, videos and teacher moderation. Textbook question coverage is still incomplete. The app uses Next.js 16, React, TypeScript and Tailwind, with Three.js for the interactive learning lab.

The backend supports permanent Supabase storage for student accounts, passwords, questions, attempts, activity and content. A live Supabase project must be configured and the migrations applied before permanent accounts can be created. See [database and student-login setup](docs/SUPABASE_SETUP.md).

## Local setup

For frontend and backend cloud hosting with the existing Supabase database, see [Vercel deployment](docs/VERCEL_DEPLOYMENT.md).

For the Render service and its ten-minute wake-up workflow, see [Render deployment](docs/RENDER_DEPLOYMENT.md).

Use Node.js 24 and npm. Run `npm ci`, copy `.env.example` to `.env.local`, run `npm run ai:setup` once on Windows x64, then run `npm run dev`. The website starts local Gemma automatically. Open `http://localhost:3000`. After `npm run build`, `npm start` also starts the model automatically. See [local model setup](docs/LOCAL_AI_SETUP.md) for other hosts and web-only startup.

This workspace already contains the full textbook PDFs. On a new checkout, run `npm run books:download` once to save the official library before using the in-site readers. The PDFs are about 2.20 GiB and are excluded from source control; copy `public/textbooks` when moving this installation. Reader worker/font assets are recreated by `npm ci` and `npm run build`.

To create an admin, supply your own `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD`. The first login requires a password change. Production requires a random `SESSION_SECRET` of at least 32 characters and an `APP_ORIGIN` matching the deployed HTTPS origin. Generate a secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

Local `ENABLE_DEMO_DATA=true` permits an isolated memory demo. Student shortcuts additionally require `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true`. Set both flags to `false` for real use. Configured Supabase connections never fall back to demo memory or seed demo accounts.

Demo logins at `/login`: `AVSCS26-0001` (Computer Science) or `AVSBIO26-0001` (Biology), password `Student@2026`. Administrator credentials come from your private `.env.local`; the initial password must be changed after signing in.

## Implemented features

- Responsive home and login, the supplied Skill Up badge, dashboard, libraries and admin content pages, with honest empty states and activity statistics.
- Three interactive schematic models: DNA double helix, plant cell and binary search tree. Rotate, zoom, select labelled parts, pause rotation, reset and enter fullscreen. Models load on demand and offer a fallback when WebGL is unavailable.
- Admin draft, publish, archive and delete workflows for PDF/image notes, MP4 uploads up to 50 MiB, YouTube or hosted videos, and NotebookLM links. The supplied 13 PDF notes and 5 Tamil lessons can be published with `npm run materials:import`; see [material import](docs/MATERIAL_IMPORT.md) and [content setup](docs/CONTENT_SETUP.md).
- Searchable administrator table of all student and admin accounts, profile details, account status and learning totals, with filtered CSV and real Excel exports. The Excel workbook includes an import-ready Students sheet and excludes passwords and password hashes.
- Official SCERT Class 12 library: 82 verified local Tamil/English medium PDF records across 40 subjects (2.20 GiB), with full in-site page readers, zoom, selectable text, PDF downloads and database metadata import. PDF.js reader assets are bundled locally during installation/build. See [textbook setup](docs/TEXTBOOKS.md).
- Student creation and CSV/XLSX import, duplicate detection, generated temporary passwords and forced password change.
- Signed sessions, role checks, same-origin mutation checks and protected quiz ownership. Practice restores saved answers; timed sessions withhold solutions until submission and use server timing.
- Local offline Gemma study helper with English/Tamil explanations, chapter sources, follow-up context and an excerpt fallback. See [local model setup](docs/LOCAL_AI_SETUP.md). New uploads are not automatically indexed; OCR and production retrieval ingestion are not implemented.
- Installable manifest, icons and an offline information page. Account pages and API responses are excluded from the service-worker cache.

## Class 12 Book-Back One-Mark MCQ Practice Platform

[Current counts by every textbook and chapter](docs/CURRENT_STUDENT_READY_COVERAGE.md) · [Tamil Physics Units 2–5 source packet](docs/TAMIL_PHYSICS_UNITS2_5_REVIEW.md).

Student practice renders HTML questions and separate text options, with immediate feedback in quick mode, running marks, navigation, server-scored results and fresh retry sessions. It contains no embedded textbook PDF, scanned page, screenshot or PDF canvas. The separate textbook library and administrator source checks remain available.

Coverage is incomplete. The October 15, 2026 read-only comparison confirms **995 English textbook publications and zero Tamil publications**, with unchanged question, candidate and practice tables. The 12 unverified legacy samples remain held and excluded. The earlier 1,007 count predates that withdrawal. The 625 generated dataset rows are not an additional published bank: 613 legacy drafts are held for teacher review, and 12 IDs overlap the sample bank. The user explicitly retained the exact 995 existing publications; they have printed-key evidence but no recorded teacher approval. A saved ID/content fingerprint baseline limits this exception. Every new textbook publication requires individual recorded teacher approval. Tamil Physics Unit 1's 15 canonical candidates remain pending, including the incomplete graph question. See [current status](PROJECT_STATUS.md), [local teacher review](docs/LOCAL_TAMIL_PHYSICS_REVIEW.md), [current all-book audit](docs/COMPLETE_PLATFORM_AUDIT.md), and [all 856 detected chapter rows](docs/book-back-chapter-coverage.csv).

Start locally with `npm run dev:web`, then open `http://localhost:3000`. This starts the existing website without setting up an AI model. Students open **Book-Back MCQs**, choose medium → textbook/volume → chapter or all chapters, select a count or **All available questions**, and click **Start Practice Session**. Search supports books/chapters and published question text, options or printed number. Preview results are paginated and omit answers. Attempts support exact-set retry, fresh practice and retrying incorrect answers; empty selections show their actual unavailable state.

Administrators can open `/admin/textbook-extraction` to filter the read-only extraction inventory and download chapter coverage or a selected book's local candidate reference CSV. Private drafts under `.local/teacher-review/extracted-books/` are separate from the live `/admin/textbook-questions` moderation queue. CSV exports do not import decisions, approve candidates or publish questions. Missing local files produce a setup error. Use the existing individual authenticated moderation workflow only for candidates already in that queue.

Completed attempts are stored on the server in Supabase. The recent-attempt dashboard additionally stores up to 50 validated records locally, separately for each authenticated account under `skillup_practice_history:<encoded-user-id>`. Browser history does not sync across devices; clearing it does not delete server attempts. Old unscoped history is retained but hidden because its owner cannot be established.

### Textbook PDF location and pipeline

- `public/textbooks/` contains the 82 local PDFs, indexed in `src/lib/textbooks-catalog.json`; availability does not establish complete exercise coverage.
- `npm run mcqs:extract-local` resumes local page extraction and builds held per-book packets plus the chapter CSV/JSON reports. Optional arguments: `-- --book-id <catalog ID> --snapshot <read-only snapshot path>`. It performs no database import or publication. Current results: 24,088 cached text pages, 856 detected chapter entries, 733 with no published questions; 12,685 active candidate IDs include in-text/damaged extraction (not an approved question count). The authentic unique book-back total remains unknown. All 17,272 local candidate records are preserved, with 4,587 inactive artifacts quarantined from active counts/exports. Saved candidate edits and review history survive reruns; refreshed derived source spans are stored separately.
- Tamil Physics Volume 1 Units 2–5 now have a bounded source inventory of **60 held questions**: 54 reused IDs and six recovered IDs, with 60 printed-key matches. Only 49 have four parsed text-choice positions; 11 need option correction and 13 need diagrams. All need Tamil/notation and teacher verification. Unit 4 Question 5 remains blocked by incomplete graph choices. The existing Unit 1 packet and blocked Question 10 are unchanged. See [the per-question review report](docs/TAMIL_PHYSICS_UNITS2_5_REVIEW.md). Administrator CSV reference exports now separate saved extraction from proposed coordinate text/options and include key/batch/graph fields. These local proposals are not automatically imported into the live moderation queue.
- `npm run mcqs:prepare` extracts/caches pages in `.local/textbook-text/` and prepares candidates without database publication.
- `npm run mcqs:audit` reruns the parser and writes `docs/textbook-question-audit.json` only. Its 985 auto-eligible and 11,244 review counts are extraction classifications, not counts of additional published questions.
- `npm run mcqs:coverage -- --live` opens and hashes physical PDFs, checks cached page provenance, reads paginated live content tables without mutations, and writes the independent book/chapter coverage artifacts. It needs the private server Supabase configuration. Without `--live`, publication is explicitly unchecked.
- `npm run mcqs:source-audit` freshly re-extracts identified exercise-start pages and selected source pages from the PDFs, comparing them to the saved cache. This checks text provenance, not visual completeness or academic correctness.
- `npm run mcqs:import` writes to Supabase and preserves existing moderation; inspect the dry run and source questions before importing. Do not bulk-approve pending candidates.
- `/admin/textbook-questions` offers administrator-only, paginated review with original question/key source references. Matching a printed key is evidence of an answer, not proof that OCR, chapter assignment or every exercise is complete.

To add a textbook, save its official PDF, add its metadata/hash to the catalog, run `npm run books:verify`, then run `npm run mcqs:prepare` and `npm run mcqs:audit`. The `books:index` script builds AI retrieval excerpts for selected subjects; it does not extract the complete MCQ collection.

## Content storage

The current site uses `STUDENT_ACTIVATION_MODE=direct`: students enter their profile details, email and a password of at least 10 characters, then sign in with that email and password. Passwords are stored as bcrypt hashes in Supabase; no SMS provider is required. Administrators can still create or bulk-import accounts with generated temporary passwords, which students must change at first sign-in. Optional administrator approval and SMS activation remain available using `admin` or `sms`; see [administrator approval setup](docs/ADMIN_APPROVAL_SETUP.md) and [OTP setup](docs/OTP_SETUP.md).

Apply the migrations in [database setup](docs/SUPABASE_SETUP.md), including the chapter-consistency and teacher-review migrations. Run `npm run mcqs:prepare` to inspect extraction and `npm run mcqs:import` to save candidates. Newly extracted questions stay in teacher review, including those with printed keys. `/textbook-practice` offers published text MCQs; `/admin/textbook-questions` provides source evidence, review batches and explicit approval/edit/reject actions. Reimports preserve prepared evidence and human moderation. Administrators can upload reviewed CSV/XLSX MCQs at `/admin/questions/import`, using the template and actual chapter IDs; batches are atomic and repeat imports skip duplicates. See [textbook MCQ setup](docs/TEXTBOOK_MCQ_SETUP.md).

Run the migrations in the order listed in [database setup](docs/SUPABASE_SETUP.md) and configure the URL and server secret/service-role key. Then run `npm run db:setup` and `npm run books:sync`. The learning-materials bucket is public; use licensed, publicly distributable content. The student-backend migration stores account and learning records, with transactions for unique IDs, password updates, answers and scoring. The `users` and `students` tables include generated profile columns for table-editor filtering.

Without Supabase, an explicitly enabled demo can save hosted resource links in temporary preview memory. Real backend operations fail with a setup error when configuration is absent. Use `npm run materials:import` to publish the supplied notes and videos. Administrators can create student credentials at `/admin/students/create`, or use `npm run student:create -- --test` after connecting Supabase.

## Validation

**Final follow-up checks:** 124/124 unit/integration tests passed, 0 failed/skipped/cancelled; six targeted desktop/mobile browser cases passed on the fresh full rerun. Typecheck, lint, build, parser audit, manifest audit and all-book extraction/rerun exited 0. The first browser run had one sign-in loading failure (5 passed); its isolated rerun and subsequent full six-case run passed. A narrow test typecheck error was fixed. Final CLI evidence matching excludes repeated short-answer numbers on the wrong source page and has regression coverage. No broad unrelated browser suite or teacher academic verification was claimed. [Validation and read-only database receipt](docs/physics-units2-5-verification.json).

The October 15 local milestone passed 118 unit/integration tests, six targeted desktop/mobile browser cases, two repeated post-build administrator/CSV checks, typecheck, lint, build and parser/manifest audits. This does not establish complete textbook extraction or teacher verification. See [actual results and log hashes](docs/complete-platform-test-results.json) and [scope/remaining work](docs/COMPLETE_PLATFORM_AUDIT.md).

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests start a production app on port 3100 and a local PostgreSQL-backed HTTP fixture on port 3101. The app uses its real Supabase SDK adapter, generated session secrets and test-only accounts. Tests cover desktop/mobile models, student creation, authorization, password changes, scoring, publication, playback, imports and the offline shell. Teacher material is replaced by generated fixtures. Live Supabase uploads require external credentials. Local Gemma inference can be verified with npm run ai:check and the opt-in model browser test in docs/LOCAL_AI_SETUP.md.

The public app is hosted on Vercel with its backend routes and Supabase database. Docker and Render configurations are also included but need validation in their target environment. Account/password changes, attempts, activity, revocations and rate limits persist in Supabase. Only the explicitly selected memory demo resets on restart. A teacher must review pending textbook extraction candidates before publication in the textbook bank.

The owner enabled the supplied HTML practice collections without teacher-review evidence on 25 October 2026. Open `/practice/collections` to practise 2,244 source-bank-unique questions across seven subjects. Their answers are labelled supplied and unverified. These collections retain their original sources and separate browser history; they do not create teacher approval records or alter the 995 existing textbook publications. Run `npm run practice:supplied:prepare` to reproducibly rebuild the dataset from the ten original HTML files. See the [integration report](docs/MATERIALS_AND_SUPPLIED_PRACTICE_REPORT.md) for counts, source issues and checks. All 32 study PDFs and 35 unique videos are available through `/notes` and `/videos`.

On a laptop unable to complete a production build, isolated browser checks can use `AVS_PORTAL_QA_BUILD=true AVS_TEST_DEV_SERVER=true npx playwright test`; this uses a local Webpack development server with the PostgreSQL fixture and longer cold-compilation waits. The default browser test command continues to use a production build.

See the [current status](PROJECT_STATUS.md) for independently measured coverage and checks, the [Tamil teacher-review guide and batch register](docs/TAMIL_TEACHER_REVIEW.md), the [896 held-question batches](docs/TEACHER_REVIEW_BATCHES.md) for source/key evidence, and the [prioritized chapter backlog](docs/TEXTBOOK_COVERAGE_BACKLOG.md). Run `npm run mcqs:tamil-review` to refresh the read-only Tamil queue report. The admin review page filters medium using database metadata and exports prepared queues as Tamil-compatible reference CSVs; decisions are recorded individually by authenticated administrators. New textbook imports require individual teacher approval; evidence preparation never publishes. The [earlier validation report](docs/QA_20261010.md) records previous checks. Earlier deployment history is in [the previous report](docs/QA_REPORT.md).
