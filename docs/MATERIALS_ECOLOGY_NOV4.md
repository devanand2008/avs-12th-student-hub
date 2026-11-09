# Bio-Botany ecology resources — 4 November 2026

This new scan found **243 physical files: 186 MP4s and 57 PDFs** in `D:\avs-12-hub\book's`. All 232 previously inventoried source files retain their hashes and sizes. Added **11 distinct owner-supplied Bio-Botany videos**, with no new PDFs or duplicate aliases. Current library: **179 unique videos and 57 notes = 236 unique resources**, with seven existing video aliases.

## Chapter and source checks

All new videos have English on-screen titles. Introductory and midpoint frames, durations, dimensions, file hashes and sizes were inspected. Narration language, complete content and scientific accuracy were not audited; resources remain labelled **owner-supplied and unverified**. No teacher approval or MCQ publication is implied. Original media and watermarks remain intact.

Chapter mapping uses the actual `12-bio-botany-english-f15d4524.pdf` contents, **PDF page 3**, and current active curriculum IDs under `tb-12-bio-botany-english-f15d4524`. Existing abbreviated registry titles were preserved.

| Chapter | Printed start | New videos | Source topics |
|---|---:|---:|---|
| 6 — Principles of Ecology | 109 | 5 | Principles of ecology, edaphic factors, topographic factors, ecological adaptations, epiphytes |
| 7 — Ecosystem | 134 | 4 | Ecosystem overview, productivity, two distinct ecosystem/succession lessons |
| 8 — Environmental Issues | 155 | 2 | Environmental issues, carbon capture and biochar |

Textbook topic checks: edaphic factors at PDF pages 117/121; topographic factors at 123; epiphytes at 125/128/131/132; succession at 153–157; carbon sequestration at 165/166/170/172; biochar at 171/172. These support chapter placement, not verification of every assertion in the videos.

`Ecosystem___Succession.mp4` and `Ecosystem___Succession (1).mp4` have different hashes, durations (about 530 / 556 seconds) and visible content. They are retained as separate lessons with distinct descriptive titles. All 11 newly scanned hashes are unique.

## Integration and preservation

New content uses the existing `/videos` player, chapter links, language/search filters, thumbnails, bookmarks and progress/reward behaviour. Existing 57 PDF notes stay in `/notes`. Several new files exceed 50 MB and use the previously authorised GitHub release hosting (`learning-materials-2026-10-25` in `devanand2008/avs-12th-student-hub`); raw MP4s remain outside the Vercel bundle.

All **158 original additional-catalogue rows and 158 resource rows** match their before snapshot. All **725 protected files** and **243 source-file hashes** remain intact. Preparation reruns leave catalogue/resource/alias bytes unchanged. Existing source warnings, questions, teacher-review decisions, practice history, points and gift workflow are not rewritten by this addition. No direct production content-table import, automatic academic approval or Git push is performed.

## Verification

Passed: all **236 resources** validated by `materials:scan`; **39 focused regression tests**; typecheck, full lint, local production build and preservation/idempotency checks. The full repository/extraction suite was not run.

All **28 local desktop/mobile browser checks passed**, including each new video's exact-source playback, duration, play/pause/seek, thumbnail, persisted progress, chapter/English search filters, notes and Resources. Media bytes were intercepted from the exact original files in an isolated PostgreSQL fixture.

All **11 hosted assets** passed release SHA-256 digest, byte-size, MP4-header and HTTP 206 byte-range checks. Existing assets were reused without replacement. Large files are available through the existing release hosting.

## Release outcome

Deployment **`dpl_4wPG9e57XZDEp7H298j4E1FzVVNJ`** is **READY** and assigned to **https://avs-12th-student-hub.vercel.app**. Cloud build passed. All **224 application-source SHA1 digests** match the tested local deployment payload. Source fingerprint: `1235c05b46c871206f6f37e8345006a9e0d49fc59a737374b9c1c742e87b7ef1`.

All **34 live checks passed**: every new hosted video played, paused and sought on desktop and mobile; thumbnails returned JPEGs; all 236 source resources matched expected chapter/hash references; PDF byte ranges passed in six subject groups; chapter/English search, notes, Resources and existing computer models worked; no page errors or horizontal overflow were observed. Browser activity POSTs were blocked during live verification, so no test points or viewing history were added. Normal sample-account authentication/presence updates are expected.

Live public curriculum still reports **995 published MCQs**. The English Bio-Botany chapter counters show five videos in Chapter 6, four in Chapter 7 and two in Chapter 8. A final checksum scan confirms all 243 source files, 725 protected files and original 158 catalogue/resource entries remain unchanged. The short deployment-scoped error/fatal log scan returned no groups; this is not a long-term monitoring guarantee. No direct production content/question/review import or Git push occurred.

Inventory: `materials-folder-nov4b-inventory.json`. Hosting evidence: `materials-folder-nov4b-hosting.json`. Local receipts: `.local/materials-nov4b-{deployment,source-verification,final-preservation,preservation,browser,live-verification}.json` and associated test/build logs. Final documentation was updated locally after release; application source remains unchanged.
