# Computer Learning Lab expansion — 31 October 2026

Extended the existing `/models` page; no new framework or downloaded assets. Inventory is **36 entries: 24 procedural 3D structures and 12 guided visuals**. Two new structures were added; neither is counted as a process animation. Earlier models and IDs are retained.

| New structure | Verified textbook chapter | Source | Interactions |
|---|---|---|---|
| Ethernet network interface card | Computer Applications, English, Chapter 13: Network Cabling | `12-computer-applications-english-627c1490.pdf`, PDF 190 / printed 184, section 13.3.3 | Select board, motherboard connection or hollow Ethernet socket; rotate, zoom, isolate, hide, explode, reset |
| Twisted-pair Ethernet cable | Same chapter | PDF 187 / printed 181, section 13.3.1; chapter heading at PDF 183 / printed 177 | Select four pairs or cutaway jacket; rotate, zoom, isolate, hide, explode, reset |

Source text was inspected in the existing fingerprint-checked textbook cache. The source audit validates the cache against the registered textbook hash. These models explain components, not exact hardware dimensions, signal propagation or wiring pinouts. Cable insulation uses light-coloured partners to represent white-striped conductors; it is explicitly not a termination guide. Equal twist pitches are schematic. No claims about obsolete source-page speed limits or LED-based Internet detection were copied into the lessons. English labels only; Tamil equivalents and complete chapter coverage are not claimed.

All geometry is locally authored Three.js code. No third-party models, textures, licence claims, API keys or new dependencies. Each new model includes a local concept check, kept separate from the MCQ bank.

## Existing-model improvements

- Added **Reset camera** to the shared viewer, preserving the selected component and lesson state.
- Fixed hidden components leaving their sprite labels visible.
- Retained lazy loading, capped pixel ratio, off-screen rendering suspension, reduced-motion behaviour, camera keyboard shortcuts, mobile control panel and accessible text fallback.
- Cable pairs have distinct mesh origins so exploded view actually separates them.

## Verification

The registry/source audit reports 36 entries, 24 3D structures, 82 available PDFs and zero errors. This is not a full-syllabus coverage claim. The generated JSON/CSV coverage inventories include the new source mappings.

All 728 protected files matched the before-change hashes, including resource catalogues, question/candidate/review data and local practice snapshots. No database writes, deployment or Git push were performed. Existing uncommitted changes were retained.

Results: 28/28 focused model/platform tests; six distinct passing desktop/mobile browser cases across applicable final runs; source audit, typecheck, full lint, changed-file lint, final production build and diff checks passed. Initial focused testing found an old expected advanced-lesson count (19 versus 21); corrected, then rerun. Browser test corrections wait for deferred search filtering and bring the canvas back on screen after clicking a lower mobile control; off-screen rendering is intentionally suspended. Both affected computer-specific cases passed on their final runs. Desktop screenshots of both structures were inspected. Full-repository testing is not claimed.

## How to use

Open `/models`, filter **Computer Applications**, then choose either new model and select **Explore in 3D**. Component buttons work with keyboard input and display explanations even without WebGL. On phones, expand **View controls** for camera presets, zoom, reset and isolation. The existing Computer Science binary-search and insertion-sort lessons remain available.

Next suitable batch: source-check additional Computer Technology hardware chapters and Computer Science database relationships before adding models. Physical computer anatomy, network topology, Tamil lab labels and full chapter coverage remain gaps; these two models do not resolve them.
