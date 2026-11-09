# Chemistry resource-folder refresh — 31 October 2026

Full recursive scan of `book's`: **189 physical files**, comprising **57 PDFs and 132 MP4s**. Byte deduplication yields **57 notes and 126 unique videos**, with six existing duplicate aliases. All 184 earlier source files match their saved hashes and sizes. Five new unique videos were added; no new PDF or alias was found.

| Source under `che/video/` | Medium | Chemistry Volume 1 unit |
|---|---|---|
| `Class_12__Transition_Elements.mp4` | English | 4 — Transition and inner transition elements |
| `p-Block_Elements_-_II.mp4` | English | 3 — p-Block Elements II |
| `அலகு_1__உலோகவியல்.mp4` | Tamil | 1 — Metallurgy |
| `அலகு_2__p-தொகுதி_தனிமங்கள்_I.mp4` | Tamil | 2 — p-Block Elements I |
| `வேதியியல்__அணைவு_வேதியியல்.mp4` | Tamil | 5 — Coordination Chemistry |

Introductory and midpoint frames, duration, dimensions and hashes were inspected. Topic mappings were compared with the textbook contents and active registered chapters retrieved read-only from `/api/subjects?library=all`. Existing chapter titles retain parser/file-layout wording; these were not rewritten. New resources use the appropriate English/Tamil textbook subject and chapter IDs. Earlier resources and archived/admin-edited overrides remain intact.

These are owner-supplied resources awaiting academic verification. Preview inspection is not a complete narration, formula, diagram or scientific audit. No teacher approval or MCQ publication is implied. Existing source-error warnings remain unchanged.

Hosting uses the existing repository release `learning-materials-2026-10-25` with hash-named assets. The Vercel bundle contains catalogue metadata and thumbnails, with raw videos retained outside the deployment bundle. Students can find lessons through `/videos`, chapter selection, language filters and search; existing PDFs remain available through `/notes`.

Preservation checks: all 111 earlier additional-catalogue objects and 111 resource objects match exactly; six aliases and 725 other protected local files are unchanged. Rerunning preparation is byte-stable. Original textbook/source files, question records, review decisions and practice snapshots remain intact. No production content-table import or question/history rewrite is performed.

Validation passed: 183-resource dry-run scan; 38/38 relevant resource, platform, progress and model tests; 16/16 local desktop/mobile cases; typecheck; full lint; diff check; Vercel production build. Staged authenticated APIs confirmed all sources and five exact new video records, PDF byte ranges across six subjects, 12 supplied collections / 2,763 entries, and student admin-export denial. All five hosted files passed size, digest, header and range checks. Full repository tests were not rerun.

Deployment `dpl_FyAXTWNMhFsc7oLrFQQoUPVWeZdb` is READY and promoted to https://avs-12th-student-hub.vercel.app. Source fingerprint and alias were independently checked. Live desktop/mobile checks passed 16/16: all five new videos played/paused/sought in each viewport; both new computer models rendered; note/search/Resources checks passed. Activity POSTs were blocked during live checks, and progress persistence was tested locally. The recent deployment-scoped error/fatal query returned no groups; this is a short observation window. No Git push occurred.

Initial saved authentication was rejected; renewed account access and a network retry completed deployment. One upload timed out and was resumed with only the missing assets uploaded. No earlier release asset was overwritten.

Machine-readable evidence: `materials-folder-oct31d-inventory.json` and `materials-folder-oct31d-hosting.json`. Existing working-tree changes were retained and included in deployment, including the locally tested computer-model expansion.
