# Everyday conversation and phone layout — 30 October 2026

The existing `/ai-helper` now offers **Chat & study** and **Study sources**. It continues to use the server-only Gemini key pool, with local Gemma and excerpt modes retained.

## Conversation

- Common English/Tamil greetings, thanks and “how are you” receive honest, lightweight assistant replies without requiring textbook matches or calling Google.
- Explicit conversational requests such as jokes, revision plans and chatting bypass incidental textbook keyword matches. Other requests use the existing stream-filtered retriever; without a match, Chat & study can generate a general conversation response.
- General conversation includes recent turns, is labelled as conversation, and has no invented textbook citations or claims of teacher approval. Its prompt distinguishes general help from official textbook wording/answers. It is not academically verified content.
- Study sources retains the strict missing-source gate. Matched study replies retain existing excerpts and citations. General outputs are never imported into MCQ records.
- Both generators share existing bounds, cancellation, language checks and key fallback. If generation fails, study replies retain their excerpts; general conversation gets an honest unavailable response rather than a fabricated answer.
- Requests default to backwards-compatible `mode: auto`; `mode: study` requests source-only answers. Mode and English/தமிழ் controls are explicit. Greetings embedded in an actual study question do not consume the question as a simple greeting.

## Phone layout

Replaced the oversized chat header with a compact title/status row, dashboard back link and new-chat action. The conversation scrolls inside its own area; scroll-to-latest does not move the whole page or interrupt browsing older messages. Message text remains selectable, and copy/source/error controls are retained. Failed/stopped requests restore the question without leaving duplicate failed turns in history.

The composer uses 16px input text, a growing textarea capped at 112px, safe-area bottom spacing and at least 44px send/stop targets. Phone Enter adds a newline; desktop Enter sends and Shift+Enter adds a newline. Conversation starters appear inside the empty chat rather than permanently taking composer space.

The shell measures the available visual viewport and observes global-header size changes. It responds to viewport resize/scroll, reduces extra toolbar/status content on short screens, and removes its listeners/observer on exit. Fixed bottom navigation and the automatic PWA banner are suppressed **only on the chatbot route**, keeping the composer clear; navigation is available through the top menu/back link and returns on other routes. The global footer, main logo and Joshua badge remain intact.

Reduced motion is respected through instant programmatic chat scrolling. Existing semantic message log/live status, labelled inputs, pressed toggle states and loading cancellation remain available.

## Actual checks

| Check | Outcome |
|---|---|
| Conversation, Gemini and local-AI unit tests | **22/22 passed** |
| Final desktop/mobile browser cases | **8/8 passed**: real API greetings/source-only missing-source gate plus UI conversation, history, mode/language selection, new chat, retry, auto-scroll and local-mode regressions |
| Narrow/short screen checks | 320×568, 360×640, 390×844 and 390×420; composer visible, 16px input, 44px send controls, no horizontal overflow |
| Real Gemini general-generation smoke | English and Tamil both generated successfully |
| Final staged deployment API with stored sample account | English/Tamil greetings and Gemini conversation passed with zero invented citations; source-only missing-source response remained blocked; a real study answer retained three citations |
| Authenticated live browser | Desktop English and mobile Tamil greetings/general Gemini conversation passed; source labels, composer visibility, no navigation/install overlays, short/narrow viewports, no page errors or overflow |
| Typecheck, full lint, diff check | Passed |
| Vercel production build | Passed |

The first broad browser run passed 7/8; its mobile geometry assertion ran during the authenticated-header height change. The observer-backed layout was rechecked using a retrying geometry assertion, and the isolated mobile run passed 2/2. The final run passed all 8 cases, including an added scroll-to-latest assertion and extra narrow viewports. One initial staged API verification encountered a transport connection reset; the complete retry passed.

Keyboard-size checks emulate a shortened viewport; no physical iOS/Android keyboard session was tested. General conversation intent matching and the existing textbook retriever are heuristic, not a complete syllabus or factual-verification system. For source-restricted answers, choose Study sources. Chat turns remain in the current page's memory, as before; this task did not add persistent chat history.

The full repository test suite was not rerun for this bounded change. Existing question, candidate, review, textbook and practice snapshots match all **725 protected local hashes**, retaining the 995 English baseline and 2,244 supplied questions. Real deployment tests use normal sample-account sign-in/chat rate-limit updates; no question, resource, review or practice-history edits were made.

## Release

Final deployment **`dpl_Cbb6ZfvKEpCNFKLZpFRsY9TYRbwb`** is READY and promoted to **https://avs-12th-student-hub.vercel.app**; the production alias was independently matched to that deployment. Source fingerprint: `5c4235416dcfba2c0ea0e8d52688d75a511d01c409514ceb816d3142c27d9c0e`.

Updated files: chat page/API, existing local/Gemini prompt generation, chat schema, route-specific bottom navigation/PWA rules, focused unit/browser tests and status documentation. No dependency, database migration or Git push. Private receipts and screenshots are under `.local`.

To use: sign in → AI → **Chat & study** for everyday conversation, or **Study sources** for excerpt-restricted questions. Select English or தமிழ், type a message and tap send.
