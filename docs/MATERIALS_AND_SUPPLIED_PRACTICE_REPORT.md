# Supplied study materials and one-mark practice integration

Date: 25 October 2026.

The owner explicitly requested student access without teacher-review evidence. The supplied HTML banks are available as **supplied, unverified practice**. No teacher approval was invented. The original 995 English publications remain separate; these counts must not be added together as a globally deduplicated verified bank.

## Source inventory

`book's/`: 71 physical files, 32 PDFs (784 PDF pages) and 39 MP4s. Four MP4 aliases are byte-identical to existing videos, leaving 67 unique resources: 32 notes/reference PDFs and 35 videos. Added 19 PDFs and two videos to the previous 46 resource rows. New PDFs comprise 16 Computer Science notes, English/Tamil Zoology reproduction notes and a supplied 176-page General Tamil copy. Its edition/current-syllabus alignment remains unverified; it is not substituted for the catalogue textbook.

All PDFs were inspected for readable PDF structure/page counts, and source first-page previews were rendered. Subject/topic mappings for the additions were checked against those previews, including the generic Pyplot filename and the Tamil PDF incorrectly filed under Maths. Both new videos were opened in a browser and their first frames, dimensions and durations inspected. This inventory does not claim every handwritten answer was academically verified.

The 21 additional assets are hosted in the repository release `learning-materials-2026-10-25`, with SHA-256 filenames. Every imported resource passed a remote file-header check; hosted additions also passed exact size/range checks. Original attributions and source files were retained. Details: [material inventory](learning-materials-inventory.json).

## Supplied HTML collections

Ten original HTML files contain 2,424 occurrences. Exact subject/section/text/ordered-option fingerprints merge 180 Maths Volume II duplicates, leaving 2,244 source-bank-unique questions in seven subjects and ten collections. Duplication against the existing official bank has not been reconciled. Original HTML files, hashes, source IDs, row numbers, wording, option order, explanations and SVG evidence are retained. Supplied scripts are never executed by the importer or inserted into the website.

| Collection | Questions | Source-defined sections |
|---|---:|---:|
| Chemistry Volume 1 | 252 | 7 |
| Chemistry Volume 2 | 299 | 8 |
| English | 130 | 6 |
| Physics Volume 2 | 165 | 6 |
| Computer Science | 316 | 16 |
| Mathematics Volume 1 | 190 | 6 |
| Mathematics Volume 2 | 180 | 6 |
| Physics Volume 1 | 175 | 15 |
| Tamil | 135 | 7 |
| Bio-Zoology | 402 | 13 |

Section labels are supplied metadata, not independently verified textbook chapter mappings. All 2,244 have structurally usable answer indices and options. Forty-three questions contain diagram warnings and four contain suspicious Tamil characters. They retain visible source notes; no missing text, official keys or teacher corrections were invented.

## Student experience and access

Open `/resources` → One-mark practice library, or `/practice/collections`. Sign in, choose a collection, section, English/Tamil/bilingual display and 10/25/50/all questions. Start practice, choose an option and press Check answer. The first submitted answer is locked, Previous/Next do not recount it, Finish shows matches/differences/unanswered totals, and Practice again or Retry missed or skipped starts a new attempt. Result feedback explicitly uses the supplied key. Completed attempts are saved under a separate account-scoped browser key; existing textbook history and server performance records are not rewritten.

Administrators can open `/admin/supplied-practice` for source/raw-text inspection and authenticated JSON/CSV reference exports. Comparing answers is not a review decision. Existing local teacher-review manifests remain intact. The notes library uses an authenticated, catalogue-constrained PDF stream for the new GitHub-hosted PDFs; videos retain native playback and existing bookmarks/progress.

## Preservation and verification

Database comparison after import: all 46 old resource rows and all 7,252 old curriculum rows match exactly; 21 resources and one supplied-file reference collection were added. All 3,039 original question rows, 16 quiz sessions, four progress records and 17 existing activity rows match the captured baseline. Published official rows remain 995. All 622 protected local candidate/decision/history/data files match their baseline hashes.

Initial full `npm test`: 226/227 passed; the first test process failed with native out-of-memory. Its separate rerun passed, alongside the supplied-bank/PDF tests (14/14). Typecheck and lint passed before the dependency update. Local Turbopack and Webpack production builds both failed from workstation memory exhaustion. Next.js was updated from 16.3.8 to 16.4.3 and Zod from 4.6.5 to 4.6.6 after the registry audit identified existing critical/high advisories; the install then reported zero vulnerabilities. Browser, post-update checks and release status are recorded below when completed.

Next.js advisory: https://github.com/advisories/GHSA-2464-fhr4-w9xw . Zod advisory: https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 .

Post-update checks: 14/14 focused Node tests passed; typecheck and lint passed. The final production-only registry audit reports zero vulnerabilities. The new supplied-practice browser suite passed 6/6 on desktop/mobile after selector-label corrections and longer development cold-compilation waits. Initial browser runs retained 4/6 and 1/2 results; both issues were subsequently resolved. Vercel production build passed (48 seconds). Authenticated staging verified all ten collections and 2,244 supplied questions, 32 notes, 35 videos, PDF byte ranges and student denial from admin exports. Seven public staging routes passed content checks.

Final verification: 15/15 focused Node tests passed after the last renderer changes, including table normalization, SVG arrowheads and dashed/pattern references. The extended desktop/mobile regression batch passed 22/24; the development server restarted under memory pressure during mobile practice and note-history checks. Both interrupted cases passed in an isolated 2/2 rerun. This is not reported as a clean single-run 24/24 result. A production-prefetch-only case is incompatible with next dev and was excluded from this development-mode selection; its initial attempted run was stopped. Existing textbook extraction candidates, publications and stored practice history retain their baseline hashes/rows. Machine-readable results: [verification receipt](materials-integration-verification.json).
