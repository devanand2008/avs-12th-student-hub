# Administrator uploads, video watch pages and open references

Date: 4 November 2026. Release completed at https://avs-12th-student-hub.vercel.app; final results and limits are recorded below.

## Implemented behaviour

- Admin: /admin/videos and /admin/notes. Upload MP4/PDF/JPG/PNG up to 512 MiB through private 4 MiB storage parts; retry the same original file to resume. Browser credentials never contain the service key. Uploads are bound to the administrator, size/type/name and a first/last-MiB resume identity (not a whole-file checksum). Duration and PDF page count are detected in the browser. Save draft or Publish is a separate authenticated action.
- Metadata: durable learning_media_uploads manifests and existing learning_resources lesson records. The private bucket is learning-upload-parts. Student delivery checks completed status and a currently published resource reference on every request; bounded byte ranges and backpressure-aware streaming preserve seeking and downloads. Existing public URLs remain public.
- Storage limits: 512 MiB is the application file cap, not a quota increase. Supabase storage/bandwidth limits still apply. Unattached uploads and abandoned parts are retained for recovery; automatic storage cleanup is not implemented. Same-browser localStorage identifies resumable files.
- Supplied-library database sync inserts only missing rows; existing edits/archives take precedence, and reruns do not duplicate records.
- /videos is a thumbnail library. Clicking a card opens /videos/watch/[videoId] with the native/YouTube player and Up next. Legacy ?id= links remain supported. Browser autoplay restrictions still apply. Existing progress, bookmark and reward logic is retained.
- Student/admin scoreboard: gradient crown/gold, silver and bronze podium cards use real visible records and ranks; ties remain ties. Gift potential is earned points / 100,000, capped at 100%, and never predicts academic performance. Existing preferences, gift workflow and award rules remain intact.

## Authorised PDF references

/resources/guides provides subject/search filtering, real availability across all 40 registered subject names, per-file attribution/licence/limitations, login-aware direct hosted downloads (avoiding long serverless download timeouts) and the existing lazy-loaded PDF.js range reader. All files below were downloaded from the original publisher/author, parsed and had their licence pages rendered and visually inspected. Exact originals are hosted as GitHub release assets with original notices intact. No commercial guides were scraped or rehosted.

| Reference | PDF pages | Licence | Licence PDF page |
|---|---:|---|---:|
| Precalculus | 1156 | CC BY 4.0 | 4 |
| Introductory Statistics | 863 | CC BY 4.0 | 2 |
| Biology 2e | 1578 | CC BY 4.0 | 3 |
| Active Calculus — Differential Calculus Activities (Chapters 1–4) | 215 | CC BY-SA 4.0 | 6 |
| Active Calculus — Integral Calculus Activities (Chapters 5–8) | 189 | CC BY-SA 4.0 | 6 |

Machine-readable source URLs, authors, SHA-256, exact byte sizes and verification dates: src/lib/open-pdf-guides.json. Hosted asset digest/header/range evidence: docs/open-pdf-guide-hosting.json. All-subject availability: docs/open-pdf-subject-coverage.csv.

These five files cover supplementary topics for seven distinct registered subject names: Mathematics, Statistics, Business Mathematics & Statistics, Bio-Botany, Bio-Zoology, Botany and Zoology. They are English references, not official Tamil Nadu guides. **Zero complete TN exam guides and zero new Tamil open guides have been verified.** The other 33 subjects have explicit reference gaps; all 82 existing official textbook records remain linked from the subject inventory. No full maths syllabus coverage is claimed. The calculus files are activities workbooks, not the full textbook.

Excluded: the downloaded OpenStax Calculus Volume 1, University Physics Volume 2 and Financial Accounting editions carried CC BY-NC-SA restrictions; they were not hosted or listed. Chemistry and Economics candidate URLs returned 403 and were not accepted as verified files. The university download of the full Active Calculus text and BCcampus Database Design PDF were inaccessible; neither is counted. Licence claims from search results were not used when the actual PDF disagreed. OpenStax branding/cover images were not extracted as app artwork.

## Verification

- Private upload schema tested in isolated PostgreSQL fixture. Local integration passes 55 MiB MP4 multipart finalisation, repeat finalisation, missing-part rejection, cross-part byte integrity, suffix/invalid ranges, HEAD/full streaming, cancellation and held/published access.
- Production additive migration applied; private bucket, RLS and zero anon/authenticated table grants verified. No existing records changed by this migration.
- Real Supabase storage check: signed browser-style upload returned 200 and signed byte range returned 206 with exact bytes/CORS enabled. The owned QA object was removed; no published test material was created.
- PDF release assets: all five original SHA-256 digests and sizes match; all five header/range probes pass.
- Full npm test passed: 270 tests, zero failures/skips (26.3 minutes). Final desktop/mobile feature suites passed 14 cases plus two PDF-upload cases (16 total). Typecheck and full lint passed before the final build; production build and git diff --check passed. Four focused upload/reference tests also passed after the full run (two overlap the 270-test suite). The local/cloud builds and final live checks passed; see the release details below. Earlier browser runs found incorrect expected HTTP status codes and ambiguous locators in the new tests; corrected. The availability selector received an explicit accessible name, choosing the same file after interruption now retries correctly, and public welcome help remains visible if its optional auth probe fails. Parallel test runs exhausted laptop memory; final suites ran sequentially.

