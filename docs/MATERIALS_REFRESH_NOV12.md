# Supplied materials refresh — 12–13 November 2026

The complete `D:\avs-12-hub\book's` scan reconciles 362 physical files with 351 distinct hosted resources. The scan began on 12 November and release verification continued on 13 November. File identities use SHA-256, retaining genuinely different editions with similar filenames.

## Folder and database inventory

| Measure | Previous baseline | Current |
|---|---:|---:|
| Physical MP4 files | 270 | 303 |
| Physical PDFs | 59 | 59 |
| Distinct videos | 260 | 292 |
| Distinct PDFs/notes | 59 | 59 |
| Byte-identical video aliases | 10 | 11 |
| Distinct learning resources | 319 | 351 |

All 329 previous physical files match their saved hashes. The 33 new physical MP4 files contain 32 distinct additions and one exact duplicate. `மின்னணு_தகவல்_தொடர்பு (1).mp4` shares its hash with the canonical unsuffixed file. `Digital_Electronics.mp4` and `Digital_Electronics (1).mp4` have different content hashes and durations and retain separate entries. There are zero new PDFs.

The 32 additions total 1,199,116,073 bytes and approximately 202 minutes. Each has three inspected source frames, a parsed MP4 duration and a source-derived 850×480 JPEG thumbnail. Source watermarks remain visible. These checks establish file identity, visible language and curriculum topic. Full narration and academic accuracy await teacher verification, as stated in each description.

## New video coverage

| Textbook | Verified chapter | New videos |
|---|---|---:|
| Physics, English, Volume 2 | 10 — Electronics and Communication | 13 |
| Physics, Tamil, Volume 2 | 10 — எலக்ட்ரானியல் மற்றும் தகவல் தொடர்பு | 11 |
| Physics, English, Volume 2 | 11 — Recent Developments in Physics | 4 |
| Physics, Tamil, Volume 2 | 11 — இயற்பியலின் அண்மைக்கால வளர்ச்சிகள் | 4 |

Metadata uses registered textbook IDs `12-physics-english-v2-0ce6704c` and `12-physics-tamil-v2-fb1fa4de`, with their existing chapter IDs. English textbook contents on PDF page 3, printed page III, identifies Chapters 6–11. Tamil source headings on PDF pages 210, 271 and 273 corroborate the selected units. Frame and chapter evidence is recorded in the machine-readable inventory.

Corrected 34 earlier Physics assignments against the actual contents. Ten Wave Optics videos move from Chapter 6 to 7, eight Dual Nature videos from 7 to 8, and sixteen Atomic/Nuclear videos from 8 to 9. The 9 November status entry retains its historical claim. This audit supersedes that entry's combined Ray/Wave chapter and shifted later chapter numbers. IDs, URLs, source files and hashes remain stable. Existing default unit descriptions are corrected only when they exactly match the previous default text.

## Complete available library

Counts reflect actual persisted published resource records, including the 67 older database-backed resources.

| Subject | English videos | Tamil videos | English PDFs | Tamil PDFs |
|---|---:|---:|---:|---:|
| Bio-Botany | 38 | 0 | 9 | 0 |
| Bio-Zoology | 18 | 18 | 4 | 2 |
| Chemistry | 2 | 3 | 11 | 0 |
| Computer Science | 5 | 4 | 16 | 3 |
| English | 19 | 0 | 0 | 0 |
| Mathematics | 1 | 6 | 13 | 0 |
| Physics | 81 | 83 | 0 | 0 |
| Tamil | 0 | 14 | 0 | 1 |
| **Total** | **164** | **128** | **53** | **6** |

The folder contains the resources shown above. These counts describe available supplied material and do not establish complete syllabus coverage.

## Hosting and persistence

The 32 MP4s are hosted as content-addressed assets under the existing repository's `learning-materials-2026-10-25` release, following the previously selected free media-hosting arrangement. All 32 assets report an uploaded state, exact size and matching GitHub SHA-256 digest. All 351 hosted resources passed HTTP 206 range requests, expected total sizes and MP4/PDF signatures. Native playback and seeking were checked separately.

A guarded database operation inserted exactly 32 resources and corrected exactly 34 existing chapter assignments. Existing-ID hash and chapter checks passed before mutation. Repeating the operation inserted zero and corrected zero. A complete comparison of all 319 original database rows confirms that the 34 intended chapter/default-description corrections are the only changes. All other resource fields, IDs, timestamps, notes and administrative metadata match the original snapshot. The total is 351 persisted resources.

