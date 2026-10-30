# Advanced Learning Lab and additional study resources

26 October 2026. Extended the existing `/models` and `/interactive-3d` routes. No separate website, new rendering framework, MCQ import, production database import or Git push. The final request explicitly authorised Vercel redeployment and adding supplied resources; this supersedes the earlier no-deployment line for this release.

## Baseline and scope

Started at Git HEAD `00a9740df57ee4d0b3416b4da40fb1d7d0ded91c`, with tracked files clean and the existing untracked `output/` directory retained. The established lab had 15 procedural models, five source-page contexts, one scalar animation and ten models without checked chapter mappings. Framework: Next.js 16.4.3, React 19.2.8, existing Three.js 0.186.1. Read AGENTS.md, CLAUDE.md, PROJECT_STATUS.md, the final learning-lab/materials reports, installed Next client/lazy-loading guidance, textbook catalogue, cached source pages, existing renderer, resources, AI tools, supplied practice and tests before implementation.

## Actual inventory

**30 implemented learning entries: 18 selectable 3D structures and 12 lightweight interactive visuals**. Added 15 entries: three 3D structures, four stage processes, six parameterised diagrams/graphs and two deterministic algorithm traces. Seven new lessons have pedagogical playback; the retained vector scalar animation brings the total to eight non-decorative animated concepts. Camera auto-rotation is not counted as scientific process animation.

Existing 15 IDs and descriptions remain: vectors, chromosome, bacterium, dipole, ammonia, carbon-dioxide, animal-cell, neuron, capacitor, solenoid, water, methane, dna, cell, tree. No existing model was removed.

| Subject | Verified chapter | Target concept / model | Interaction | Validation / source PDF / printed page |
|---|---|---|---|---|
| Bio-Zoology | 2. Human Reproduction | Human ovum · protective layers | rotate, zoom, select, hide selected, explode, reset | Source-checked simplified illustration; 26 / 18 |
| Chemistry | 6. Solid State | Sodium chloride · ionic lattice | rotate, zoom, select, hide selected, explode, reset | Source-checked simplified illustration; 202 / 192 |
| Chemistry | 5. Coordination Chemistry | Octahedral coordination geometry | rotate, zoom, select, hide selected, explode, reset | Source-checked simplified illustration; 143 / 133 |
| Bio-Zoology | 5. Molecular Genetics | DNA replication · old and new strands | play, pause, speed, previous stage, next stage, reset | Source-checked simplified illustration; 74 / 66 |
| Bio-Zoology | 5. Molecular Genetics | DNA template to RNA | play, pause, speed, previous stage, next stage, reset | Source-checked simplified illustration; 77 / 69 |
| Bio-Botany | 2. Classical Genetics | Monohybrid cross · Tt × Tt | play, pause, speed, previous stage, next stage, select genotype, reset | Source-checked simplified illustration; 42 / 36 |
| Bio-Botany | 1. Asexual and Sexual Reproduction in Plants | Pollination to fertilisation | play, pause, speed, previous stage, next stage, reset | Source-checked simplified illustration; 19 / 13 |
| Bio-Botany | 7. Ecosystem | Energy through trophic levels | transfer efficiency, reset | Source-checked simplified illustration; 144 / 138 |
| Physics | 4. Electromagnetic Induction and Alternating Current | Alternating voltage · frequency and peak | peak voltage, frequency, play, pause, speed, previous stage, next stage, reset | Source-checked simplified illustration; 241 / 233 |
| Physics | 6. Ray Optics | Converging lens · object and image | object distance, reset | Source-checked simplified illustration; 38 / 30 |
| Physics | 2. Current Electricity | Ohmic circuit · V, I and R | voltage, resistance, reset | Source-checked simplified illustration; 95 / 87 |
| Mathematics | 7. Applications of Differential Calculus | Curve and tangent · y = x² | point a, secant h, reset | Source-checked simplified illustration; 16 / 12 |
| Computer Science | 4. Algorithmic Strategies | Binary search · comparison trace | input array, target, apply input, play, pause, speed, previous stage, next stage, select element, reset | Source-checked simplified illustration; 43 / 37 |
| Computer Science | 4. Algorithmic Strategies | Insertion sort · shifting and insertion | input array, apply input, play, pause, speed, previous stage, next stage, select element, reset | Source-checked simplified illustration; 47 / 41 |
| Basic Electrical Engineering | 1. Power transmission and distribution | Ideal transformer · turns and voltage | turns ratio, reset | Source-checked simplified illustration; 12 / 4 |

