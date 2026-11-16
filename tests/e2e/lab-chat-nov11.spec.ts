import { test, expect } from "@playwright/test";
import { advancedModels } from "../../src/lib/advanced-models";
import { testFixtureOrigin } from "../helpers/e2e-urls";

test("new textbook structures render their parts and the generator angle drives flux and emf", async ({
  page,
}, info) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/models");
  for (const id of ["fcc", "square-planar", "nucleosome", "ac-generator"]) {
    const model = advancedModels.find((model) => model.id === id)!;
    await page.getByLabel("Search models", { exact: true }).fill(model.title);
    await expect(page.locator(".model-option")).toHaveCount(1);
    await page.locator(".model-option").click();
    const launch = page.getByRole("button", {
      name: "Explore in 3D",
      exact: true,
    });
    if (await launch.isVisible()) await launch.click();
    const canvas = page.locator("canvas");
    await expect(canvas).toHaveCount(1);
    await canvas.scrollIntoViewIfNeeded();
    for (const part of model.parts) {
      await page
        .getByRole("group", { name: "Model components" })
        .getByRole("button", { name: part.name, exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: part.name, exact: true }),
      ).toBeVisible();
    }
    await page
      .getByRole("button", { name: "Hide selected component", exact: true })
      .click();
    await canvas.scrollIntoViewIfNeeded();
    await expect(canvas).not.toHaveAttribute(
      "data-visible-parts",
      new RegExp(model.parts.at(-1)!.id),
    );
    await page
      .getByRole("button", { name: "Show selected component", exact: true })
      .click();
    await canvas.scrollIntoViewIfNeeded();
    await page
      .locator(".model-stage")
      .screenshot({ path: `.local/nov11-${id}-${info.project.name}.png` });
  }
  const canvas = page.locator("canvas");
  await page
    .getByRole("button", { name: "Turn coil 90°", exact: true })
    .click();
  await expect(
    page.getByLabel("Normalised magnetic flux", { exact: true }),
  ).toHaveText("0");
  await expect(
    page.getByLabel("Normalised induced emf", { exact: true }),
  ).toHaveText("1");
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute("data-coil-angle", "90");
  await page
    .getByRole("button", { name: "Turn coil 90°", exact: true })
    .click();
  await expect(
    page.getByLabel("Normalised magnetic flux", { exact: true }),
  ).toHaveText("-1");
  await page.getByRole("button", { name: "Reset coil", exact: true }).click();
  await page.getByLabel("Coil angle θ (degrees)").focus();
  await page.keyboard.press("ArrowRight");
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute("data-coil-angle", "1");
  await page.getByRole("button", { name: "Play coil", exact: true }).click();
  // Rendering pauses offscreen, so bring the animated scene back into view.
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).not.toHaveAttribute("data-coil-angle", "1");
  await page.getByRole("button", { name: "Pause coil", exact: true }).click();
  const paused = await page.getByLabel("Coil angle θ (degrees)").inputValue();
  await page.waitForTimeout(150);
  await expect(page.getByLabel("Coil angle θ (degrees)")).toHaveValue(paused);
  await page
    .getByRole("button", { name: "Reset structure", exact: true })
    .click();
  await expect(page.getByLabel("Coil angle θ (degrees)")).toHaveValue("0");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Play coil", exact: true }).click();
  await page.waitForTimeout(150);
  await expect(page.getByLabel("Coil angle θ (degrees)")).toHaveValue("0");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("answer format and bilingual follow-ups reach the chat API and fit the mobile viewport", async ({
  page,
}, info) => {
  expect(
    (
      await page.request.post("/api/auth/login", {
        data: { loginId: "AVSCS26-0001", password: "Student@2026" },
      })
    ).status(),
  ).toBe(200);
  const requests: {
    message: string;
    language: string;
    responseStyle: string;
    history: unknown[];
  }[] = [];
  await page.route("**/api/ai/chat", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { ready: true, provider: "gemini" } });
    const body = route.request().postDataJSON();
    requests.push(body);
    await route.fulfill({
      json: {
        response:
          body.language === "Tamil"
            ? "1. தூய செயல்கூறு பக்கவிளைவுகளை ஏற்படுத்தாது. ஒரே உள்ளீட்டிற்கு ஒரே முடிவை வழங்கும்.\n2. செயல்கூறுக்கு வெளியே உள்ள தரவுகளை மாற்றாது. ஒரே உள்ளீட்டை மீண்டும் கொடுத்து முடிவை ஒப்பிடலாம்.\n3. கொடுக்கப்பட்ட உள்ளீடுகளுக்கும் வெளியீட்டுக்கும் உள்ள தொடர்பை கவனியுங்கள். இந்த விளக்கம் சோதனைக்கான மாதிரி உரை."
            : "1. Pure functions return the same result for the same input. Compare the arguments before comparing the output, so the repeated call tests the same case.\n2. They have no side effects. A call leaves data outside the function unchanged, which is distinct from returning an output value.\n3. These paragraphs are a test fixture for a longer explanation. The sources below remain available after the student reads the answer.",
        engine: "gemini",
        answerType: "study",
        foundInKnowledgeBase: true,
        citations: [
          {
            subject: "Computer Science",
            chapter: "Function",
            topic: "Pure functions",
            source: "QA fixture",
          },
        ],
      },
    });
  });
  await page.goto("/ai-helper");
  await page
    .getByRole("combobox", { name: "Answer format", exact: true })
    .selectOption("steps");
  await page.getByLabel("Your study question").fill("Explain pure functions");
  await page.getByRole("button", { name: "Ask AI", exact: true }).click();
  await expect(
    page.getByRole("group", { name: "Continue studying" }),
  ).toBeVisible();
  expect(requests[0].responseStyle).toBe("steps");
  await expect(
    page.getByRole("log").locator("article").last().locator("li").first(),
  ).toBeInViewport();
  await page
    .getByRole("combobox", { name: "Answer format", exact: true })
    .selectOption("revision");
  await page
    .getByRole("button", { name: "Summarise in three points", exact: true })
    .click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1].history).toHaveLength(2);
  expect(requests[1].responseStyle).toBe("revision");
  await page.getByRole("button", { name: "தமிழ்", exact: true }).click();
  await page
    .getByRole("button", { name: "மேலும் எளிமையாக விளக்குங்கள்", exact: true })
    .click();
  await expect.poll(() => requests.length).toBe(3);
  expect(requests[2].language).toBe("Tamil");
  await expect(page.getByRole("log")).toContainText("தூய செயல்கூறு");
  await expect(
    page.getByRole("log").locator("article").last().locator("li").first(),
  ).toBeInViewport();
  await page
    .getByTestId("chat-shell")
    .screenshot({ path: `.local/nov11-chat-${info.project.name}.png` });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 390, height: 410 });
    await expect(page.getByLabel("Your study question")).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Ask AI", exact: true }),
    ).toBeInViewport();
  }
});

