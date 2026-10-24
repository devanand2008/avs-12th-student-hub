# MCQ, 3D and practice portal integration — October 23, 2026

Local-only work in the existing Skill Up application. No production access, deployment, database migration application, publication, Git commit or push. Existing uncommitted model/resource work was preserved; Agent 1's resources internals were not rewritten. This is verified incremental delivery, **not complete all-subject academic coverage**.

## Coverage and source inventory

All **82 registered PDFs / 24,088 cached pages** were checksum-inventoried and the full extraction workflow reran with **zero added IDs on rerun**, zero extraction failures. Physical source scan also found **13 handwritten Mathematics PDF files under book's/**; their identity/paths/hashes are listed separately as not_started, not silently treated as official book-back questions. No new source was downloaded or rehosted.

The **856 chapter entries are provisional parser entries**, not a teacher-confirmed academic chapter total. Current general bounded coverage is **79 sections / 1,044 proposals**; **777 provisional entries lack a general bounded section**, **733 lack dated publications**. Other Physics-specific review packets are counted separately by the existing audit. No chapter/book is marked complete_after_verification. [Every PDF, source filename/hash, medium, volume and chapter state](portal-coverage.json), [chapter CSV](portal-chapter-coverage.csv), and the existing [processing manifest](textbook-processing-manifest.json) remain machine-readable.

The old Chapter 2 backlog was already processed. The next actual unfinished chapters were inspected and processed in this pass:

| Book / medium | Chapter | Full chapter PDF span | MCQ PDF / printed pages | Held occurrences |
|---|---|---|---|---:|
| English Bio-Zoology | 3 — Reproductive Health | 40–52 | 50–51 / 42–43 | 8 |
| Tamil Bio-Zoology | 3 — இனப்பெருக்க நலன் | 43–59 | 56–57 / 48–49 | 8 |
| Tamil Basic Electrical Engineering | 3 — மின் வெப்பச் சாதனங்கள் | 49–66 | 63–65 / 55–57 | 18 |

Contents, chapter openings, exercise pages, ending/next-chapter pages were rendered and inspected. English Zoology source pages 3,40,49–53; Tamil Zoology 3,43,56–60; Electrical 7,49,62–67. Intervening lesson pages were not individually transcribed. Scientific model contexts were visually checked in Physics PDF28,62,172 and Mathematics PDF229–231; DNA context uses the existing Molecular Genetics source text. Private renderings are under .local/portal-source. Chapter 3 expanded original review page receipts from 297 to 328; later Chapter 4 receipts are additional; six original crops preserve two tables per Zoology edition and Electrical formula/label evidence.

**34 source occurrences: 28 reused IDs / six recovered IDs**, 34 held, 34 unknown answers, zero explicit key matches, teacher decisions, approvals or publications. All are four-choice source items; Zoology's evaluation does not print a one-mark allocation, so the report does not invent one. Electrical Part A explicitly prints one mark. Q18 continues onto PDF65; stopping at PDF64 would be incomplete. Q9 onward in Zoology and Electrical Parts B/C/D remain excluded rather than converted into MCQs.

Original extraction and proposed transcription are separate. Table row alignment, cross-page English Q6, Tamil glyph damage, Electrical Q8 superscripts and Q11's extracted repeated அ versus the visible printed ஆ are held for review. English Q8 says “correct action”; Tamil asks for the wrong statement. Bold formatting is not an answer key. No answer is inferred from scientific reasoning. Reused page/number identities retain provisional-identity warnings where original text was damaged.

The nine recovered IDs across Chapter 3 and the integrated Chapter 4 work are:

