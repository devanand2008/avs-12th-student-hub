# Physics magnetism video refresh — 4 November 2026

Recursive inspection of `D:\avs-12-hub\book's` found **232 physical files: 57 PDFs and 175 MP4s**. All 209 files in the previous inventory retain their hashes and sizes. The 23 new MP4 files contain **22 unique videos** and one exact duplicate. Total unique resources are **225: 57 notes and 168 videos**, with seven video aliases.

All 57 PDFs were already represented; no new note PDF was found. The existing handwritten notes stay available in `/notes`. No resource or question was deleted.

## Source and chapter mapping

The 22 new canonical videos have source previews, durations, SHA-256 hashes, byte sizes and thumbnails. All are mapped to the existing Physics Volume 1 Unit 3 chapters in the appropriate medium. Both original textbooks were inspected: `12-physics-english-v1-1b1de8f8.pdf` and `12-physics-tamil-v1-c1623725.pdf`, contents at **PDF page 3**, printed Unit 3 start **125** (PDF page **133**). English title: **Magnetism and magnetic effects of electric current**. Tamil title: **காந்தவியல் மற்றும் மின்னோட்டத்தின் காந்த விளைவுகள்**. Current public curriculum confirms both active chapter IDs; its generic chapter labels were preserved.

| Medium | New videos | Topics visible in source previews |
|---|---:|---|
| English | 11 | Magnetism introduction; current's magnetic effects; Ampere's circuital law; Biot–Savart law; Lorentz force; magnetic torque/energy; axial/equatorial field geometry; magnetic materials, quantities and properties; hysteresis |
| Tamil | 11 | Magnetism introduction; current's magnetic effects; Ampere's law; Biot–Savart law; Coulomb's magnetic law; two distinct Lorentz-force lessons; torque/potential energy; magnetic quantities/materials; hysteresis |

`phy/video/காந்தவியலின்_ரகசியங்கள் (1).mp4` is byte-identical to `phy/video/காந்தவியலின்_ரகசியங்கள்.mp4`: one canonical listing and an explicit alias preserve both source files without duplicate cards. The two Tamil Lorentz-force files have different durations and hashes and remain separate lessons.

Language classification is based on visible English/Tamil slides, not only filenames. Introductory and midpoint frames were inspected, not the full narration. Videos remain **owner-supplied and academically unverified**. Diagrams, generated illustrations and complete scientific accuracy need teacher review; these resources do not approve or add MCQs. Original video watermarks are preserved. The earlier `Origin_of_Everyday_Forces.mp4` caption correction warning remains intact.

## Integration and preservation

New listings use the existing `/videos` interface, chapter selection, language/search filters, native playback, bookmarks and completion-reward logic. Tamil titles are retained for display/search. New thumbnails are original video frames without player controls. The existing `/resources`, AI tools, model lab, scoreboard and gift workflow are preserved.

Large files use SHA-named assets in the existing GitHub release `learning-materials-2026-10-25` in `devanand2008/avs-12th-student-hub`, following the owner's previously selected free hosting arrangement. Raw MP4s are excluded from the Vercel bundle. There is no Git branch push or direct production resource-table import.

All **136 original additional-catalogue entries and 136 resource records** are identical to the before snapshot. All **725 protected local files** retain their hashes; all **232 source files** retain their scanned hashes. Re-running preparation leaves the three catalogue/resource/alias JSON files byte-stable and does not duplicate IDs. Existing notes, 995 published questions, candidates, teacher decisions, saved practice history and point balances are not rewritten by this change.

## Verification

Passed: `materials:scan` validates all **225 resources** (PDF headers/page counts and MP4 duration/hash checks); **38 focused tests**, TypeScript typecheck, full lint, production build and source-preservation/idempotency checks. Full extraction/repository tests were not run.

All **50 local desktop/mobile browser checks passed**, including exact-source playback, play/pause/seek, durations, thumbnails, persisted viewing progress, English chapter/search filtering, notes search and Resources navigation. These checks use an isolated local PostgreSQL fixture and intercept media with the exact original MP4 bytes. No production activity is submitted by these local checks.

All **22 hosted assets** passed release SHA-256 digest, size, MP4 header and HTTP 206 byte-range verification. Existing release assets were reused without replacement. Original files and aliases remain intact. No new PDF was uploaded because all 57 are already represented.

## Release outcome

Deployment **`dpl_FsVwMproMhHpj5uYJrd3rf1Yew2Q`** is READY and assigned to **https://avs-12th-student-hub.vercel.app**. Cloud build passed; all **224 deployed application-source SHA1 digests** match the tested local payload. Deployment source fingerprint: `694f7615cd054a9c5270e1d1f525f20676c18241b4dbecbce1ca95bc3efcc133`.

All **56 live checks passed**: every new hosted video played, paused and sought on desktop and mobile; all thumbnails returned JPEGs; all 225 source resources matched their expected chapter/hash references; PDF byte ranges passed across six subject groups; Tamil-language filtering and Tamil-script search worked; notes and Resources remained accessible; existing computer models rendered; no page errors or horizontal overflow were observed. Production activity POSTs were blocked during browser verification, so these checks did not award points or create viewing history. Normal sample-account authentication/presence updates are expected.

The live public curriculum reports **995 published MCQs**, unchanged. English Unit 3 now has 11 videos; Tamil Unit 3 has 12, including its one earlier video. A final rescan confirms all 232 source files, 725 protected files and original 136 catalogue/resource entries remain unchanged. The short deployment-scoped error/fatal log scan returned no groups; this does not substitute for ongoing monitoring. No direct production resource/question/review-table import or Git push was performed.

Machine-readable inventory: `materials-folder-nov4-inventory.json`; hosting evidence: `materials-folder-nov4-hosting.json`. Local receipts: `.local/materials-nov4-{browser,live-verification,preservation,final-preservation,release-verification,deployment}.json` and associated test/build logs. Documentation was finalised after the release; deployed application source remains unchanged.
