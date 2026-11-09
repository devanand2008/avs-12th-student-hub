# Scoreboard and joshuaskillup search identity

2 November 2026.

The existing points ledger, quiz rewards, resource rewards, signed-out bilingual instruction video and reminder scheduling are preserved. This update adds a shared responsive scoreboard at `/leaderboard` and `/admin/leaderboard`.

Students see their personal points, rank, practice shortcut, recent rewards and existing privacy/reminder preferences. The board includes leading-learner cards for positive scores ranked 1–3, a full top-50 table, a highlighted own row, refresh, retry and empty states. Cards display at most three learners; ties retain their actual shared rank and the full table remains authoritative. Scores are all-time learning rewards, not academic grades.

Administrators use **Admin navigation → Learning scoreboard**. The administrator API authenticates the current role and reads the existing scoreboard function without creating a profile or awarding points. It returns only visible active learners' display names, ranks and points. It does not expose hidden profiles, contact details, individual reward history or point-editing actions. Both private routes remain noindex; API responses are private/no-store.

## Search identity

The public homepage now identifies the portal as **joshuaskillup · Skill Up Class 12 Learning Portal**. The homepage title and description, Open Graph site name and `WebSite.alternateName` identify the requested name. Metadata also includes relevant Class 12 notes, Tamil/English materials, Samacheer Kalvi one-mark practice and 3D learning terms. Existing public canonical URLs, sitemap and private-page exclusions are retained.

Google selects search results and site names automatically. These changes do not prove indexing or guarantee placement for a search term. Search Console ownership and sitemap submission are not claimed. See [Google site-name guidance](https://developers.google.com/search/docs/appearance/site-names). After verifying ownership, the owner can submit `/sitemap.xml` and request homepage indexing. Meta keywords alone are not a Google ranking mechanism.

## Email availability

The user confirmed no email provider is configured. Automatic delivery remains disabled. The existing administrator reminder setup page describes the required verified sender/provider configuration. No real reminder emails were sent as part of this update.

## Validation

- 39/39 relevant regression tests passed, including engagement, SEO, platform, answer locking, practice history, supplied practice, Supabase adapter and resource activity. No skipped tests in this run. Full extraction/all-repository suite was not rerun.
- 12/12 isolated browser cases passed across desktop and mobile: admin authentication/read-only access/privacy, existing rewards and replay protection, video playback, preferences, ranking cards and SEO/canonical/sitemap/private-route behavior.
- Typecheck, full lint, focused lint after test edits, production build and `git diff --check` passed.
- Initial browser run against a production server on local HTTP had six authentication-related failures (secure cookies were not returned), with six public checks passing. The isolated development-mode rerun passed all 12; production HTTPS authentication was independently checked on the staged deployment. Production cookie security was not relaxed.
- An initial JSX editing error was corrected before the successful checks; no failed build was released.
- All 728 protected local files match the existing preservation snapshot. No migration, MCQ changes, teacher decisions, resource records or practice-history edits were made. Live verification uses existing logins/read-only views, not quiz attempts or reward awards.

## Release

Vercel deployment `dpl_HRAVTLUPwgmovT7i3Pj5hGfijruj` is READY and promoted to `https://avs-12th-student-hub.vercel.app`. Project and production alias match. Source fingerprint: `e1160f5725fa9bfda333ed026dae404119b92070904d54532cde7783e85c9c38`.

Staged production checks passed for brand metadata, protected endpoints, student/admin sign-in, read-only admin scoreboard, privacy, bilingual guide and range delivery, disabled cron email delivery, 126 videos, 57 notes and 2,763 supplied collection entries. Working-tree deployment; no Git push. Cloud build passed.

After promotion, **10/10 live checks passed** across desktop and mobile: actual tutorial playback, student scoreboard/privacy, dashboard points, Resources/AI pages, administrator read-only scoreboard and joshuaskillup homepage identity. No page errors were observed. Live checks made no point awards, quiz submissions, preference updates or resource-activity posts; authentication creates normal login audit entries. Reports and screenshots are retained under `.local/scoreboard-seo-*`.
