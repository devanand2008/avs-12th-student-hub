# Validation report — 7 October 2026

## Connection to the requested Supabase project

The local application now uses `https://rqsymozgslwwupxmyido.supabase.co`. The supplied public key was validated against that project, and the matching server credential was obtained through the existing authorized Supabase connection and stored only in ignored `.env.local`. All seven migrations were applied to the initially empty project. The previous environment and account/content snapshot are retained privately under `.local`; the previous project was left intact.

Copied all four app accounts, three student profiles, curriculum, 82 textbook catalog records, saved bookmarks/activity and the other application records. All 18 material files were copied to the new project's storage, and their database URLs now use that project. Account passwords and profile data were compared against the original snapshot and preserved. Only the clearly labelled sample's phone Auth identity was recreated and relinked for the new project, with an audit entry; no SMS was sent. Textbook PDF files remain local.

`npm run db:setup`, the production build and focused ESLint passed. A real browser sign-in verified administrator access and the new project reference on `/admin/backend`; the supplied public key connects to Auth settings and cannot read private account tables. The private report is `.local/new-project-connection-report.json`.

Verification exposed a browser routing issue: after successful authentication, a guest-prefetched admin redirect could keep the login page visible with a valid session. Password sign-in now starts a fresh document request with the new cookie. A regression check failed against the previous build. Student testing also exposed replay overwriting a completed video's percentage; automatic updates now retain completion, and progress writes are ordered so an earlier delayed request cannot overwrite a later completion. The learner can still explicitly mark a lesson unfinished.

Video bookmark controls now wait for the saved state and show the backend's returned `bookmarked` value, preventing a late loading response or local toggle from displaying the opposite state. Changing the active lesson cannot apply an earlier lesson's save result. A controlled delayed bookmark read verifies that the button stays disabled until loading finishes. The final build and focused lint passed, followed by all eight desktop/mobile scenarios covering common-subject material search, bookmarks, admin sign-in after guest prefetch, ordinary student sign-in, video playback, retained completion on replay, explicit reset and upload validation. `npm run materials:verify` passed for all 18 files on the new project.

The notes reader also orders initial and subsequent page saves. Two additional desktop/mobile checks hold the initial page-one request, navigate to page two, then verify the persisted page and restoration after local storage is cleared. Both passed after the final reader rebuild, which also passed type checking and focused lint. The ten focused browser scenarios passed across these runs.

The live sample verification passed across the initial material/profile checks and the final resumed checks. It confirmed real PDF and MP4 access from the new storage, both official textbook pages, saved bookmarks, performance totals, student denial from admin APIs, and a fresh login restoring page two and completed video state from Supabase. On the separate final run, password responses took five and three seconds. The private `.local/student-test-report.json` is ready and records the remaining question-bank, AI-indexing and SMS limitations. Current credentials remain in the ignored admin/student access files.

The new project's Phone authentication remains disabled, with Twilio selected as provider. Database connection does not establish SMS delivery; an SMS provider must be configured before ordinary first-time student OTP onboarding can work. Existing admin and the scoped sample student continue to use their saved passwords.

## SMS delivery diagnosis and login recovery

Fresh live Supabase Auth settings confirm that Phone authentication is disabled, with Twilio selected as provider. Existing Management authorization cannot read or update Auth configuration: it returns 403 for missing Auth scope. No SMS-provider credential settings are present in the local environment. Provider credential completeness in Supabase remains unknown until Auth configuration access is granted. No real SMS was sent or provider configuration changed during diagnosis.

A read-only account audit also found one earlier registration with verification/setup timestamps but no linked Auth identity or verification audit. Those timestamps precede the reviewed source-edit window, so its origin was not attributed to that edit. No existing account fields were changed during diagnosis; the clearly labelled sample has its expected linked identity and provisioning audits.

The app now distinguishes unavailable phone authentication, delivery failure and rate limiting. Already-verified students return to a prefilled password sign-in page, without receiving an authenticated session from the OTP endpoint. Both OTP pages offer password sign-in links. The scoped preverified sample remains usable. Removed a recently added global OTP-disable branch that marked ordinary accounts verified without ownership proof, ignored failed database updates and opened OTP entry without a challenge.

