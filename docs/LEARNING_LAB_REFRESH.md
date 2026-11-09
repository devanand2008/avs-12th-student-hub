# Class 12 Learning Lab refresh — 30 October 2026

Extended the existing `/models` and `/interactive-3d` routes using the installed Three.js implementation. Baseline: 30 learning entries, 18 actual 3D structures and 12 guided visuals. Current registry: **34 entries, 22 actual 3D structures and 12 guided visuals**. The seven existing guided playback concepts and retained vector animation are unchanged; camera rotation is not counted as a scientific animation.

## New source-checked structures

All four use the locally installed English-medium Class 12 textbook editions. PDF pages below are one-based and differ from printed textbook pages.

| Subject / textbook | Verified chapter | Model | PDF / printed page | Learning interaction |
|---|---|---|---|---|
| Bio-Zoology | 2. Human Reproduction | Human sperm | 25 / 17 | Select acrosome, nucleus, neck, mitochondrial middle piece and flagellar tail |
| Bio-Botany | 1. Asexual and Sexual Reproduction in Plants | Typical Polygonum-type embryo sac | 18 / 12 | Inspect seven cells and eight nuclei, including two polar nuclei within one central cell |
| Chemistry Volume 1 | 6. Solid State | Body-centred cubic unit cell | 193 / 183 | Count eight corner centres, one body centre, twelve edges and eight nearest-neighbour directions; distinguish drawn centres from atom contributions |
| Physics Volume 2 | 10. Electronics and Communication | Equilibrium p–n junction | 210–211 / 202–203 | Inspect mobile holes/electrons, fixed charged ions and the built-in field from n to p |

Exact source IDs, PDF filenames, file SHA-256, cached page-text hashes, chapter mappings, objectives, local concept checks and limitations are recorded in [the generated coverage inventory](advanced-learning-lab-coverage.json) and [CSV](advanced-learning-lab-coverage.csv). Source-page text and rendered page images were inspected locally. The junction's primary link opens PDF 210; the continued explanation is on PDF 211.

The new content is an authored educational schematic. Sperm dimensions/axoneme detail are simplified; the embryo sac depicts the stage before fusion of polar nuclei and is not universal to all angiosperms; BCC spheres have reduced radii and connecting lines are geometric guides rather than bonds; junction carrier counts/widths are illustrative and minority carriers, bulk ion balance and drift/diffusion currents are omitted. These are not numerical biological/device simulations. English labels are available; equivalent Tamil source-page mappings remain unverified.

## Improvements to existing structures

All 22 3D structures now provide Front, Top and Side camera presets, touch-friendly Zoom in/out and a Focus selected component / Show whole model toggle. Presets restore object orientation; focus follows the selected component. Reset view/structure and model navigation restore the complete scene. Tree label sprites follow component isolation. Existing drag, pinch/scroll, keyboard arrows, +/−/Home, rotation, source links, local concept checks and guided lessons remain.

The four additions also reuse the existing exploded view and hide/show controls. Exploded positions are illustrative separation, not a biological process. The p–n model uses charge signs and separate carrier/ion colours, with no free carriers drawn in its depletion region. On phones the camera toolbar is collapsible and touch instructions are outside the canvas, leaving the structure visible. Show whole model remains enabled when a focused part is hidden. All four scenes were visually inspected; the long sperm silhouette was recentered so its tail fits the default complete view.

No dependency or external model/texture was added. All new meshes are procedural local code; no third-party asset licence or attribution is claimed. Geometry is loaded only after activating 3D. Existing reduced-motion handling, offscreen/background render suspension, capped pixel ratio, resource disposal and accessible text fallback remain. Camera controls disappear when WebGL is unavailable; component descriptions remain usable.

## Scope and preservation

The previous resource-folder work remains intact. No MCQ, review decision, candidate, practice-history, resource or AI-tool dataset was edited for this task. A fresh before/after local SHA-256 baseline covers 728 protected files, including the current additional resource catalogues and AI chapter registry. This checks available local files, not the full live database. No production database write, import, teacher approval or Git push is part of this release.