- textbook-bounded-12-basic-electrical-engineering-tamil-029f513a-b8a06fec93505ff3
- textbook-bounded-12-bio-zoology-english-7e848813-9f6b901d8073a8e8
- textbook-bounded-12-bio-zoology-english-7e848813-2bfa576356f19f3c
- textbook-bounded-12-bio-zoology-english-7e848813-6a5c8c90e059ac7b
- textbook-bounded-12-bio-zoology-english-7e848813-1768cb37df5253e8
- textbook-bounded-12-bio-zoology-english-7e848813-0850e6a27d3bae29
- textbook-bounded-12-bio-zoology-tamil-2631f8e3-5534d4c744e2fb5f
- textbook-bounded-12-bio-zoology-tamil-2631f8e3-60a07e9b0955d998
- textbook-bounded-12-bio-zoology-tamil-2631f8e3-eb175cdd92fd2c90

All 34 stable IDs, ordered choices, source spans, PDF/printed pairs, signatures, held status and batch IDs are in the three Chapter 3 proposal packets and portal-coverage.json. Batch source signatures are preserved separately from physical occurrences. Same-wording occurrences are retained rather than merged; the global audit still lists **1,179 duplicate occurrences beyond the first** and **1,206 active rows without four nonempty choices** as held diagnostics. One pre-existing Economics D/three-choice mapping remains held. This is not a count of new duplicate errors.

## Review, data integrity and practice

Saved records **17,329 → 17,338**; active **12,738 → 12,747**; inactive **4,591 unchanged**; bounded proposals **953 → 1,044**. All **17,329 earlier raw candidate objects, 953 earlier proposals and 468 protected files** match the initial snapshot. Append-only source definitions and page/crop receipts retain every older entry. Existing reviewer decisions/history were preserved. New pending manifests contain no invented teacher identity. The Q18 pending entry was appended with an exact comparison of all 17 earlier entries; startup now persists such safe resumptions atomically.

There are **1,059 pending decisions in 80 local review batches; reviewed/approved/rejected/history events all zero**. The protected dated bank remains **995 English / zero Tamil**, twelve held legacy samples excluded; thirteen dated practice-session snapshots unchanged. Snapshot SHA256: 2b353c35dabec50c349918da09c19d2c1e74042848efaeb9163ea5a4f0f1bd8a. These are local October 10 snapshots, **not fresh live counts or retrospective human teacher approvals**. New publication still requires the genuine individual authenticated review workflow. Run npm run mcqs:review and use the Chapter 3 subject/medium batches; no local export or import was fabricated.

Student flow remains Home → medium → subject/book/volume → chapter → HTML practice. Counts use the existing shared eligibility gate, including the explicitly protected legacy bank exception. Empty/held-only selections explain verification is pending. No question-paper resource is imported into the textbook bank; textbook_bookback_one_mark, previous_year_exam_one_mark and model_exam_one_mark are distinct origin contracts in portal-coverage.json. The latter two have no new MCQ rows.

Fixed post-feedback answer replacement: non-timed Submit Answer now locks the first recorded answer in UI, memory persistence, single-answer SQL and bulk SQL under row locks. The API returns the actual recorded answer under repeated requests. **Clear answer** and changing options work before submission. Timed drafts remain editable. Unsubmitted choices count as skipped; conventional one-mark scoring remains correct=1, wrong/skipped=0. Final submissions remain idempotent; retakes create new session IDs and preserve history. The new **20261023_practice_answer_lock.sql** is present and tested only in isolated PostgreSQL. It has **not been applied to any production database**, and persistent installations need that migration before relying on server-side locking.

## Interactive models

Existing /models is preserved; **/interactive-3d** exposes the same lab. Actual inventory: **15 procedural models** — Biology 6, Physics 3, Chemistry 4, Mathematics 1, Computer Science 1. Added the coordinate-vector model and one genuine scalar animation t(2i+2j+k) with timeline, speed, play/pause and length readout. Camera orbit is not counted as an educational simulation. Search, all registered subject filters, textbook medium and verified source-chapter filters are present; unsupported selections show a coverage gap.

