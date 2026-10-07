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
- Searchable administrator table of all student and admin accounts, profile details, account status and learning totals, with filtered CSV export.
- Official SCERT Class 12 library: 82 verified local Tamil/English medium PDF records across 40 subjects (2.20 GiB), with full in-site page readers, zoom, selectable text, PDF downloads and database metadata import. PDF.js reader assets are bundled locally during installation/build. See [textbook setup](docs/TEXTBOOKS.md).
- Student creation and CSV/XLSX import, duplicate detection, generated temporary passwords and forced password change.
- Signed sessions, role checks, same-origin mutation checks and protected quiz ownership. Practice restores saved answers; timed sessions withhold solutions until submission and use server timing.
- Local offline Gemma study helper with English/Tamil explanations, chapter sources, follow-up context and an excerpt fallback. See [local model setup](docs/LOCAL_AI_SETUP.md). New uploads are not automatically indexed; OCR and production retrieval ingestion are not implemented.
- Installable manifest, icons and an offline information page. Account pages and API responses are excluded from the service-worker cache.

## Content storage

The current site uses administrator approval and password login. Self-registrations stay pending until an administrator approves them in `/admin/students` and shares a generated temporary password. Administrator-created accounts are approved immediately. Students choose their personal password at first sign-in. See [administrator approval setup](docs/ADMIN_APPROVAL_SETUP.md). Optional SMS activation remains available through `STUDENT_ACTIVATION_MODE=sms` with a configured provider; see [first-login OTP setup](docs/OTP_SETUP.md).

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

Docker and Render configurations are included for review; no deployment is performed. Docker needs validation in its target environment. With Supabase configured, account/password changes, attempts, activity, revocations and rate limits survive app restarts. A real project connection, backups, hosting verification and a reviewed question bank are still required before launch. Only the explicitly selected memory demo resets on restart.

See the [validation report](docs/QA_REPORT.md) for the final checks and remaining launch requirements.