test("repeated follow-ups retain the original source topic through the authenticated API", async ({
  page,
}) => {
  const distractor = await page.request.post(
    `${testFixtureOrigin}/rest/v1/avs_curriculum`,
    {
      headers: {
        apikey: "qa-service-key",
        Authorization: "Bearer qa-service-key",
      },
      data: {
        kind: "knowledge",
        id: "qa-summary-distractor",
        data: {
          id: "qa-summary-distractor",
          stream: "Computer Science",
          subjectName: "Computer Science",
          chapterTitle: "Unrelated strings",
          topicTitle: "Three points",
          chunkText: "Summarise three points about strings and indexing.",
          sourceType: "QA distractor",
        },
      },
    },
  );
  expect(distractor.ok()).toBe(true);
  expect(
    (
      await page.request.post("/api/ai/chat", {
        data: { message: "pure function" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await page.request.post("/api/auth/login", {
        data: { loginId: "AVSCS26-0001", password: "Student@2026" },
      })
    ).status(),
  ).toBe(200);
  for (const [language, message] of [
    ["English", "Summarise in three points"],
    ["Tamil", "மூன்று குறிப்புகளில் சுருக்கமாகக் கூறுங்கள்"],
  ]) {
    const response = await page.request.post("/api/ai/chat", {
      data: {
        message,
        language,
        mode: "study",
        responseStyle: "revision",
        history: [
          { role: "user", content: "pure function" },
          {
            role: "assistant",
            content: "A pure function has no side effects.",
          },
          { role: "user", content: "Explain more simply" },
          {
            role: "assistant",
            content: "A pure function has no side effects.",
          },
        ],
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.foundInKnowledgeBase).toBe(true);
    expect(body.citations[0].subject).toBe("Computer Science");
    expect(
      body.citations.every(
        (citation: { chapter: string }) =>
          citation.chapter !== "Unrelated strings",
      ),
    ).toBe(true);
  }
});
