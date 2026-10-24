import { test, expect } from "@playwright/test";
test("verified model context opens the matching subject and chapter prompt", async ({
  page,
}) => {
  await page.goto(
    "/ai-study-tools?subject=tb-12-physics-english-v1-1b1de8f8&chapter=tb-12-physics-english-v1-1b1de8f8-ch-1",
  );
  await expect(page.getByLabel("Subject", { exact: true })).toHaveValue(
    "tb-12-physics-english-v1-1b1de8f8",
  );
  await expect(
    page.getByLabel("Textbook chapter", { exact: true }),
  ).toHaveValue("tb-12-physics-english-v1-1b1de8f8-ch-1");
  for (const value of [
    "concept",
    "maths",
    "biology",
    "science",
    "code",
    "revision",
    "documents",
    "language",
    "commerce",
  ]) {
    await page
      .getByLabel("Prompt template", { exact: true })
      .selectOption(value);
    await expect(page.getByLabel("Editable study prompt")).toHaveValue(
      /Physics[\s\S]*Do not invent/,
    );
  }
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByLabel("Subject", { exact: true })).toHaveValue("");
  await page.goto("/ai-study-tools?subject=not-real&chapter=not-real");
  await expect(page.getByLabel("Subject", { exact: true })).toHaveValue("");
  await expect(
    page.getByLabel("Textbook chapter", { exact: true }),
  ).toBeDisabled();
});
test("AI tools navigation, filters, privacy, actual curriculum prompt copy/reset and responsive layout", async ({
  page,
  context,
}, info) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/resources");
  await page.getByRole("link", { name: /AI Study Tools/ }).click();
  await expect(
    page.getByRole("heading", { name: "AI Study Tools", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("10 tools found");
  await page.screenshot({
    path: `.local/ai-study-tools-${info.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByLabel("Verified language", { exact: true })
    .selectOption("Tamil");
  await expect(page.getByRole("status")).toContainText("1 tools found");
  await expect(
    page.getByRole("heading", { name: "Google Gemini", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page
    .getByLabel("Free access", { exact: true })
    .selectOption("free-tools");
  await expect(
    page
      .getByRole("region", { name: "Tool results" })
      .getByText("Free tier — usage limits apply", { exact: true })
      .first(),
  ).toBeVisible();
  await page
    .getByLabel("Tool type", { exact: true })
    .selectOption("Subject learning tool");
  await expect(page.getByRole("status")).toContainText("5 tools found");
  await page
    .getByLabel("Search tools", { exact: true })
    .fill("no-matching-tool");
  await expect(
    page.getByRole("heading", { name: "No matching tools" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page
    .getByLabel("Subject", { exact: true })
    .selectOption("tb-12-accountancy-english-c0f4ded3");
  await page
    .getByLabel("Textbook chapter", { exact: true })
    .selectOption({ index: 1 });
  await page.getByLabel("Prompt response language").selectOption("Tamil");
  await page
    .getByLabel("Topic or problem")
    .fill("கணக்கு <script>alert(1)</script>");
  const area = page.getByLabel("Editable study prompt");
  await expect(area).toHaveValue(/Accountancy[\s\S]*Chapter 1/);
  await expect(area).toHaveValue(/கணக்கு/);
  await area.fill("My edited Tamil prompt: கணக்கு");
  await page.getByRole("button", { name: "Copy Study Prompt" }).click();
  await expect(
    page.getByText("Study prompt copied. Paste it into your chosen tool."),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "My edited Tamil prompt: கணக்கு",
  );
  await page.getByRole("button", { name: "Reset Prompt" }).click();
  await expect(area).toHaveValue(/Do not invent/);
  const links = page.getByRole("link", { name: "Open Tool ↗", exact: true });
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("navigation", { name: "Breadcrumb" })
    .getByRole("link", { name: "Study Resources", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: /Browse all 103 resources/ }),
  ).toBeVisible();
});
