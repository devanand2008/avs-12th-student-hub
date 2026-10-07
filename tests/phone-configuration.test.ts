import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { getPhoneOtpConfiguration } from "../src/lib/auth/phone-configuration";

function configureTest(t: TestContext) {
  const values = {
    SUPABASE_URL: "https://otp-check.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "qa-public-key",
  };
  const original = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, values);
  t.after(() => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test("phone diagnostics expose no provider credentials and never claim SMS delivery", async (t) => {
  configureTest(t);
  let phoneEnabled = false;
  const requests: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: URL, init: RequestInit) => {
    requests.push(String(input));
    assert.equal(
      init.headers && (init.headers as Record<string, string>).apikey,
      "qa-public-key",
    );
    assert.equal(init.cache, "no-store");
    return Response.json({
      external: { phone: phoneEnabled },
      sms_provider: "twilio",
      sms_twilio_auth_token: "qa-secret-that-must-not-be-returned",
    });
  });
  const disabled = await getPhoneOtpConfiguration();
  assert.equal(disabled.state, "disabled");
  phoneEnabled = true;
  const enabled = await getPhoneOtpConfiguration();
  assert.equal(enabled.state, "enabled");
  assert.match(enabled.message, /test delivery/);
  assert.equal(
    JSON.stringify([disabled, enabled]).includes("qa-secret"),
    false,
  );
  assert.deepEqual(requests, [
    "https://otp-check.supabase.co/auth/v1/settings",
    "https://otp-check.supabase.co/auth/v1/settings",
  ]);
});

test("an Auth outage or malformed settings stays unknown rather than reporting OTP ready", async (t) => {
  configureTest(t);
  let result = Response.json(
    { error: "temporarily unavailable" },
    { status: 503 },
  );
  t.mock.method(globalThis, "fetch", async () => result);
  assert.equal((await getPhoneOtpConfiguration()).state, "unavailable");
  result = Response.json({ external: {}, sms_provider: "twilio" });
  assert.equal((await getPhoneOtpConfiguration()).state, "unavailable");
  result = Response.json({
    external: { phone: false },
    sms_provider: "unexpected-secret-value",
  });
  const status = await getPhoneOtpConfiguration();
  assert.equal(status.state, "disabled");
  assert.equal(status.provider, undefined);
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("request failed with private configuration");
  });
  assert.equal((await getPhoneOtpConfiguration()).state, "unavailable");
});
