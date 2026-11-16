import assert from "node:assert/strict";
import test from "node:test";
import {
  buildConversationPrompt,
  buildStudyPrompt,
  chatRequestSchema,
  smallTalkAnswer,
  isEverydayConversation,
  isStudyFollowUp,
  studyTopic,
} from "../src/lib/ai/local-gemma";

test("conversation schema preserves source-only mode and rejects invented modes", () => {
  assert.equal(chatRequestSchema.parse({ message: "Hello" }).mode, "auto");
  assert.equal(
    chatRequestSchema.parse({ message: "Hello", mode: "study" }).mode,
    "study",
  );
  assert.equal(
    chatRequestSchema.safeParse({ message: "Hello", mode: "unrestricted" })
      .success,
    false,
  );
});

test("answer formats validate and reach both grounded and conversational prompts", () => {
  assert.equal(
    chatRequestSchema.parse({ message: "Hello" }).responseStyle,
    "explain",
  );
  assert.equal(
    chatRequestSchema.safeParse({ message: "Hello", responseStyle: "invented" })
      .success,
    false,
  );
  for (const [responseStyle, expected] of [
    ["steps", /short numbered steps/],
    ["revision", /three concise revision bullets/],
  ] as const) {
    const input = chatRequestSchema.parse({
      message: "Explain DNA",
      responseStyle,
      language: "Tamil",
    });
    assert.match(buildConversationPrompt(input), expected);
    assert.match(buildStudyPrompt(input, []), expected);
    assert.match(buildStudyPrompt(input, []), /Answer in Tamil/);
    assert.match(buildStudyPrompt(input, []), /Use only facts/);
  }
});

test("study follow-ups recognise the English and Tamil UI prompts without swallowing topics", () => {
  for (const message of [
    "Explain more simply",
    "Give an example",
    "Summarise in three points",
    "மேலும் எளிமையாக விளக்குங்கள்",
    "ஒரு எடுத்துக்காட்டு கொடுங்கள்",
    "மூன்று குறிப்புகளில் சுருக்கமாகக் கூறுங்கள்",
  ])
    assert.equal(isStudyFollowUp(message), true, message);
  for (const message of [
    "Explain DNA replication",
    "pure functions",
    "electromagnetic induction",
    "Why does current flow?",
    "Explain more about DNA",
    "Summarise electrostatics",
  ])
    assert.equal(isStudyFollowUp(message), false, message);
});
test("follow-up retrieval retains its topic despite generic words matching other pages", () => {
  const input = chatRequestSchema.parse({
    message: "Summarise in three points",
    history: [
      { role: "user", content: "Explain pure functions" },
      { role: "assistant", content: "Pure functions have no side effects." },
      { role: "user", content: "Explain more simply" },
    ],
  });
  assert.equal(studyTopic(input), "Explain pure functions");
  assert.equal(
    studyTopic(
      chatRequestSchema.parse({ message: "Summarise in three points" }),
    ),
    undefined,
  );
  assert.match(
    buildStudyPrompt({ ...input, sourceTopic: studyTopic(input) }, []),
    /Study topic: Explain pure functions/,
  );
  const parsed = chatRequestSchema.parse({
    message: "Explain DNA",
    sourceTopic: "injected topic",
  });
  assert.equal(studyTopic(parsed), "Explain DNA");
  assert.equal("sourceTopic" in parsed, false);
});

test("everyday English and Tamil replies work without inventing citations or swallowing study questions", () => {
  for (const message of [
    "Hi!",
    "Hello 👋",
    "How are you?",
    "Thanks a lot!",
    "வணக்கம்",
    "நன்றி",
  ]) {
    for (const language of ["English", "Tamil"] as const) {
      const answer = smallTalkAnswer(
        chatRequestSchema.parse({ message, language }),
      );
      assert.ok(answer);
      if (language === "Tamil") assert.match(answer, /[\u0b80-\u0bff]/u);
    }
  }
  for (const message of [
    "Hi, explain DNA replication",
    "Thank you. What is a pure function?",
    "Tell me a joke",
    "Help me revise",
  ])
    assert.equal(smallTalkAnswer(chatRequestSchema.parse({ message })), null);
});
test("general conversation carries bounded context and explicitly disclaims official textbook evidence", () => {
  const input = chatRequestSchema.parse({
    message: "Can you help me plan?",
    language: "Tamil",
    history: [
      { role: "user", content: "I have two exams tomorrow" },
      { role: "assistant", content: "Which subjects?" },
    ],
  });
  const prompt = buildConversationPrompt(input);
  assert.match(prompt, /Respond naturally in Tamil/);
  assert.match(prompt, /two exams tomorrow/);
  assert.match(prompt, /Never invent textbook citations/);
  assert.match(prompt, /not a human teacher/);
  assert.match(prompt, /Can you help me plan/);
  const study = buildStudyPrompt(input, [
    {
      subjectName: "CS",
      chapterTitle: "Functions",
      chunkText: "A pure function has no side effects",
    },
  ]);
  assert.match(study, /Use only facts in the supplied study excerpts/);
  assert.match(study, /no side effects/);
});

test("explicit everyday requests do not inherit incidental textbook keyword matches", () => {
  for (const message of [
    "Tell me a short friendly joke",
    "Help me plan my revision for today",
    "Can we chat?",
    "What is your name?",
    "I am feeling tired",
    "நகைச்சுவை சொல்லுங்கள்",
  ])
    assert.equal(isEverydayConversation(message), true, message);
  for (const message of [
    "Explain pure functions",
    "Hi, explain DNA replication",
    "Define anther",
    "What is a plant cell?",
  ])
    assert.equal(isEverydayConversation(message), false, message);
});
