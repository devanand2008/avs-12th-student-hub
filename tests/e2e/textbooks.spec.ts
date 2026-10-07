import { expect, test } from "@playwright/test";

test("textbook subject links, medium filter and saved PDF route work", async ({
  page,
}) => {
  await page.goto("/textbooks?search=Physics");
  await expect(
    page.getByRole("heading", {
      name: "Official Class 12 SCERT Textbook Library",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Search textbooks" }),
  ).toHaveValue("Physics");
  await expect(page.locator("article")).toHaveCount(4);
  await page.getByLabel("Textbook medium").selectOption("Tamil");
  await expect(page.locator("article")).toHaveCount(2);
  const card = page.locator("article").first();
  await expect(card).toContainText("Tamil medium");
  await expect(card).toContainText("Saved locally");
  const pdfPath = await card
    .getByRole("link", { name: "Open PDF", exact: true })
    .getAttribute("href");
  expect(pdfPath).toMatch(/^\/textbooks\/[a-z0-9-]+\.pdf$/);
  const response = await page.request.get(pdfPath!, {
    headers: { Range: "bytes=0-1023" },
  });
  expect(response.status()).toBe(206);
  expect(response.headers()["content-type"]).toContain("application/pdf");
  expect(response.headers()["content-range"]).toMatch(/^bytes 0-1023\/\d+$/);
  expect((await response.body()).subarray(0, 5).toString("ascii")).toBe(
    "%PDF-",
  );
  await expect(
    card.getByRole("link", { name: "Download", exact: true }),
  ).toHaveAttribute("download", /Physics.*Tamil\.pdf/);
  await page.getByLabel("Subject group").selectOption("Commerce");
  await expect(page.locator("article")).toHaveCount(0);
  await expect(
    page.getByText("0 textbooks shown.", { exact: true }),
  ).toBeVisible();
});
