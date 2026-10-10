# AVS 12 Learning Hub

A Tamil Nadu Class 12 learning portal for Computer Science, Bio-Botany, Bio-Zoology, Mathematics and Tamil. The app uses Next.js 16, React, TypeScript and Tailwind, with Three.js for the interactive learning lab.

The backend supports permanent Supabase storage for student accounts, passwords, questions, attempts, activity and content. A live Supabase project must be configured and the migrations applied before permanent accounts can be created. See [database and student-login setup](docs/SUPABASE_SETUP.md).

## Local setup

For frontend and backend cloud hosting with the existing Supabase database, see [Vercel deployment](docs/VERCEL_DEPLOYMENT.md).

Use Node.js 24 and npm. Run `npm ci`, copy `.env.example` to `.env.local`, run `npm run ai:setup` once on Windows x64, then run `npm run dev`. The website starts local Gemma automatically. Open `http://localhost:3000`. After `npm run build`, `npm start` also starts the model automatically. See [local model setup](docs/LOCAL_AI_SETUP.md) for other hosts and web-only startup.

This workspace already contains the full textbook PDFs. On a new checkout, run `npm run books:download` once to save the official library before using the in-site readers. The PDFs are about 2.20 GiB and are excluded from source control; copy `public/textbooks` when moving this installation. Reader worker/font assets are recreated by `npm ci` and `npm run build`.

To create an admin, supply your own `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD`. The first login requires a password change. Production requires a random `SESSION_SECRET` of at least 32 characters and an `APP_ORIGIN` matching the deployed HTTPS origin. Generate a secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

Local `ENABLE_DEMO_DATA=true` permits an isolated memory demo. Student shortcuts additionally require `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true`. Set both flags to `false` for real use. Configured Supabase connections never fall back to demo memory or seed demo accounts.

Demo logins at `/login`: `AVSCS26-0001` (Computer Science) or `AVSBIO26-0001` (Biology), password `Student@2026`. Administrator credentials come from your private `.env.local`; the initial password must be changed after signing in.

## Implemented features

- Responsive blue gradient home and login matching the supplied reference, the supplied AVS logo, dashboard, libraries and admin content pages, with honest empty states and activity statistics.
- Three interactive schematic models: DNA double helix, plant cell and binary search tree. Rotate, zoom, select labelled parts, pause rotation, reset and enter fullscreen. Models load on demand and offer a fallback when WebGL is unavailable.
- Admin draft, publish, archive and delete workflows for PDF/image notes, MP4 uploads up to 50 MiB, YouTube or hosted videos, and NotebookLM links. The supplied 13 PDF notes and 5 Tamil lessons can be published with `npm run materials:import`; see [material import](docs/MATERIAL_IMPORT.md) and [content setup](docs/CONTENT_SETUP.md).
- Searchable administrator table of all student and admin accounts, profile details, account status and learning totals, with filtered CSV and real Excel exports. The Excel workbook includes an import-ready Students sheet and excludes passwords and password hashes.
- Official SCERT Class 12 library: 82 verified local Tamil/English medium PDF records across 40 subjects (2.20 GiB), with full in-site page readers, zoom, selectable text, PDF downloads and database metadata import. PDF.js reader assets are bundled locally during installation/build. See [textbook setup](docs/TEXTBOOKS.md).
- Student creation and CSV/XLSX import, duplicate detection, generated temporary passwords and forced password change.
- Signed sessions, role checks, same-origin mutation checks and protected quiz ownership. Practice restores saved answers; timed sessions withhold solutions until submission and use server timing.
- Local offline Gemma study helper with English/Tamil explanations, chapter sources, follow-up context and an excerpt fallback. See [local model setup](docs/LOCAL_AI_SETUP.md). New uploads are not automatically indexed; OCR and production retrieval ingestion are not implemented.
- Installable manifest, icons and an offline information page. Account pages and API responses are excluded from the service-worker cache.

## Class 12 Book-Back One-Mark MCQ Practice Platform

Student practice renders HTML questions and separate text options, with immediate feedback in quick mode, running marks, navigation, server-scored results and fresh retry sessions. It contains no embedded textbook PDF, scanned page, screenshot or PDF canvas. The separate textbook library and administrator source checks remain available.

Coverage is incomplete. The independent October 10, 2026 live read found **1,007 student-ready questions: 995 printed-key textbook questions across 16 English-medium PDF records, plus 12 legacy samples without textbook verification metadata**. The 625 generated dataset rows are not an additional published bank: 613 legacy drafts are held for teacher review, and 12 IDs overlap the sample bank. No Tamil-medium textbook questions were student-ready in that read. See [independently verified status](PROJECT_STATUS.md), [all 82 textbook records](docs/INDEPENDENT_COVERAGE.md), and [all detected chapter rows](docs/independent-chapter-coverage.csv).

Completed attempts are stored on the server in Supabase. The recent-attempt dashboard additionally stores up to 50 validated records locally, separately for each authenticated account under `skillup_practice_history:<encoded-user-id>`. Browser history does not sync across devices; clearing it does not delete server attempts. Old unscoped history is retained but hidden because its owner cannot be established.

### Textbook PDF location and pipeline

- `public/textbooks/` contains the 82 local PDFs, indexed in `src/lib/textbooks-catalog.json`; availability does not establish complete exercise coverage.
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

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests start a production app on port 3100 and a local PostgreSQL-backed HTTP fixture on port 3101. The app uses its real Supabase SDK adapter, generated session secrets and test-only accounts. Tests cover desktop/mobile models, student creation, authorization, password changes, scoring, publication, playback, imports and the offline shell. Teacher material is replaced by generated fixtures. Live Supabase uploads require external credentials. Local Gemma inference can be verified with npm run ai:check and the opt-in model browser test in docs/LOCAL_AI_SETUP.md.

The public app is hosted on Vercel with its backend routes and Supabase database. Docker and Render configurations are also included but need validation in their target environment. Account/password changes, attempts, activity, revocations and rate limits persist in Supabase. Only the explicitly selected memory demo resets on restart. A teacher must review pending textbook questions before those questions become available to students.

See the [current status](PROJECT_STATUS.md) for independently measured coverage and checks, the [Tamil teacher-review guide and batch register](docs/TAMIL_TEACHER_REVIEW.md), the [896 held-question batches](docs/TEACHER_REVIEW_BATCHES.md) for source/key evidence, and the [prioritized chapter backlog](docs/TEXTBOOK_COVERAGE_BACKLOG.md). Run `npm run mcqs:tamil-review` to refresh the read-only Tamil queue report. The admin review page filters medium using database metadata and exports prepared queues as Tamil-compatible reference CSVs; decisions are recorded individually by authenticated administrators. New textbook imports require individual teacher approval; evidence preparation never publishes. The [earlier validation report](docs/QA_20261010.md) records previous checks. Earlier deployment history is in [the previous report](docs/QA_REPORT.md).
