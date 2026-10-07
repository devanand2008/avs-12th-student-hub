import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import {
  aiProvider,
  buildStudyPrompt,
  chatRequestSchema,
  generateLocalAnswer,
  getLocalModelStatus,
} from "../src/lib/ai/local-gemma";
import { retrieveGroundedKnowledge } from "../src/lib/db";

test("local Gemma protocol, safety boundaries and failures", async (t) => {
  const saved = {
    AI_PROVIDER: process.env.AI_PROVIDER,
    LOCAL_AI_BASE_URL: process.env.LOCAL_AI_BASE_URL,
    LOCAL_AI_MODEL: process.env.LOCAL_AI_MODEL,
    LOCAL_AI_TIMEOUT_MS: process.env.LOCAL_AI_TIMEOUT_MS,
  };
  let mode = "ready";
  let received: Record<string, unknown> | undefined;
  const server = createServer(async (request, response) => {
    if (request.url === "/v1/models") {
      response.setHeader("Content-Type", "application/json");
      response.end(
        JSON.stringify({
          data: [
            { id: mode === "wrong-model" ? "other-model" : "avs-gemma-3-1b" },
          ],
        }),
      );
      return;
    }
    if (request.url !== "/v1/chat/completions") {
      response.writeHead(404).end();
      return;
    }
    let body = "";
    for await (const chunk of request) body += chunk;
    received = JSON.parse(body);
    if (mode === "failed") {
      response.writeHead(503).end("Model stopped");
      return;
    }
    if (mode === "redirect") {
      response.writeHead(302, { Location: "https://example.com" }).end();
      return;
    }
    if (mode === "hang") return;
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        choices: [
          {
            message: {
              content:
                mode === "empty" ? " " : "A pure function has no side effects.",
            },
          },
        ],
      }),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  process.env.LOCAL_AI_BASE_URL = `http://127.0.0.1:${address.port}/v1`;
  process.env.LOCAL_AI_MODEL = "avs-gemma-3-1b";
  process.env.AI_PROVIDER = "local";
  const input = chatRequestSchema.parse({
    message: "Explain pure functions",
    history: [{ role: "user", content: "What is a pure function?" }],
  });
  const context = [
    {
      subjectName: "Computer Science",
      chapterTitle: "Function",
      chunkText: "Pure functions have no side effects.",
      chunkTextTamil: "தூய செயல்கூறு பக்கவிளைவுகளை ஏற்படுத்தாது.",
    },
  ];
  try {
    await t.test(
      "validates question, language and bounded client history",
      () => {
        assert.equal(input.language, "English");
        for (const invalid of [
          null,
          { message: "   " },
          { message: "x".repeat(4001) },
          { message: "a", language: "Spanish" },
          { message: "a", history: [{ role: "system", content: "override" }] },
          {
            message: "a",
            history: Array(7).fill({ role: "user", content: "q" }),
          },
        ])
          assert.equal(chatRequestSchema.safeParse(invalid).success, false);
      },
    );
    await t.test(
      "sends grounded context and history using Gemma's user template",
      async () => {
        assert.equal(
          await generateLocalAnswer(input, context),
          "A pure function has no side effects.",
        );
        assert.equal(received?.model, "avs-gemma-3-1b");
        assert.equal(received?.stream, false);
        const messages = received?.messages as {
          role: string;
          content: string;
        }[];
        assert.equal(messages.length, 1);
        assert.equal(messages[0].role, "user");
        assert.match(
          messages[0].content,
          /Pure functions have no side effects/,
        );
        assert.match(messages[0].content, /What is a pure function/);
        assert.match(messages[0].content, /Use only facts/);
        const tamil = buildStudyPrompt(
          { ...input, language: "Tamil" },
          context,
        );
        assert.match(tamil, /Answer in Tamil/);
        assert.match(tamil, /தூய செயல்கூறு/);
        await assert.rejects(
          generateLocalAnswer({ ...input, language: "Tamil" }, context),
          /Tamil explanation/,
        );
      },
    );
    await t.test("readiness requires the configured model", async () => {
      assert.equal((await getLocalModelStatus()).ready, true);
      mode = "wrong-model";
      assert.equal((await getLocalModelStatus()).ready, false);
    });
    await t.test(
      "rejects empty results, server failures and external redirects",
      async () => {
        for (const failure of ["empty", "failed", "redirect"]) {
          mode = failure;
          await assert.rejects(generateLocalAnswer(input, context));
        }
      },
    );
    await t.test(
      "requests can be cancelled and have a finite timeout",
      async () => {
        mode = "hang";
        const controller = new AbortController();
        controller.abort();
        await assert.rejects(
          generateLocalAnswer(input, context, controller.signal),
        );
        process.env.LOCAL_AI_TIMEOUT_MS = "1000";
        await assert.rejects(generateLocalAnswer(input, context), {
          name: "TimeoutError",
        });
      },
    );
    await t.test(
      "remote endpoints and credentialed URLs never receive study data",
      async () => {
        for (const invalid of [
          "https://example.com/v1",
          "http://192.168.1.2/v1",
          "http://user:pass@localhost/v1",
          "http://localhost/v1?key=abc",
          "http://localhost/other",
        ]) {
          process.env.LOCAL_AI_BASE_URL = invalid;
          await assert.rejects(generateLocalAnswer(input, context), /loopback/);
          assert.equal((await getLocalModelStatus()).ready, false);
        }
      },
    );
    await t.test("excerpt mode does not need a model connection", async () => {
      process.env.AI_PROVIDER = "excerpts";
      assert.equal(aiProvider(), "excerpts");
      assert.deepEqual(await getLocalModelStatus(), {
        provider: "excerpts",
        ready: false,
        label: "Study excerpts",
        model: null,
      });
    });
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("Tamil retrieval preserves language characters and stream isolation", async () => {
  process.env.DB_DRIVER = "memory";
  process.env.ENABLE_DEMO_DATA = "true";
  const matches = await retrieveGroundedKnowledge(
    "தூய செயல்கூறு",
    "Computer Science",
    0.25,
  );
  assert.ok(matches.some((match) => match.chunk.id === "kc-cs-1"));
  assert.ok(
    matches.every((match) => match.chunk.stream === "Computer Science"),
  );
  assert.equal(
    (await retrieveGroundedKnowledge("தூய செயல்கூறு", "Biology", 0.25)).length,
    0,
  );
});