Five model contexts are mapped to four real English textbook chapters. The other ten models are explicitly general concepts. Tamil chapter associations/translations, other subject models and most chapter mappings remain gaps; English labels are disclosed. Existing generic registry anchors are no longer presented as confirmed textbook mappings.

| Model | Subject | Verified source context / gap |
|---|---|---|
| Vectors in three dimensions | Mathematics | 12-mathematics-english-v1-e33ceed7, ch 6, PDF 230 / printed 222 |
| Replicated chromosome | Biology | General concept; unverified chapter mapping |
| Bacterial cell | Biology | General concept; unverified chapter mapping |
| Electric dipole | Physics | 12-physics-english-v1-1b1de8f8, ch 1, PDF 28 / printed 20 |
| Ammonia molecule · NH₃ | Chemistry | General concept; unverified chapter mapping |
| Carbon dioxide · CO₂ | Chemistry | General concept; unverified chapter mapping |
| Inside an animal cell | Biology | General concept; unverified chapter mapping |
| Structure of a neuron | Biology | General concept; unverified chapter mapping |
| Parallel-plate capacitor | Physics | 12-physics-english-v1-1b1de8f8, ch 1, PDF 62 / printed 54 |
| Solenoid coil | Physics | 12-physics-english-v1-1b1de8f8, ch 3, PDF 172 / printed 164 |
| Water molecule · H₂O | Chemistry | General concept; unverified chapter mapping |
| Methane molecule · CH₄ | Chemistry | General concept; unverified chapter mapping |
| DNA double helix | Bio-Zoology | 12-bio-zoology-english-7e848813, ch 5, PDF 70 / printed 62 |
| Inside a plant cell | Bio-Botany | General concept; unverified chapter mapping |
| Binary search tree | Computer Science | General concept; unverified chapter mapping |

All geometry is authored locally in TypeScript using the already installed Three.js 0.186.1. No external GLB/glTF or downloaded/hotlinked model, no separate asset byte payload, no new rendering dependency. Creator/source/format and the honest licence state are displayed: project source, no separate redistribution licence declared; no third-party rights are invented. Original asset URL is null because there is no external asset. Geometry is illustrative, not to scale or an official exam/anatomy diagram. Molecular/anatomical simplifications remain disclosed.

Renderer code is loaded only on Explore in 3D. Rotation defaults paused; reduced motion prevents animation; tabs/offscreen rendering are throttled, pixel ratio capped at 1.5 and resources disposed. Touch drag/pinch, keyboard arrows/+/-/Home, reset, selected parts, pause/resume and supported fullscreen remain functional. Without WebGL the description, part buttons and scalar readout remain accessible. Software WebGL desktop/mobile checks are not a claim of physical low-end-device certification.

## Study Resources integration

Read Agent 1's [handoff](STUDY_RESOURCES_REPORT.md). Shared home/navbar/sidebar already linked /resources and /models; retained those established links and added the lab's Study Resources cross-link. Verified contract: /resources, /resources/all, /resources/question-papers, /resources/learning-materials, /resources/video-lessons, /resources/temporary and /resources/item/[id]. No missing /study-resources route was invented or imported. Current resource audit: **103 records / 17 listed / 86 temporary / zero new local PDF copies**. Resource counts never enter MCQ counts. Video error/embed behavior is browser-tested locally; no claim of fresh real playback for every external lesson.

## Validation receipts

For concurrent local work, set PowerShell $env:AVS_PORTAL_QA_BUILD='true' before npm run build and npm run test:e2e. This uses .next-portal, loopback ports 3140/3141 and private .local/portal-playwright-* artifact folders; the default app/build/test settings remain .next and 3100/3101. next.config.ts, Playwright/server helpers and Next's generated tsconfig includes were updated for this isolation. A different local task rebuilt the default .next directory during the first run; a subsequent startup failed because its build had no BUILD_ID. Another browser run also removed shared trace files (ENOENT during context.close). Those infrastructure failures are retained in logs rather than attributed to scoring or model behavior.

