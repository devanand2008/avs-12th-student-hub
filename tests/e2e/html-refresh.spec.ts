import { test, expect, type Page } from "@playwright/test";
async function login(page: Page) {
  expect(
    (
      await page.request.post("/api/auth/login", {
        data: { loginId: "AVSCS26-0001", password: "Student@2026" },
      })
    ).status(),
  ).toBe(200);
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test("every collection opens native questions using its actual title and source options", async ({
  page,
}) => {
  await login(page);
  const cookie = (await page.context().cookies())
    .map((c) => c.name + "=" + c.value)
    .join("; ");
  const response = await page.request.get("/api/supplied-practice", {
    headers: { Cookie: cookie },
  });
  const { collections } = await response.json();
  expect(collections).toHaveLength(12);
  for (const collection of collections) {
    const questionResponse = await page.request.get(
      "/api/supplied-practice?questions=1&collection=" + collection.id,
      { headers: { Cookie: cookie } },
    );
    expect(questionResponse.status()).toBe(200);
    const data = await questionResponse.json();
    expect(data.questions).toHaveLength(collection.available);
    await page.goto("/practice/collections/" + collection.id);
    await expect(
      page.getByRole("heading", { name: "Set up your practice" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Start practice", exact: true })
      .click();
    await expect(
      page.getByText("Question 1 of 10", { exact: true }),
    ).toBeVisible();
    expect(await page.locator("iframe,canvas").count()).toBe(0);
    await noOverflow(page);
  }
});
test("all supplied HTML sources are discoverable and Biology sections launch with the correct source context", async ({
  page,
}) => {
  await login(page);
  await page.goto("/practice/collections");
  await expect(
    page.getByText("12 collections · 2,763 practice entries shown"),
  ).toBeVisible();
  await page
    .getByLabel("Filter collections by subject")
    .selectOption("Bio-Zoology");
  await expect(
    page.getByText("2 collections · 666 practice entries shown"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Bio-Zoology · Biology group",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Filter collections by subject")
    .selectOption("Bio-Botany");
  const card = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "Bio-Botany · Biology group",
      exact: true,
    }),
  });
  await card.locator("summary").click();
  await card
    .getByRole("link", { name: /Botany Ch 2: Classical Genetics/ })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Bio-Botany · Biology group",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Chapter or section", { exact: true }),
  ).toHaveValue("2");
  await page
    .getByLabel("Number of questions", { exact: true })
    .selectOption("10");
  await page
    .getByRole("button", { name: "Start practice", exact: true })
    .click();
  await expect(
    page.getByText("Question 1 of 10", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("iframe,canvas")).toHaveCount(0);
  const cookie = (await page.context().cookies())
    .map((c) => c.name + "=" + c.value)
    .join("; ");
  const response = await page.request.get(
    "/api/supplied-practice?questions=1&collection=bio-botany-biology-group",
    { headers: { Cookie: cookie } },
  );
  const first = (await response.json()).questions.find(
    (q: { section: string }) => q.section === "2",
  );
  const wrong = (first.proposedAnswer + 1) % first.optionsEn.length;
  const choice = page.getByRole("button", {
    name: new RegExp("^" + String.fromCharCode(65 + wrong) + " "),
  });
  await choice.click();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(choice).toHaveClass(/border-rose-600/);
  await expect(
    page.getByText("1 answered · 0 matched", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(
    page.getByText("1 answered · 0 matched", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Finish practice", exact: true })
    .click();
  await expect(page.getByText("0 / 10", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Saved to your supplied-practice history",
  );
  await noOverflow(page);
  await page.goto("/practice/collections/bio-zoology-biology-group?section=8");
  await expect(
    page.getByLabel("Chapter or section", { exact: true }),
  ).toHaveValue("8");
  await expect(
    page
      .getByLabel("Chapter or section", { exact: true })
      .locator("option:checked"),
  ).toContainText("Microbes");
  await page
    .getByLabel("Practice language", { exact: true })
    .selectOption("ta");
  await page
    .getByRole("button", { name: "Start practice", exact: true })
    .click();
  await expect(
    page.getByText("Question 1 of 10", { exact: true }),
  ).toBeVisible();
  await expect(page.locator('article [lang="ta"]').first()).toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: `.local/html-refresh-${test.info().project.name}.png`,
    fullPage: true,
  });
});