The actual SMS signup request now includes the saved student name needed by the connected project's existing profile-creation trigger. Integration coverage exercises the real Supabase SDK with disabled provider, SMS failure, rate limit, unchanged password/verification state after failure, and the required profile metadata. Full real SMS delivery still requires authorized Phone configuration and a configured SMS-provider account.

The production build passed and the updated local service was restarted. All 52 unit/database checks passed across the full run and focused SDK rerun. Eight relevant desktop/mobile registration and OTP browser scenarios passed; the two unavailable-SMS scenarios needed a selector scoped to the page error because Next.js also provides an alert route announcer. Targeted ESLint passed. A fresh browser against the live app verified that the sample's already-verified number returns 409 with no login cookie, navigates to password sign-in, authenticates with its saved Student ID/password, and returns 401 after logout. The private live-check report is `.local/otp-password-exit-report.json`. No real SMS was sent.

## Live sample student access

Created `AVSCS26-0002`, named **Sample App Test Student**, in the live Supabase database for Computer Science, English medium, academic year 2026–2027. Its current sign-in details are stored only in ignored `.local/student-access.txt` and `.local/student-access.json`. This is an administrator-confirmed test fixture: its dedicated Supabase phone identity was confirmed for testing, no SMS was sent, and normal student onboarding remains unchanged. The setup action is recorded in the audit log.

Actual password sign-in and a fresh browser session passed. Browser checks verified the correct stream/dashboard, student profile, all 13 notes and 5 videos, PDF page navigation, decoded MP4 playback, saved note/video bookmarks, watched state, performance totals, and official textbook pages rendered by PDF.js. A fresh context with no local storage restored the note page and bookmarks from Supabase. Student access to the admin page redirects to the dashboard, and the admin users/students/backend APIs return 403. Details and screenshots are in ignored `.local/student-test-report.json` and `.local/student-dashboard-ready.png`.

Testing also corrected the dashboard's stream enum comparison, which previously showed Biology labels for Computer Science students, and aligned the profile password form with the backend's 10-character minimum. Standalone typecheck and the production build passed; the updated production app is running locally.

Full quiz scoring still requires published questions, and grounded AI responses require indexed study content. The live local Gemma readiness check passes, but an unsupported question correctly returns `foundInKnowledgeBase: false`. Real SMS/OTP onboarding remains untested because the Phone provider and SMS delivery are not configured; the test fixture does not establish real phone ownership.

## Live administrator access

The configured administrator's initial password setup is complete. Setup used the normal signed-in password-change API, then a fresh login verified the saved password and `/admin` redirect. The administrator is signed in through the browser UI, and the admin panel is open locally. Current sign-in details are stored only in ignored `.local/admin-access.txt` and `.local/admin-access.json`; server secrets and passwords are not included in this report.

Live authenticated checks passed for database status, analytics and the safe user directory. Browser verification confirmed both **Admin Control Center** and **Supabase connected**. `npm run db:setup` passed again, and the missing `20261007_material_library_uploads` migration was applied and verified against the existing project. All 16 required tables and all 18 published material files are available. Screenshots are in ignored `.local/admin-panel-ready.png` and `.local/admin-database-connected.png`.

First student SMS verification remains a separate setup requirement: the live Supabase project's Phone provider is disabled. No SMS credentials or phone-auth configuration were changed during the administrator access work.

## Student material library update

The existing live Supabase configuration in `.env.local` was verified successfully with `npm run db:setup`. The account schema, textbook metadata table and learning-materials storage are connected. Existing account passwords and first-login requirements were preserved.

All 18 files from `book's` are uploaded and published: 11 Mathematics PDFs, 2 Bio-Botany PDFs and 5 Tamil MP4 lessons. The PDFs contain 414 pages; the original files total 364 MiB. Actual page counts and MP4 durations were read from the files. Scanned Botany pages and Tamil video title frames were inspected to identify the correct topics. `npm run materials:verify` confirmed all 18 database records and public file URLs. Chromium decoded and played every uploaded Tamil video at its original 1280×720 resolution.

