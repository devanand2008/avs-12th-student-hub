# Performance and database latency — 5 November 2026

## Measured baseline

Production measurements used the existing student test account over HTTPS, with all viewing-activity POSTs blocked. Three GET samples were taken per endpoint, followed by one page visit per desktop/mobile viewport. Mobile uses a 390 × 844 viewport and **4× CPU throttling**, without network emulation. These are observations from the agent's machine/network, not Lighthouse scores or guarantees for every device.

| Endpoint | Before median | Final median | Reduction |
|---|---:|---:|---:|
| /api/auth/me | 3360 ms | 598 ms | 82.2% |
| /api/subjects | 2600 ms | 631 ms | 75.7% |
| /api/subjects?library=all | 2728 ms | 859 ms | 68.5% |
| /api/videos | 3068 ms | 785 ms | 74.4% |
| /api/performance | 4130 ms | 589 ms | 85.7% |

The mobile dashboard became usable in 5,652 ms, Subjects in 4,192 ms and Videos in 6,140 ms. Dashboard/Videos each issued two browser authentication probes. The video view rendered all 205 cards immediately. Individual page visits are small samples; the report retains the raw timings instead of treating one run as a universal speed claim.

Supabase reports `ACTIVE_HEALTHY`, region `ap-southeast-2` (Sydney). Actual pre-release Vercel response headers identify `bom1::iad1`, confirming an Indian edge forwarding to US function execution even though `vercel.json` already requested Sydney. Existing indexes cover the hot query paths. The performance adviser reports four informational unindexed foreign keys and three unused indexes; no evidence justified changing indexes or removing them for this batch. Existing service-only RLS remains intact. No schema or policy changes were made.

## Implemented changes

- **Server validation:** session revocation, authoritative user/password-version and active student reads run concurrently. `/api/auth/me` reuses the validated student record instead of querying it again. Role, activation, password-reset and revocation checks remain fresh on **every request**; no permission-result cache was introduced.
- **Optional bookkeeping:** authenticated last-seen updates run with Next.js `after()` after the response. They no longer delay rendering, and retain the previous best-effort failure behaviour.
- **Database SDK:** reuse the server-only service client for data requests, recreating it when URL/key changes. **OTP sign-in/verification uses a separate fresh client** because Supabase Auth mutates SDK session state. User tokens never enter the shared service client. Node/fetch handles HTTP connection pooling; this change does not create a custom Postgres pool.
- **Browser authentication:** simultaneous Navbar/page/help requests share only their in-flight GET, with independently readable bodies. Completed responses and failures are not cached. One component's cancellation cannot abort another; logout cancels the pending probe and prevents outdated Navbar updates.
- **Curriculum:** independent reads start together. Chapter/resource/question counts use indexed in-memory maps instead of rescanning every question/resource for each chapter. Returned data and eligibility rules are preserved.
- **Performance API:** independent progress/history work runs concurrently.
- **Video library:** initially render 24 cards, add 24 with a keyboard-accessible Load more action, search/filter the entire collection, and defer expensive search rendering. Card links do not prefetch all watch routes. Newest videos appear first, retaining newly published admin uploads in the initial batch. API records, IDs and media URLs are unchanged.
- **Hosting:** set the existing Vercel project's default function region to `syd1`, alongside the existing database. The update used the current `resourceConfig.functionDefaultRegions` field after the API rejected specifying both it and the legacy field. Final deployment metadata and all 15 sampled HTTPS response headers confirm Sydney (`syd1`) execution.

Follow-up traces also showed automatic navigation prefetch downloading unrelated routes during current-page loading. Added a small shared `IntentLink` for header, sidebar, bottom navigation, footer, dashboard and subject links: initial prefetch is disabled; pointer hover and keyboard focus enable Next prefetch for the intended link. URLs, styles and click behaviour are preserved.

Existing lazy 3D/PDF loading, demand-based and visibility-aware 3D rendering, reduced-motion handling, WebGL fallback and source asset handling were inspected and preserved.

## Verification so far