Coverage remains partial: 82 registered PDFs, 40 subjects and 856 provisional detected chapter entries are inventoried, not declared covered. Ten retained general models still lack checked chapter mappings. No chapter is certified complete. Next useful batch: verify Tamil terminology/equivalent source pages for these four structures, then source-bounded translation/protein synthesis and angiosperm double fertilisation. Those targets are not included in the implemented count.

## Validation and release

Focused model tests: **7/7 passed**, including mesh/part consistency, eight BCC corner centres plus one centre, twelve cell edges/eight neighbour directions, embryo-sac nuclear counts, junction carrier positions, ion signs and field-arrow direction. These invariant checks do not certify a physically scaled simulation.

Relevant local browser coverage: **12/12 distinct desktop/mobile cases passed across the final applicable runs**: all 19 source-linked lessons, graph/algorithm/process controls and reduced motion, all additional resource IDs, all 22 3D structures, camera/focus/hide interactions and WebGL fallback. Final phone layout was inspected visually and rechecked; final focus/hide controls and fallback passed 4/4. Source references, local concept feedback, canvas cleanup, selectable descriptions and absence of horizontal overflow/page errors were checked where specified by each case.

Initial browser runs exposed stale resource-description counting and a search-result wait missing in the new fallback test; both checks were corrected and their four desktop/mobile cases rerun successfully. The Chemistry filter assertion was updated for seven actual Chemistry entries. A new test's missing TypeScript `this` annotation was fixed; subsequent typecheck and full lint passed. `git diff --check` passed. Registry/source-cache audit: 34 entries, 22 3D, 19 source-linked lessons, 82 accessible PDFs, 40 registered subjects, 856 provisional chapter entries, zero audit errors.

Full `npm test` run: **253 tests, 251 passed, 2 failed, 0 skipped**, in 1,450 seconds. Both failed results refer to one stale `learningModels.length === 30` assertion and its parent platform test. Updated that assertion to the actual 34-entry inventory; reran the entire affected file: **21/21 passed, 0 failed, 0 skipped**. The full 253-test command was not repeated after this assertion-only fix. No other failure was reported in that full run. This is a full run followed by a targeted successful rerun, not a claim that the original full command exited successfully.

Additional navigation smoke checks: homepage, `/resources`, `/ai-study-tools` and `/practice/collections`, desktop and phone: **8/8 passed**, with no script errors or horizontal overflow. These are navigation checks, not a repeat of every authenticated MCQ workflow. The full suite separately exercised scoring, source selection, held-question exclusion, review decisions and history in isolated fixtures.

Production build `dpl_A2e3VzeQoYnhkxaMmH5m4yz6CrN4` is **READY** and has been promoted to the existing Vercel project. The read-only deployment API confirmed project ID `prj_YASnKdy7xVDdXNHhm4oqa19X2iZX` and the exact application/source fingerprint `a076574b92371bf8bf833412042aca088dde7e47a90af88312bdd5ee2bd04b5c`. Earlier staged builds were superseded while visual/control fixes were verified; only this final artifact was promoted. This is a working-tree release; no Git push occurred. Existing supplied-resource changes were preserved in the build.

The production alias `avs-12th-student-hub.vercel.app` was independently verified to point to this final deployment. Live model/control/fallback checks: **4/4 passed** across desktop/mobile, exercising the four new models plus retained DNA and tree models. Live navigation checks: **8/8 passed** for the homepage, Resources, AI Study Tools and practice library. No script errors or horizontal overflow were observed in those navigation/control checks. No live activity/review/candidate API mutation was used.

Final post-suite preservation check: **728/728 protected local files unchanged**. The retained 995-English-question snapshot and existing supplied-practice, candidate/review/history, resource and AI files remain intact wherever included in that authoritative local baseline. This does not claim a full before/after snapshot of the production database. The code and tests in this task did not access production Supabase for writes.

Important changes: `src/lib/advanced-models.ts`, `science-geometry.ts`, `ModelCanvas.tsx`, `/models/page.tsx`; source coverage JSON/CSV; focused model/controls tests and existing model-count/resource regression assertions. Routes `/models` and `/interactive-3d` remain the integrated Learning Lab.
