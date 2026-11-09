# Complete supplied resource-folder refresh

Verified 30 October 2026. Source: `D:\avs-12-hub\book's`.

All **132 physical files** are accounted for: **57 PDFs and 75 MP4s**. These represent **127 byte-unique resources: 57 PDFs + 70 videos**, with 5 byte-identical aliases. All 113 earlier source paths retain their hashes/sizes. There are **18 added videos**, one new duplicate alias and **zero new PDFs**. No original media was modified. The already integrated 57 PDFs remain available in the notes library.

## Added videos and source mapping

Introductory and midpoint source frames, duration and dimensions were inspected for all 19 new physical files. This checks identification, language and playback metadata; it is **not a complete narration, diagram, medical/legal or scientific accuracy review**. All videos remain labelled owner-supplied and academically unverified. No teacher approval or new MCQ answer was created.

Mappings use existing registry entries: `zoo-ch-3` = Reproductive Health, `cs-ch-1` = Function, and `maths-ch-1` = Applications of Matrices and Determinants. The previews support these topics; no new curriculum chapter was invented. The distinct Tamil reproductive-health/infections lesson is retained; its byte-identical “(3)” file points to the “(2)” canonical file. Other similarly named videos differ in bytes/content and remain separate.

| Subject | Existing chapter ID | Video topic | Language | Duration, rounded up |
|---|---|---|---|---:|
| Bio-Zoology | zoo-ch-3 | Medical Termination of Pregnancy (MTP) | English | 302s |
| Bio-Zoology | zoo-ch-3 | Population & Birth Control | English | 394s |
| Bio-Zoology | zoo-ch-3 | Reproductive Health Needs | English | 339s |
| Bio-Zoology | zoo-ch-3 | இனப்பெருக்க நலன் — Reproductive health and infections | Tamil | 472s |
| Bio-Zoology | zoo-ch-3 | இனப்பெருக்க நலன் — Reproductive health needs | Tamil | 385s |
| Bio-Zoology | zoo-ch-3 | மக்கள் தொகைப் பெருக்கம் — Population and birth control | Tamil | 405s |
| Bio-Zoology | zoo-ch-3 | மருத்துவ கருக்கலைப்பு — Medical termination of pregnancy | Tamil | 242s |
| Computer Science | cs-ch-1 | 12ஆம் வகுப்பு: செயற்கூறுகள் — Introduction | Tamil | 184s |
| Computer Science | cs-ch-1 | 12ஆம் வகுப்பு: செயற்கூறுகள் — Definition and reuse | Tamil | 271s |
| Computer Science | cs-ch-1 | Functions in Programming | English | 143s |
| Computer Science | cs-ch-1 | Intro to Functions | English | 218s |
| Computer Science | cs-ch-1 | Mastering Functions — Reusable code | English | 183s |
| Computer Science | cs-ch-1 | Mastering Functions — Input, process and output | English | 466s |
| Computer Science | cs-ch-1 | Power of Functions! | English | 377s |
| Computer Science | cs-ch-1 | கணினி அறிவியல் — Subroutines and functions | Tamil | 172s |
| Computer Science | cs-ch-1 | செயற்கூறுகள் — அறிமுகம் | Tamil | 221s |
| Mathematics | maths-ch-1 | Matrices & Determinants | English | 367s |
| Mathematics | maths-ch-1 | அணிகள் மற்றும் பயன்பாடுகள் — Matrices and applications | Tamil | 335s |

## Student access and hosting