Detailed command results and logs: [verification JSON](portal-verification.json). Earlier integration-in-progress failures are retained in .local/portal-baseline-tests.log (199/210, 11 failures while packets/assets/count assertions were changing); this was not a clean immutable baseline. Source-layout assertions deliberately stopped initial extraction attempts until actual table labels and the last Electrical page were reconciled. A first build identified missing script types, subsequently fixed. The first default browser run exposed a select-label test locator, corrected without removing behavior checks.

| Command / suite | Exit status (null = not finished/run at report generation) |
|---|---:|
| Full unit/integration suite | 1 |
| New concurrent AI module unit suite | 0 |
| Default full Playwright clean isolated run | 0 |
| Playwright run with shared artifact collision | 1 |
| Default Playwright initial run | 1 |
| Actual-book and direct-account browser | 0 |
| Admin-approval browser | 0 |
| Typecheck | 0 |
| Lint | 0 |
| Production build | 0 |
| All82 extraction rerun | 0 |
| Source-page comparison | 0 |
| MCQ parser audit | 0 |
| Extraction/decision audit | 0 |
| Physics review audit | 0 |
| Teacher decision audit | 0 |
| Systematic coverage audit | 0 |
| Resource audit | 0 |
| Diff whitespace check | 0 |
| Dependency audit | 1 |
| Chapter 2/3/4 reconciliation regression (7 passed) | 0 |
| Final gallery (4 passed) | 0 |
| Source lifecycle (1 passed) | 0 |
| Latest integrity audit | 0 |

Final isolated browser results: **74 passed / 12 opt-in skipped**, with an additional **6 direct-account/real-book cases**, **4 admin-approval cases**, and **4 final gallery cases** passing. The full unit/integration run ended **212/214 passing**: two extraction regressions arose while Chapter 4 definitions and packets were changing. After reconciliation, all **7 affected Chapter 2/3/4 and resumption checks passed**, recorded in .local/final-lab-focused-final.log. The lifecycle test also passed after removing an assumption that three drafts must always remain unfinished. A concurrently running fresh full suite is not claimed as passed here. Focused scoring tests: **23/23 passed**, including atomic repeated/bulk/concurrent saves and timed changes. Focused prior 3D/extraction/platform checks: 26/26 passed before the additional resumption test. Source audit freshly matched **713 pages, zero mismatches**; it is sampled text verification, not exhaustive academic validation. The all82 rerun before Chapter 4 added zero IDs. Chapter 4 targeted rerun equality is covered by the seven passing regression cases. The parser audit's 985 “verified” / 11,244 “pending” counters are legacy parser classifications, not human approvals or additional publications. Real test accounts/teacher decisions exist only in isolated fixtures. Local installed Gemma inference opt-ins and production systems were not exercised.

Dependency audit is a separate **pre-existing failure**: installed Next.js 16.3.8 is in the npm advisory range for GHSA-2464-fhr4-w9xw, GHSA-p3m5-59mp-jv5r and GHSA-673q-mjm6-r5xr. npm reports one critical dependency and suggests Next 16.4.3. No automatic framework upgrade, audit fix, dependency or lockfile churn was added to this feature change. Plan a separately verified Next upgrade; do not treat the feature build pass as a security audit pass.

## Remaining work and next batch

Academic completion remains false. The complete per-book/chapter backlog is in portal-chapter-coverage.csv and textbook-processing-manifest.json; 777 entries lack general bounded sections and cannot be labelled absent exercises without inspection. All 42 Tamil textbook records have zero dated eligible questions. Genuine review of the 1,059 pending entries, faithful Tamil/math/code/diagram transcription, unknown answers, five-choice scoring support, unregistered handwritten sources, external resource verification and broader 3D/Tamil mappings remain outstanding. Sources are available for many of these tasks; they are pending work, not falsely labelled blocked_by_source. Only publication/answer confirmation requires the genuine review evidence/workflow.