The build, standalone typecheck and all 52 unit/database/integration tests passed. Full lint has no errors and three existing unused-import warnings outside the changed pages. Focused desktop/mobile browser coverage checks subject/language search, Tamil search, chapter links, video bookmarks, draft/publish/read/archive, native playback/progress and a 16 MiB admin upload above Next.js's default proxy buffer limit. A delayed PDF plugin navigation caused one mobile test timeout; the navigation wait was adjusted to DOM readiness and the workflow passed on rerun.

Mathematics and Tamil are common subjects visible to both streams. Admin uploads and the storage bucket now allow files up to 50 MiB, with a 51 MiB Next.js proxy buffer for multipart overhead. Original source files remain untouched. Import IDs are stable and existing administrator edits, archives and student progress are preserved on subsequent imports.

The final production build is running at `http://localhost:3000`; the existing local Gemma service is healthy on loopback port 8080. The live subject API reports 11 Mathematics notes, 2 Botany notes and 5 Tamil videos. Unauthenticated note/video API requests return 401. The import report is in ignored `.local/material-import-report.json`. No external website deployment or SMS delivery was performed during this update.

## Earlier first-login OTP update

The production build passes with `/login/mobile`, `/login/otp` and the send/verify/status API routes. All 49 unit/database/integration tests pass. The ten PostgreSQL checks also passed a focused rerun after adding an explicit assertion that browser roles cannot invoke phone verification. Focused lint for the authentication changes and browser specs passes; full lint has no errors and ten existing unused-import warnings in other screens.

The final production browser run passed 38 scenarios and skipped two optional live Gemma scenarios. Four remaining failures were stale homepage/library selectors; after updating them to the current labels and empty-result count, all four passed on desktop and mobile. Together these runs cover all 42 applicable browser scenarios with no remaining failures. All OTP, registration, first password setup and subsequent password-login checks passed on both screen sizes in the full run.

OTP coverage includes signed challenge tampering and expiry, binding to the current phone, rejected password bypass, absent challenges, wrong/expired SMS codes, replay, resend cooldown, excessive guesses, registration without a session, initial password setup without a temporary password, invalidation of the earlier password, recovery of unfinished setup, and rejection of OTP as a reset method after setup is complete. SMS is simulated only by the local fixture; codes are generated randomly and never returned by product API routes.

At the time of this earlier OTP validation, live Supabase credentials were absent. The current material-library update above verified the subsequently configured project and its OTP migration. Real SMS delivery remains unverified; follow [OTP_SETUP.md](OTP_SETUP.md) to validate actual delivery.

## Earlier platform verification — 6 October 2026

The updated production app is running locally on port 3000 with the installed Gemma model on loopback port 8080. The administrator supplied in private environment configuration successfully authenticated and retains the first-login password-change requirement. No administrator password or server credential is committed in source.

## Checks

| Check                    | Result                                                                                                                                                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint                   | Full lint passed; changed homepage, navbar, content studio and browser specs also passed subsequent focused lint.                                                                                                                                                                                                         |
| TypeScript               | Standalone typecheck and final production-build typecheck passed.                                                                                                                                                                                                                                                         |
| Unit/database tests      | 47 passed. Backend's final 32 focused tests also passed after expanding the storage fixture.                                                                                                                                                                                                                              |
| Production build         | Passed, including all admin, registration and textbook routes.                                                                                                                                                                                                                                                            |
| Browser tests            | Full desktop/mobile run with real Gemma: 34 passed and two note assertions failed because a broad status locator matched loading and success messages. Corrected assertions and image paths, rebuilt, then all eight affected home/admin/login/note tests passed. All 36 browser scenarios are covered across these runs. |
| Textbook integrity       | All 82 downloaded official PDFs verified by recorded hashes; about 2.20 GiB.                                                                                                                                                                                                                                              |
| Actual local admin login | HTTP 200, admin role, first password change required.                                                                                                                                                                                                                                                                     |
| Public subject asset     | HTTP 200, image/jpeg; all eight optimized images loaded in desktop and mobile browsers.                                                                                                                                                                                                                                   |

