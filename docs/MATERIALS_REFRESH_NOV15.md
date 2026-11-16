# Supplied-folder refresh — 15 November 2026

The complete recursive SHA-256 scan of `D:\avs-12-hub\book's` found 393 physical files, comprising 308 MP4s and 85 PDFs. These represent 297 distinct videos and 85 distinct PDFs, with 11 byte-identical video aliases. All 377 previously inventoried files remain present with unchanged hashes.

Sixteen new English Maths PDFs contain 141 actual pages. There are no new video files in this batch. Existing videos remain available through the current video library.

| Mathematics Volume 1 chapter | New PDFs | Actual PDF pages |
|---|---:|---:|
| 4 — Inverse Trigonometric Functions, supplied Exercises 4.1–4.6 | 6 | 58 |
| 6 — Applications of Vector Algebra, supplied Exercises 6.1–6.10 | 10 | 83 |
| Total | 16 | 141 |

Every new PDF was parsed page by page, and first/middle/final page images were rendered with Poppler and inspected. Chapter titles were checked against the registered English Mathematics Volume 1 contents on PDF pages 4 and 5, printed pages IV and V. Exercise headings were located in the textbook. Exercise labels in the uploaded notes follow the supplied files. Exact question equivalence and solution accuracy await teacher review.

## Preserved source limitations

- Exercise 4.1 contains eight supplied PDF pages, while sampled printed page labels reach ten. A sampled question interval differs from the registered textbook. Its title identifies the packet as partial.
- Exercise 4.2's final page explicitly records unavailable expression/working for Additional Problem 3. Its title and visible reader notice identify the source gap.
- Original page layout, crops, diagrams, question wording and supplied answers remain unchanged. Full coverage and answer accuracy await teacher review.
- Exercises 4.6 and 6.10 remain revision PDFs in the notes library. Their page counts represent PDF pages. They create no practice-bank questions or teacher decisions.

The existing note reader now displays optional source-warning metadata for affected notes. Existing records without warnings retain their usual reader layout. The typed note schema gains an optional `sourceWarnings` field. The deployment ignore file now excludes the local `tmp` inspection directory. These changes support this resource import.

## Hosting, persistence and release

All 16 actual PDFs are hosted as SHA-256-named assets under the existing repository release `learning-materials-2026-10-25`. GitHub asset digests, sizes and uploaded states match the local files. Range requests return valid PDF signatures and exact total sizes. The 72.3 MiB Exercise 6.1 file uses this existing hosting arrangement.

The guarded Supabase import inserted 16 rows and preserved all 366 existing rows exactly. Repeating the import inserted zero rows. The live library now contains **382 distinct resources, comprising 297 videos and 85 PDF notes**. Regenerating the metadata retains stable IDs, all prior records and the same deployed application hashes.

Vercel deployment **dpl_EHfGgRqycM6QSH4RuyJjVxuSd7v5** is **READY**. Its production alias is https://avs-12th-student-hub.vercel.app. The cloud build completed in approximately 133 seconds. Deployment used the existing working tree. No Git push occurred.

The frozen deployment inventory contains 1,080 files. All 1,076 uploaded file digests match, with four ignore files omitted by Vercel. All 249 application-file digests match both the deployed source and the current local application after metadata regeneration. Private credentials, signing files, `.local`, `output` and `tmp` are absent from the uploaded source inventory. Documentation below was completed locally after deployment.

## Actual verification results

| Verification | Actual result |
|---|---|
| Recursive final folder rescan | 393 files, zero missing, modified or unregistered files |
| Original source preservation | All 377 previous file hashes unchanged |
| Hosted media integrity | 382/382 range, signature and total-size checks passed |
| Database rerun | Zero inserted; all 366 original rows unchanged |
| Focused unit tests | 24 passed, zero failed, cancelled or skipped |
| Live desktop/mobile browser checks | 42 passed, zero failed |
| Production build | Passed locally and on Vercel |
| TypeScript typecheck | Passed |
| Changed-file ESLint | Passed |
| Full-project ESLint | Five existing errors and 11 warnings remain |
| Complete material scan | 382 valid resources |
| Git whitespace check | Passed |

The 42 live checks cover both desktop and mobile. Every new PDF opens from the searchable notes library, navigates from page 1 to page 2, and returns an actual PDF byte-range download. Both source-gap notices appear on their corresponding readers. Existing English and Tamil video samples play and seek. An existing reader without warnings remains compatible. Home, resources, AI study tools, models and leaderboard routes load, and the student subject API reports **995 eligible practice questions**. Browser checks blocked activity/points writes. These are scoped resource and navigation checks. The complete application test suite and physical Android-device testing were not run in this checkpoint.

Full-project lint errors remain in `scripts/audit-all-videos.ts` and `scripts/upload-missing-physics-videos.ts`, from existing explicit `any` types. Existing unused-import warnings remain on the founder and home pages.

## Protected data

All 299 previous additional-catalog rows and 299 runtime resource rows remain identical, along with the video-alias registry. All 32 protected local registry/schema/review-file hashes match their existing baseline. The final database fingerprints match the starting snapshot for **3,039 question rows, 12,229 candidate rows, 20 practice sessions, 118 activity rows and 23 point events**. Student eligibility remains 995. No questions or teacher decisions were imported from these PDFs. Original source PDFs remain byte-identical.

Students can open **Notes**, choose **Mathematics** and Chapter 4 or Chapter 6, and search by exercise number. Videos remain available through **Videos**. Exercise 4.1 is visibly partial, and Exercise 4.2 retains its unavailable-problem warning. Academic accuracy and exact exercise completeness remain awaiting teacher review.

The source inventory is `docs/materials-folder-nov15-inventory.json`. Detailed snapshots, previews, receipts and test logs are stored privately under `.local/materials-nov15-*`.
