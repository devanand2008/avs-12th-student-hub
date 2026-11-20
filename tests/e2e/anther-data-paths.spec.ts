import { test, expect } from "@playwright/test";

for (const [title, label, part] of [
  ["Anther cross-section", "Pollen grains", "pollen"],
  ["Serial and parallel data paths", "Eight parallel data lanes", "parallel"],
]) {
  test(title + " renders and isolates a textbook component", async ({ page }) => {
    await page.goto("/models");
    await page.getByLabel("Search models", { exact: true }).fill(title);
    await page.locator(".model-option").click();
    await page.getByRole("button", { name: "Explore in 3D" }).click();
    const canvas = page.locator("canvas");
    await expect(canvas).toHaveCount(1);
    await page.getByRole("group", { name: "Model components" }).getByRole("button", { name: label, exact: true }).click();
    const menu = page.getByRole("button", { name: "View controls", exact: true });
    if (await menu.isVisible()) await menu.click();
    const controls = page.getByRole("group", { name: "3D camera and focus controls" });
    await controls.getByRole("button", { name: "Focus selected component" }).click();
    await expect(canvas).toHaveAttribute("data-visible-parts", part);
    await controls.getByRole("button", { name: "Front view", exact: true }).click();
    await expect(canvas).toHaveAttribute("data-camera-position", "0.000,0.000,11.000");
  });
}
