# Gemini chatbot key fallback — 30 October 2026

The existing authenticated `/ai-helper` chatbot now supports `AI_PROVIDER=gemini`. The two owner-provided credentials are configured in the production Vercel project as one **sensitive, server-only** `GEMINI_API_KEYS` pool. Local configuration uses ignored `.env.local`; no credential values appear in source, this report, browser responses or deployment metadata. Preview/development Vercel environments were not changed. Model: `gemini-3.1-flash-lite`, confirmed available to both credentials through Google's actual models endpoint and successful generation requests.

## Behaviour

- Ordered, deduplicated fallback pool, with at most five distinct credentials. The optional legacy `GEMINI_API_KEY` joins the pool after `GEMINI_API_KEYS`.
- Each key is attempted at most once. Credential/authentication errors, quota/rate responses, server errors, network failures and timeouts can try the next credential. Google HTTP 400 responses retry only when structured details identify an invalid/expired key; ordinary bad requests stop.
- Default attempt timeout: 12 seconds; configurable from 1–20 seconds. All attempts share a 30-second deadline. Client cancellation stops further attempts.
- Safety blocks, empty/truncated output and unsupported Tamil output never become a successful answer. Safety results are not bypassed through credential rotation.
- If generation is unavailable, the matching study excerpt and existing citations remain available. Questions with no source match keep the original no-match response without calling Google.
- Existing session protection, 12-questions/minute user limit, stream-filtered retrieval, bounded history, source citations, English/Tamil choices and answer-copy/new-chat controls remain intact.
- The interface identifies Gemini explanations and explains that the question and matching excerpts are sent to Gemini. “Gemini · enabled” indicates configuration, not a continuous health or quota guarantee.
- Local Gemma and excerpt-only modes remain available. The normal web startup script now respects Gemini mode instead of forcing local-model startup.
- No new dependency, paid integration provisioning, model download, MCQ publication or automatic answer-bank import was added. Multiple keys do not create additional quota when their projects share a quota limit.

## Verification actually completed

| Check | Result |
|---|---|
| Each supplied credential: authenticated model listing | 2/2 HTTP 200 |
| Each supplied credential: bounded source-based generation | English and Tamil both succeeded |
| Gemini and existing local-AI unit tests | **17/17 passed**, including real timeout signals, cancellation, failed credentials, quota/server failures, safety/truncation handling, language checks and secret-safe errors |
| Desktop/mobile browser with isolated database and actual Google API | **4/4 English/Tamil flows passed** with a deliberately invalid first key and the real second key; answers retained citations and new-chat reset worked |
| Existing local-mode/status/error browser regressions | **4/4 passed** |
| Staged production build, stored sample student | Authenticated English and Tamil requests both returned `engine: gemini`, three citations and nonempty generated answers |
| Public release checks | Home, chatbot entry, resources and models returned HTTP 200; the chatbot entry correctly redirects guests to login; anonymous chat GET/POST remain HTTP 401 |
| Live desktop/mobile checks | Login access flow passed with no page errors or horizontal overflow |
| Secret exclusion | Both values absent from 473 inspected source/public text files, public HTML and 18 loaded browser-script responses |
| Typecheck, full lint, diff check | Passed |
| Vercel production build | Passed |

An initial local browser helper used the English selector `Tamil` for the button labelled `தமிழ்`; the selector was corrected and all four real fallback flows passed. The first public browser helper expected a guest chat input; the existing login redirect correctly prevented that. The corrected guest-login checks passed. These were test expectation issues, not disabled authentication or application fixes.

The full 18-minute repository suite was not repeated for this bounded AI change. Its earlier run and subsequent test-fixture fixes are recorded in `JOSHUA_INTRODUCTION_RESOURCES.md`.

The sample-account deployment check uses normal sign-in and AI rate-limit updates. It does not edit questions, resources, teacher decisions or practice history. The 725 protected local file hashes still match; the retained English baseline remains 995 and the supplied unverified bank remains 2,244. This is local preservation evidence, not a fresh production database snapshot.

## Release

Deployment **`dpl_2Wt18xzFn5A8AgPVD3YPXz4Vnf8m`** built READY and was promoted to **https://avs-12th-student-hub.vercel.app**. The production alias was independently checked against that exact deployment after propagation. Source fingerprint: `1119ac437a877d0f2c5c0bcc6d2970f1c1e1855e467e3f2894901bee70af3268`.

This was a working-tree deployment retaining existing changes; no Git push occurred. Product files: `src/lib/ai/gemini.ts`, provider selection, chat API, chatbot page, web startup and `.env.example`. Private verification receipts remain under `.local`; no credentials are included in the report.

Open the website, sign in with a student account, and choose **AI** → **SkillUp AI Study Assistant**. It should show **Gemini · enabled**. Ask a question supported by the available Computer Science/Biology study excerpts and select English or தமிழ்.

Protocol references: [Google API-key guidance](https://ai.google.dev/gemini-api/docs/api-key), [Gemini text generation](https://ai.google.dev/gemini-api/docs/text-generation), [Gemini 3.1 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite).
