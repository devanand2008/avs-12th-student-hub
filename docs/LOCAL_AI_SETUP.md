# Local Gemma for AVS 12 Hub

The chatbot runs Google Gemma 3 1B IT Q4_K_M from [Hugging Face](https://huggingface.co/lmstudio-community/gemma-3-1b-it-GGUF), using the [llama.cpp CPU server](https://github.com/ggml-org/llama.cpp/tree/master/tools/server). It is governed by the [Gemma terms](https://ai.google.dev/gemma/terms).

## Start the website and model

The model and runtime are already installed in this workspace:

```powershell
npm run dev
```

Open `http://localhost:3000`, sign in using an existing account, and open **AI Study Assistant** (`/ai-helper`). The status badge shows **Gemma · running locally** when the configured model is ready. The command waits for the model before starting Next.js and reuses an existing instance of the same model. Ctrl+C stops the processes it started.

On another Windows x64 PC, run `npm ci` and `npm run ai:setup` first. Setup downloads an 806 MB model and a 19 MB runtime archive, pins their upstream versions and verifies SHA-256 checksums before installation. Interrupted downloads resume when setup is rerun. A checksum mismatch stops installation; move the indicated corrupt file aside before retrying.

Both `npm run dev` and `npm start` launch Gemma automatically before starting the website. For production on this PC, run `npm run build` once, then `npm start`. The existing `npm run dev:local` command remains an alias for development startup. Gemma runs on the server and answers through the web chatbot.

For a single production command, use `npm run serve`. It builds first and starts the website and model only if the build succeeds. Before switching from development to production, stop the development terminal with Ctrl+C so port 3000 is free. Opening a second server on the same port produces `EADDRINUSE`.

To manage services separately, use `npm run ai:start` with `npm run dev:web` or `npm run start:web`. The Docker and Render configurations use the web-only command because their existing deployment does not include the downloaded native runtime or model. Hosting with local inference requires provisioning those on the hosting server.

## Configuration and files

These server-only settings are in `.env.local`:

```dotenv
AI_PROVIDER=local
LOCAL_AI_BASE_URL=http://127.0.0.1:8080/v1
LOCAL_AI_MODEL=avs-gemma-3-1b
LOCAL_AI_TIMEOUT_MS=120000
```

`AI_PROVIDER=excerpts` disables generation and skips model startup. The default is `local`. With the local provider, a missing model or a startup failure stops startup with a useful error; run `npm run ai:setup` if installation is needed. The chatbot does not use a Gemini API key. Only HTTP loopback endpoints ending in `/v1` are accepted. The native server binds to loopback, restricts browser CORS to localhost and disables its separate web UI.

Downloads are excluded from Git:

- `local ai model/gemma-3-1b-it-Q4_K_M.gguf`
- `.local/ai/runtime/llama-server.exe` and adjacent DLLs
- `.local/ai/installation.json`, containing sources and checksums

The installer targets Windows x64. On another operating system, install the appropriate llama.cpp server yourself. Set `LOCAL_AI_EXECUTABLE` to its executable path and `LOCAL_AI_MODEL_PATH` to the GGUF path; the shared startup commands can then launch it automatically. Alternatively, serve the model independently on a loopback `/v1` endpoint with the alias `avs-gemma-3-1b`. Keep the runtime on the same host as Next.js. A shared deployment needs the model on the web server, not on a visitor's PC.

## Behavior and offline limits

`POST /api/ai/chat` checks the session, filters materials by the student's stream, retrieves up to three matching curriculum excerpts and passes them with bounded conversation history to Gemma. `GET /api/ai/chat` reports readiness. Questions have a finite timeout and rate limit and support cancellation. Questions without matching material receive a refusal without running inference. If Gemma fails, the matching excerpt appears with a fallback notice.

Citations identify the supplied excerpts, not proof that every generated sentence is correct. This compact model can make mistakes, especially in Tamil or complex explanations. If a Tamil request receives a mostly English answer, the app shows the Tamil study excerpt with a notice. Check answers with the cited study material.

**Only inference is offline.** Initial installation requires internet. The local memory demo can run offline, but configured Supabase accounts and data require their database connection. Uploaded PDFs are not automatically indexed: the admin content route remains responsible for content management. See [content setup](CONTENT_SETUP.md).

This 8 GB PC uses four CPU threads, one inference slot and an 8,192-token context. Answers take a short pause. A local demonstration fits this configuration; serving many students requires appropriately sized hardware.

## Verify

With Gemma running, `npm run ai:check` and `npm run ai:check -- --tamil` generate diagnostic answers without changing account or content records. The Tamil diagnostic reports a failure if Gemma returns mostly English; the website handles that case by showing the source excerpt.

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, then `npm run test:e2e -- tests/e2e/local-ai.spec.ts`. Browser tests normally use excerpt mode and mocked UI responses. To exercise the installed model through the authenticated Next.js API:

```powershell
$env:AVS_TEST_LOCAL_AI = "true"
npm run test:e2e -- tests/e2e/local-ai.spec.ts --grep "installed Gemma"
Remove-Item Env:AVS_TEST_LOCAL_AI
```

Browser tests use a separate fixture database and do not touch live Supabase accounts. Screenshots are saved to `.local/ai-chat-desktop.png` and `.local/ai-chat-mobile.png`.
