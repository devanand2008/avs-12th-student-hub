import { test, expect } from "@playwright/test";
import { authRequest } from "../helpers/otp-browser";
test("eligible student can explicitly request a gift and see recorded delivery stages", async ({
  page,
}, info) => {
  await authRequest(page, "/api/auth/login", {
    loginId: info.project.name === "desktop" ? "AVSBIO26-0001" : "AVSCS26-0001",
    password: "Student@2026",
  });
  // UI fixture only: the actual SQL eligibility and transitions are integration-tested.
  let requested = false;
  await page.route("**/api/engagement/gifts", async (route) => {
    if (route.request().method() === "POST") requested = true;
    await route.fulfill({
      json: {
        eligible: true,
        points: 100000,
        milestone: 100000,
        claim: requested
          ? {
              id: "qa-only-claim",
              status: "requested",
              gift: "",
              delivery_note: "",
              version: 1,
            }
          : null,
        history: [],
      },
    });
  });
  await page.goto("/leaderboard");
  const button = page.getByRole("button", { name: "Request my gift" });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.getByText("Gift status: requested")).toBeVisible();
  expect(requested).toBe(true);
  await expect(button).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
test("admin individually chooses a gift and records delivery with optimistic versioning", async ({
  page,
}, info) => {
  let response = await authRequest(page, "/api/auth/login", {
    loginId: "qa-admin@example.test",
    password: "QA-only-changed-password",
  });
  if (response.status() !== 200)
    response = await authRequest(page, "/api/auth/login", {
      loginId: "qa-admin@example.test",
      password: "QA-only-bootstrap-password",
    });
  expect(response.status()).toBe(200);
  if ((await response.json()).user.mustChangePassword)
    await authRequest(page, "/api/auth/change-password", {
      currentPassword: "QA-only-bootstrap-password",
      newPassword: "QA-only-changed-password",
    });
  const claim = {
    id: "qa-only-claim",
    user_id: "qa-only-user",
    studentName: "QA Gift Student",
    studentId: "QA-GIFT",
    email: "gift@example.test",
    points: 100000,
    status: "requested",
    gift: "",
    delivery_note: "",
    admin_notes: "",
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    history: [] as object[],
  };
  await page.route("**/api/admin/gifts", async (route) => {
    if (route.request().method() === "PATCH") {
      const d = route.request().postDataJSON();
      expect(d.version).toBe(claim.version);
      Object.assign(claim, {
        status: d.status,
        gift: d.gift,
        delivery_note: d.deliveryNote,
        admin_notes: d.adminNotes,
        version: claim.version + 1,
      });
      claim.history.push({
        status: claim.status,
        gift: claim.gift,
        delivery_note: claim.delivery_note,
        admin_notes: claim.admin_notes,
        actor_id: "qa-admin",
        created_at: new Date().toISOString(),
      });
      return route.fulfill({ json: { saved: true } });
    }
    return route.fulfill({ json: { claims: [claim] } });
  });
  await page.goto("/admin/gifts");
  await page
    .getByLabel("Gift stage for QA Gift Student")
    .selectOption("approved");
  await page.getByLabel("Gift chosen").fill("Science kit");
  await page
    .getByLabel("Private admin notes")
    .fill("QA only private arrangement");
  await page.getByRole("button", { name: "Save gift update" }).click();
  await expect(page.getByText("Current status: approved")).toBeVisible();
  await page
    .getByLabel("Gift stage for QA Gift Student")
    .selectOption("dispatched");
  await page
    .getByLabel("Delivery update", { exact: false })
    .fill("Collect at school office");
  await page.getByRole("button", { name: "Save gift update" }).click();
  await expect(page.getByText("Current status: dispatched")).toBeVisible();
  await page
    .getByLabel("Gift stage for QA Gift Student")
    .selectOption("delivered");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Save gift update" }).click();
  await expect(page.getByText("Current status: delivered")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save gift update" }),
  ).toHaveCount(0);
  await page.getByText("Gift audit trail (3)").click();
  await expect(page.getByText("By qa-admin")).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.screenshot({
    path: `.local/gifts-admin-${info.project.name}.png`,
    fullPage: true,
  });
});
