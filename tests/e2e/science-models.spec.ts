import { test, expect } from "@playwright/test";
import { learningModels } from "../../src/lib/models";
import { advancedLesson } from "../../src/lib/advanced-models";

test("science models render, filter and expose their selectable parts", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/models");
  await page.getByRole("button", { name: "Explore in 3D" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  for (const model of learningModels) {
    if (
      advancedLesson(model.id)?.kind &&
      advancedLesson(model.id)?.kind !== "3d"
    )
      continue;
    await page
      .getByRole("button", {
        name: new RegExp(model.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      })
      .click();
    await expect(page.locator("canvas")).toBeVisible();
    for (const part of model.parts) {
      await page
        .getByRole("group", { name: "Model components" })
        .getByRole("button", { name: part.name, exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: part.name, exact: true }),
      ).toBeVisible();
    }
  }
  await page.getByRole("button", { name: "Chemistry", exact: true }).click();
  await expect(page.locator(".model-option")).toHaveCount(6);
  await expect(
    page.getByRole("heading", { name: "Ammonia molecule · NH₃" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume rotation" }).click();
  await page.getByRole("button", { name: "Pause rotation" }).click();
  await expect(
    page.getByRole("button", { name: "Resume rotation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset view" }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: `.local/science-models-${test.info().project.name}.png`,
    fullPage: true,
  });
});
