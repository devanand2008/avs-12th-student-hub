# Materials refresh and dashboard glass scoreboard - 6 November 2026

## Source audit and additions

A complete recursive checksum scan found **271 files: 212 MP4s and 59 PDFs**. All **269 previous files** are unchanged. Seven existing byte-identical video aliases remain separate from the canonical resource count. There are **264 byte-unique resources: 205 videos and 59 notes**. No new videos were found in this pass.

| New source | PDF pages | Verified chapter | Student title |
|---|---:|---|---|
| `che/pdf/Chemistry_Chapter_2_Original_Order.pdf` | 53 | Chemistry Volume 1, Chapter 2 | Chemistry — p-Block Elements I — original-order scanned notes |
| `che/pdf/DocScanner Nov 2, 2026 11-44 AM.pdf` | 70 | Chemistry Volume 1, Chapter 1 | Chemistry — Metallurgy — scanned notes (70 PDF pages) |

Chapter names were checked against the actual English Chemistry Volume 1 contents, **PDF page 9**, and both new resources use the two existing active textbook chapter IDs. Older resource entries are preserved. All 123 new PDF pages were inspected as contact sheets, with first/middle/last pages enlarged. Both PDFs are image-based English notes, not searchable text or approved MCQ records.

Source issues are retained in the student descriptions: the p-Block file contains inconsistent later chapter headings; the Metallurgy scan contains repeated logical page numbers and combined two-page images. PDF page counts do not imply unique notebook pages, unique questions or complete chapter coverage. Supplied answers are not teacher-verified. No original source wording or images were rewritten.

Both original PDFs are hosted as SHA-256-named assets in the existing GitHub materials release. Remote asset size/digest and `%PDF-` byte-range responses were verified. Original files remain unchanged. The two additional catalogue/resource rows are appended without changing earlier rows or aliases. Preparation reuses stable file-derived IDs and does not duplicate entries on rerun.

## Dashboard scoreboard

The existing dashboard PointsCard now uses a frosted translucent panel, cyan/violet light effects, a readable dark base, responsive layout and clear keyboard focus. It displays actual server points, rank/privacy status and gift progress towards the existing 100,000-point milestone. No scoring rules, reward grants, leaderboard ordering or permissions were changed.

Loading and unavailable states do not invent zero balances. Rank privacy remains visible as “Private”. Gift progress is capped at 100%; large balances wrap on small screens. Hover motion respects reduced-motion preferences. Browsers without backdrop-filter receive an opaque, readable fallback, and forced-colour mode has a solid border. There are no new dependencies or animation loops.

Important implementation files: `src/components/learning/PointsCard.tsx`, `PointsCard.module.css`, the two existing additional-materials catalogues, `tests/materials-nov6.test.ts` and `tests/e2e/glass-scoreboard.spec.ts`.

## Verification and release

The materials dry run validates all **264** resources without writes. Both new hosted PDFs pass source digest/size/range checks. Initial typecheck and lint pass. Eleven focused material/reward/performance checks pass.

The full `npm test` run executed **282 tests: 280 passed and two failure entries represented one nested catalogue-description check and its parent**. The two new descriptions used a different prefix from the existing owner-supplied resource contract. The descriptions were corrected without weakening the test or dropping warnings. The affected platform module plus new material tests then passed **23/23**. The full 13-minute suite was not repeated; no other unit failures were observed.

The initial browser run passed **18/22** cases. The new note test incorrectly required a heading where the existing reader uses visible title text; its locator was corrected. The independent account-revocation case expected direct activation while the QA server defaulted to SMS, so the follow-up used the existing local-only direct-activation fixture setting. No production authentication behaviour was changed. All **10 follow-up cases passed** across desktop and mobile, covering every previously failed case and repeating the glass-card states. In total, all **22 distinct selected browser cases** have successful evidence across the runs: dashboard, private/unavailable/large point values, reduced motion, keyboard navigation, real note PDF range/download access, admin privacy, video pagination/search, account disabling/revocation, licensed guides and public/private SEO routes. Desktop/mobile screenshots were visually checked.

