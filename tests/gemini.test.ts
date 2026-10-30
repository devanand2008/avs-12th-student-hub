import assert from "node:assert/strict";
import test from "node:test";
import { generateGeminiAnswer, getGeminiStatus } from "../src/lib/ai/gemini";
import { aiProvider, chatRequestSchema } from "../src/lib/ai/local-gemma";

test("Gemini key fallback is bounded, grounded, cancellable and does not leak credentials", async (t) => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;
  const calls: { url: string; key: string; body: string }[] = [];
  let mode = "success";
  process.env.GEMINI_API_KEYS = "fake-primary, fake-secondary, fake-primary";
  process.env.GEMINI_API_KEY = "fake-secondary";
  process.env.GEMINI_MODEL = "gemini-3.1-flash-lite";
  process.env.AI_PROVIDER = "gemini";
  const input = chatRequestSchema.parse({ message: "Explain pure functions" });
  const context = [
    {
      subjectName: "Computer Science",
      chapterTitle: "Functions",
      chunkText: "A pure function has no side effects.",
    },
  ];
  const completed = (text: string, finishReason = "STOP") =>
    Response.json({
      candidates: [
        {
          finishReason,
          content: {
            parts: [{ text: "private reasoning", thought: true }, { text }],
          },
        },
      ],
    });
  globalThis.fetch = async (url, init) => {
    const key = new Headers(init?.headers).get("x-goog-api-key")!;
    assert.equal(init?.redirect, "error");
    assert.equal(init?.cache, "no-store");
    assert.ok(init?.signal);
    calls.push({ url: String(url), key, body: String(init?.body) });
    if (mode === "hang")
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new Error("Aborted fake-primary")),
          { once: true },
        );
      });
    if (mode === "invalid-key" && key === "fake-primary")
      return Response.json(
        { error: { details: [{ reason: "API_KEY_INVALID" }] } },
        { status: 400 },
      );
    if (mode === "first-quota" && key === "fake-primary")
      return new Response("quota", { status: 429 });
    if (mode === "network") throw new Error("fake-primary provider detail");
    if (mode === "empty") return completed(" ");
    if (mode === "blocked") return completed("", "SAFETY");
    if (mode === "truncated") return completed("Partial", "MAX_TOKENS");
    if (mode === "bad-request")
      return new Response("fake-primary rejected", { status: 400 });
    if (mode === "failed" || key === "fake-primary")
      return new Response("fake-primary provider detail", { status: 503 });
    if (mode === "denied")
      return new Response("credential details", { status: 401 });
    if (mode === "quota" && key === "fake-secondary")
      return new Response("quota", { status: 429 });
    return completed(
      mode === "tamil"
        ? "தூய செயல்கூறு பக்க விளைவுகள் இல்லாமல் செயல்படும்."
        : "A pure function has no side effects.",
    );
  };
  try {
    await t.test(
      "invalid-key and quota statuses on the primary credential use the secondary",
      async () => {
        for (mode of ["invalid-key", "first-quota"]) {
          calls.length = 0;
          assert.equal(
            await generateGeminiAnswer(input, context),
            context[0].chunkText,
          );
          assert.deepEqual(
            calls.map((c) => c.key),
            ["fake-primary", "fake-secondary"],
          );
        }
        calls.length = 0;
        mode = "success";
      },
    );
    await t.test(
      "primary failure uses the second unique key and preserves grounding",
      async () => {
        assert.equal(aiProvider(), "gemini");
        assert.equal(
          await generateGeminiAnswer(input, context),
          context[0].chunkText,
        );
        assert.deepEqual(
          calls.map((c) => c.key),
          ["fake-primary", "fake-secondary"],
        );
        const payload = JSON.parse(calls[0].body);
        assert.match(payload.contents[0].parts[0].text, /Use only facts/);
        assert.match(payload.contents[0].parts[0].text, /no side effects/);
        assert.equal(payload.generationConfig.maxOutputTokens, 768);
        assert.ok(
          calls.every(
            (c) =>
              c.url ===
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent" &&
              !c.body.includes("fake-primary"),
          ),
        );
        assert.equal(
          JSON.stringify(getGeminiStatus()).includes("fake-"),
          false,
        );
      },
    );
    await t.test(
      "conversation requests use recent chat without claiming textbook evidence",
      async () => {
        calls.length = 0;
        await generateGeminiAnswer(
          {
            ...input,
            history: [{ role: "user", content: "I have an exam tomorrow" }],
          },
          [],
          undefined,
          "conversation",
        );
        const prompt = JSON.parse(calls[0].body).contents[0].parts[0].text;
        assert.match(prompt, /Respond naturally in English/);
        assert.match(prompt, /exam tomorrow/);
        assert.match(prompt, /No verified textbook excerpt/);
        assert.doesNotMatch(prompt, /\[Source 1:/);
      },
    );
    await t.test(
      "quota, denied and network errors exhaust each key at most once with safe errors",
      async () => {
        for (mode of ["quota", "denied", "failed", "network"]) {
          calls.length = 0;
          await assert.rejects(
            generateGeminiAnswer(input, context),
            (e: Error) =>
              e.message === "Gemini could not complete this question.",
          );
          assert.equal(calls.length, 2);
        }
      },
    );
    await t.test(
      "bad requests, safety blocks, empty and truncated answers do not rotate to bypass the result",
      async () => {
        for (mode of ["bad-request", "blocked", "empty", "truncated"]) {
          calls.length = 0;
          // Use the successful credential first to inspect a completed response.
          process.env.GEMINI_API_KEYS = "fake-secondary,fake-primary";
          await assert.rejects(generateGeminiAnswer(input, context));
          assert.equal(calls.length, 1);
        }
      },
    );
    await t.test(
      "Tamil language failures fall back and cancellation stops before any request",
      async () => {
        mode = "success";
        await assert.rejects(
          generateGeminiAnswer({ ...input, language: "Tamil" }, context),
          /Tamil explanation/,
        );
        mode = "tamil";
        assert.match(
          await generateGeminiAnswer({ ...input, language: "Tamil" }, context),
          /தூய/,
        );
        const controller = new AbortController();
        controller.abort();
        calls.length = 0;
        await assert.rejects(
          generateGeminiAnswer(input, context, controller.signal),
          /cancelled/,
        );
        assert.equal(calls.length, 0);
      },
    );
    await t.test(
      "in-flight timeouts exhaust the bounded pool and aborts do not start a second request",
      async () => {
        mode = "hang";
        process.env.GEMINI_TIMEOUT_MS = "1000";
        calls.length = 0;
        await assert.rejects(generateGeminiAnswer(input, context));
        assert.equal(calls.length, 2);
        calls.length = 0;
        const controller = new AbortController();
        const pending = generateGeminiAnswer(input, context, controller.signal);
        controller.abort();
        await assert.rejects(pending, /cancelled/);
        assert.equal(calls.length, 1);
      },
    );
    await t.test(
      "missing credentials and invalid model paths fail without network access",
      async () => {
        delete process.env.GEMINI_API_KEYS;
        delete process.env.GEMINI_API_KEY;
        assert.equal(getGeminiStatus().ready, false);
        calls.length = 0;
        await assert.rejects(generateGeminiAnswer(input, context));
        process.env.GEMINI_MODEL = "gemini-../elsewhere?key=secret";
        await assert.rejects(
          generateGeminiAnswer(input, context),
          /configuration/,
        );
        assert.equal(calls.length, 0);
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
  }
});