Use [Video Lessons](https://avs-12th-student-hub.vercel.app/videos) and [Notes, Formulas & Study PDFs](https://avs-12th-student-hub.vercel.app/notes) after signing in. Existing subject/chapter links, English/Tamil search and language filters are retained. New chapter playlists: [Reproductive Health](https://avs-12th-student-hub.vercel.app/videos?chapterId=zoo-ch-3), [Function](https://avs-12th-student-hub.vercel.app/videos?chapterId=cs-ch-1), [Matrices and Determinants](https://avs-12th-student-hub.vercel.app/videos?chapterId=maths-ch-1).

All 18 new MP4s are hosted as hash-named assets on the existing owner-authorised GitHub release `learning-materials-2026-10-25`. Each passed hosted size, SHA-256 release digest, 32-byte range and MP4-header checks. Videos stream from that host; raw PDFs/videos and private files are excluded from the Vercel source bundle. Source-derived thumbnails are included in the app. No new external licence or academic-approval claim is made.

Source-controlled additions append to the existing two material catalogues. Stored administrator edits and archives continue to override defaults. No bulk production database import/migration was run. Normal student progress saves retain the existing canonical-resource registration behaviour; verification writes were confined to the isolated local fixture, with live activity POSTs blocked explicitly.

## Actual verification

- Full `materials:scan`: **127 valid canonical resources**, no uncatalogued/missing files after integration. Initial scan correctly reported the 19 newly dropped files before they were catalogued.
- Final resource/platform/progress tests: **28/28 passed**, zero failed/skipped, including an added regression checking all 18 additions against the active chapter registry. Typecheck, full lint, final changed-test lint and `git diff --check` passed. An intermediate attempt to apply the limited memory seed to all older additional resources failed on the explicitly unverified enrichment collection and a legacy Chemistry chapter absent from that seed. The regression now targets this new batch; the old metadata was preserved, and live older-note delivery was checked separately.
- Import preparation rerun: byte-stable catalogue/alias outputs and no duplicate IDs. The 42 original additional catalogue objects and 42 resource objects match exactly; protected local files and all 132 source hashes match their snapshots. Retained English questions remain **995**, supplied HTML entries **2,763**. Teacher decisions, candidate records and practice history were not edited.
- Local browser: **42/42 final checks passed** across desktop/mobile. All 18 new videos per viewport loaded their exact local source bytes, played, paused, sought, matched duration/thumbnail and persisted activity in the isolated database. Chapter/Tamil search, notes empty-state search and /resources passed; no horizontal overflow or page-script errors. The fixture contains the 25 source-controlled additional notes, not all 57 live notes; live coverage was checked separately. Earlier helper attempts failed on a relative URL, a Windows-encoded Tamil lookup and the incorrect fixture-count assumption; these were corrected and the final run completed. A user interruption stopped background jobs; uploads resumed without replacing existing assets.
- Staged authenticated API: **57 notes / 70 videos**, every one of the 127 canonical source files represented, all 18 added video records exact. PDF byte ranges passed across 6 available subjects. Twelve supplied collections / 2,763 entries and denied student/admin-export access remain intact.
- Vercel production build: **READY**. The CLI lost its polling connection with “fetch failed” after upload; authenticated deployment inspection independently confirmed the build succeeded, and the existing artifact was verified instead of creating an unnecessary replacement.
- Live public desktop/mobile: **14/14 checks passed**. Verified all 18 new API records and 57/70 totals, real hosted English/Tamil playback/seek across all three added subject/chapter groups, search, notes empty state and /resources. No horizontal overflow or page-script errors. Live progress writes were blocked; persisted progress was tested locally. The deployment-scoped error/fatal runtime-log query returned no groups in the recent 10-minute window; this does not establish long-term monitoring.
- The full 252-test repository suite passed during the preceding HTML milestone; it was **not rerun** for this catalogue-only update. No claim of every app feature or physical-phone testing is made.

## Release and changed files

Deployment **`dpl_9cYAVHyayYa2wJVVhN47h1c3CiHF`** is READY and promoted to [the existing Vercel site](https://avs-12th-student-hub.vercel.app). Application source fingerprint: `4a6aaf7ebbb666691acaacb36e4b97f8972f61f94b20624a15e5402501f0f703`. The alias was checked against this exact deployment. This is a working-tree release; no Git commit or push was requested or performed in this task. Existing unrelated `output/` content remains untouched.

Product changes: `src/lib/additional-materials-catalog.json`, `src/lib/additional-materials-resources.json`, `src/lib/video-source-aliases.json` and 18 source thumbnails. The chapter-mapping regression is in `tests/learning-materials.test.ts`. The existing pages/components/schema were preserved. Inventory: [full source reconciliation](materials-folder-refresh-inventory.json); hosting: [18 verified assets](materials-folder-refresh-hosting.json). Private browser, staging and preservation receipts remain under `.local`. Protected record preservation is based on authoritative local snapshots, not a new complete live database snapshot.