All 725 protected local source/review/history files remain unchanged after the full regression run. The public all-textbook subject API still reports **995 eligible questions**. Final typecheck, lint, local production build and `git diff --check` pass. The production release and durable resource sync are recorded below after completion.

No new MCQ publication, teacher decision, source-PDF alteration or Git push is part of this task. Existing questions, candidates, practice history and point events are checked separately from the authorised resource insertions.

## Production checks and blur correction

The first production build completed and was promoted. Authenticated insert-only sync made the durable resource total **264**, and all **262 previous rows** remain deeply equal. Repeated syncs insert zero. An inherited verification script initially selected the previous 26-video inventory; that verification selection was corrected to this two-PDF batch without changing application code or existing data.

The first live visual check caught a real production-only issue: the CSS optimiser collapsed adjacent native/WebKit backdrop declarations and kept only the unsupported WebKit form in Chrome. The prefixed variant was moved into its own feature-support rule. A new test runs the actual installed CSS optimiser and checks that both native blur and the separate WebKit fallback survive. **24 final focused checks passed**, including the style regression, platform and new material tests. **Two extra desktop/mobile blur cases passed**. Final typecheck, lint, production build and the actual built CSS inspection pass. The first failed live check is not counted as a pass.

The question, candidate, practice-session and curriculum fingerprints match the before snapshots: **3,039 rows, 12,229 rows, 19 rows and 7,254 rows**, respectively. Point events increased from **15 to 17** during the work: two note-open events timestamped 13:45 UTC, before this release's live browser verification. Their origin has not been attributed. They were preserved. The original 15 point-event rows retain their exact aggregate fingerprint, so no historical point data was rewritten to force a matching total. Subsequent live checks intercept viewing-activity POSTs and compare the sample student's balance/recent activity across each run.

## Final deployed result

- **Production URL:** https://avs-12th-student-hub.vercel.app
- **Deployment:** `dpl_G9SaKVYNwUi9XVTenLDnjp25wc2q`, **READY**, region `syd1`.
- **Framework/build:** Next.js 16.4.3; cloud build completed; approximately 98 seconds from building to ready.
- **Source:** tested working tree based on `5e198181b6c5d9d2ad30d20ae229ec2d3edefa28`; no Git push. Source manifest fingerprint `5ab78f03605e5ddd1d00d62ac6551929697b13e8df342597722adc9e82bf10de`.
- **Alias:** independently confirmed to point to this exact deployment. The promote endpoint reported it was already current; no redundant release or rebuild was needed.
- **Live tests:** all **eight verification groups** passed across desktop/mobile. Native computed blur is `blur(14px)`, real point totals/progress and keyboard navigation work, both new note titles/metadata/ranges/download controls match, 59 notes and 205 videos are present, Resources/AI Tools work, the 995-question count is unchanged, and there are no browser page errors or horizontal overflow. Four viewing-activity POSTs were intercepted before reaching production; the sample student's balance and recent events are unchanged across the live checks.
- **Preservation:** final checks match all **271 source files**, **725 protected local files**, **248 application source digests** and all **262 prior database resource rows**. No new questions, teacher decisions or practice sessions were created.
- **Observability:** a deployment-scoped 15-minute error/fatal log scan returned no groups. No external drains are configured; these are bounded build/live checks, not a long-term uptime assessment.

Raw private evidence: `.local/materials-glass-nov6-*.log`, `.local/materials-glass-nov6-live.json`, `.local/materials-glass-nov6-final-preservation.json`, `.local/materials-nov6-sync.json` and the final deployment manifest. Screenshot previews: `.local/glass-scoreboard-live-desktop.png` and `.local/glass-scoreboard-live-mobile.png`.
