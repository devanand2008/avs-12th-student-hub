# Bio-Botany folder refresh — 3 November 2026

Recursive inspection of `D:\avs-12-hub\book's` identified **209 physical files: 57 PDFs and 152 MP4 files**. Six existing exact-video aliases leave **203 unique resources: 57 notes and 146 videos**. All 189 source files from the previous inventory retain their hashes and sizes. **20 new unique videos** were prepared; no new PDF or duplicate alias was found.

The initial scan found 12 new files. Validation detected eight more videos added while work was in progress; those were inspected and included before the final checks. The three `Plant_Tissue_Culture` filenames have different hashes, durations and preview content, and are retained as distinct lessons.

## Chapter mapping

All new lessons use the active registered Bio-Botany English subject `tb-12-bio-botany-english-f15d4524`, with chapter IDs ending in `-ch-1` through `-ch-5`.

| Chapter | New videos | Topics |
|---|---:|---|
| 1 — Asexual and Sexual Reproduction in Plants | 4 | Flower structures, pollen development, embryo sac, seeds/apomixis |
| 2 — Classical Genetics | 3 | Classical inheritance, Class 12 classical genetics, post-Mendelian genetics |
| 3 — Chromosomal Basis of Inheritance | 5 | Chromosomal inheritance, crossover, test crosses and genetic mapping |
| 4 — Principles and Processes of Biotechnology | 4 | Principles, recombinant DNA, gene transfer, blotting/bioremediation |
| 5 — Plant Tissue Culture | 4 | Principles, laboratory overview, callus induction, types of culture |

Mappings were compared with the actual textbook contents at PDF page 3 and chapter/topic source text, including Chapter 4 pages 74, 82–86 and 91–98. Public active curriculum records were retrieved read-only. Existing abbreviated registry titles were preserved.

`botany chap 2 video 2.mp4` is deliberately mapped to **Chapter 1**: the source opening slide says “Ch 1: Plant Reproduction” and its midpoint shows pollen development. This filename discrepancy is recorded in the student description. Original filenames/files are preserved.

Introductory and midpoint frames, MP4 duration, dimensions and SHA-256 were inspected for each new file. The visible slide labels are English; the catalogue descriptions explicitly state that narration language and complete academic accuracy were not audited. These are owner-supplied, unverified study resources. Preview inspection is not teacher approval or a complete narration/diagram review. No MCQ publication is implied. The existing source correction warning for `Origin_of_Everyday_Forces.mp4` is retained.

## Delivery and preservation

New resources appear in the existing `/videos` page, chapter lists, language filter and search, with source thumbnails, durations and the existing progress/points behavior. Existing notes remain in `/notes`. Hosting uses hash-named assets in the previously authorised GitHub release `learning-materials-2026-10-25`; large raw videos stay outside the Vercel application bundle.

Verification completed locally:

- `materials:scan` validated **203 unique resources** against all 209 physical files, including PDF headers/page counts and MP4 durations. The first validation detected the eight newly arrived files; the expanded rerun passed.
- **43/43 relevant regression tests passed**, covering materials, source progress, platform behavior, points, 3D models and SEO. No skipped tests in this run; the full extraction/repository suite was not rerun.
- **46/46 local desktop/mobile browser checks passed** for all 20 new videos: exact source playback, duration, play/pause/seek, thumbnails, progress persistence, chapter/language/search filters, notes search and Resources route. Local media bytes were intercepted from the exact original sources; hosted media was checked separately.
- Typecheck, full lint, production build and `git diff --check` passed.
- All **116 original additional-catalogue rows and 116 resource rows** are identical to the pre-import snapshot. **725 other protected files** are unchanged. All **209 source files** retain their hashes. Repeating preparation leaves catalogue and resource bytes unchanged, with no duplicate IDs. Six duplicate aliases are retained.

Early browser runs during catalogue regeneration hit a route-manifest error and request/heading timeouts. The isolated fixture was restarted after the catalogue settled; the final complete 46-check run passed. No application security or review gate was weakened.

All **20 hosted assets** passed release size, SHA-256 digest, MP4 header and byte-range checks. Existing release assets were reused without replacement. The saved Vercel CLI login was rejected; the connected Vercel API deployed the tested application using existing cached files and newly uploaded metadata/thumbnails. An initial cloud package omitted test helpers referenced by the build configuration; that build failed safely. Adding the four existing helpers resolved the packaging error without application changes.

Deployment **`dpl_3auJ5zsfEXbgfNF6yJbcHdAUEa7A`** is READY and automatically assigned to the existing production alias. Cloud build passed; the protected staged `/models` page returned 200. All **216 deployed application-source SHA1 digests** match the local files, including the new catalogue records. Source fingerprint: `edfa4a2976763e1e8f8cd000105f2b243255e297dd1550d4277d71d4533ba74e`. The connector truncates some directory listings; new thumbnails were also checked by HTTP during live verification. A subsequent promotion request correctly reported that this was already the current production deployment.

**52/52 final live checks passed**: all 20 hosted videos played, paused and sought on both desktop and mobile; thumbnails returned valid JPEGs; chapter/language/search filters worked; notes and Resources remained accessible; existing computer models rendered; no horizontal overflow or page errors were observed. All **203 unique source resources** matched their expected source/chapter references in the authenticated API. PDF byte ranges passed for notes across **six subject groups**. An initial live run timed out on one lesson heading; focused checks of the affected routes and the complete final rerun passed without application changes. The short deployment-scoped error/fatal log query returned no groups. Receipts: `.local/materials-nov2-*` and `.local/materials-nov3-*`.

No existing resource override, teacher-review decision, question or practice-history record is deliberately rewritten. No direct production content-table import or Git push is part of this request. Live browser activity POSTs are blocked so verification does not award points or create viewing history; normal login audit/presence updates are expected.

Machine-readable inventory: `materials-folder-nov2-inventory.json` (scan began 2 November and was expanded on 3 November); hosting evidence: `materials-folder-nov2-hosting.json`.
