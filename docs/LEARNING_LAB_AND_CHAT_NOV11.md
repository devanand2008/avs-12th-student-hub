# Learning Lab and chatbot update — 11 November 2026

The Learning Lab contains 43 interactive lessons, comprising 31 procedural 3D structures and 12 guided visuals. This update adds four source-checked models. The advanced-lesson inventory includes eight animated concepts, with the new generator counted by its working coil animation. Registry counts describe implemented concepts and partial chapter contexts.

| New model | Textbook and chapter | PDF / printed page | Student interaction |
|---|---|---|---|
| Face-centred cubic unit cell | Chemistry English Volume 1, Chapter 6, Solid State | 194 / 184 | Inspect eight corners, six faces and shared-atom contributions, rotate, zoom, hide, explode |
| Square-planar coordination | Chemistry English Volume 1, Chapter 5, Coordination Chemistry | 153 / 143 | Select metal, donors and coordination directions, compare coplanar positions from camera presets |
| Nucleosome DNA packaging | Bio-Zoology English, Chapter 5, Molecular Genetics | 72 / 64 | Inspect eight core histones, wrapped duplex path and linker DNA, hide components, rotate |
| AC generator | Physics English Volume 1, Unit 4, Electromagnetic Induction and Alternating Current | 231 / 223 | Set coil angle, play/pause rotation, step 90°, reset, inspect normalised flux and emf |

All three source-cache fingerprints match the registered textbook editions. The new mappings use checked English source pages. The source references and model limitations remain available beside each model. Broader chapter coverage and equivalent Tamil source mappings require further source checks.

The FCC spheres show lattice sites with reduced radii for visibility. Square-planar donor positions are generic. The nucleosome tube follows the whole DNA duplex path and its enlarged beads identify eight core proteins. The generator uses the rotating-coil teaching arrangement from the textbook note, with dimensionless cos θ and sin θ readouts and a chosen polarity convention. These models use locally authored Three.js geometry and the existing lazy-loaded viewer.

Scientific references support the lattice and coordination geometry. [OpenStax lattice structures](https://openstax.org/books/chemistry/pages/10-6-lattice-structures-in-crystalline-solids), [OpenStax coordination chemistry](https://openstax.org/books/chemistry-atoms-first-2e/pages/19-2-coordination-chemistry-of-transition-metals).

DNA packaging and generator relationships were checked against educational sources. [RCSB PDB-101 nucleosome](https://pdb101-east.rcsb.org/motm/7), [OpenStax electric generators](https://openstax.org/books/university-physics-volume-2/pages/13-6-electric-generators-and-back-emf).

## Chatbot changes

Students can choose Clear explanation, Step by step or Quick revision. The validated format reaches both Gemini and local-model prompts. English and Tamil follow-up buttons request a simpler explanation, an example or a three-point summary. Repeated follow-ups recover the latest substantive study question within the existing six-turn history limit. Named topic questions remain eligible as source anchors. Existing excerpt-only responses retain their original wording.

A real follow-up exposed a retrieval error when words such as “three points” matched unrelated textbook pages. Follow-up retrieval now always uses the original substantive question, and the model prompt carries that study topic. Two authenticated local integration checks include an unrelated strings excerpt designed to match the summary words and verify its exclusion. Client-provided topic overrides are discarded by request validation.

The format control sits in the responsive toolbar and follows its compact-keyboard behaviour. Completed replies scroll to their beginning, and mobile follow-up buttons use a single horizontally scrollable row. A long real reply exposed the need for this adjustment during live verification. Two additional desktop/mobile regression cases with longer English/Tamil responses pass, including the first-answer visibility check. Signed-in navigation now uses distinct React keys for Home and Dashboard. The React review covered component state, effect cleanup, lazy loading, keyboard controls and touch layouts.

## Verification

- Focused unit and provider-protocol tests passed 33/33 after the source-topic correction.
- The initial browser run passed 15 cases, failed one offscreen-canvas assertion and skipped two opt-in installed-Gemma checks. Bringing the canvas into view corrected that assertion. The final six new desktop/mobile cases all passed. Across both runs, all 16 selected active scenarios have passing evidence, covering new models, generator controls, reduced motion, existing camera controls, WebGL fallback, authentication, chat formatting, bilingual follow-ups and retry behaviour.
- All four model screenshots and the mobile chat screenshot were visually inspected. Desktop and mobile layouts passed horizontal-overflow checks. The mobile composer stayed usable in a reduced viewport.
- The initial local production build passed. Typecheck and changed-file lint passed again after both follow-up corrections, along with `git diff --check`. The final cloud build passed for the released source.
- Full-project lint reports five pre-existing explicit-`any` errors in `scripts/audit-all-videos.ts` and `scripts/upload-missing-physics-videos.ts`, plus 11 unused-import warnings in the homepage/founder pages. Those maintenance files match the starting Git revision.
- `npm run lab:audit` reports 43 lessons, 31 3D structures, eight advanced animated concepts, 82 available registered PDFs and zero errors.
- Signed-in probes before and after the initial release returned real Gemini study answers in English and Tamil, each with three source citations. One initial live request used the source-excerpt fallback. Subsequent English/Tamil probes and all four desktop/mobile live verification groups passed. Local diagnostic output confirmed a completed provider response without exposing credentials.
- The public subject API reports 995 eligible questions. The 35 protected tracked registry/schema files match the starting Git content. Local question, candidate and practice-history files were outside the edited paths.

The complete historical unit/browser suites and the optional installed-Gemma smoke tests were outside this focused verification run. The initial production release `dpl_4kAqLRzb9WG6YwxPM4PynYWqNAz9` reached READY with a 168-second cloud build. The mobile readability release `dpl_FVorZ2HZhuB6YvCbQ9JuiiiEQGvg` reached READY with a 110-second cloud build. Screenshot review then identified the separate follow-up source issue described above.

## Final production verification — 12 November 2026

| Field | Observed result |
|---|---|
| URL | https://avs-12th-student-hub.vercel.app/ |
| Target and status | Production, READY |
| Deployment | `dpl_9WEnLbfEDEed43n5j1ixDrjoB4Fc` |
| Source revision | `287f475` with this task's working-tree changes |
| Framework | Next.js 16.4.3 |
| Region | Sydney, `syd1` |
| Cloud build duration | 105 seconds |

The existing alias points to the final deployment. All four final live verification groups pass across desktop and mobile. These checks open every new model, exercise generator readouts, test the public home/resources/AI-tools pages, and obtain genuine English/Tamil Gemini answers with readable reply beginnings. Follow-up citations exactly match the original question's citations, and the English answer contains the requested pure-function concept. The final Tamil screenshot was visually checked for the same topic. The eligible-question total is 995.

All 1,033 uploaded source-file digests matched before these final documentation updates, including all 249 application files. All 35 protected tracked registry/schema fingerprints match the starting snapshot. The recent ten-minute error/fatal log query returned zero groups. The account rejected an earlier one-hour log-window query, so that broader scan is unavailable. External drains are unconfigured. These are bounded verification results and Vercel runtime-log observations.