Browser tests use test-only accounts and the real Supabase SDK against a local PostgreSQL HTTP fixture. This is implementation verification, not evidence of a connected cloud project. Model smoke tests invoked the installed Gemma through the authenticated web API on both desktop and mobile.

## Behavior covered

### Full-book reader update

The full-book reader at `/textbooks/[bookId]` now serves every saved catalog record. All 82 reader routes returned HTTP 200 and their corresponding full-size PDFs passed HTTP range/header checks. All 82 PDF checksums passed again. The final production build and full ESLint passed, and all 10 targeted production browser checks passed across desktop and mobile.

Browser verification covers complete English and Tamil books through their final pages (360 and 240 respectively), previous/next navigation, page jumps, zoom/fit, selectable text, local PDF.js workers with external internet requests blocked, invalid-book 404 responses, failed PDF loads with working retry and original-file fallback, medium filters, downloads and student login. Three existing textbook catalog/database tests also passed. Generated reader assets are copied locally during installation/build; Docker copies the setup script before running the new postinstall hook. Docker execution remains untested in this environment.

Full-book links are available in the textbook catalog, authenticated navigation, mobile menus and student dashboard. See [the textbook reader documentation](TEXTBOOKS.md).

After the mobile layout fixes, four additional production reader/login checks passed. A final 320px-wide browser check verified guest and signed-in textbook navigation, all 82 library cards, unobstructed reader pages and header controls without brand overlap. The local production app was restarted with the final build, and all 82 reader/PDF availability checks passed again.

- Public registration creates one pending user/profile transaction and always assigns student role. First-login OTP verification and personal password setup now precede subsequent Student ID, email and normalized phone login.
- Admin users table includes students and administrators, safe profile fields, learning totals, filters, CSV export, detail dialogs, password resets and activation controls. Reports and CSV omit credentials; student access is rejected.
- Notes support draft, publish, PDF reader, reading activity and archive. Videos support playback/progress, links and MP4 uploads. The fixture now verifies PNG/PDF/MP4 storage byte round trips through the Supabase SDK.
- Textbook subject search links and medium/group filters work. Local PDF requests support byte ranges and downloads. The library records real source metadata and reports file availability.
- Homepage matches the supplied reference layout, uses the supplied logo and serves subject photos from a public asset path. Desktop/mobile checks verify image loading, horizontal overflow and all three interactive 3D models.
- Authorization, signed sessions, forced password changes, same-origin mutations, logout replay protection, quiz ownership, server timing, answer restoration, imports and offline-shell exclusions remain covered.
- Local Gemma readiness, English/Tamil questions, source references, error states and unsupported-topic refusal are covered. Newly uploaded notes are not automatically indexed.

## Live database handoff

A Supabase project URL and server credential are now configured privately. Database setup and uploads to the existing cloud project were verified during the material-library update. Textbook PDFs remain local; their cloud metadata table is available. No hosting deployment was performed.

For a fresh project, follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md), including the larger material-upload limit, and enable its Phone/SMS provider as described in [OTP_SETUP.md](OTP_SETUP.md). The existing installation can be verified with:

```powershell
npm run db:setup
npm run books:sync
npm run materials:verify
```

Setup preserves existing accounts, seeds missing curriculum, and verifies the account report and upload bucket. Textbook sync stores their metadata; their PDFs remain in `public/textbooks`. Imported notes and videos, account records and learning progress use durable Supabase storage. Explicit memory demos on other installations remain temporary.

Screenshots and the latest focused Playwright report are in `test-results` and `playwright-report`; reference comparison images are in ignored `.local` files. See [UI assets](UI_ASSETS.md), [textbooks](TEXTBOOKS.md) and [local Gemma](LOCAL_AI_SETUP.md) for their sources and setup.
