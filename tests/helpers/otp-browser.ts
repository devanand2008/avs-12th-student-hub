import { expect, test, type Page } from "@playwright/test";
export async function authRequest(page: Page, path: string, data?: unknown) {
  const cookies = await page.context().cookies();
  return page.request.post(path, {
    data,
    headers: {
      Cookie: cookies.map((c) => c.name + "=" + c.value).join("; "),
      "x-forwarded-for":
        "otp-" + test.info().project.name + "-" + test.info().title,
    },
  });
}
export async function readTestOtp(page: Page, phone: string) {
  const sms = await page.request.get(
    "http://127.0.0.1:3101/_qa/otp?phone=" + encodeURIComponent("+91" + phone),
    { headers: { apikey: "qa-service-key" } },
  );
  expect(sms.status()).toBe(200);
  return (await sms.json()).code as string;
}
export async function completeFirstOtp(page: Page, phone: string) {
  const sent = await authRequest(page, "/api/auth/otp/send", { phone });
  expect(sent.status()).toBe(200);
  const result = await sent.json();
  expect(result.token).toBeUndefined();
  expect(result.otp).toBeUndefined();
  const verified = await authRequest(page, "/api/auth/otp/verify", {
    token: await readTestOtp(page, phone),
  });
  expect(verified.status()).toBe(200);
  return verified.json();
}
