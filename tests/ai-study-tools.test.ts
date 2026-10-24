import test from "node:test";
import assert from "node:assert/strict";
import {
  aiStudyTools,
  aiSubjects,
  isFreeTool,
  matchesTool,
  studyPrompt,
  toolSchema,
  validateAiTools,
  promptTemplates,
} from "../src/lib/ai-study-tools";
import chapters from "../src/lib/ai-study-chapters.json";
test("tool registry validates identities, sources, actual curriculum IDs and separate AI/access classifications", () => {
  assert.equal(aiStudyTools.length, 10);
  assert.equal(aiSubjects.length, 82);
  assert.equal(new Set(aiSubjects.map((s) => s.name)).size, 40);
  assert.equal(
    aiStudyTools.filter((t) => t.verification === "Source checked").length,
    9,
  );
  assert(chapters.every((c) => aiSubjects.some((s) => s.id === c.subjectId)));
  assert.equal(new Set(chapters.map((c) => c.id)).size, chapters.length);
  assert(
    aiStudyTools.every((t) =>
      t.subjectIds.every((id) => aiSubjects.some((s) => s.id === id)),
    ),
  );
  assert.equal(
    aiStudyTools.find((t) => t.id === "phet")!.type,
    "Subject learning tool",
  );
  assert.throws(
    () => validateAiTools([aiStudyTools[0], aiStudyTools[0]]),
    /Duplicate/,
  );
  assert.throws(
    () => validateAiTools([{ ...aiStudyTools[0], subjectIds: ["made-up"] }]),
    /Unknown subject/,
  );
});
test("unsafe destinations, arbitrary HTML and missing metadata fail closed", () => {
  const t = aiStudyTools[0];
  for (const url of [
    "javascript:alert(1)",
    "http://example.com",
    "https://user:secret@example.com",
    "https://localhost/a",
    "not-a-url",
  ])
    assert.equal(toolSchema.safeParse({ ...t, url }).success, false);
  assert.equal(
    toolSchema.safeParse({ ...t, iframeHtml: "<iframe>" }).success,
    false,
  );
  assert.equal(toolSchema.safeParse({ ...t, sources: [] }).success, false);
  assert(
    toolSchema.safeParse({
      ...t,
      privacyUrl: null,
      termsUrl: null,
      account: "Unknown",
    }).success,
  );
});
test("all filter dimensions work and free filter excludes unverified/eligibility-only access", () => {
  const t = aiStudyTools.find((t) => t.id === "gemini")!;
  const f = {
    q: "Gemini",
    subject: t.subjectIds[0],
    task: t.tasks[0],
    type: t.type,
    category: t.categories[0],
    language: "Tamil",
    access: "free-tools",
    account: "Required",
  };
  assert(matchesTool(t, f));
  for (const key of [
    "q",
    "subject",
    "task",
    "type",
    "category",
    "language",
    "access",
    "account",
  ]) {
    assert(!matchesTool(t, { ...f, [key]: "missing" }));
  }
  assert(!isFreeTool({ ...t, access: "access_status_unverified" }));
  assert(
    !isFreeTool({ ...t, access: "school_or_account_eligibility_required" }),
  );
  assert(t.limitations.length > 20);
});
test("prompts retain supplied curriculum context, Tamil and editable text without fabricating references", () => {
  for (const key of Object.keys(
    promptTemplates,
  ) as (keyof typeof promptTemplates)[]) {
    const prompt = studyPrompt(
      key,
      "Physics · Tamil",
      "Chapter 1",
      "மின்புலம் <b>test</b>",
      "Tamil",
    );
    assert(prompt.includes("Physics · Tamil, Chapter 1"));
    assert(prompt.includes("மின்புலம் <b>test</b>"));
    assert(prompt.includes("Do not invent"));
  }
  assert(!studyPrompt("concept", "", "", "", "English").includes("undefined"));
});
