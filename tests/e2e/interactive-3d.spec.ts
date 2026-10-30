import { test, expect } from "@playwright/test";

test("3D source filters, scalar animation, keyboard controls and empty curriculum gaps", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/interactive-3d");
  await expect(
    page.getByText("30 interactive models", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByLabel("Search models").fill("vectors");
  await expect(page.locator(".model-option")).toHaveCount(1);
  await page
    .getByRole("button", { name: /Vectors in three dimensions/ })
    .click();
  await page.getByRole("button", { name: "Explore in 3D" }).click();
  await expect(
    page.getByRole("link", { name: "Build an AI study prompt" }),
  ).toHaveAttribute(
    "href",
    "/ai-study-tools?subject=tb-12-mathematics-english-v1-e33ceed7&chapter=tb-12-mathematics-english-v1-e33ceed7-ch-6",
  );
  await expect(page.locator("canvas")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Resume rotation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: /Applications of Vector Algebra · Chapter 6/,
    }),
  ).toHaveAttribute("href", /page=230/);
  await page.getByLabel("Vector scale t").fill("0.5");
  await expect(
    page.getByText("t = 0.50 · length = 1.50 units", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play scalar animation" }).click();
  await expect
    .poll(async () =>
      Number(await page.getByLabel("Vector scale t").inputValue()),
    )
    .not.toBe(0.5);
  await page.getByRole("button", { name: "Pause scalar animation" }).click();
  await page.locator("canvas").focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("+");
  await page.keyboard.press("Home");
  await page.getByRole("button", { name: "Reset view" }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.getByLabel("Search models").fill("");
  await page.getByLabel("Textbook medium").selectOption("English");
  await expect(page.locator(".model-option")).toHaveCount(20);
  await page
    .getByLabel("Source chapter")
    .selectOption("12-physics-english-v1-1b1de8f8:ch-1");
  await expect(page.locator(".model-option")).toHaveCount(2);
  await expect(page.locator('.model-option[aria-pressed="true"]')).toHaveCount(
    1,
  );
  await page
    .getByRole("combobox", { name: /^Subject/ })
    .selectOption("Commerce");
  await expect(
    page.getByText(/No verified model matches these filters/),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  expect(errors).toEqual([]);
});

test("3D reduced motion and unavailable WebGL retain an accessible description", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return original.call(this, type, ...args);
    } as typeof original;
  });
  await page.goto("/interactive-3d");
  await page.getByRole("button", { name: "Mathematics", exact: true }).click();
  await page.getByRole("button", { name: "Explore in 3D" }).click();
  await expect(
    page.getByText(/3D rendering is unavailable on this device/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Vector (2, 2, 1)", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Vector (2, 2, 1)", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Vector scale t").fill("0.5");
  await page.getByRole("button", { name: "Play scalar animation" }).click();
  await expect(
    page.getByText("t = 0.50 · length = 1.50 units", { exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page.getByLabel("Vector scale t")).toHaveValue("0.5");
  await page.getByRole("button", { name: "Pause scalar animation" }).click();
});
