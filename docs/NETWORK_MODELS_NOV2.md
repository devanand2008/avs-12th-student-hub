# Network structures and shared viewer improvements

2 November 2026. Existing `/models` Learning Lab extended; no framework replacement, new dependency, downloaded model or texture.

## Added structures

All three belong to **Computer Applications, English, Chapter 13 — Network Cabling**, source `12-computer-applications-english-627c1490.pdf`. Chapter heading was checked at PDF 183 / printed 177. The local extraction cache fingerprint matches the registered textbook.

| Model | Source PDF / printed page | Selectable parts | Limits |
|---|---|---|---|
| Coaxial cable cutaway | 184 / 178 | Central conductor, dielectric insulation, metallic shield, outer jacket | Stepped concentric shells; no impedance or signal simulation; smooth shield stands for braid/foil |
| Optical fibre cutaway | 184 / 178 (continued 185 / 179) | Core, cladding, protective coating | One fibre, not a whole multi-fibre cable; no optical-mode or ray simulation; colours and diameters schematic |
| Eight-contact Ethernet plug | 188 / 182 | Open-sided housing, eight separate contacts, retaining latch | 8P8C/RJ45 concept only; no pin numbering, colour wiring or termination guide |

The textbook establishes the curriculum contexts. Layer details were cross-checked against [Belden construction information](https://www.belden.com/products/cable/video-cable/coaxial-video-cable/8241f) and [the Fiber Optic Association reference](https://www.thefoa.org/tech/ref/basic/fiber.html). These references are linked in the lessons; no images/assets were copied. Obsolete speed limits, USB-version statements and questionable cable-installation generalisations in adjacent source text were not repeated.

Each new structure supports rotate/zoom, component selection and explanation, hide/show, isolation, exploded/complete views, camera presets and reset, plus a model-local concept check. The checks do not enter the MCQ bank. All geometry is locally authored procedural Three.js geometry. English labels only; this does not establish full chapter or Tamil-medium coverage.

## Existing viewer improvements

- Added **Surface mesh / Solid surfaces** for all shared 3D scenes. The control describes this as the rendering mesh, not a physical structure. It resets when a different model or lesson reset is selected.
- Home key now calls the same camera reset as the button, including model orientation and target.
- Existing component highlighting, hidden-part labels, reduced-motion preference, lazy scene loading, off-screen suspension, pixel-ratio cap, mobile controls and no-WebGL textual fallback are retained.

## Inventory and validation

Registry audit: **39 entries, 27 3D structures, 12 guided visuals**, 82 available PDFs, zero audit errors. Three static structures added; no additional process animation claimed. Generated JSON/CSV coverage inventories updated.

Verification: **33/33 focused regression tests**, **8/8 desktop/mobile browser cases**, typecheck, full lint, local production build, registry/source audit and `git diff --check` passed. Browser cases exercise all 27 registered 3D structures and selectable parts, existing camera controls, isolation, new model hide/show and exploded views, surface mesh and keyboard Home reset, and the WebGL-unavailable fallback. Geometry tests check eight distinct plug contacts, matching part labels, hollow nested shells and decreasing cutaway heights. Rendered desktop and mobile images were inspected. The complete repository/extraction suite was not rerun.

All **728 protected files** match the existing snapshot. No resource catalogue, points rule, scoreboard, AI tool, MCQ record, teacher decision or practice history is changed by this batch. No production database writes or Git push.

Cloud deployment **`dpl_3tgpJ6Uqbu4Tr7pBGQnToXHZyLav`** is READY and promoted to the existing Vercel production alias. Source fingerprint `42b54c064113dbdb068d4c24b65516c0aa05a2af2376f77749d828e3e2d4869f` matched the local tested files. Cloud build and staged `/models` response/new-title/canonical checks passed.

**8/8 live model checks passed**: the three new structures plus existing DNA on desktop/mobile, actual surface-mesh changes, keyboard reset, screenshots, no horizontal overflow and no page errors. An initial live wait-for-render assertion timed out; rerunning with an explicit rotation pause before camera assertions passed all eight, without changing application code. The short deployment-scoped error/fatal log query returned no groups. Private receipts: `.local/lab-nov2-*` and `.local/network-lab-*`.

## Student access and next batch

Open `/models`, filter **Computer Applications**, then search a title above and choose **Explore in 3D**. On phones expand **View controls** to use **Surface mesh**, camera presets or isolation.

Next useful batch: source-check additional Computer Technology hardware chapters and Computer Science database relationships. These remain gaps; no full-syllabus coverage claim is made.
