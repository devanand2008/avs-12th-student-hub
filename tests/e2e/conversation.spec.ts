import { test, expect, type Page } from "@playwright/test";

async function signIn(page: Page) {
  expect(
    (
      await page.request.post("/api/auth/login", {
        data: { loginId: "AVSCS26-0001", password: "Student@2026" },
      })
    ).status(),
  ).toBe(200);
}
async function fits(page: Page) {
  await expect
    .poll(async () => {
      const box = await page.getByTestId("chat-composer").boundingBox();
      return box ? box.y + box.height : Infinity;
    })
    .toBeLessThanOrEqual(page.viewportSize()!.height + 2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const input = page.getByLabel("Your study question");
  expect(await input.evaluate((el) => getComputedStyle(el).fontSize)).toBe(
    "16px",
  );
  const send = await page
    .getByRole("button", { name: "Ask AI", exact: true })
    .boundingBox();
  expect(send!.width).toBeGreaterThanOrEqual(44);
  expect(send!.height).toBeGreaterThanOrEqual(44);
}

test("greetings are real API conversation responses, while study-only mode retains its source gate", async ({
  page,
}) => {
  await signIn(page);
  const cookies = (await page.context().cookies())
    .map((c) => c.name + "=" + c.value)
    .join("; ");
  for (const language of ["English", "Tamil"]) {
    const response = await page.request.post("/api/ai/chat", {
      headers: { Cookie: cookies },
      data: { message: "Hi!", language },
    });
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.answerType).toBe("conversation");
    expect(result.citations).toEqual([]);
    expect(result.response).not.toContain("could not find");
    if (language === "Tamil")
      expect(result.response).toMatch(/[\u0b80-\u0bff]/);
  }
  const strict = await page.request.post("/api/ai/chat", {
    headers: { Cookie: cookies },
    data: { message: "Hi!", mode: "study" },
  });
  expect((await strict.json()).answerType).toBe("unavailable");
});

test("phone chat keeps its composer visible, handles conversation and reduced viewport height, and restores portal navigation", async ({
  page,
}, info) => {
  await signIn(page);
  const sent: Record<string, unknown>[] = [];
  await page.route("**/api/ai/chat", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { ready: true, provider: "gemini" } });
    const data = route.request().postDataJSON();
    sent.push(data);
    await route.fulfill({
      json: {
        response:
          data.language === "Tamil"
            ? "நாம் பேசலாம்! இன்று உங்கள் படிப்பு எப்படி செல்கிறது?"
            : "Of course! Let's make a simple revision plan together.",
        engine: "gemini",
        answerType: data.mode === "study" ? "study" : "conversation",
        foundInKnowledgeBase: data.mode === "study",
        citations:
          data.mode === "study"
            ? [
                {
                  subject: "Computer Science",
                  chapter: "Functions",
                  source: "Study notes",
                },
              ]
            : [],
      },
    });
  });
  await page.goto("/ai-helper");
  await expect(page.getByTestId("chat-shell")).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Install mobile app prompt" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Mobile Bottom Navigation" }),
  ).toHaveCount(0);
  await fits(page);
  const input = page.getByLabel("Your study question");
  await input.fill("Can we talk?");
  if (info.project.name === "mobile") {
    await input.press("Enter");
    await expect(input).toHaveValue("Can we talk?\n");
    expect(sent).toHaveLength(0);
  }
  await page.getByRole("button", { name: "Ask AI", exact: true }).click();
  await expect(
    page.getByText("Gemini · conversation", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole("log")
        .evaluate((log) => log.scrollHeight - log.scrollTop - log.clientHeight),
    )
    .toBeLessThanOrEqual(2);
  await expect(page.getByText("Study sources", { exact: true })).toHaveCount(1);
  expect(sent[0].mode).toBe("auto");
  await page.getByRole("button", { name: "தமிழ்", exact: true }).click();
  await input.fill("ஒரு திட்டம் சொல்லுங்கள்");
  await page.getByRole("button", { name: "Ask AI", exact: true }).click();
  await expect(
    page.getByText("நாம் பேசலாம்! இன்று உங்கள் படிப்பு எப்படி செல்கிறது?"),
  ).toBeVisible();
  expect((sent[1].history as unknown[]).length).toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Study sources", exact: true })
    .click();
  await input.fill("Explain functions");
  await page.getByRole("button", { name: "Ask AI", exact: true }).click();
  await expect(
    page.getByText("Gemini · source-based explanation", { exact: true }),
  ).toBeVisible();
  expect(sent[2].mode).toBe("study");
  await page.getByRole("button", { name: "New chat" }).click();
  await expect(
    page.getByText("Gemini · conversation", { exact: true }),
  ).toHaveCount(0);
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 390, height: 420 });
    await input.focus();
    await expect
      .poll(() => page.getByTestId("chat-shell").getAttribute("data-compact"))
      .toBe("true");
    await fits(page);
    await input.fill("A long message ".repeat(40));
    await fits(page);
    await page.screenshot({ path: ".local/conversation-keyboard-size.png" });
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 360, height: 640 },
    ]) {
      await page.setViewportSize(viewport);
      await fits(page);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.getByTestId("chat-shell").getAttribute("data-compact"))
      .toBe("false");
  }
  await input.fill("");
  await page.screenshot({
    path: `.local/conversation-${info.project.name}.png`,
  });
  await page.goto("/subjects");
  if (info.project.name === "mobile")
    await expect(
      page.getByRole("navigation", { name: "Mobile Bottom Navigation" }),
    ).toBeVisible();
});
