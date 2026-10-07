import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import catalogJson from "../../src/lib/textbooks-catalog.json";

const englishBook = catalogJson.books.find(
  (book) => book.subject === "Computer Science" && book.medium === "English",
)!;
const tamilBook = catalogJson.books.find((book) => book.subject === "Tamil")!;

async function renderedPage(page: Page, number: number) {
  await expect(page.getByTestId("pdf-page")).toHaveAttribute(
    "data-rendered-page",
    String(number),
  );
  await expect(page.getByRole("status")).toContainText(`Page ${number} of `);
}

async function canvasSignature(page: Page) {
  return page.getByTestId("pdf-page").evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const context = canvas.getContext("2d")!;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 2166136261;
    let nonWhite = 0;
    for (let offset = 0; offset < pixels.length; offset += 16) {
      hash = Math.imul(hash ^ pixels[offset], 16777619);
      if (
        pixels[offset] < 230 &&
        pixels[offset + 1] < 230 &&
        pixels[offset + 2] < 230
      )
        nonWhite++;
    }
    return { hash, nonWhite, width: canvas.width };
  });
}

test("full reader renders first, next and last pages, zooms, selects text and runs with all external requests blocked", async ({
  page,
}, info) => {
  const errors: string[] = [];
  const workerRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("pdf.worker"))
      workerRequests.push(request.url());
  });
  const origin = new URL(info.project.use.baseURL!).origin;
  await page.route("**/*", (route) =>
    new URL(route.request().url()).origin === origin
      ? route.continue()
      : route.abort(),
  );
  await page.goto("/textbooks?search=Computer%20Science");
  await page.getByLabel("Textbook medium").selectOption("English");
  await expect(page.locator("article")).toHaveCount(1);
  await page.getByRole("link", { name: "Read in Portal", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/textbooks/${englishBook.id}$`));
  await expect(
    page.getByRole("heading", { name: "Computer Science", exact: true }),
  ).toBeVisible();
  await renderedPage(page, 1);
  await expect(
    page.getByRole("button", { name: "Previous page", exact: true }),
  ).toBeDisabled();
  const first = await canvasSignature(page);
  expect(first.nonWhite).toBeGreaterThan(100);
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await renderedPage(page, 2);
  const second = await canvasSignature(page);
  expect(second.hash).not.toBe(first.hash);
  await page.getByLabel("Page number", { exact: true }).fill("6");
  await page.getByRole("button", { name: "Go", exact: true }).click();
  await renderedPage(page, 6);
  await expect(
    page.getByTestId("pdf-text").locator("span").first(),
  ).toBeAttached();
  await expect(page.getByTestId("pdf-text")).not.toHaveText("");
  const fitWidth = await page
    .getByTestId("pdf-page")
    .evaluate((element) => element.getBoundingClientRect().width);
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(page.getByLabel("Zoom level")).toHaveText("125%");
  await expect
    .poll(() =>
      page
        .getByTestId("pdf-page")
        .evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBeGreaterThan(fitWidth);
  await page
    .getByRole("button", { name: "Fit page width", exact: true })
    .click();
  await expect(page.getByLabel("Zoom level")).toHaveText("100%");
  await page
    .getByLabel("Page number", { exact: true })
    .fill(String(englishBook.pages));
  await page.getByRole("button", { name: "Go", exact: true }).click();
  await renderedPage(page, englishBook.pages!);
  await expect(
    page.getByRole("button", { name: "Next page", exact: true }),
  ).toBeDisabled();
  expect((await canvasSignature(page)).hash).not.toBe(first.hash);
  await expect(
    page.getByRole("link", { name: "Download full book", exact: true }),
  ).toHaveAttribute("download", /Computer Science-English\.pdf/);
  await expect(
    page.getByRole("link", { name: "Open original PDF", exact: true }),
  ).toHaveAttribute("href", englishBook.localPath!);
  expect(workerRequests.length).toBeGreaterThan(0);
  expect(workerRequests.every((url) => new URL(url).origin === origin)).toBe(
    true,
  );
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("reader-last-page.png"),
    fullPage: true,
  });
});

test("Tamil textbook full reader and unknown-book 404 work", async ({
  page,
}) => {
  await page.goto(`/textbooks/${tamilBook.id}`);
  await renderedPage(page, 1);
  expect((await canvasSignature(page)).nonWhite).toBeGreaterThan(100);
  await page
    .getByLabel("Page number", { exact: true })
    .fill(String(tamilBook.pages));
  await page.getByRole("button", { name: "Go", exact: true }).click();
  await renderedPage(page, tamilBook.pages!);
  const unknown = await page.request.get("/textbooks/nonexistent-book-123");
  expect(unknown.status()).toBe(404);
  const invalid = await page.request.get("/textbooks/INVALID-book");
  expect(invalid.status()).toBe(404);
});

test("reader download failures show a useful fallback and recover after retry", async ({
  page,
}) => {
  const pdfPattern = `**${englishBook.localPath}`;
  await page.route(pdfPattern, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/pdf",
      body: "This response is not a PDF.",
    }),
  );
  await page.goto(`/textbooks/${englishBook.id}`);
  await expect(page.getByTestId("pdf-viewer").getByRole("alert")).toContainText(
    "This book could not be loaded in the reader",
  );
  await expect(
    page.getByRole("link", { name: "Open original PDF", exact: true }),
  ).toHaveAttribute("href", englishBook.localPath!);
  await expect(
    page.getByRole("link", { name: "Download full book", exact: true }),
  ).toBeVisible();
  await page.unroute(pdfPattern);
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await renderedPage(page, 1);
  await expect(page.getByTestId("pdf-viewer").getByRole("alert")).toHaveCount(
    0,
  );
});
