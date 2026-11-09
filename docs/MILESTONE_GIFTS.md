# Skill Up completion rewards and milestone gifts

Implemented locally on 3 November 2026. Release verification is recorded below.

## Student rewards

- A completed one-mark practice or timed assessment earns **10 points per attempt** when all assigned questions have submitted answers. Academic marks are calculated separately; correct answers do not add a second reward.
- A completed supplied HTML collection attempt earns **10 participation points**, with every question answered. A signed, student-bound attempt token records the chosen question IDs. Supplied answers remain labelled unverified.
- The same attempt can be submitted again after a network failure without adding another reward. A newly started, completed practice attempt can earn another 10 points.
- A fully watched native video earns **10 points once per student/video**. Server-timed playback segments are merged, so seeks and repeated sections do not create watched coverage. Completion requires at least 99% coverage and reaching the final second, allowing rounding in catalogue durations. Start, pause, seek and end events anchor progress; ordinary heartbeat gaps longer than 30 seconds cannot claim an entire missing interval.
- This is measured playback, not proof of human attention. Browser events can be imitated; gift administration should check genuine learning activity. External YouTube/Notebook embeds cannot report completion through this player and receive no completion reward. Known-duration MP4 lessons support rewards. Playback above 2×, disconnections or long background gaps may require replaying uncredited portions.
- Mark as Watched remains a learning-history convenience and awards no points. Notes retain the existing one-point, once-per-note rule.
- Existing ledger entries and balances are preserved. No retroactive bulk awards or deductions are performed.

## Gift workflow

Open **Learning scoreboard** (`/leaderboard`). The gift card shows progress toward **100,000 points**. After reaching the threshold, explicitly select **Request my gift**. The server checks the authenticated student's real balance. One lifetime claim is allowed for this milestone; concurrent requests reuse the same claim. Points remain in the balance.

The student sees the status, gift chosen, public delivery update and status history. Requesting does not place an order or promise a shipment date. The admin chooses the gift and arranges delivery individually, as requested by the owner. No new address database or shipping provider is added.

Admins open **Milestone gifts** (`/admin/gifts`), also linked from the admin scoreboard. Each request shows the student's name, student ID, email and points. Use the existing All users directory for further authorised contact details.

1. Choose a gift and move Requested → Approved.
2. Arrange delivery, then move Approved → Dispatched with a student-visible delivery or collection update.
3. Confirm actual receipt, move Dispatched → Delivered, and accept the explicit confirmation. Delivered is final.
4. A requested/approved claim can be rejected with a reason. An admin can reopen a rejected claim to Requested; it does not create a second entitlement.

Private admin notes stay out of the student API. All saved stages record actor ID, timestamp, gift, delivery update and notes in a separate audit history. Optimistic version checks prevent overwriting another admin's newer change. There is no automatic fulfilment, redemption deduction or automatic delivered status.

## Implementation and preservation

Additive migration: `supabase/migrations/20261103103557_completion_rewards_gifts.sql` creates three private tables and four service-only functions. RLS is enabled; anonymous/authenticated Data API access is revoked. Existing custom sessions, active-student checks and admin authorisation remain required. No service key is exposed to browsers. No question, candidate, teacher review, resource or practice-history table is changed by the migration.

Production baseline before changes: 3,039 question rows; 12,229 extraction candidates; 19 practice sessions; 15 point events totalling 23 points; five engagement profiles totalling 23 points. Existing published student bank remains 995 English questions.

## Verification

Passed: **39 focused regression tests** (completion/gift/token SQL integration, engagement/reminders, platform security, Supabase adapter, answer locking, history and supplied HTML ingestion) and **12 desktop/mobile browser cases** covering authentication, idempotent rewards, skipped-video rejection, preferences, gift eligibility/request UI, admin stage changes and confirmation. Gift browser screens use explicit intercepted UI fixtures for high-score claims; real PostgreSQL fixtures independently test eligibility, concurrency, transition authorisation, privacy, stale versions and ledger preservation. No real student is awarded test points or issued a fictitious gift.

Typecheck, full lint and local production build passed. The first lint identified a React effect style issue; the fetch effect was corrected and lint passed. Full repository/extraction tests were not run. Native full-duration video coverage is validated with simulated server time in isolated SQL tests; external embedded playback completion cannot be verified.

The additive migration was applied successfully. Before/after checks match all 3,039 question rows, 12,229 candidates and 19 practice sessions by full-row fingerprints. All 15 existing point events / 23 points and the five profile balances are unchanged. All three new tables are empty; no claim or test reward was fabricated. Anonymous claim execution and authenticated direct claim-table reads are denied; all three tables have RLS. The existing admin can query the empty queue. All **725 protected local files** match their saved hashes.

The pre-change Supabase advisory scan reports an existing Auth leaked-password-protection warning ([configuration guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)). Private server-only tables intentionally have no public RLS policies; grants are revoked. This release does not change the existing authentication provider or expose those tables.

Vercel deployment **`dpl_73cemFeMtZRDZevhEW6xnrirPxdy`** is READY, cloud build passed and the existing alias **https://avs-12th-student-hub.vercel.app** points to it. All 224 deployed application-source digests match the local tested payload. Deployment input fingerprint: `4cd61a619f0590e312d74a37ddbc76882e07cdd431053ec3420420e82e2ff1fd`.

**Eight final live desktop/mobile checks passed:** signed-out access denial; student eligibility/balance/status card and admin API denial; reward explanation with unchanged 146 videos / 57 notes; authenticated admin queue refresh; no page errors or horizontal overflow. These checks use existing accounts and do not submit quizzes, video activity, claims or fulfilment changes. The first live-check attempt hit `ECONNRESET`; a test session token appeared in that error's request detail, so that session was revoked and the script now removes request details before logging errors. The complete rerun passed. A short deployment-scoped runtime error/fatal log scan returned no groups; this is not a long-term monitoring guarantee.

Students can reload the scoreboard page to see a newer admin delivery update. Gift records, delivery notes and account details are not public leaderboard fields. Email reminders remain disabled until a sender/provider is configured; gift shipment is arranged by the admin, not by an automated email or shipping integration.

No Git push was performed. Source changes remain in the existing working tree. Verification metadata is saved locally in `.local/gifts-deployment.json`, `.local/gifts-preservation.json`, and `.local/gifts-live-verification.json`.