The Chapter 4 batches were reconciled during concurrent local work: English Bio-Zoology PDF53–65, exercises63–64 (21); Tamil Bio-Zoology PDF60–75, exercises72–74 (21); Tamil Electrical, இயந்திர மின்சாதனங்கள், PDF67–90, exercises86–88 (15). Contact sheets were independently inspected. These 57 held occurrences reuse 54 IDs and recover three; no answers, approvals or publication were inferred. The older Electrical alternator title was incorrect. All three definitions are now source_checked, meaning extraction boundaries checked, not teacher-approved. Next source openings are Chapter 5 at English Zoology PDF66, Tamil Zoology PDF76 and Tamil Electrical PDF91; their exercise boundaries still need inspection.

## Changed integration files

Models: src/app/models/page.tsx, src/app/interactive-3d/page.tsx, src/lib/models.ts, src/lib/model-curriculum.ts, src/components/learning/ModelCanvas.tsx. Practice: session page, individual answer API, memory driver, new SQL migration and fixture wiring. Extraction: shared source/figure definitions, question-specific table-label pattern, safe pending-manifest resumption. Audits: scripts/audit-portal-coverage.ts, scripts/audit-portal-integrity.ts and package audit scripts. Tests: new Chapter3, answer-lock and gallery cases; existing scientific batch scope and scoring expectations updated. Reports: this report, portal coverage/CSV/integrity/verification and existing local processing/audit reports. Agent 1's distinct report and internals remain intact.

## Registered textbook inventory

“Bounded proposals” are held extraction evidence, not playable questions; “dated eligible” uses the protected snapshot. Exact filenames, local paths, SHA256 and chapter records are in portal-coverage.json.

