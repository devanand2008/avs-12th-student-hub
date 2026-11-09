import { test, expect } from "@playwright/test";
import { authRequest } from "../helpers/otp-browser";
import { openPdfGuides } from "../../src/lib/open-pdf-guides";
test("admin PDF picker detects real page count and stores notes privately until publishing", async ({
  page,
}, info) => {
  let r = await authRequest(page, "/api/auth/login", {
    loginId: "qa-admin@example.test",
    password: "QA-only-changed-password",
  });
  if (r.status() !== 200)
    r = await authRequest(page, "/api/auth/login", {
      loginId: "qa-admin@example.test",
      password: "QA-only-bootstrap-password",
    });
  if ((await r.json()).user.mustChangePassword)
    await authRequest(page, "/api/auth/change-password", {
      currentPassword: "QA-only-bootstrap-password",
      newPassword: "QA-only-changed-password",
    });
  const guide = openPdfGuides.find((g) => g.id === "calculus-workbook")!;
  const download = await page.request.get(guide.hostedUrl);
  expect(download.status()).toBe(200);
  const bytes = await download.body();
  await page.goto("/admin/notes");
  await page.getByRole("button", { name: "Add notes", exact: true }).click();
  const form = page.locator("form.content-form");
  const chapter = await form
    .locator('select[name="chapterId"] option:not([disabled])')
    .first()
    .getAttribute("value");
  await form.locator('select[name="chapterId"]').selectOption(chapter!);
  await form
    .locator('input[type="file"]')
    .setInputFiles({
      name: "QA-open-activities.pdf",
      mimeType: "application/pdf",
      buffer: bytes,
    });
  await expect(
    page.getByText("File stored securely.", { exact: false }),
  ).toBeVisible();
  await expect(form.locator('input[name="pageCount"]')).toHaveValue(
    String(guide.pages),
  );
  const title = `QA PDF upload ${info.project.name}`;
  await form.locator('input[name="title"]').fill(title);
  await form.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByText("Draft saved. Publish it when you are ready."),
  ).toBeVisible();
  const resource = (
    await (await page.request.get("/api/admin/content?kind=note")).json()
  ).resources.find((n: { title: string }) => n.title === title);
  expect(resource.pageCount).toBe(guide.pages);
  expect(resource.isPublished).toBe(false);
  await authRequest(page, "/api/auth/login", {
    loginId: "AVSBIO26-0001",
    password: "Student@2026",
  });
  expect((await page.request.get(resource.pdfUrl)).status()).toBe(404);
  await authRequest(page, "/api/auth/login", {
    loginId: "qa-admin@example.test",
    password: "QA-only-changed-password",
  });
  expect(
    (
      await page.request.post("/api/admin/content", {
        data: { kind: "note", id: resource.id, action: "publish" },
      })
    ).status(),
  ).toBe(200);
  await authRequest(page, "/api/auth/login", {
    loginId: "AVSBIO26-0001",
    password: "Student@2026",
  });
  const range = await page.request.get(`/api/notes/${resource.id}/pdf`, {
    headers: { Range: "bytes=0-31" },
  });
  expect(range.status()).toBe(206);
  expect((await range.body()).subarray(0, 5).toString()).toBe("%PDF-");
  await page.goto("/notes/" + resource.id);
  await expect(page.locator("iframe")).toHaveAttribute("src", /#page=1/);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /#page=2/);
});
