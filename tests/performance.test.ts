import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchCurrentSession,
  clearCurrentSessionRequest,
} from "../src/lib/current-session-client";
import { getSupabase, requireSupabaseAuth } from "../src/lib/supabase/server";

test("simultaneous auth probes share one request, readable bodies and no completed cache", async () => {
  const original = global.fetch;
  let requests = 0;
  let resolve!: (response: Response) => void;
  global.fetch = async (_url, options) => {
    requests++;
    assert.equal(options?.cache, "no-store");
    assert.equal(options?.credentials, "same-origin");
    return new Promise<Response>((done) => {
      resolve = done;
    });
  };
  try {
    const a = fetchCurrentSession(),
      b = fetchCurrentSession();
    assert.equal(requests, 1);
    resolve(Response.json({ authenticated: true, user: { id: "student-a" } }));
    const [one, two] = await Promise.all([a, b]);
    assert.deepEqual(await one.json(), await two.json());
    const next = fetchCurrentSession();
    assert.equal(requests, 2);
    resolve(Response.json({ authenticated: false }, { status: 401 }));
    assert.equal((await next).status, 401);
  } finally {
    clearCurrentSessionRequest();
    global.fetch = original;
  }
});

test("one unmounted consumer cannot cancel another; logout cancels all old probes", async () => {
  const original = global.fetch;
  let resolve!: (response: Response) => void;
  let requests = 0;
  global.fetch = async (_url, options) => {
    requests++;
    return new Promise<Response>((done, reject) => {
      resolve = done;
      options?.signal?.addEventListener(
        "abort",
        () => reject(options.signal?.reason),
        { once: true },
      );
    });
  };
  try {
    const consumer = new AbortController();
    const a = fetchCurrentSession(consumer.signal),
      b = fetchCurrentSession();
    consumer.abort();
    await assert.rejects(a, { name: "AbortError" });
    resolve(Response.json({ user: { id: "student-b" } }));
    assert.equal((await (await b).json()).user.id, "student-b");
    const obsolete = fetchCurrentSession();
    clearCurrentSessionRequest();
    await assert.rejects(obsolete, { name: "AbortError" });
    const current = fetchCurrentSession();
    resolve(Response.json({ authenticated: false }, { status: 401 }));
    assert.equal((await current).status, 401);
    assert.equal(requests, 3);
  } finally {
    clearCurrentSessionRequest();
    global.fetch = original;
  }
});

test("failed authentication probes are not retained", async () => {
  const original = global.fetch;
  let requests = 0;
  global.fetch = async () => {
    requests++;
    if (requests === 1) throw new TypeError("offline");
    return Response.json({ authenticated: false }, { status: 401 });
  };
  try {
    await assert.rejects(fetchCurrentSession(), /offline/);
    assert.equal((await fetchCurrentSession()).status, 401);
    assert.equal(requests, 2);
  } finally {
    clearCurrentSessionRequest();
    global.fetch = original;
  }
});

test("server data clients are reused, credential rotation and OTP auth stay isolated", () => {
  const keys = [
    "DB_DRIVER",
    "SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ] as const;
  const before = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    delete process.env.DB_DRIVER;
    Object.assign(process.env, {
      SUPABASE_URL: "https://fixture.invalid",
      SUPABASE_SECRET_KEY: "fixture-key-a",
    });
    const data = getSupabase();
    assert.ok(data);
    assert.equal(getSupabase(), data);
    const firstAuth = requireSupabaseAuth(),
      secondAuth = requireSupabaseAuth();
    assert.notEqual(firstAuth, data);
    assert.notEqual(firstAuth.auth, data.auth);
    assert.notEqual(firstAuth, secondAuth);
    assert.equal(getSupabase(), data);
    process.env.SUPABASE_SECRET_KEY = "fixture-key-b";
    assert.notEqual(getSupabase(), data);
  } finally {
    for (const key of keys) {
      if (before[key] === undefined) delete process.env[key];
      else process.env[key] = before[key];
    }
  }
});
