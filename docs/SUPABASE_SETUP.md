# Connect Supabase and create a student login

The database code and migrations are included. A live connection needs your own Supabase project and server credentials; this repository does not create a cloud project or invent credentials.

## 1. Configure the project

Create or open a project in the Supabase dashboard. In its SQL editor, run these files in order:

1. `supabase/migrations/20261006_learning_resources.sql`
2. `supabase/migrations/20261006_student_backend.sql`
3. `supabase/migrations/20261007_account_directory.sql`
4. `supabase/migrations/20261007_first_login_otp.sql`
5. `supabase/migrations/20261007_textbook_library.sql`
6. `supabase/migrations/20261008_learning_video_uploads.sql`
7. `supabase/migrations/20261007_material_library_uploads.sql` (50 MiB notes/video uploads; run after the preceding migrations)
8. `supabase/migrations/20261007144717_admin_student_approval.sql` (administrator approval and temporary-password activation)

The scripts are additive and can be rerun. They create the content bucket, account and learning tables, textbook metadata table, uniqueness constraints, transactional database functions, and access restrictions. They do not import the previous temporary memory data. Downloaded textbook PDFs remain in `public/textbooks`; the catalogue import saves their source, language, local path and file information in Supabase.

Add the following to `.env.local`, preserving your existing session secret and administrator credentials:

```dotenv
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
# Optional compatibility name; the backend prefers SUPABASE_URL.
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
# Optional public key for browser integrations; it cannot replace the server key.
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-PUBLISHABLE-OR-ANON-KEY
SUPABASE_SECRET_KEY=YOUR-SERVER-SECRET-KEY
ENABLE_DEMO_DATA=false
DB_DRIVER=
NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false
SESSION_SECRET=YOUR-RANDOM-SECRET-OF-AT-LEAST-32-CHARACTERS
ADMIN_EMAIL=YOUR-ADMIN-EMAIL
ADMIN_INITIAL_PASSWORD=YOUR-INITIAL-ADMIN-PASSWORD
APP_ORIGIN=http://localhost:3000
STUDENT_ACTIVATION_MODE=admin
```

Use the full `https://YOUR-PROJECT.supabase.co` URL; the project reference alone is not a URL. The administrator's `/admin/backend` page displays the connected project and links to its Supabase dashboard.

The legacy `SUPABASE_SERVICE_ROLE_KEY` is also supported instead of `SUPABASE_SECRET_KEY`. Use a server secret or service-role key for the backend; a publishable/anon key only belongs in the optional public setting. The server key is used by server code only; never prefix it with `NEXT_PUBLIC_`. Supabase documents these distinctions in its [API keys guide](https://supabase.com/docs/guides/getting-started/api-keys).

Run `npm run db:setup`. It checks the migration, seeds the curriculum, and creates the configured administrator if that email does not already exist. Existing passwords and records are preserved. Restart `npm run dev`, sign in as administrator, and change the initial password. Check `/admin/backend` for connection status.

Run `npm run materials:scan` to inspect the supplied `book's` folder, then `npm run materials:import` to upload and publish its 13 notes and 5 Tamil videos. The importer enables the required storage limit, reads actual PDF page counts and MP4 durations, and preserves existing records when rerun. `npm run materials:verify` checks their metadata and public file URLs without changing database records. See [material import](MATERIAL_IMPORT.md).

For a deployed app, set these environment variables in the hosting provider, use its HTTPS address for `APP_ORIGIN`, and rebuild after changing the public Supabase URL. Never copy `.env.local` into a public repository or container image.

## 2. Create the new student

In the admin workspace, choose **New Student** at `/admin/students/create`. Enter the student's actual name, register number, school, mobile number, stream, medium and academic year. The backend creates a unique Student ID and a random temporary password in one transaction. Share credentials privately; passwords are stored as bcrypt hashes.

Use **Open student sign-in**, or open `/login`. In administrator approval mode, accounts created by an administrator are approved immediately. Share their Student ID and temporary password privately. Self-registered students first need approval in `/admin/students`. The student signs in with the temporary password and chooses a personal password of at least 10 characters before accessing the dashboard. Follow [the administrator approval guide](ADMIN_APPROVAL_SETUP.md). Password changes, password resets and deactivation persist across restarts. Admin password resets invalidate previous sessions and require a password change. If you select `STUDENT_ACTIVATION_MODE=sms`, use [the SMS provider setup guide](OTP_SETUP.md) instead.

You can also create an account from the terminal:

```sh
npm run student:create -- student.example.json
```

Edit the example with the actual student's details first. For a clearly labelled test account:

```sh
npm run student:create -- --test
```

These commands require a connected Supabase backend. Temporary credentials are saved to an ignored `.local/AVS...-credentials.json` file. Share them privately and remove that file afterward. They never create a fake permanent account in demo memory.

## Stored records and login design

Students use custom PostgreSQL accounts and signed HttpOnly cookies. The configured activation method is administrator approval, recorded with the administrator's ID and a timestamp. This does not verify phone ownership. Optional SMS mode verifies ownership through Supabase Auth; its tokens stay on the server. Indian mobile numbers normalize to ten digits, including `+91`. Nonempty phone numbers and emails are unique. Browser roles cannot read account tables or invoke backend functions. Every app API checks account and role before reading or writing private data.

Public registration at `/register` creates the pending user, student profile and audit record in one transaction. It stores name, school, 12th Standard, stream, medium, mobile number, optional email and optional custom account ID. It does not issue a session before activation. Administrator approval issues a temporary password and invalidates the registration credentials; the student chooses their personal password at first sign-in. Optional SMS mode invalidates the prior password after verification. The database ignores supplied role/status/approval fields and always creates a student. Duplicate phones, emails and IDs fail without leaving an orphan user row.

The administrator's **Users & Students** table at `/admin/students` includes every student and administrator account, profile fields and learning totals. Its safe PostgreSQL report explicitly selects public account/profile fields and verifies an administrator actor. Password hashes and session secrets are never included in the report or CSV export. Supabase's table editor exposes generated account/profile columns alongside the underlying JSON records for direct filtering.

Supabase now stores users, students, curriculum, question-bank changes, immutable quiz question snapshots, attempts, progress, note/video activity, bookmarks, announcements, audit records, revoked sessions and login rate limits. Notes and video metadata continue to use `learning_resources` and the note-file storage bucket. Uploaded files have public URLs; use only material suitable for public distribution.

The application selects Supabase whenever both URL and server key are configured. Missing, partial or failed configuration does not switch a live app back to temporary memory. Demo memory is available only with explicit `ENABLE_DEMO_DATA=true`; `DB_DRIVER=memory` forces an isolated demo and is rejected without that flag. Demo login shortcuts additionally require `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true`. Supabase initialization never adds demo students, questions or source excerpts.

## Verification

`npm test` runs the migration against embedded PostgreSQL, checks uniqueness and transactions, closes/reopens the database to verify durability, and exercises the actual Supabase JavaScript SDK through a local HTTP fixture. Playwright runs the app against the same PostgreSQL-backed fixture, including account creation and first password change. This validates the local implementation; `npm run db:setup` and a real upload still need to succeed against your live project.

OCR and automatic AI indexing of uploaded notes remain separate work. No cloud deployment is performed by these setup commands.