The CSV contains one row per new implemented topic with exact source IDs, medium, volume, pages and limitations. The JSON also retains all 15 legacy records and the **82-book / 40-subject / 856-provisional-chapter** inventory. Available volumes/mediums are copied from the existing registry, not constructed as a competing catalogue. All 82 local PDFs are present. Source hashes/page-text fingerprints are recorded; 15 relevant source pages were rendered and visually checked. These checks do not certify entire chapters or all 24,088 textbook pages.

Twenty entries have a source-page context, spanning 16 distinct book/chapter contexts. Ten retained entries remain general concepts without a checked chapter mapping. Existing historical `chapterId` links on cell/tree were retained but are not upgraded to source-certified curriculum coverage. General scientific references are displayed separately.

## Learning, controls and fallback

Every new lesson presents its objective, checked textbook link, known simplifications and a model-local concept check. None of these checks is an official textbook/previous-year question or an MCQ-bank record. Process/algorithm lessons provide Previous/Next, Play/Pause, 0.5×/1×/2× and Reset; parameter diagrams have named sliders and exact calculated readouts. Algorithms accept bounded integer inputs, report input errors, expose actual operations and allow element selection. Insertion sort preserves its held key during shifts; binary search explicitly sorts its input.

The three new 3D structures reuse the existing drag/pinch, keyboard arrows/+/−/Home, reset camera, rotation and part-selection system. They add exploded views, hide/show selected components and structure reset. Text explanations remain available without WebGL; process/graph lessons use native responsive SVG/HTML and require no GPU. Idle 3D scenes now skip unchanged GPU frames; existing offscreen/hidden-page guards, pixel-ratio cap, dynamic loading and explicit GPU/listener/observer disposal remain. Process timers pause offscreen/in background and are disposed on navigation. Reduced motion disables automatic process playback but keeps manual stepping. No decorative no-op controls were introduced.

Discovery adds model-type and context-status filters, clear filters, the existing actual-subject/source-chapter/medium selectors and honest empty states. Labels for this new batch are English. **Tamil source mappings and Tamil scientific labels have not been verified**, so medium filtering does not pretend they exist. Mathematics, Computer Science and the new electrical lesson use suitable 2D visuals rather than forced physical 3D scenes. No new Accountancy, Commerce, Economics, Statistics or language visual has been claimed.

## Scientific evidence and limits