- **55 focused tests passed**, zero failed/skipped: browser-request deduplication/cancellation/failure handling, isolated SDK auth, persistent repository, SMS paths, password reset, admin approval, scoring, answer locking, history, gifts/points, source progress, upload and PDF-reference policy.
- **20 desktop/mobile browser cases passed** against the isolated development fixture: batched/full-search video discovery, keyboard controls, navigation, immediately disabled/restored accounts, revoked cookies, password resets, one-mark/assessment/supplied-quiz points, rewards, resumed uploads, PDF references, 3D controls and WebGL fallback.
- The first **production-mode HTTP fixture** run had 6 passes/14 failures: traces show login returned `Secure` cookies that its HTTP API client did not send on later calls. Product cookie security was **not weakened**. The existing development fixture resolved the environment limitation; live HTTPS checks will independently cover deployment behaviour.
- Production build, initial typecheck/lint and diff checks passed. Final lint/typecheck and both local/cloud production builds passed; `git diff --check` passed. The historical full extraction/repository suite was not rerun because question/extraction data was not changed.
- All **725 monitored protected files** and every existing manifest JSON/CSV/SQL file are unchanged. Source material/question/review registries, practice snapshots, resource entries and AI prompt data were not edited. No Git push.

## Release and after measurements

First release `dpl_9dw3AAiJEYLhcqjZ2RRauHH6n6wo` is READY with real `bom1::syd1` headers. API medians improved substantially (auth 359 ms, subjects 497 ms, all-textbook subjects 750 ms, videos 750 ms, performance 644 ms), and all 24 live functional checks passed on the diagnostic rerun. An initial live check timed out without a stage receipt. Mobile page timing samples were variable and sometimes slower despite faster endpoints, with speculative navigation requests visible in the traces. Both intermediate runs are retained; no mobile speed gain is claimed from them. The intent-prefetch refinement passed **eight follow-up desktop/mobile browser cases**, including keyboard footer navigation, and its production build, lint and typecheck passed. Final release **dpl_6aKjRq634UkBKeH8g8uLccJ5XQYd** is READY at https://avs-12th-student-hub.vercel.app with Sydney functions. **All 24 final live functional checks passed** on desktop and mobile: all 262 resource records match the database snapshot, 24/48-card loading and Tamil full-library search work, real hosted video plays, authenticated PDF ranges work, and Dashboard, Subjects, Notes, Resources, AI Study Tools, Practice, Scoreboard and Profile load without overflow or page errors. Public eligibility remains 995 questions. Production viewing-activity POSTs were blocked during verification. The short error/fatal runtime scan returned no groups.

Final medians are **68.5–85.7% lower** for the five sampled data endpoints. All six final page samples became usable sooner; results are observations under the stated test conditions, not a universal device/network guarantee.

| Viewport | Page | Before | Final | Reduction |
|---|---|---:|---:|---:|
| desktop | /dashboard | 10042 ms | 3382 ms | 66.3% |
| desktop | /subjects | 3060 ms | 1739 ms | 43.2% |
| desktop | /videos | 8084 ms | 2945 ms | 63.6% |
| mobile | /dashboard | 5652 ms | 2370 ms | 58.1% |
| mobile | /subjects | 4192 ms | 2235 ms | 46.7% |
| mobile | /videos | 6140 ms | 2435 ms | 60.3% |

The mobile video page rendered 24 initial cards versus 205 (88.3% fewer), and 583 DOM elements versus 1,948 in the sampled baseline. Dashboard and Video authentication probes fell from two to one. Raw before/final/intermediate traces are retained in [the benchmark data](performance-nov5-benchmark.json). Dashboard score-card links still have a small amount of prefetch; expensive media quality/network adaptation and larger concurrency/load tests remain possible future work.

Final protected database fingerprints are unchanged: 3,039 questions, 12,229 candidates, 7,254 curriculum rows, 262 resources and 19 quiz sessions; the points balance remains 23. All 725 monitored files and original JSON/CSV/SQL registries remain unchanged. All **246 application-source digests match the submitted deployment manifest**; no independent remote source-tree comparison is claimed. Local documentation was completed after deployment. No schema changes, content import, data reset or Git push.