| Catalog ID | Subject | Medium | Volume | Pages | Bounded proposals | Dated eligible |
|---|---|---|---|---:|---:|---:|
| 12-accountancy-english-c0f4ded3 | Accountancy | English | — | 368 | 0 | 94 |
| 12-accountancy-tamil-6e7f5476 | Accountancy | Tamil | — | 368 | 0 | 0 |
| 12-advanced-tamil-tamil-6679b417 | Advanced Tamil | Tamil | — | 288 | 0 | 0 |
| 12-agricultural-science-tamil-1d871464 | Agricultural Science | Tamil | — | 336 | 0 | 0 |
| 12-auditing-english-cb18c74c | Auditing | English | — | 184 | 0 | 91 |
| 12-auditing-tamil-e1982513 | Auditing | Tamil | — | 200 | 0 | 0 |
| 12-basic-automobile-engineering-english-69f8e9f9 | Basic Automobile Engineering | English | — | 280 | 0 | 0 |
| 12-basic-automobile-engineering-tamil-e76f29d2 | Basic Automobile Engineering | Tamil | — | 288 | 0 | 0 |
| 12-basic-civil-engineering-english-fc2d4128 | Basic Civil Engineering | English | — | 248 | 0 | 47 |
| 12-basic-civil-engineering-tamil-122addb5 | Basic Civil Engineering | Tamil | — | 280 | 0 | 0 |
| 12-basic-electrical-engineering-english-13c7fc7b | Basic Electrical Engineering | English | — | 216 | 156 | 0 |
| 12-basic-electrical-engineering-tamil-029f513a | Basic Electrical Engineering | Tamil | — | 232 | 61 | 0 |
| 12-basic-electronics-engineering-english-983efd90 | Basic Electronics Engineering | English | — | 304 | 0 | 93 |
| 12-basic-electronics-engineering-tamil-96fcb4f2 | Basic Electronics Engineering | Tamil | — | 352 | 0 | 0 |
| 12-basic-mechanical-engineering-english-e15ca391 | Basic Mechanical Engineering | English | — | 224 | 0 | 0 |
| 12-basic-mechanical-engineering-tamil-49be34e2 | Basic Mechanical Engineering | Tamil | — | 248 | 0 | 0 |
| 12-bio-botany-english-f15d4524 | Bio-Botany | English | — | 248 | 158 | 0 |
| 12-bio-botany-tamil-51160855 | Bio-Botany | Tamil | — | 272 | 154 | 0 |
| 12-bio-zoology-english-7e848813 | Bio-Zoology | English | — | 264 | 50 | 0 |
| 12-bio-zoology-tamil-2631f8e3 | Bio-Zoology | Tamil | — | 312 | 50 | 0 |
| 12-biochemistry-english-dfd867ac | Biochemistry | English | — | 304 | 0 | 0 |
| 12-biochemistry-tamil-910cca11 | Biochemistry | Tamil | — | 320 | 0 | 0 |
| 12-botany-english-da5635aa | Botany | English | — | 304 | 0 | 0 |
| 12-botany-tamil-37a9b740 | Botany | Tamil | — | 320 | 0 | 0 |
| 12-business-mathematics-statistics-english-5710bd23 | Business Mathematics & Statistics | English | — | 296 | 0 | 28 |
| 12-business-mathematics-statistics-tamil-a77e8ce0 | Business Mathematics & Statistics | Tamil | — | 312 | 0 | 0 |
| 12-chemistry-english-v1-2d0e27cb | Chemistry | English | 1 | 296 | 0 | 34 |
| 12-chemistry-english-v2-0010d706 | Chemistry | English | 2 | 328 | 0 | 54 |
| 12-chemistry-tamil-v1-5fcd65a9 | Chemistry | Tamil | 1 | 328 | 0 | 0 |
| 12-chemistry-tamil-v2-52192807 | Chemistry | Tamil | 2 | 344 | 0 | 0 |
| 12-commerce-english-4f83c61b | Commerce | English | — | 288 | 0 | 135 |
| 12-commerce-tamil-d9e013d8 | Commerce | Tamil | — | 288 | 5 | 0 |
| 12-communicative-english-english-10e4b8ba | Communicative English | English | — | 192 | 0 | 0 |
| 12-computer-applications-english-627c1490 | Computer Applications | English | — | 304 | 0 | 0 |
| 12-computer-applications-english-ccd483a9 | Computer Applications | English | — | 304 | 0 | 0 |
| 12-computer-applications-tamil-e51fbdf6 | Computer Applications | Tamil | — | 352 | 153 | 0 |
| 12-computer-applications-tamil-f43670d1 | Computer Applications | Tamil | — | 336 | 0 | 0 |
| 12-computer-science-english-37bdae5b | Computer Science | English | — | 360 | 0 | 0 |
| 12-computer-science-tamil-d5aa7dd4 | Computer Science | Tamil | — | 360 | 20 | 0 |
| 12-computer-technology-english-293bf656 | Computer Technology | English | — | 256 | 0 | 0 |
| 12-computer-technology-english-cf787554 | Computer Technology | English | — | 256 | 0 | 0 |
| 12-computer-technology-tamil-c66e9089 | Computer Technology | Tamil | — | 272 | 67 | 0 |
| 12-computer-technology-tamil-cff5867a | Computer Technology | Tamil | — | 272 | 0 | 0 |
| 12-economics-english-5418ce45 | Economics | English | — | 296 | 0 | 186 |
| 12-economics-tamil-c7590e3f | Economics | Tamil | — | 336 | 0 | 0 |
| 12-english-english-b9d1c4c3 | English | English | — | 248 | 0 | 0 |
| 12-ethics-and-indian-culture-tamil-f49cc8fe | Ethics and Indian Culture | Tamil | — | 264 | 0 | 0 |
| 12-food-service-management-english-111451e7 | Food Service Management | English | — | 264 | 0 | 0 |
| 12-food-service-management-tamil-e2061fb1 | Food Service Management | Tamil | — | 328 | 0 | 0 |
| 12-general-nursing-english-5c87aafc | General Nursing | English | — | 336 | 0 | 16 |
| 12-general-nursing-tamil-b39f5ab1 | General Nursing | Tamil | — | 360 | 0 | 0 |
| 12-geography-english-24059775 | Geography | English | — | 216 | 0 | 0 |
| 12-geography-tamil-ba849e46 | Geography | Tamil | — | 232 | 0 | 0 |
| 12-history-english-3cd2e4c2 | History | English | — | 272 | 30 | 0 |
| 12-history-tamil-3c88c869 | History | Tamil | — | 312 | 21 | 0 |
| 12-home-science-english-e5c3e008 | Home Science | English | — | 248 | 0 | 0 |
| 12-home-science-tamil-0cbbe34e | Home Science | Tamil | — | 272 | 0 | 0 |
| 12-mathematics-english-v1-e33ceed7 | Mathematics | English | 1 | 304 | 0 | 1 |
| 12-mathematics-english-v2-d4925ec0 | Mathematics | English | 2 | 272 | 0 | 7 |
| 12-mathematics-tamil-v1-96fc1e8d | Mathematics | Tamil | 1 | 336 | 0 | 0 |
| 12-mathematics-tamil-v2-f8732624 | Mathematics | Tamil | 2 | 288 | 0 | 0 |
| 12-microbiology-english-6a36a404 | Microbiology | English | — | 320 | 25 | 0 |
| 12-microbiology-tamil-a879259a | Microbiology | Tamil | — | 312 | 0 | 0 |
| 12-nursing-vocational-english-6c60782a | Nursing Vocational | English | — | 344 | 0 | 0 |
| 12-nursing-vocational-tamil-7f44a760 | Nursing Vocational | Tamil | — | 360 | 0 | 0 |
| 12-nutrition-and-dietetics-english-3d2e918e | Nutrition and Dietetics | English | — | 240 | 0 | 0 |
| 12-office-management-secretaryship-typography-english-6b7b27b2 | Office Management, Secretaryship & Typography | English | — | 208 | 0 | 0 |
| 12-office-management-secretaryship-typography-tamil-241b6edf | Office Management, Secretaryship & Typography | Tamil | — | 224 | 0 | 0 |
| 12-physics-english-v1-1b1de8f8 | Physics | English | 1 | 352 | 0 | 20 |
| 12-physics-english-v2-0ce6704c | Physics | English | 2 | 296 | 0 | 29 |
| 12-physics-tamil-v1-c1623725 | Physics | Tamil | 1 | 352 | 60 | 0 |
| 12-physics-tamil-v2-fb1fa4de | Physics | Tamil | 2 | 312 | 0 | 0 |
| 12-political-science-english-db4a2e0c | Political Science | English | — | 328 | 34 | 0 |
| 12-political-science-tamil-5da94964 | Political Science | Tamil | — | 360 | 0 | 0 |
| 12-statistics-english-1489a12e | Statistics | English | — | 280 | 0 | 99 |
| 12-statistics-tamil-c1143d1d | Statistics | Tamil | — | 296 | 0 | 0 |
| 12-tamil-tamil-7db1698f | Tamil | Tamil | — | 240 | 0 | 0 |
| 12-textile-technology-tamil-648797c8 | Textile Technology | Tamil | — | 336 | 0 | 0 |
| 12-textiles-and-dress-designing-english-1ceb8fbe | Textiles and Dress Designing | English | — | 288 | 0 | 61 |
| 12-textiles-and-dress-designing-tamil-3650ec00 | Textiles and Dress Designing | Tamil | — | 336 | 0 | 0 |
| 12-zoology-english-788d2d32 | Zoology | English | — | 280 | 0 | 0 |
| 12-zoology-tamil-3c154dab | Zoology | Tamil | — | 336 | 0 | 0 |
