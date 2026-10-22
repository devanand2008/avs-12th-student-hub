# Study Resources hub — source and maintenance report

Verified October 22, 2026. This extends the existing Next.js/React Skill Up app and blue design system. Public resources use a static validated manifest, with no new service, account, database migration or production operation.

## Routes and student experience

- `/resources`: hub with three category cards and a separate temporary group.
- `/resources/question-papers`: original examination PDF collections.
- `/resources/learning-materials`: source-checked supplementary reading.
- `/resources/video-lessons`: source-checked YouTube lessons.
- `/resources/temporary`: historical textbook references and a third-party video still awaiting provenance/relevance checks.
- `/resources/item/[id]`: dedicated metadata, PDF/source links or click-to-load video player, attribution, licence, check date and unresolved issues.

Entry links are in the existing home feature cards, desktop/mobile main navigation and student sidebar. Resources are public; no account is required. Normal subject/textbook/practice routes retain the existing access model. The existing NotebookLM video library and its history were preserved.

GET-form search covers titles, subject, medium, publisher, topic/type and year. Subject choices come from the actual textbook registry. Medium, year, type and publisher filter choices come from actual scoped resources. Query strings and the returnTo link preserve filters; clear, empty, loading, unavailable, error and missing-resource states are provided. Tamil Unicode is preserved. Category, source and resource actions use explicit keyboard-accessible links/buttons, with responsive cards and long-title wrapping. Resource PDFs never replace student MCQ sessions.

PDFs remain at their original publishers and open in a separate tab, with a permanent publisher fallback. Download instructions refer to the source/browser's Save control; no forced cross-origin download claim is made. Remote embedding permission is unknown, so these PDFs are not placed in a broken iframe. No new public PDF copy, video copy or huge asset was downloaded into this repository. The initial browser run exposed select labels containing option text; explicit accessible names fix filtering and keyboard targeting. A later strict-404 assertion was corrected against the installed Next documentation; missing resources are rejected with the unavailable/noindex UI even when streaming has already sent HTTP200. All initial failure logs were retained. Next emits more than one noindex marker on these streamed pages; the final assertion verifies the protection exists without demanding a particular tag count.

Video iframes load only after Play, use a validated eleven-character YouTube ID and youtube-nocookie.com, set an appropriate referrer policy, and accept error/state messages only from that exact iframe origin and window. No arbitrary iframe HTML is accepted. The player has a retry, manual help and permanent original YouTube link. Controls retain at least 200px height on mobile. Unavailable/restricted content is never bypassed. Source checks use oEmbed metadata, not an assumption that every public video is embeddable.

## Actual inventory and rights

| Category | Source-checked | Temporary | Meaning |
|---|---:|---:|---|
| Question papers | 4 | 0 | Four official combined collections, **not four individual papers or hundreds of separately verified papers** |
| Learning materials | 4 | 82 | Four OpenStax references; eighty-two historical textbook links pending renewed provenance verification |
| Video lessons | 8 | 1 | Nine genuine YouTube IDs with successful oEmbed; eight KalviTVOfficial channel lessons, one third-party title pending relevance/ownership checks |

**99 resources / 16 source-checked / 83 temporary; zero currently unreachable source URLs in the final manifest checks; zero retired; zero new local PDF/video copies.** All 82 textbook source range probes returned accessible PDF signatures, but this proves availability only. Their historical SCERT catalogue provenance and source ownership still require renewed verification; they remain temporary. Thirty-one Tamil extraction warnings are unrelated to resource status and never counted as published student questions.

### Official examination collections

