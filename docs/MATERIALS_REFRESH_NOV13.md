# Supplied materials refresh — 13 November 2026

## Source inspection

The full recursive scan of `D:\avs-12-hub\book's` found 377 physical files, including 308 MP4 files and 69 PDFs. SHA-256 grouping identifies 297 distinct videos and 69 distinct PDFs, with 11 byte-identical video aliases. All 362 files from the previous inventory remain present with matching hashes.

Published as supplied study resources are five English NotebookLM genetics videos and ten English handwritten Mathematics PDFs. The ten PDFs contain 161 actual pages. Existing source files, resource IDs, descriptions and aliases are preserved.

## New resources

| Subject and source chapter | Videos | PDFs | PDF pages |
|---|---:|---:|---:|
| Bio-Zoology, Chapter 5, Molecular Genetics | 5 | 0 | 0 |
| Mathematics Volume 1, Chapter 1, Applications of Matrices and Determinants | 0 | 8 | 87 |
| Mathematics Volume 1, Chapter 2, Complex Numbers | 0 | 1 | 42 |
| Mathematics Volume 1, Chapter 3, Theory of Equations | 0 | 1 | 32 |
| Total additions | 5 | 10 | 161 |

The genetics lessons cover DNA fingerprinting, DNA replication, the Human Genome Project, the genetic code and transcription. Beginning, middle and later video frames were inspected. Thumbnails come from the original video frames and retain the source watermarks. Duration metadata comes from each actual MP4 header.

Every new PDF was parsed page by page. First, middle and final page images were rendered for visual topic verification. The 42-page compilation contains Complex Numbers exercises. The Exercise 1.7 PDF contains six actual pages, which is reflected in its metadata. The supplied Chapter 3 compilation has 32 pages. All 12 pages of the Exercise 1.2 file were also inspected. Its title was tightened to describe handwritten notes without claiming additional problems. Titles describe supplied exercise compilations, with solution correctness and completeness awaiting teacher review.

Chapter evidence comes from the registered Bio-Zoology English textbook contents on PDF page 3, printed page III, and Mathematics English Volume 1 contents on PDF page 4, printed page IV. New genetics videos use the existing `tb-12-bio-zoology-english-7e848813-ch-5` chapter. Maths notes use the existing `maths-ch-1`, `maths-ch-2` and `maths-ch-3` chapters. The generic display title in the chapter inventory remains as previously registered. Resource titles and descriptions identify Molecular Genetics explicitly.

These checks establish identity, visible topic, language, file validity and chapter mapping. Full narration, diagrams and worked-solution accuracy await teacher verification. Resource descriptions preserve that distinction.

## Hosting and release preparation

All 15 actual files are hosted as SHA-256-named assets under the repository's existing `learning-materials-2026-10-25` release. Asset sizes and GitHub SHA-256 digests match local files. All 15 pass HTTP 206 checks with valid MP4/PDF signatures and exact total sizes.

Local production build, TypeScript typecheck, changed-file lint, complete material scan and 20 focused tests pass. Full lint retains five existing script errors and 11 existing warnings. The database insert added exactly 15 resources. Replays inserted zero and all 351 original rows remain byte-equivalent. The live library contains 297 videos and 69 notes. All 366 hosted resources pass range, signature and size checks. Desktop/mobile verification covers all five new videos with actual playback and seeking, all ten new PDF reader/download routes, and the existing 995 eligible practice questions. Release details are recorded below.

The machine-readable source inventory is `docs/materials-folder-nov13-inventory.json`. Private source previews, database snapshots, hosting receipts and test logs remain in `.local`.

## Verified results

| Check | Result |
|---|---|
| Full-folder source scan | 377 files, 366 unique resources, 11 duplicate aliases |
| Actual new uploads | 15 matching GitHub SHA-256 digests and sizes |
| New PDF pages | 161 |
| Complete hosted-file audit | 366 passed, zero failed |
| Focused tests | 20 passed, zero failed or skipped |
| Production build | Passed |
| TypeScript typecheck | Passed |
| Changed-file lint | Passed |
| Full lint | Five existing script errors and 11 existing warnings |
| Resource persistence | 15 inserted, all 351 original rows preserved |
| Resource import replay | Zero inserted |
| Catalogue regeneration | No resource-byte changes or duplicate IDs |
| Protected source files | All 32 hashes match |

The inherited lint errors are in `scripts/audit-all-videos.ts` and `scripts/upload-missing-physics-videos.ts`. Both files match the earlier deployed source. Their existing `no-explicit-any` errors are outside the resource-data changes.

Initial cloud CLI polling lost its connection after the build completed. The authenticated Vercel connector confirmed that the deployment reached READY. Playback verification starts the player before checking duration, matching the student Play action. A separate diagnostic confirmed decoding and seeking for all five source videos.

## Final live release

Vercel deployment **dpl_CHdDXdRf7UpyVrPQtNF81cQr1p9m** is **READY** and assigned to **https://avs-12th-student-hub.vercel.app**. Its cloud build completed in **94 seconds**. The alias mapping was verified through the authenticated Vercel connector.

All **34 final desktop/mobile checks pass**. These include all 15 new records, actual playback and seeking for every new video on both viewport sizes, all ten new PDF reader navigation and download paths on both viewport sizes, shared navigation, and the existing **995 eligible questions**. The corrected Exercise 1.2 title is present in the final release.

All **1,073 selected uploaded source-file hashes**, including **249 application files**, match the release manifest. The CLI omits four ignore files. The additional remote entries comprise 402 generated build outputs, one generated type declaration and 130 existing temporary PDF-inspection files. Those temporary files passed the private-credential disclosure scan. Source inventory checks found zero private signing/output/environment paths in the uploaded tree. The final full-folder rescan found zero unknown, missing or modified files. The 32 protected source hashes match. Final question, moderation-candidate, quiz-session, activity and point-event fingerprints match the task's starting snapshot. The 351 earlier resource rows remain unchanged, and a final import replay inserts zero.

Published resources retain labels indicating that full academic accuracy awaits teacher review. Existing MCQ publication rules and saved practice history are preserved. Deployment and source receipts, detailed live results and the five-table fingerprint comparison are stored under `.local/materials-nov13-*`.
