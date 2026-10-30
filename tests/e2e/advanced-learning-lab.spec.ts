import { test, expect } from "@playwright/test";
import { advancedModels } from "../../src/lib/advanced-models";
import { authRequest } from "../helpers/otp-browser";

test("all new models open with valid source context, functional controls and no leaked canvas", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/interactive-3d");
  await expect(
    page.getByText("30 interactive models", { exact: true }),
  ).toBeVisible();
  for (const model of advancedModels) {
    await page.getByLabel("Search models", { exact: true }).fill(model.title);
    await expect(page.locator(".model-option")).toHaveCount(1);
    await page.locator(".model-option").click();
    await expect(
      page.getByRole("link", {
        name: new RegExp(
          `Chapter ${model.chapterNumber} · PDF ${model.pdfPage} /`,
        ),
      }),
    ).toHaveAttribute(
      "href",
      `/textbooks/${model.bookId}?page=${model.pdfPage}`,
    );
    await expect(page.getByText(model.limitations).first()).toBeVisible();
    if (model.kind === "3d") {
      const launch = page.getByRole("button", {
        name: "Explore in 3D",
        exact: true,
      });
      if (await launch.isVisible()) await launch.click();
      await expect(page.locator("canvas")).toHaveCount(1);
      for (const part of model.parts) {
        await page
          .getByRole("group", { name: "Model components" })
          .getByRole("button", { name: part.name, exact: true })
          .click();
        await expect(
          page.getByRole("heading", { name: part.name, exact: true }),
        ).toBeVisible();
      }
      await page
        .getByRole("button", { name: "Exploded view", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Complete view", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await page
        .getByRole("button", { name: "Hide selected component" })
        .click();
      await expect(
        page.getByRole("button", { name: "Show selected component" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Reset structure" }).click();
      await expect(
        page.getByRole("button", { name: "Exploded view", exact: true }),
      ).toHaveAttribute("aria-pressed", "false");
      await page.locator("canvas").focus();
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("+");
      await page.keyboard.press("Home");
    } else {
      await expect(page.getByTestId("lab-simulation")).toBeVisible();
      await expect(page.locator("canvas")).toHaveCount(0);
      if (model.stages.length || model.kind === "algorithm") {
        await expect(page.getByText(/^Stage 1\//)).toBeVisible();
        await page
          .getByRole("button", { name: "Next stage", exact: true })
          .click();
        await expect(page.getByText(/^Stage 2\//)).toBeVisible();
        await page
          .getByRole("button", { name: "Previous stage", exact: true })
          .click();
        await expect(page.getByText(/^Stage 1\//)).toBeVisible();
        await page
          .getByRole("combobox", { name: /Playback speed/ })
          .selectOption("0.5");
        await page
          .getByRole("button", { name: "Play process", exact: true })
          .click();
        await expect(page.getByText(/^Stage \d+\//)).not.toContainText(
          /^Stage 1\//,
        );
        const pause = page.getByRole("button", {
          name: "Pause process",
          exact: true,
        });
        if (await pause.isVisible()) await pause.click();
        const pausedText = await page.getByText(/^Stage \d+\//).innerText();
        await page.waitForTimeout(250);
        await expect(page.getByText(/^Stage \d+\//)).toHaveText(pausedText);
      }
      if (model.kind === "algorithm") {
        await page.getByLabel("Input array", { exact: true }).fill("bad");
        await page.getByRole("button", { name: "Apply input" }).click();
        await expect(
          page.getByTestId("lab-simulation").getByRole("alert"),
        ).toContainText("integers");
        await page.getByLabel("Input array", { exact: true }).fill("3, 1, 2");
        await page.getByRole("button", { name: "Apply input" }).click();
        await expect(
          page.getByRole("button", { name: /Index \d, value/ }),
        ).toHaveCount(3);
        await expect(page.getByText(/^Stage 1\//)).toBeVisible();
        const total = Number(
          (await page.getByText(/^Stage 1\//).innerText()).match(
            /Stage 1\/(\d+)/,
          )![1],
        );
        for (let frame = 1; frame < total; frame++) {
          await page
            .getByRole("button", { name: "Next stage", exact: true })
            .click();
          await expect(
            page.getByText(new RegExp(`^Stage ${frame + 1}/`)),
          ).toBeVisible();
        }
        if (model.id === "insertion-sort")
          await expect(
            page.getByText(/Sorted ascending\. All keys/),
          ).toBeVisible();
        else await expect(page.getByText(/11 is not present/)).toBeVisible();
      }
      await page
        .getByRole("button", { name: "Reset lesson", exact: true })
        .click();
    }
    await page
      .getByText("Quick review · concept check", { exact: true })
      .click();
    await page
      .locator("details")
      .getByRole("button", {
        name: model.check.options[model.check.answer],
        exact: true,
      })
      .click();
    await expect(page.getByText(/^Correct\./)).toBeVisible();
    console.log(`Verified new lesson ${model.id}`);
  }
  await page.screenshot({
    path: `.local/advanced-lab-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  expect(errors).toEqual([]);
});

test("graphs calculate actual values, filters clear and reduced-motion lessons remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/models");
  await page.getByLabel("Search models", { exact: true }).fill("Ohmic circuit");
  await expect(page.locator(".model-option")).toHaveCount(1);
  await page.locator(".model-option").click();
  await page.getByLabel("Voltage (V)").fill("12");
  await page.getByLabel("Resistance (Ω)").fill("6");
  await expect(
    page.getByRole("status").filter({ hasText: "I = V/R" }),
  ).toContainText("2.00 A");
  await page
    .getByLabel("Search models", { exact: true })
    .fill("Converging lens");
  await expect(page.locator(".model-option")).toHaveCount(1);
  await page.locator(".model-option").click();
  await page.getByLabel("Object distance (multiples of f)").fill("3");
  await expect(
    page.getByRole("status").filter({ hasText: "dᵢ" }),
  ).toContainText("1.50");
  await page.getByRole("button", { name: "Reset lesson" }).click();
  await expect(page.getByLabel("Object distance (multiples of f)")).toHaveValue(
    "2",
  );
  await page
    .getByLabel("Search models", { exact: true })
    .fill("DNA replication");
  await expect(page.locator(".model-option")).toHaveCount(1);
  await page.locator(".model-option").click();
  await expect(
    page.getByRole("button", { name: "Play process" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Next stage" }).click();
  await expect(page.getByText(/^Stage 2\//)).toBeVisible();
  await page.getByRole("button", { name: "Clear model filters" }).click();
  await page
    .getByLabel("Model type", { exact: true })
    .selectOption("algorithm");
  await expect(page.locator(".model-option")).toHaveCount(2);
  await page
    .getByLabel("Textbook medium", { exact: true })
    .selectOption("Tamil");
  await expect(page.getByText(/No verified model matches/)).toBeVisible();
  await page.getByRole("button", { name: "Clear model filters" }).click();
  await expect(page.locator(".model-option")).toHaveCount(30);
  for (const entry of [
    {
      search: "Energy through trophic",
      slider: "Transfer efficiency (%)",
      value: "20",
      output: "Primary consumers: 200.00 kJ",
    },
    {
      search: "Alternating voltage",
      slider: "Frequency (Hz)",
      value: "2",
      output: "Period T = 0.500 s",
    },
    {
      search: "Curve and tangent",
      slider: "Point a",
      value: "2",
      output: "tangent slope = 4.00",
    },
    {
      search: "Ideal transformer",
      slider: "Turns ratio Nₛ/Nₚ",
      value: "2",
      output: "Secondary: 24.00 V RMS",
    },
  ]) {
    await page.getByLabel("Search models", { exact: true }).fill(entry.search);
    await expect(page.locator(".model-option")).toHaveCount(1);
    await page.locator(".model-option").click();
    await page.getByLabel(entry.slider).fill(entry.value);
    await expect(
      page.getByRole("status").filter({ hasText: entry.output }),
    ).toBeVisible();
  }
});

test("additional supplied PDFs/videos appear without mutating stored resources", async ({
  page,
}) => {
  expect(
    (
      await authRequest(page, "/api/auth/login", {
        loginId: "AVSCS26-0001",
        password: "Student@2026",
      })
    ).status(),
  ).toBe(200);
  const notes = await page.request.get("/api/notes"),
    videos = await page.request.get("/api/videos");
  expect(notes.status()).toBe(200);
  expect(videos.status()).toBe(200);
  const n = (await notes.json()).notes,
    v = (await videos.json()).videos;
  expect(
    n.filter((x: { description: string }) =>
      x.description.startsWith("Owner-supplied study resource."),
    ),
  ).toHaveLength(25);
  expect(
    v.filter((x: { description: string }) =>
      x.description.startsWith("Owner-supplied study resource."),
    ),
  ).toHaveLength(11);
  expect(
    n.find((x: { sourceFile: string }) =>
      x.sourceFile?.includes("Chapter_11_Notes_Clean"),
    ),
  ).toMatchObject({ subjectName: "Mathematics", chapterId: "maths-ch-11" });
  await page.goto("/notes");
  await expect(
    page.getByRole("heading", { name: /Handwritten|Notes|notes/ }).first(),
  ).toBeVisible();
});