Original authority listing: [DGE Question Bank](https://apply1.tndge.org/dge-notification/questbank). The four exact links were followed from that page. All returned application/pdf with valid signatures. The complete PDFs were inspected in memory; first-page Tamil paper images were visually checked. New PDFs were not saved in public assets or split into rehosted papers. Redistribution terms remain unclear, so these are external-link-only.

| Year / session | Original PDF | Pages | Indexed subjects from source headings |
|---|---|---:|---|
| 2023 March public | [Original collection](https://tnegadge.s3-ap-south-1.amazonaws.com/notification/questbank/2023_Mar_HSE_II.pdf) | 366 | English, Mathematics, Physics, Chemistry, Bio-Botany, Bio-Zoology, Botany, Zoology, History, Economics, Commerce, Accountancy, Microbiology, General Nursing, Home Science, Business Mathematics & Statistics, Statistics, Geography, Political Science, Ethics and Indian Culture, Computer Science, Computer Applications, Basic Mechanical Engineering, Basic Electrical Engineering, Basic Electronics Engineering, Basic Civil Engineering, Basic Automobile Engineering, Computer Technology, Textiles and Dress Designing, Food Service Management, Tamil |
| 2024 March public | [Original collection](https://tnegadge.s3.amazonaws.com/notification/questbank/2200420242.pdf) | 491 | English, Mathematics, Physics, Chemistry, Bio-Botany, Bio-Zoology, Botany, Zoology, History, Economics, Commerce, Accountancy, Microbiology, General Nursing, Home Science, Business Mathematics & Statistics, Statistics, Geography, Political Science, Ethics and Indian Culture, Computer Science, Computer Applications, Basic Mechanical Engineering, Basic Electrical Engineering, Basic Electronics Engineering, Basic Civil Engineering, Basic Automobile Engineering, Textiles and Dress Designing, Food Service Management, Computer Technology, Tamil |
| 2025 March public | [Original collection](https://tnegadge.s3.ap-south-1.amazonaws.com/notification/questbank/2025_MAR_12_QUESTION_PAPER.pdf) | 448 | English, Mathematics, Physics, Chemistry, Bio-Botany, Bio-Zoology, Botany, Zoology, History, Economics, Commerce, Accountancy, Microbiology, General Nursing, Home Science, Business Mathematics & Statistics, Statistics, Geography, Political Science, Ethics and Indian Culture, Computer Science, Computer Applications, Basic Mechanical Engineering, Basic Electrical Engineering, Basic Electronics Engineering, Basic Civil Engineering, Basic Automobile Engineering, Textiles and Dress Designing, Food Service Management, Communicative English, Tamil |
| 2026 March public | [Original collection](https://tnegadge.s3.ap-south-1.amazonaws.com/notification/questbank/HSE2_2026_Q.pdf) | 432 | English, Mathematics, Physics, Chemistry, Bio-Botany, Bio-Zoology, Botany, Zoology, History, Economics, Commerce, Accountancy, Microbiology, General Nursing, Home Science, Business Mathematics & Statistics, Statistics, Geography, Political Science, Ethics and Indian Culture, Computer Science, Computer Applications, Communicative English, Basic Mechanical Engineering, Basic Electrical Engineering, Basic Electronics Engineering, Basic Civil Engineering, Basic Automobile Engineering, Textiles and Dress Designing, Food Service Management, Tamil |

Collection media include Tamil/English; this does not certify every paper variant. Tamil language paper on page 1 is visually confirmed in all four years (codes 6601/7401/8301/9001); some other scripts and variants are present but not independently indexed. Text heading matching was narrowed to actual headers to avoid incorrectly classifying instructions or question-body references as subjects. Subject aliases such as Bio-Botany/Bio-Zoology are relevance mappings to biology components, not additional paper counts. Computer Technology is indexed only where an actual header was found. Older, supplementary and model collections were not verified in this batch. Earlier legacy DGE endpoints failed; the reachable DGE application portal supplied the current links. A third-party login-gated paper site was examined but its restricted links were not bypassed or imported.

### Open learning references

- **Biology 2e**, Bio-Botany, Bio-Zoology, Botany, Zoology, English: [Publisher preface](https://openstax.org/books/biology-2e/pages/preface). CC BY-NC-SA 4.0 — noncommercial reuse with attribution and share-alike.
- **Chemistry 2e**, Chemistry, English: [Publisher preface](https://openstax.org/books/chemistry-2e/pages/preface). CC BY-NC-SA 4.0 — noncommercial reuse with attribution and share-alike.
- **College Physics 2e**, Physics, English: [Publisher preface](https://openstax.org/books/college-physics-2e/pages/preface). CC BY-NC-SA 4.0 — noncommercial reuse with attribution and share-alike.
- **Principles of Economics 3e**, Economics, English: [Publisher preface](https://openstax.org/books/principles-economics-3e/pages/preface). CC BY-NC-SA 4.0 — noncommercial reuse with attribution and share-alike.

These are supplementary references, not Tamil Nadu prescribed Class 12 textbooks or certified chapter alignment. Current publisher prefaces explicitly identify CC BY-NC-SA 4.0. Because this is a paid project, no commercial copying/redistribution permission was inferred: external links only; redistribution field remains unclear for this use. Licence evidence is the actual publisher preface, and the [licence terms](https://creativecommons.org/licenses/by-nc-sa/4.0/) are linked from each record. OpenStax attribution is retained. No paid guide, unlicensed notes or rehosted textbook was added.

The existing 82 original textbook source links preserve catalogue subject, source medium, volume, filename, publisher landing page and direct URL, with fresh range-check receipts. Their edition year is unknown. They appear only under Temporary Learning Resources until publisher provenance/reuse checks finish; they are not labelled Openly Licensed.

### Video source inventory

| Title | Channel as returned by YouTube | Medium | Status | Original |
|---|---|---|---|---|
| KALVI TV OFFICIAL / முப்பரிமாணம் / STD 12 TM / PHYSICS / MINNOTAVIYAL | KalviTVOfficial | Tamil | listed; oEmbed supported | [YouTube](https://www.youtube.com/watch?v=CCBJkNSSMTo) |
| KALVI TV OFFICIAL / முப்பரிமாணம் / STD 12 TM / PHYSICS / OSCILLATION IN LC CIRCUITS | KalviTVOfficial | Tamil | listed; oEmbed supported | [YouTube](https://www.youtube.com/watch?v=DiWlqmIR1cY) |
| KALVI TV OFFICIAL / முப்பரிமாணம் / STD 12 TM / PHYSICS / முப்பட்டகத்தின் ஒளிவிலகல் எண் காணல் | KalviTVOfficial | Tamil | listed; oEmbed supported | [YouTube](https://www.youtube.com/watch?v=hmX9B-lr2FY) |
| KALVI TV OFFICIAL / முப்பரிமாணம் / STD 12 TM / PHYSICS / KATHIRVEECHU PARUPORULIN IRUMAI AMAIPPU 2 | KalviTVOfficial | Tamil | listed; oEmbed supported | [YouTube](https://www.youtube.com/watch?v=MSnao03i6Qc) |
| KALVI TV OFFICIAL / முப்பரிமாணம் / STD 12 TM / PHYSICS / MAGNETIC FIELD CURRENT CARRYING | KalviTVOfficial | Tamil | listed; oEmbed supported | [YouTube](https://www.youtube.com/watch?v=spoBwQzuhEc) |
| KALVI TV OFFICIAL / முப்பரிமாணம் / STD 12 TM / PHYSICS / ALTERNATIVE CURRENT / PART 02 | KalviTVOfficial | Tamil | listed; oEmbed supported | [YouTube](https://www.youtube.com/watch?v=VQjlpOhO_34) |
| KALVI TV OFFICIAL / முப்பரிமாணம் / STD 12 TM / PHYSICS / KATHIRVEECHU PARUPORULIN IRUMAI AMAIPPU 1 | KalviTVOfficial | Tamil | listed; oEmbed supported | [YouTube](https://www.youtube.com/watch?v=WNp6zKLrnYM) |
| KALVI TV OFFICIAL / முப்பரிமாணம் / STD 12 TM / PHYSICS / ALTERNATIVE CURRENT / PART 01 | KalviTVOfficial | Tamil | listed; oEmbed supported | [YouTube](https://www.youtube.com/watch?v=Xe4tYi4hd0I) |
| KALVI TV 12th PHYSICS UNIT-1 PART-1 | NATIONAL STRATEGIES IN TAMIL | Unknown | temporary_unverified; oEmbed supported | [YouTube](https://www.youtube.com/watch?v=Y-ivyEQi8eg) |

All nine successful oEmbed checks returned the exact stored title and channel plus an iframe response. The response HTML is discarded, never rendered. Physics/Tamil relevance is grounded in the eight source titles; no chapter number was guessed. KalviTVOfficial is the channel name reported by YouTube, not a certification of government ownership. The third-party resource retains Unknown medium and pending authenticity/relevance despite its title. No videos were downloaded or rehosted.

**Actual live playback:** one lesson played in an isolated real YouTube embed, with the clock advancing and no video error. The probe initially timed out waiting for an old CSS selector; using the actual accessible Play button confirmed playback. Initial receipts are retained. oEmbed support is recorded for nine, but playback has not been independently tested for the other eight or every student browser/region. Automated app browser tests simulate a YouTube error response to verify fallback behaviour; those simulations do not prove live playback. The final local Skill Up page also played the actual lesson, with an advancing video clock, no media error and a Playing status. Ten final desktop/mobile page captures had no horizontal overflow or page-script errors. Final UI visual/playback evidence is separately documented in the verification receipt when available.

## Coverage by subject

Counts below are resource records/combined collections, not eligible MCQs or individual exam-paper counts. Source-checked reading is English only. The eight source-checked videos are Physics/Tamil; the ninth is temporary/Unknown. Temporary textbook links span the existing registry, without claiming a verified OER for every subject.

| Actual textbook subject | Listed exam collections / years | Listed reading | Listed videos | Temporary resources |
|---|---|---:|---:|---:|
| Accountancy | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| Advanced Tamil | 0 / none | 0 | 0 | 1 |
| Agricultural Science | 0 / none | 0 | 0 | 1 |
| Auditing | 0 / none | 0 | 0 | 2 |
| Basic Automobile Engineering | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| Basic Civil Engineering | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| Basic Electrical Engineering | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| Basic Electronics Engineering | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| Basic Mechanical Engineering | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| Bio-Botany | 4 / 2023, 2024, 2025, 2026 | 1 | 0 | 2 |
| Bio-Zoology | 4 / 2023, 2024, 2025, 2026 | 1 | 0 | 2 |
| Biochemistry | 0 / none | 0 | 0 | 2 |
| Botany | 4 / 2023, 2024, 2025, 2026 | 1 | 0 | 2 |
| Business Mathematics & Statistics | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| Chemistry | 4 / 2023, 2024, 2025, 2026 | 1 | 0 | 4 |
| Commerce | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| Communicative English | 2 / 2025, 2026 | 0 | 0 | 1 |
| Computer Applications | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 4 |
| Computer Science | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| Computer Technology | 2 / 2023, 2024 | 0 | 0 | 4 |
| Economics | 4 / 2023, 2024, 2025, 2026 | 1 | 0 | 2 |
| English | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 1 |
| Ethics and Indian Culture | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 1 |
| Food Service Management | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| General Nursing | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| Geography | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| History | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| Home Science | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| Mathematics | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 4 |
| Microbiology | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| Nursing Vocational | 0 / none | 0 | 0 | 2 |
| Nutrition and Dietetics | 0 / none | 0 | 0 | 1 |
| Office Management, Secretaryship & Typography | 0 / none | 0 | 0 | 2 |
| Physics | 4 / 2023, 2024, 2025, 2026 | 1 | 8 | 5 |
| Political Science | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| Statistics | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| Tamil | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 1 |
| Textile Technology | 0 / none | 0 | 0 | 1 |
| Textiles and Dress Designing | 4 / 2023, 2024, 2025, 2026 | 0 | 0 | 2 |
| Zoology | 4 / 2023, 2024, 2025, 2026 | 1 | 0 | 2 |

For complete zero-coverage subjects use [the resource audit](study-resource-audit.json), which starts with every subject in the textbook registry. The largest gaps are independently verified current-syllabus subject/medium paper sections and supplementary/model papers; Tamil open references, authorised notes/practical manuals; and videos outside Physics. Reachable does not mean licensed, current, government-owned or teacher-approved.

## Curation workflow

The first-version curation mechanism is the **single validated `src/lib/study-resources-catalog.json` manifest**. It is separate from the MCQ database and has no write endpoint or invented administrator approvals. `src/lib/study-resource-schema.ts` validates it; `npm run resources:audit` validates identities/subjects and writes coverage. Future maintenance:

1. Find the original public publisher and inspect actual title, subject/medium/year/session. Check any existing resource by URL/YouTube identity, not title alone. Never bypass a login or restriction.
2. Add or update one stable record. Use actual textbook registry subject names. Unknown year/session/chapter/licence are null; use Unknown medium when not established. Do not add a placeholder resource to fill a gap.
3. Keep independent availability, authenticity, relevance, rights, redistribution, embedding, download and editorial states. Start at temporary_unverified/pending when uncertain. A publicly reachable source is not automatically licensed or approved.
4. Record original/source/PDF URLs, publisher, checkedAt, issues and evidence. Append a dated history entry for every check/change; preserve old entries and the stable ID. Never claim an administrator/teacher action unless it happened.
5. A YouTube URL must produce a valid identity. Confirm the exact title/channel and oEmbed response; never store iframe HTML. Keep blocked videos flagged/unavailable or retired and original-link-only; no workarounds. Live playback and region/access restrictions are separate facts.
6. A local PDF is allowed only with explicit sufficient permission/licence evidence, localAsset under /resources/, checksum and permitted redistribution. This initial registry has no local PDF. Commercial NC-licensed reuse is not assumed.
7. To retire, preserve the record and history, set status and editorial to retired, append reason/evidence. Retired entries leave lists and detail routes; do not delete their audit trail.
8. Run `npm run resources:audit`, `npm run typecheck`, `npm run lint`, relevant tests and `npm run build`. Inspect the data diff and rendered pages. No deployment/import happens automatically.

Schema rejects unsupported categories/statuses, unsafe/insecure or credential-bearing URLs, arbitrary extra iframe fields, invalid YouTube IDs, duplicate source identities/IDs, unknown subject names, false licence claims and unsupported local-copy claims. Rendering does not fetch arbitrary remote URLs on the server. The GET lists derive from the manifest; UI components need no per-resource editing. The new missing-resource screen gives a useful return link; Next.js may send HTTP 200 after its loading boundary starts streaming, with notFound/noindex in the resulting page. HTTP 404 is only guaranteed before streaming; tests check the actual missing-resource UI and noindex. An attempted static-param restriction did not alter dynamic search-parameter streaming and was removed.

Important implementation paths: src/app/resources/**, src/components/resources/**, src/lib/study-resources.ts, src/lib/study-resource-schema.ts, src/lib/study-resources-catalog.json, scripts/audit-study-resources.ts, tests/study-resources.test.ts, tests/e2e/study-resources.spec.ts. Integration touched the existing home cards, Navbar and student Sidebar only. Existing unrelated user changes were retained.

## Validation and preservation

207/207 full tests, five focused tests and 12/12 scoped desktop/mobile browser cases passed; five MCQ audits plus resources:audit, typecheck, lint, build and git diff --check passed. The full unrelated browser suite was not run. The resource cases check public navigation, actual filters and search, filter-preserving return links, external PDFs and publisher fallback, licence/temporary labels, empty/404 states, click-to-load trusted iframe URL, error/help/retry and original YouTube fallback. Unit validation covers unsafe URLs, arbitrary iframe fields, duplicate resources and unknown subjects. External availability checks, first-page images and oEmbed receipts are real; browser error fixtures are explicitly isolated.

MCQ extraction/protected snapshots were checked before/after: 17,321 earlier raw records remain unchanged; eight source-backed recoveries make 17,329 saved records. Earlier 906 proposals, all genuine decisions/history, source assets, the dated 995 English bank, excluded legacy samples and thirteen practice sessions remain unchanged. Resource records never enter question selection. [MCQ batch report](BIO_ZOOLOGY_TAMIL_ELECTRICAL_CH2_REVIEW.md), [verification](zoology-ch2-resources-verification.json), [preservation](zoology-ch2-preservation.json), [resource coverage](study-resource-audit.json).
