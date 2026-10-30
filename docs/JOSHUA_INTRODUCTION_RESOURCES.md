# Joshua introduction badge and complete supplied-folder reconciliation

Verified 30 October 2026. Source: `D:\avs-12-hub\book's`.

The supplied Joshua introduction image is a secondary introduction card in the global footer and a compact card in student/admin sidebars. SkillUp's main logo, favicon and app icons remain unchanged. The original 553×554 PNG is copied without image edits to `public/images/joshua-introduction.png`; the accessible link opens its full-size version. Next.js serves responsive lazy-loaded image sizes. The footer shares the card across all routes, including mobile; the sidebar adds a restrained portal placement. The Instagram link is retained.

## Folder coverage

All **113 physical files** are accounted for: **57 PDFs and 56 MP4 files**, representing **109 byte-unique resources (57 PDFs + 52 videos)** after four existing byte-identical video aliases. All 107 earlier file paths retain their hashes and sizes. No new PDF was present. Six new video IDs and six source-derived thumbnails were appended to the existing catalogues; all 36 earlier additional entries remain byte-equivalent as objects. A preparation rerun leaves identical catalogue bytes and no duplicate IDs.

| New video | Language | Chapter | Duration (rounded up) |
|---|---|---|---:|
| Fertilization & Implantation | English | Bio-Zoology 2 — Human Reproduction | 411s |
| Structure of the Human Ovum | English | Bio-Zoology 2 — Human Reproduction | 269s |
| The Menstrual Cycle | English | Bio-Zoology 2 — Human Reproduction | 439s |
| கருவுறுதல் & கருப்பதித்தல் — Fertilization & Implantation | Tamil | Bio-Zoology 2 — Human Reproduction | 306s |
| மனித விந்து செல்லின் அமைப்பு — Human sperm structure | Tamil | Bio-Zoology 2 — Human Reproduction | 331s |
| மாதவிடாய் சுழற்சி — The Menstrual Cycle | Tamil | Bio-Zoology 2 — Human Reproduction | 338s |

Topic/language previews and playback metadata were inspected, including introductory and midpoint frames. This does not certify every narration, diagram or scientific statement. These remain labelled owner-supplied, academically unverified videos. They are accessible in the existing `/videos` library and `/videos?chapterId=zoo-ch-2`, with English/Tamil filtering. All existing notes remain in `/notes`.

Hosting uses the repository's existing GitHub release `learning-materials-2026-10-25`, with hash-named MP4 assets. All 6 new assets passed release SHA-256, size, 32-byte range and MP4-header checks. Media is streamed instead of bundled into the Vercel application. See [inventory](joshua-materials-inventory.json) and [hosting verification](joshua-resource-hosting-verification.json).

## Progress-saving fix

The initial browser run exposed HTTP 400 when saving progress for source-controlled resources absent from `learning_resources`: the activity table's resource foreign key requires a real row. After session authorization and published-resource validation, the activity route now registers only the canonical source record, using `onConflict: id` and `ignoreDuplicates: true`, before saving activity. It accepts no client-supplied resource content and preserves stored edits and archives. The same fix supports new source-managed PDF progress. No migration, bulk import, direct production database write or history replacement was executed. **After deployment, an authenticated student's normal progress save can insert a missing canonical learning-resource row and then save that student's activity.** Existing rows are never overwritten by this registration.

The isolated PostgreSQL regression verifies concurrent registration, actual note/video activity persistence, fractional seconds, no fabricated-ID registration, and preservation of edited/archived records. The final desktop/mobile playback run confirms successful HTTP 200 activity saves and persisted activity for every new video. Scientific and MCQ teacher-review rules are unchanged.

Reference: [Supabase upsert semantics](https://supabase.com/docs/reference/javascript/upsert). Current changelog checked; no relevant API breaking change applied.

## Actual verification

- Full `materials:scan` dry run: 109 valid resources; no unknown/missing source files and no database import.
- Initial focused material/model tests: 12/12 passed. New PostgreSQL regression: 1/1 passed. Final platform/material/model/progress tests: **34/34 passed**.
- Full `npm test`: 233/237 passed, 4 failed, 0 skipped in the initial broad run (18 minutes). Failures were the stale video-count assertion and its parent suite, plus two supplied-HTML audit/reimport cases triggered by two additional unimported source files. The count assertion now compares canonical IDs. The reimport test now runs in an isolated temporary directory using only the existing imported source manifest; source auditing checks imported occurrences instead of claiming every newly dropped HTML file is already imported. Its unintended local regeneration was restored to the exact pre-test SHA-256 bytes. The final 34 focused tests and 9 supplied-practice tests passed. The full suite was not repeated.
- Local browser: **22/22 checks passed**, across desktop/mobile pages and all six new video play/pause/seek/progress flows. An earlier 22-check run passed display/playback but exposed progress-save errors; the fix was then verified in the final run.
- Live public browser: **10/10 passed** on desktop/mobile, covering home, models, resources, AI tools and supplied-practice navigation, secondary-image loading, primary-logo preservation and no horizontal overflow/page errors. Production student login/activity writes were not used as a test.
- Typecheck, full lint and diff check passed. Vercel production build passed. No local production build or full separate Playwright suite was run.
- 725 protected local files unchanged by SHA-256, including original textbooks/crops, teacher review/candidates and dated history; retained English publication baseline **995** and supplied unverified practice questions **2244** are unchanged. These are local preservation proofs, not fresh live database snapshots.

## Release

The first CLI deploy returned Not authorized, with a version-check worker timeout. The user renewed the device login, which was confirmed in the CLI log. The second working-tree build completed READY, and staged HTML returned HTTP 200 with both main logo and Joshua badge references. Vercel's connector promoted deployment **dpl_EoCSmvnYpU9NzY2Z85ijbMvZ8kWs** to **https://avs-12th-student-hub.vercel.app**, with the alias independently checked. Source fingerprint: `67134dc29f14792cac68e872fae190290d79fa1cec7ed189da76e24c4f5a9087`. No Git push occurred; existing uncommitted project changes were preserved and included in the working-tree release.

Changed product files: `JoshuaIntroduction.tsx`, shared `Footer.tsx` / `Sidebar.tsx`, the two existing additional-material catalogues, `content.ts`, activity API and the new PNG/thumbnails. Tests were updated for catalogue growth and the progress foreign-key regression. Private receipts remain under `.local`.
