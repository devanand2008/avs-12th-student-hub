import { test, expect } from "@playwright/test";
import { openPdfGuides, guideSubjects } from "../../src/lib/open-pdf-guides";
import { authRequest } from "../helpers/otp-browser";
test("authorised reference library shows real availability and requires login for downloads", async ({
  page,
}, info) => {
  await page.goto("/resources/guides");
  await expect(
    page.getByRole("heading", { name: "Open PDF references", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Open references", exact: true })
      .locator("article"),
  ).toHaveCount(openPdfGuides.length);
  const subject = page.getByLabel("Subject", { exact: true });
  await expect(subject.locator("option")).toHaveCount(guideSubjects.length + 1);
  await subject.selectOption("Tamil");
  await expect(
    page.getByText("No verified open reference matches this selection."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await subject.selectOption("Mathematics");
  const math = openPdfGuides.filter((g) => g.subjects.includes("Mathematics"));
  await expect(
    page
      .getByRole("region", { name: "Open references", exact: true })
      .locator("article"),
  ).toHaveCount(math.length);
  const id = "calculus-workbook";
  await page.goto(`/resources/guides/${id}/download`);
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await authRequest(page, "/api/auth/login", {
    loginId: "AVSBIO26-0001",
    password: "Student@2026",
  });
  const api = await page.request.get(`/api/guides/${id}/pdf`, {
    headers: { Range: "bytes=0-31" },
  });
  expect(api.status()).toBe(206);
  expect((await api.body()).subarray(0, 5).toString()).toBe("%PDF-");
  await page.goto(`/resources/guides/${id}`);
  await expect(
    page.getByRole("region", { name: "Source and licence" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "CC BY-SA 4.0", exact: true }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Next page", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.screenshot({
    path: `.local/open-guides-${info.project.name}.png`,
    fullPage: true,
  });
});
