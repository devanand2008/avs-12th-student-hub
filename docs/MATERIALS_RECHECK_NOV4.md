# Full materials-folder recheck — 4 November 2026

The owner requested another complete scan and Vercel redeployment after the magnetism release. A fresh recursive checksum comparison against `materials-folder-nov4-inventory.json` confirms:

| Item | Actual result |
|---|---:|
| Physical files checked | 232 |
| MP4 files | 175 |
| PDF files | 57 |
| Unique video resources | 168 |
| Unique PDF notes | 57 |
| Duplicate video aliases | 7 |
| New or modified source files since the previous release | 0 |
| Protected local files unchanged | 725 |

All source paths, SHA-256 hashes and original catalogue/resource entries match. There is no new content to import and no duplicate listing was added. All 224 application-source files match the previously tested deployment. Only its final local documentation differs from the uploaded release snapshot.

The previously completed 38 focused regression tests, 50 local browser checks, 56 live checks, typecheck, lint and builds belong to the earlier release; they are not claimed as fresh test runs. Because application code, datasets and media bytes have not changed, this recheck reuses that verified release and performs a new cloud build and representative live checks. No dependency upgrade, database migration, content import, academic approval or Git push is part of this recheck.

The requested Vercel redeployment was rebuilt from `dpl_FsVwMproMhHpj5uYJrd3rf1Yew2Q`. New deployment **`dpl_GAdxkShJpf5hmTLHK2HaN9E3biG5`** is **READY** and assigned to **https://avs-12th-student-hub.vercel.app**. Cloud build passed and all **224 application-source digests** match the unchanged verified payload. Source fingerprint remains `694f7615cd054a9c5270e1d1f525f20676c18241b4dbecbce1ca95bc3efcc133`.

**12 fresh desktop/mobile live checks passed:** all 225 source records match expected chapter/hash references; video and note counts are 168 / 57; representative English and Tamil hosted clips play, pause and seek; language and Tamil-script search work; PDF byte ranges return valid PDF bytes; Resources and the scoreboard/gift card open; there are no page errors or horizontal overflow. Live public curriculum still reports **995 published questions**. Activity POSTs were blocked during playback, so no test viewing history or points were created. Normal sample-account login/logout/presence updates are expected. The short deployment-scoped error/fatal scan returned no groups.

The full unit/lint/typecheck/local-browser suite was not repeated for identical application bytes. No production database/content import, fake question approval, additional resource listing or Git push was performed. Documentation was finalised locally after release.

Scan evidence: `.local/materials-nov4-final-preservation.json`. Fresh live evidence: `.local/materials-recheck-nov4-live.json`; source digest checks: `.local/materials-recheck-nov4-source-verification.json`; deployment manifest: `.local/materials-recheck-nov4-deployment.json`. Original inventory/source and hosting evidence remain in `materials-folder-nov4-inventory.json` and `materials-folder-nov4-hosting.json`.