Students access `/videos`, click a video card to open `/videos/watch/[id]`, and use the existing native player. Search, language filters, incremental card loading and subject/chapter links remain available. The 59 existing PDFs remain accessible through `/notes` and their existing reader/download routes.

## Verification

| Check | Actual result |
|---|---|
| `npm run materials:scan` | Passed for 351 unique resources, including PDF validation and MP4 duration checks |
| Hosted resource range/signature/size checks | 351 passed, zero failed |
| GitHub new-asset digest checks | 32 passed |
| Focused material/platform unit tests | 38 passed, zero failed or skipped |
| Selected desktop/mobile browser suite | 6 passed |
| Browser playback | English/Tamil Chapters 10 and 11 played and sought on both viewports |
| Final typecheck | Passed after correcting an unsupported Next.js route export |
| Changed-file ESLint | Passed |
| Full `npm run lint` | Failed with 5 existing explicit-`any` errors and 11 existing unused-import warnings |
| Production build | Passed |
| `git diff --check` | Passed |
| Full unit/browser suite | Not rerun for this bounded media refresh |
| Production release and live browser checks | READY, eight final live verification groups passed |

The platform test's old fixed model count was corrected from 39 to the actual existing 43 models. The first browser attempt expected database-backed base resources in the isolated fixture. The final browser tests explicitly check the source-controlled additions present in that fixture. Production resource totals are checked separately against the real database and live APIs.

Next.js generated route types exposed an existing unused `invalidateSubjectsCache` export in `/api/subjects/route.ts`. Repository-wide search found no callers. Removing that unsupported export preserves the existing GET handler, cache and expiry behavior and allows type validation to pass.

Full-project lint errors remain in `scripts/audit-all-videos.ts` (three) and `scripts/upload-missing-physics-videos.ts` (two). Existing homepage/founder unused imports account for the warnings.

## Vercel release

Deployment `dpl_3eNbg9nVzjmYY8PRfVL8hzzefK7B` is READY in `syd1`. The production alias resolves to that exact deployment. The cloud build completed in 115 seconds. The working-tree source package contains 1,069 files, with 44 changed source files totaling 3,584,220 bytes uploaded by digest. Media MP4s remain in the existing GitHub release. A temporary Vercel source-upload transport failure was recovered through idempotent content-addressed uploads.

The source fingerprint is `1a58e1f416b3c8dd19795bd1037f46dc56bd3653b4fe0e08273c85f4977206f8`. Every packaged file matched the local source before final release documentation. The two final status/report documents were completed after deployment. All 249 application-file digests still match the deployed package.

All eight final live verification groups pass across desktop and mobile viewports. They check all 32 new video records, 32 source-thumbnail JPEGs, the 34 corrected chapter links, actual English/Tamil playback and seeking in Chapters 10/11, library search/card navigation, both Supabase-direct and GitHub-proxied PDF reader/download paths, homepage/resources/AI-tools/model-page navigation and the public 995-question count. All 59 notes and 292 videos are present in the authenticated APIs. Client page-error counts are zero. The ten-minute deployment error/fatal log query returned zero groups.

The first live verification attempt incorrectly requested the GitHub PDF proxy for an older Supabase-direct PDF and received 404. The corrected verification follows the reader's actual download link and covers both supported hosting paths. Both paths return HTTP 206 with valid PDF signatures in the final run.

## Protected data

The 32 protected question/review/curriculum/resource-tool registry and schema files outside the three intended media metadata updates match the previous verified hashes. All original source files are retained. The local review decisions and original textbook/crop files are untouched by the importer.

Database snapshots before and after the resource operation match for 3,039 question rows, 12,229 extraction candidates, 19 quiz sessions and 109 activity records. Their ordered row fingerprints also match after the final live run. All 17 point-event rows retain their fingerprint. The final public eligible practice count is 995. Production playback tests intercept activity POSTs, preserving practice progress and points.

## Files and evidence

The source catalogue, runtime resources and alias map receive the additions and corrections. Thirty-two JPEG thumbnails are added. Focused material tests, historical-inventory compatibility checks and desktop/mobile browser checks cover the changes. Machine-readable file and chapter evidence is in `docs/materials-folder-nov12-inventory.json`.

Private `.local/materials-nov12-*` receipts retain the original database snapshot, full hash scan, source previews, uploaded asset receipts, all 351 hosted-file checks, database comparison, SQL replay result and test logs. A final 13 November streamed-hash rescan found the same 362 files with zero unknown, missing or modified files. These private working files are excluded from deployment.
