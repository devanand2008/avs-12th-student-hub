import { test, expect } from "@playwright/test";

test("computer cable and card expose textbook parts and reversible exploration", async ({
  page,
}, info) => {
  await page.goto("/models");
  for (const [title, part] of [
    ["Ethernet network interface card", "Ethernet port"],
    ["Twisted-pair Ethernet cable", "Protective jacket"],
    ["Coaxial cable cutaway", "Metallic shield"],
    ["Optical fibre cutaway", "Optical cladding"],
    ["Eight-contact Ethernet plug", "Eight metal contacts"],
  ]) {
    await page.getByLabel("Search models", { exact: true }).fill(title);
    await expect(page.locator(".model-option")).toHaveCount(1);
    await page.locator(".model-option").click();
    const launch = page.getByRole("button", {
      name: "Explore in 3D",
      exact: true,
    });
    if (await launch.isVisible()) await launch.click();
    await expect(page.locator("canvas")).toHaveCount(1);
    await page
      .getByRole("group", { name: "Model components" })
      .getByRole("button", { name: part, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: part, exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Hide selected component", exact: true })
      .click();
    await page.locator("canvas").scrollIntoViewIfNeeded();
    await expect(page.locator("canvas")).not.toHaveAttribute(
      "data-visible-parts",
      new RegExp(
        part === "Metallic shield"
          ? "shield"
          : part === "Optical cladding"
            ? "cladding"
            : part === "Eight metal contacts"
              ? "contacts"
              : "jacket|port",
      ),
    );
    await page
      .getByRole("button", { name: "Show selected component", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Exploded view", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Complete view", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("button", { name: "Complete view", exact: true })
      .click();
    await page.locator("canvas").scrollIntoViewIfNeeded();
    const menu = page.getByRole("button", {
      name: "View controls",
      exact: true,
    });
    if (await menu.isVisible()) await menu.click();
    await page
      .getByRole("button", { name: "Surface mesh", exact: true })
      .click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-surface-mesh",
      "true",
    );
    await page
      .getByRole("button", { name: "Solid surfaces", exact: true })
      .click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-surface-mesh",
      "false",
    );
    await page.getByRole("button", { name: "Side view", exact: true }).click();
    await page.locator("canvas").press("Home");
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-camera-position",
      "0.000,1.100,11.000",
    );
    await page.locator(".model-stage").screenshot({
      path: `.local/computer-lab-${part.replaceAll(" ", "-")}-${info.project.name}.png`,
    });
  }
});
