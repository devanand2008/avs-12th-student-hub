import { test, expect } from "@playwright/test";

test("camera presets, zoom and isolation change the rendered new and existing structures", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/models");
  for (const title of [
    "Ethernet network interface card",
    "Twisted-pair Ethernet cable",
    "Human sperm",
    "Embryo sac",
    "Body-centred cubic",
    "p–n junction",
    "DNA double",
    "Binary search tree",
  ]) {
    await page.getByLabel("Search models", { exact: true }).fill(title);
    await expect(page.locator(".model-option")).toHaveCount(1);
    await page.locator(".model-option").click();
    const launch = page.getByRole("button", {
      name: "Explore in 3D",
      exact: true,
    });
    if (await launch.isVisible()) await launch.click();
    const canvas = page.locator("canvas");
    await expect(canvas).toHaveCount(1);
    const menu = page.getByRole("button", {
      name: "View controls",
      exact: true,
    });
    if (await menu.isVisible()) await menu.click();
    const group = page.getByRole("group", {
      name: "3D camera and focus controls",
    });
    await group
      .getByRole("button", { name: "Front view", exact: true })
      .click();
    await group
      .getByRole("button", { name: "Reset camera", exact: true })
      .click();
    await expect(canvas).toHaveAttribute(
      "data-camera-position",
      "0.000,1.100,11.000",
    );
    await group
      .getByRole("button", { name: "Front view", exact: true })
      .click();
    await expect(canvas).toHaveAttribute(
      "data-camera-position",
      "0.000,0.000,11.000",
    );
    await group.getByRole("button", { name: "Zoom in", exact: true }).click();
    await expect
      .poll(async () =>
        Number(await canvas.getAttribute("data-camera-distance")),
      )
      .toBeLessThan(10);
    await group.getByRole("button", { name: "Zoom out", exact: true }).click();
    await expect
      .poll(async () =>
        Number(await canvas.getAttribute("data-camera-distance")),
      )
      .toBeGreaterThan(10);
    await group.getByRole("button", { name: "Side view", exact: true }).click();
    await expect(canvas).toHaveAttribute(
      "data-camera-position",
      "11.000,0.000,0.000",
    );
    await group.getByRole("button", { name: "Top view", exact: true }).click();
    await expect(canvas).toHaveAttribute(
      "data-camera-position",
      "0.000,11.000,0.001",
    );
    const parts = page
      .getByRole("group", { name: "Model components" })
      .getByRole("button");
    await parts.nth(1).click();
    await group
      .getByRole("button", { name: "Focus selected component", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (await canvas.getAttribute("data-visible-parts"))?.split(",").length,
      )
      .toBe(1);
    const first = await canvas.getAttribute("data-visible-parts");
    await parts.nth(0).click();
    await expect(canvas).not.toHaveAttribute("data-visible-parts", first!);
    if (title === "Human sperm") {
      await page
        .getByRole("button", { name: "Hide selected component", exact: true })
        .click();
      await expect(
        group.getByRole("button", { name: "Show whole model", exact: true }),
      ).toBeEnabled();
    }
    await group
      .getByRole("button", { name: "Show whole model", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (await canvas.getAttribute("data-visible-parts"))?.split(",").length,
      )
      .toBeGreaterThan(1);
    if (title === "Human sperm")
      await page
        .getByRole("button", { name: "Show selected component", exact: true })
        .click();
    await group
      .getByRole("button", { name: "Front view", exact: true })
      .click();
    const closeMenu = page.getByRole("button", {
      name: "Hide view controls",
      exact: true,
    });
    if (await closeMenu.isVisible()) await closeMenu.click();
    if (title === "Embryo sac")
      await page
        .locator(".model-stage")
        .screenshot({ path: `.local/lab-refresh-${info.project.name}.png` });
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  expect(errors).toEqual([]);
});

test("unavailable WebGL keeps component explanations accessible without dead camera controls", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/models");
  await page.getByLabel("Search models", { exact: true }).fill("Human sperm");
  await expect(page.locator(".model-option")).toHaveCount(1);
  await page.locator(".model-option").click();
  await page
    .getByRole("button", { name: "Explore in 3D", exact: true })
    .click();
  await expect(page.getByText(/3D rendering is unavailable/)).toBeVisible();
  await expect(
    page.getByRole("group", { name: "3D camera and focus controls" }),
  ).toHaveCount(0);
  await page
    .getByRole("group", { name: "Model components" })
    .getByRole("button", { name: "Acrosome", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Acrosome", exact: true }),
  ).toBeVisible();
});
