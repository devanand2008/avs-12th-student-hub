# Learning points, welcome video and reminders — 2 November 2026

Routes: `/leaderboard`, `/dashboard`, `/login`, `/admin/reminders`, `/unsubscribe`. The dashboard and desktop learning navigation link to the scoreboard. The signed-out homepage and login screen offer the existing five-minute English/Tamil demonstration video, with optional captions and written steps. Playback is user-initiated, mobile-friendly and loaded on demand. Its synthetic demonstration account is identified in the recording; no real account credentials are published.

## Reward rules

| Activity | Points | Repeat rule |
|---|---:|---|
| Open a note | 1 | Once per resource |
| Start a video lesson | 2 | Once per resource; opening/starting is rewarded, not proof of watching the whole video |
| Submit an answered normal quiz question | 1 | Once per question across attempts |
| Correctly answer that question | 1 more | Once per question; server-scored answers only |
| Complete normal practice | 5 | Once per UTC day; answer at least five questions, or all questions if fewer than five |
| Complete a timed assessment | 10 | Same minimum participation, once per UTC day |
| Answer a supplied-collection question | 1 | Once per question; participation only, no correctness bonus for unverified answers |

Quiz rewards use the persisted completed session, never a client-supplied score or point count. Resource rewards validate the published resource and page/progress input through the existing activity route. The ledger's `(user_id,event_key)` primary key makes retries and simultaneous duplicate calls idempotent. Events and balance updates occur in one database transaction. Old sessions and activity are not backfilled; existing examination scores remain separate. Quiz results, notes and video progress remain usable if points storage is temporarily unavailable; supplied practice can retry saving its points.

The leaderboard shows at most 50 visible active learners, their chosen display name, points and shared ranks for ties. It does not expose other learners' IDs, emails, phone numbers, register numbers or detailed reward history. Students can edit their display name, hide themselves and opt out of email reminders. The initial display name uses a first name plus a short distinguishing tag. There are no fabricated leaders or starting points.

## Email status and setup

**Delivery is disabled. The owner confirmed that no email provider is configured.** The production flag is explicitly `REMINDERS_ENABLED=false`. A private `CRON_SECRET` protects the scheduled route. No real email was sent during implementation or testing.

The daily cron is configured for `30 3 * * *` (09:00 India time, subject to platform scheduling precision). When enabled with a verified sender, it selects up to 20 active student accounts per run that have not opened the app for at least three days. It reserves a seven-day cooldown atomically; concurrent runs cannot claim the same learner twice. Returning learners and opt-outs are rechecked before provider submission. Placeholder school/demo email addresses are skipped. Tracking begins when a student next uses the new feature; historical inactivity is not invented.

Email uses a bilingual plain-text template and a signed unsubscribe link. Opening the link displays a confirmation; pressing the button persists the opt-out without requiring login. Provider submissions use stable idempotency keys and an outbox status. A provider acceptance receipt is not proof of inbox delivery. Failed/ambiguous submissions retain the weekly reservation to avoid sending duplicate reminders after uncertain outcomes. Crashed pending submissions require operator inspection rather than blind resending.

To activate later: create/configure Resend, verify a sending domain, set server-only `RESEND_API_KEY` and `REMINDER_FROM_EMAIL`, then change `REMINDERS_ENABLED=true` and redeploy. `SESSION_SECRET` signs unsubscribe links; keep it private. The admin reminder page reports configuration without revealing secrets. Do not use a Supabase public key as a mail-provider key. No paid service or sending domain was purchased.

Provider references: [Resend email API](https://resend.com/docs/api-reference/emails/send-email), [idempotency keys](https://resend.com/changelog/idempotency-keys), [Vercel cron security](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [cron scheduling limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

## Data and verification

Migration `20261102_engagement.sql` adds three tables and service-only functions. RLS is enabled; browser roles cannot award rewards or read the ledger directly. Existing content and assessment tables are untouched. The migration was exercised through the real Supabase SDK against the isolated PostgreSQL fixture before production application.

Local verification: 37/37 relevant regression tests, six desktop/mobile browser cases, typecheck, lint and the final production build passed. Tests cover concurrent duplicate rewards, transactional balances, completed quiz/assessment plans, repeat submissions, supplied participation, visibility/preferences, spoofed inputs, unauthorized cron and admin access, tutorial playback, signed unsubscribe-token validation, a mocked provider delivery and overlapping reminder claims. No real provider delivery test is possible without provider credentials.

Initial browser assertions incorrectly expected zero points after another test had earned rewards; corrected to use the existing balance. A React effect lint issue was corrected and lint rerun. Final applicable tests passed; the full extraction/testbook suite was not rerun for this feature.

All 728 protected local files match their before-change hashes. Production preservation checks after migration: all 3,039 question records (995 Published), 12,229 candidates and 19 saved quiz sessions retain their counts and data fingerprints. No teacher decision, question answer, practice history, source PDF, resource catalogue or model registry was rewritten. New reward/profile data are stored separately. No historical point awards or bulk emails were created.

Deployment `dpl_nbci6mUfZtGKQ2djwYwLzS7k7CX8` is READY and promoted to https://avs-12th-student-hub.vercel.app. Project, source fingerprint and production alias were independently checked; the cloud build passed. Staged checks confirmed private points/leaderboard, 32-byte MP4 ranges, bilingual captions, admin/cron boundaries, delivery disabled with zero sent, and unchanged resource/practice totals. Eight live desktop/mobile checks passed for guide playback, scoreboard/contact-data protection, points card, Resources and AI tools. These checks created no rewards or practice attempts; normal sample-account login and new engagement presence were recorded. Production academic data and quiz fingerprints still match after the live checks.

Deployment recovered from expired CLI authorization and an invalid initial cron secret; the replacement is validated as a 48-character base64url value. A subsequent live visual check identified a Windows SQL-text encoding issue in the default name separator. Follow-up migration `20261102_engagement_display_name.sql` uses an ASCII-only source, fixes only exact malformed generated defaults and preserves custom aliases, balances and preferences. Its regression test verifies both repair and alias preservation; the affected two tests passed again after the change. Runtime error/fatal logs had no groups in the recent deployment-scoped query; this is a short observation window. No Git push was made.
# Current reward policy (3 November 2026)

Completion rewards now use **10 points per fully answered practice/assessment attempt** and **10 points once per fully watched native video**. The previous per-question/video-open/daily-bonus rules below are historical. Existing balances were preserved. See [current reward rules and the 100,000-point admin-arranged gift workflow](MILESTONE_GIFTS.md).