## Preservation and remaining work

No question, candidate, review, history, resource-registry or AI-tool data is edited for this feature. The original 995 English student publications remain the intended bank; new references are not MCQ publications. Final before/after database and 725-file preservation checks passed as detailed below.

Next content task: locate author-permitted Tamil/English TN-specific guides for the 33 subject gaps, starting with Physics/Chemistry and the remaining Mathematics chapters, preserving per-edition licence evidence.

Security advisory check: the new upload table intentionally uses service-only access with RLS and no browser policies (INFO, [Supabase linter guidance](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). The pre-existing Supabase Auth leaked-password-protection warning remains; no Auth configuration was changed ([provider guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)).

## Live checks and upload recovery follow-up

The initial Vercel release (dpl_6nTxEJa5nx6Cu8EJP5gbRwrCY3Uu) is READY at the existing public alias. Insert-only sync stored 146 missing rows (90 → 236); a repeat inserted zero. One real browser upload of the 6.89 MB instruction video completed, persisted as a draft and played from private storage; that owned test draft/parts were removed. The later student-login check hit a connection reset, and subsequent live attempts encountered stalled network transfers. No student-blocking live pass is claimed from those incomplete attempts.

This exposed a missing cancellation/deadline in the uploader. Added 90-second request deadlines, Cancel upload, abort-on-navigation and cancellation during metadata checks. Final local desktop/mobile upload follow-up passed four cases: deliberately stall the second part, cancel, resume the same manifest with the completed first part reused, then verify draft/publish/playback; PDF upload/page detection still passes. All temporary production upload records and objects have been removed, including the one unfinished owned staging manifest. The recovery patch passed final typecheck, lint, four focused tests and production build. Final deployment dpl_9q7HukDpxb7weQcWiu2FFag1q1Uw is READY and assigned to the public alias.

The first independent Vercel source-tree inspection timed out in the connector. Deployment uses a locally hashed 704-file manifest (244 application-source files), with SHA-1 references verified by Vercel’s upload API. Do not report an independent remote tree comparison as passing unless it finishes later.

Final preservation: all 725 protected files match; both original source material registries are identical. All 90 pre-sync database resource rows match byte-for-byte as decoded records; the 146 added resources exactly match their canonical supplied records. Question/candidate/session fingerprints are unchanged (3,039 / 12,229 / 19); point balances total 23 before and after. Temporary upload manifests and private objects both count zero.

## Final live verification and delivery

- **12 real student checks passed** across desktop/mobile: 179 videos, 57 notes, 995 eligible questions; gallery-to-watch navigation and actual hosted video playback; gift Potential/scoreboard; five-reference library, subject filters and honest Tamil gaps; PDF.js rendering/page navigation, authenticated ranges and complete-file download redirects; existing Resources, Notes, AI Tools and practice navigation; student/admin separation and unchanged points. No browser page errors or horizontal overflow were observed. Activity/practice writes were blocked during these view checks.
- **Two deployed Cancel UI checks passed**, desktop/mobile. The upload-start request was deliberately intercepted and held before reaching the server, then Cancel restored the form. These prove the live UI behaviour, not an additional real storage upload. Actual completed-part reuse is covered by the four final local upload cases. No production records were created by these two checks.
- A prior real browser upload, metadata save as draft and private playback succeeded on the initial release; owned test data was removed. Later network resets/stalls are recorded above rather than hidden as successes. The recovery patch preserves parts and gives the admin a finite timeout/cancel/resume path. No further real production file publication was attempted.
- Cloud build and alias are verified for **dpl_9q7HukDpxb7weQcWiu2FFag1q1Uw**. Its source manifest contains 704 files / 244 application files, with fingerprint `9bddc0419979fa445efa1dc986f682d00be71bca1db1de415b68152d7da7638c`. All 244 local application SHA-1 values still match that manifest. Vercel accepted the uploaded SHA-1 objects. Independent remote source-tree inspection timed out and is not reported as passing. The final deployment-scoped 10-minute error/fatal runtime scan returned no groups.
- No Git push or question publication occurred. Original resources, AI-tool catalogue/templates, question bank/reviews and practice history remain preserved.

Admin workflow: sign in → `/admin/videos` or `/admin/notes` → Add → choose an authorised file → verify the detected duration/page count and chapter/medium/title → Save draft or Publish. Cancel retains completed parts; choose the same original file in the same browser to resume. Students browse `/videos`; one card opens its dedicated watch page. Open PDF references are under Study Resources → Open PDF references.