Primary curriculum evidence is the installed Tamil Nadu textbook edition linked in each model. Independent background checks include [semiconservative replication](https://openstax.org/books/biology-2e/pages/14-3-basics-of-dna-replication), [thin lenses](https://openstax.org/books/university-physics-volume-3/pages/2-4-thin-lenses), [ionic lattice structure](https://openstax.org/books/chemistry-2e/pages/10-6-lattice-structures-in-crystalline-solids), [ideal transformers](https://openstax.org/books/university-physics-volume-2/pages/15-6-transformers), [molecular structure](https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity), [cell structures](https://openstax.org/books/concepts-biology/pages/3-3-eukaryotic-cells), [neurons/glia](https://openstax.org/books/biology-2e/pages/35-1-neurons-and-glial-cells) and [binary search trees](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/lecture-5-binary-search-trees-bst-sort/). An initially attempted OpenDSA URL returned 404 and was replaced with the checked MIT reference.

These are original schematic drawings and geometry, not exact biochemical or physical simulations. A finite lattice fragment has incomplete edge coordination; an extended rock-salt crystal has 1:1 stoichiometry and six unlike neighbours per interior ion. Octahedral donor positions are generic, not a fabricated named molecule. The ovum cutaway omits meiotic staging/polar bodies. Replication omits enzymes and strand polarity, RNA uses a clearly illustrative sequence, Mendelian ratios assume one locus/complete dominance, pollination omits double fertilisation, and the energy diagram uses an explicit adjustable-efficiency assumption. Lens controls cover only real inverted images outside f; electrical models are idealised; y=x² is not a general symbolic solver. Full limitations are stored per record.

No external 3D meshes/textures were downloaded. All educational geometry/SVG is authored in project source; no separate open-source or redistribution licence has been invented. Educational sources are links used to check facts; their images/text were not copied into model assets. Original user-provided PDF/video attributions remain; rights are owner-supplied/unspecified, not claimed open-source. Thumbnails are local frames from those supplied videos.

## Added folder resources

`book's/` now contains **107 physical files**, with all previous 71 retained. Four earlier byte-identical MP4 aliases are preserved locally. There are **103 byte-unique source resources: 57 PDFs / 46 videos**. Added 25 PDFs (1,054 pages) and 11 videos (all playable 1280×720 sources). PDF page counts/text availability and first-page images were inspected; new MP4 duration, dimensions and an interior frame were checked. This is a full file inventory and topic/language check, not teacher verification of every handwritten answer. Some different-byte videos are alternate renditions of the same concept; 46 is a file count, not 46 unique syllabus concepts.

Two PDFs under `che/pdf` actually contain Mathematics: Applications of Vector Algebra and Probability Distributions. They are mapped to Maths chapters 6 and 11. Chemistry generic filenames were mapped from their actual pages to Metallurgy, p-Block I/II, Transition Elements, Coordination, Solid State, Chemical Kinetics, Ionic Equilibrium and Surface Chemistry. Botany covers Principles of Ecology, Ecosystem and Environmental Issues; Zoology includes reproduction/ovum/gametogenesis and one clearly labelled Olympiad enrichment resource without an official chapter claim. Three Computer Science Tamil PDFs cover Functions, Data Abstraction and Scoping. Supplied questions remain reference PDFs, not imported MCQs.

New assets use SHA-256 release filenames in the existing repository release. `additional-materials-catalog.json` and `additional-materials-resources.json` are source-controlled additions; `listResources` merges them without a production import. Existing stored records, including drafts/archives, override matching IDs. Supplied additions can be archived; deletion instructs the administrator to archive a source-managed record rather than making it silently reappear. Authenticated PDF streaming remains constrained to exact catalogue URL/hash/size references. The old resource catalogue, database rows and original files are not rewritten.

## Gaps and next batch

This is partial syllabus coverage. All unmapped books/chapters are retained in the machine-readable inventory; parser chapter titles remain explicitly provisional. No chapter is declared complete. Next priority: verify equivalent Tamil source pages/terminology for these 15 lessons, followed by source-bounded translation/protein synthesis, angiosperm double fertilisation and semiconductor junction lessons. Those additions are not included in implemented counts. Other registered subjects need source inspection and a suitable educational design before a visual is assigned.

## Verification and release receipts

Execution results are recorded below when complete. Protected local registries, source PDFs/crops, candidate/teacher-decision files, official/supplied question data, resource catalogues, AI prompts and dated history are compared against `.local/advanced-lab-protected.json`. Live DB state is not inferred from old local snapshots. No production migration/import, question publication or teacher decision is authorised by this implementation. No Git push is performed.

### Completed checks

| Check | Actual result |
|---|---|
| Initial full npm test | 235/236 passed; 1 stale old-video-catalogue assertion failed |
| Corrected focused tests | 33/33 passed, including platform/archive/data integrity |
| Final new-model/material tests | 12/12 passed |
| Broad desktop/mobile browser batch | 31/32 passed; one desktop development reload |
| Final model + portal regressions | 19/20 passed; one mobile admin connection refusal |
| Mobile admin isolated recheck | 1/1 passed on fresh fixture |
| Registry/source coverage audit | 30 entries; 18 structures, 12 guided visuals; zero errors |
| Folder dry-run | 103 unique materials validated; zero unknown/missing files |
| New hosted media | 36/36 passed release digest, size, range and header checks |
| Protected local files | 725 byte baselines matched; no changes |
| TypeScript / lint / git diff --check | Passed |
| Production dependency audit | 0 vulnerabilities |

Final browser coverage includes every new lesson on both sizes, 3D part selection/explode/hide/reset, camera keyboard controls, process stepping/play/pause/speed/reset, numeric parameter changes, algorithm input errors/full traces, local concept checks, reduced-motion and unavailable-WebGL fallback, source filters/empty states, AI prompts, public resources/licence states, supplied bilingual MCQ practice/admin preview and official scoring/history/timed tests, note history, native video progress, auth/CSRF and admin draft/publish/archive controls. No page-script errors or horizontal overflow were found in the completed model walkthroughs.

One broad-run desktop case lost its state during an observed development navigation while an additional visual preview browser was running; it was not counted passed. The final isolated desktop and mobile walkthroughs each inspected all 15 new lessons. The final portal batch passed 19/20; one mobile admin request encountered ECONNREFUSED during a temporary local-server restart, then passed 1/1 in a fresh isolated fixture. No clean single-run 20/20 is claimed. Intermediate selector failures and a stopped run are retained in private receipts; no skipped/unavailable case is reclassified as passing. The complete Node suite was not rerun a second time after the one stale inventory assertion was corrected. Tests use isolated local PostgreSQL/PostgREST fixtures. Production was not used as a writable test database.

Additional fixes found through testing/visual QA: explicit accessible names for filters; named component groups and separate concept-check controls; disabled controls until hydration; bounded responsive 3D viewport with a sticky desktop layout; reset clears exploded/hidden/selected structure state; hidden meshes cannot be ray-picked; unchanged scenes skip GPU rendering; lost WebGL context retains the accessible explanation. New procedural structures were visually inspected from browser screenshots; relevant textbook pages and all new resource previews were also inspected.

| Protected registry | Before | After | Evidence |
|---|---:|---:|---|
| Retained publication baseline | 995 | 995 | Same local baseline bytes/fingerprints |
| Supplied unverified HTML questions | 2,244 | 2,244 | Same dataset bytes |
| Registered textbooks | 82 | 82 | Same catalogue/PDF hashes |
| Provisional chapter entries | 856 | 856 | Same chapter-registry bytes |
| Curated Study Resources catalogue | 103 | 103 | Same Git-normalised JSON |
| AI tool entries | 10 | 10 | Same Git-normalised JSON; prompt source bytes unchanged |
| Earlier supplied material rows | 67 | 67 | Same source-file hashes/catalogue; 36 separate additions |

The 725-file baseline covers original textbooks/crops, selected candidate/review/data/history files and protected registry files (2,655,218,990 bytes). Extra tracked JSON comparisons normalise Git line endings. Earlier raw extraction records were also checked by the existing portal-integrity audit against its historical baseline (17,329 records and 953 proposals retained, zero errors). This is local evidence, not a new live database snapshot.

Important implementation files: `src/lib/advanced-models.ts`, `lab-math.ts`, `model-validation.ts`, the existing `models.ts`/`model-curriculum.ts`, `components/learning/LabSimulation.tsx`, existing ModelCanvas/science-geometry, the existing model page, source-controlled additional-material catalogues and authenticated notes PDF route. `npm run lab:audit` rebuilds the source-aware JSON/CSV from the registries and local source cache. No added runtime dependencies.

## Final Vercel release

Production build passed and deployment `dpl_EjL43eNmcDW51i9UsNsc1ZQonzRq` was promoted to [https://avs-12th-student-hub.vercel.app](https://avs-12th-student-hub.vercel.app). Alias inspection confirms the exact new deployment is READY. The upload used the existing working tree, with source fingerprint `95ede0cf4a4983655a74b9a10e4dc8643adcef7fc74ac97dfb9737cf424159bc`; no Git push occurred. Documentation receipts were updated after release. The local production build was not rerun; the actual Vercel production `npm run build` succeeded.

Public checks passed on eight routes and desktop (1440×1000)/mobile (390×844). The lab shows 30 entries, loads a selectable ovum structure, changes exploded view, disposes the canvas when switching to a diagram, and recalculates a changed circuit input (20 V / 4 Ω = 5 A). No page-script errors or horizontal overflow occurred. These checks used public routes only, with no production student login, migration or data import. Full authenticated workflows were exercised in isolated fixtures rather than production. [Public verification](advanced-public-verification.json).
