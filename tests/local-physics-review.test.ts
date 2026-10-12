import assert from "node:assert/strict";
import test from "node:test";
import {
  mkdtemp,
  readFile,
  rm,
  mkdir,
  copyFile,
  writeFile,
} from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import path from "node:path";
import os from "node:os";
import { chromium } from "@playwright/test";
import packet from "../docs/tamil-physics-unit1-candidates.json";
import type { Unit1Candidate } from "../scripts/lib/tamil-physics-unit1";
import { mergeLocalReviewQueue } from "../scripts/lib/tamil-physics-unit1";
import {
  decisionInput,
  reconcileManifest,
  recordDecision,
  requiredSourcePages,
  type LocalDecisionInput,
} from "../scripts/lib/local-physics-review";
import {
  provisionReviewer,
  startLocalPhysicsReview,
} from "../scripts/lib/local-physics-review-server";
import { auditTeacherManifest } from "../scripts/lib/teacher-decision-audit";

const candidates = packet.candidates as Unit1Candidate[];
const reviewer = {
  id: "isolated-test-teacher",
  name: "Fixture Teacher",
  email: "fixture@example.test",
};
function input(
  number: number,
  overrides: Partial<LocalDecisionInput> = {},
): LocalDecisionInput {
  const c = candidates.find((c) => c.number === number)!;
  return {
    id: c.id,
    expectedRevision: 0,
    decision: "pending",
    notes: "",
    unresolvedIssues: [...c.qualityFlags],
    inspectedPages: [],
    textConfirmed: false,
    keyConfirmed: false,
    diagramConfirmed: false,
    ...overrides,
  };
}
const approve = (number: number) =>
  input(number, {
    decision: "approved",
    notes:
      "Isolated fixture source verification, not an actual teacher decision",
    unresolvedIssues: [],
    inspectedPages: requiredSourcePages(
      candidates.find((c) => c.number === number)!,
    ),
    textConfirmed: true,
    keyConfirmed: true,
    diagramConfirmed: true,
  });

test("Local review defaults pending and blocks implicit approval, graph choices, missing diagram checks and stale decisions", () => {
  const manifest = reconcileManifest(candidates);
  assert.ok(
    manifest.entries.every(
      (e) =>
        e.decision === "pending" &&
        e.history.length === 0 &&
        e.reviewer === null,
    ),
  );
  assert.throws(
    () =>
      recordDecision(
        manifest,
        candidates,
        input(2, { decision: "approved" }),
        reviewer,
      ),
    /notes/,
  );
  assert.throws(
    () => recordDecision(manifest, candidates, approve(10), reviewer),
    /graph options are incomplete/,
  );
  assert.throws(
    () =>
      recordDecision(
        manifest,
        candidates,
        { ...approve(1), diagramConfirmed: false },
        reviewer,
      ),
    /original diagram/,
  );
  assert.throws(
    () =>
      recordDecision(
        manifest,
        candidates,
        { ...approve(2), inspectedPages: [] },
        reviewer,
      ),
    /each original/,
  );
  assert.throws(
    () =>
      recordDecision(
        manifest,
        candidates,
        { ...approve(2), unresolvedIssues: ["Unresolved Tamil"] },
        reviewer,
      ),
    /Resolve all issues/,
  );
  assert.throws(
    () =>
      recordDecision(
        manifest,
        candidates,
        input(2, { decision: "rejected" }),
        reviewer,
      ),
    /rejection reason/,
  );
  const before = JSON.stringify(candidates);
  const after = recordDecision(manifest, candidates, approve(2), reviewer);
  assert.equal(
    after.entries.find((e) => e.number === 2)!.history[0].reviewer.id,
    reviewer.id,
  );
  assert.equal(after.entries.find((e) => e.number === 2)!.decision, "approved");
  assert.ok(
    after.entries.every(
      (e) => e.candidateStatus === "Needs Review" && !e.practicePublished,
    ),
  );
  assert.equal(JSON.stringify(candidates), before);
  assert.throws(
    () => recordDecision(after, candidates, approve(2), reviewer),
    /Reload/,
  );
  assert.deepEqual(reconcileManifest(candidates, after), after);
  assert.deepEqual(mergeLocalReviewQueue(candidates, candidates), candidates);
  assert.deepEqual(
    reconcileManifest(mergeLocalReviewQueue(candidates, candidates), after),
    after,
  );
  const changed = structuredClone(candidates);
  changed[0].options[0] = "Changed source";
  assert.throws(
    () => reconcileManifest(changed, after),
    /Source evidence changed/,
  );
  assert.throws(() =>
    decisionInput.parse({ ...approve(2), reviewerId: "forged" }),
  );
});

test("Actual extraction reruns preserve separate saved local decisions, notes and candidate identities", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "avs-physics-rerun-test-"),
  );
  try {
    for (const folder of [
      "docs",
      "public/textbooks",
      ".local/textbook-text",
      ".local/teacher-review/physics-unit1-workflow",
    ])
      await mkdir(path.join(directory, folder), { recursive: true });
    await copyFile(
      path.resolve("public" + packet.localPdf),
      path.join(directory, "public", packet.localPdf),
    );
    await copyFile(
      path.resolve(`.local/textbook-text/${candidates[0].bookId}.json`),
      path.join(directory, `.local/textbook-text/${candidates[0].bookId}.json`),
    );
    await writeFile(
      path.join(directory, "docs/tamil-physics-unit1-candidates.json"),
      JSON.stringify(packet),
    );
    const queuePath = path.join(
      directory,
      ".local/teacher-review/tamil-physics-unit1.json",
    );
    await writeFile(queuePath, JSON.stringify(candidates));
    const manifestPath = path.join(
      directory,
      ".local/teacher-review/physics-unit1-workflow/decisions.json",
    );
    const saved = recordDecision(
      reconcileManifest(candidates),
      candidates,
      approve(2),
      reviewer,
    );
    await writeFile(manifestPath, JSON.stringify(saved));
    const before = await readFile(manifestPath, "utf8");
    for (let run = 0; run < 2; run++) {
      await promisify(execFile)(
        process.execPath,
        [
          "--import",
          pathToFileURL(path.resolve("node_modules/tsx/dist/loader.mjs")).href,
          path.resolve("scripts/prepare-tamil-physics-unit1.ts"),
        ],
        { cwd: directory, timeout: 30000 },
      );
      assert.equal(await readFile(manifestPath, "utf8"), before);
      assert.deepEqual(
        JSON.parse(await readFile(queuePath, "utf8")),
        candidates,
      );
      const audit = JSON.parse(
        await readFile(
          path.join(
            directory,
            "docs/tamil-physics-unit1-extraction-audit.json",
          ),
          "utf8",
        ),
      );
      assert.equal(audit.insertedLocalRows, 0);
      assert.equal(audit.rerunInsertedRows, 0);
      assert.equal(audit.pending, 15);
      assert.equal(audit.published, 0);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("Standalone authenticated local review persists individual decisions, protects exports and serves actual source images", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "avs-physics-local-test-"));
  let app: Awaited<ReturnType<typeof startLocalPhysicsReview>> | undefined;
  try {
    const provision = await provisionReviewer(
      dir,
      reviewer.email,
      reviewer.name,
    );
    const credentials = await readFile(provision.credentialsFile, "utf8"),
      password = credentials.match(/Password: (.+)/)![1];
    assert.ok(
      !(await readFile(path.join(dir, "reviewers.json"), "utf8")).includes(
        password,
      ),
    );
    await assert.rejects(
      provisionReviewer(dir, reviewer.email, reviewer.name),
      /already exists/,
    );
    app = await startLocalPhysicsReview({
      root: process.cwd(),
      directory: dir,
      port: 0,
    });
    const origin = app.origin;
    const call = (
      route: string,
      body?: unknown,
      cookie = "",
      requestOrigin = origin,
    ) =>
      fetch(origin + route, {
        method: body ? "POST" : "GET",
        headers: {
          Cookie: cookie,
          Origin: requestOrigin,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    assert.equal((await call("/api/queue")).status, 401);
    assert.equal((await call("/api/export")).status, 401);
    assert.equal((await call("/source/79.png")).status, 401);
    assert.equal(
      (
        await call(
          "/api/login",
          { email: reviewer.email, password },
          "",
          "https://hostile.example",
        )
      ).status,
      403,
    );
    const login = await call("/api/login", { email: reviewer.email, password });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie")!.split(";")[0];
    assert.match(login.headers.get("set-cookie")!, /HttpOnly; SameSite=Strict/);
    const actualReviewer = (await login.json()).reviewer;
    const queue = await (await call("/api/queue", undefined, cookie)).json();
    assert.equal(queue.candidates.length, 15);
    for (const number of [79, 80, 81]) {
      const response = await call(`/source/${number}.png`, undefined, cookie);
      assert.equal(response.status, 200);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(bytes.subarray(1, 4).toString(), "PNG");
      assert.ok(bytes.length > 100000);
    }
    assert.equal(
      (await call("/api/decision", approve(10), cookie)).status,
      400,
    );
    assert.equal(
      (
        await call(
          "/api/decision",
          approve(2),
          cookie,
          "https://hostile.example",
        )
      ).status,
      403,
    );
    assert.equal((await call("/api/decision", approve(2), cookie)).status, 200);
    const conflict = await Promise.all([
      call(
        "/api/decision",
        input(3, {
          decision: "needs_correction",
          notes: "Fixture correction detail",
        }),
        cookie,
      ),
      call(
        "/api/decision",
        input(3, { decision: "rejected", notes: "Fixture rejection reason" }),
        cookie,
      ),
    ]);
    assert.deepEqual(conflict.map((r) => r.status).sort(), [200, 409]);
    const exportResponse = await call("/api/export", undefined, cookie);
    assert.match(
      exportResponse.headers.get("content-disposition")!,
      /attachment/,
    );
    const exported = await exportResponse.json();
    const savedExportFile = exportResponse.headers.get("x-local-export-path");
    assert.ok(
      savedExportFile &&
        path.resolve(savedExportFile).startsWith(path.resolve(dir) + path.sep),
    );
    assert.deepEqual(
      JSON.parse(await readFile(savedExportFile, "utf8")),
      exported,
    );
    const exportedAudit = auditTeacherManifest(exported, {
      candidates: queue.candidates,
      persisted: JSON.parse(await readFile(app.manifestFile, "utf8")),
      reviewers: [actualReviewer],
      requireExport: true,
    });
    assert.equal(exportedAudit.valid, true);
    assert.equal(exportedAudit.confirmedEntries.length, 2);
    assert.equal(exported.entries.length, 15);
    const entry = exported.entries.find(
      (e: { number: number }) => e.number === 2,
    );
    assert.equal(entry.decision, "approved");
    assert.equal(entry.reviewer.id, actualReviewer.id);
    assert.equal(entry.history.length, 1);
    assert.equal(entry.candidateStatus, "Needs Review");
    assert.equal(entry.practicePublished, false);
    assert.ok(entry.source.sourceSha256 && entry.source.pdfPage);
    assert.equal(
      exported.entries.find((e: { number: number }) => e.number === 10)
        .decision,
      "pending",
    );
    await app.close();
    app = undefined;
    app = await startLocalPhysicsReview({
      root: process.cwd(),
      directory: dir,
      port: 0,
    });
    const persisted = JSON.parse(await readFile(app.manifestFile, "utf8"));
    assert.equal(
      persisted.entries.find((e: { number: number }) => e.number === 2)
        .decision,
      "approved",
    );
  } finally {
    await app?.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("Local teacher browser can inspect all 15 questions on desktop and mobile without contacting external services", async () => {
  const dir = await mkdtemp(
    path.join(os.tmpdir(), "avs-physics-browser-test-"),
  );
  let app: Awaited<ReturnType<typeof startLocalPhysicsReview>> | undefined;
  const browser = await chromium.launch({ headless: true });
  try {
    const provision = await provisionReviewer(
      dir,
      reviewer.email,
      reviewer.name,
    );
    const password = (await readFile(provision.credentialsFile, "utf8")).match(
      /Password: (.+)/,
    )![1];
    app = await startLocalPhysicsReview({
      root: process.cwd(),
      directory: dir,
      port: 0,
    });
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const errors: string[] = [],
        external: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.route("**/*", (route) => {
        if (
          !route
            .request()
            .url()
            .startsWith(app!.origin + "/")
        ) {
          external.push(route.request().url());
          void route.abort();
        } else void route.continue();
      });
      await page.goto(app.origin);
      await page.locator("#email").fill(reviewer.email);
      await page.locator("#password").fill(password);
      await page.getByRole("button", { name: "Sign in locally" }).click();
      await page.locator("#review").waitFor({ state: "visible" });
      for (const c of candidates) {
        await page.locator("#question").selectOption(c.id);
        assert.equal(
          await page.locator("#original").innerText(),
          c.originalExtraction!.questionText,
        );
        assert.equal(await page.locator("#proposedOptions li").count(), 4);
        assert.equal(
          await page.locator("#originalOptions li").count(),
          c.originalExtraction!.options.length,
        );
        assert.ok(
          (await page.locator("#references").innerText()).includes(c.id),
        );
        assert.equal(
          await page.locator("#images img").count(),
          requiredSourcePages(c).length,
        );
        for (const image of await page.locator("#images img").all()) {
          await image.scrollIntoViewIfNeeded();
          await image.evaluate((img: HTMLImageElement) => img.decode());
          assert.ok(
            await image.evaluate(
              (img: HTMLImageElement) => img.naturalWidth > 500,
            ),
          );
        }
        if (c.number === 10) {
          assert.equal(
            await page
              .locator('#decision option[value="approved"]')
              .evaluate((option: HTMLOptionElement) => option.disabled),
            true,
          );
          assert.equal(await page.locator("#incomplete").isVisible(), true);
        }
      }
      const q10 = candidates.find((c) => c.number === 10)!;
      await page.locator("#question").selectOption(q10.id);
      await page.locator("#decision").selectOption("needs_correction");
      await page
        .locator("#notes")
        .fill(
          "Isolated browser fixture: graph options need faithful representation.",
        );
      await page
        .getByRole("button", { name: "Save this individual local decision" })
        .click();
      await page.waitForFunction(() =>
        document
          .getElementById("message")!
          .textContent!.includes("saved locally"),
      );
      await page.reload();
      await page.locator("#review").waitFor({ state: "visible" });
      await page.locator("#question").selectOption(q10.id);
      assert.equal(
        await page.locator("#decision").inputValue(),
        "needs_correction",
      );
      const downloadPromise = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Export decision manifest" })
        .click();
      const download = await downloadPromise;
      assert.equal(
        download.suggestedFilename(),
        "tamil-physics-unit1-decisions.json",
      );
      const exportPath = await download.path();
      const manifest = JSON.parse(await readFile(exportPath!, "utf8"));
      assert.ok(
        (await page.locator("#message").innerText()).includes(
          path.join(dir, "exports"),
        ),
      );
      assert.equal(manifest.entries.length, 15);
      assert.equal(
        manifest.entries.find((e: { number: number }) => e.number === 10)
          .decision,
        "needs_correction",
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
      await context.close();
    }
  } finally {
    await browser.close();
    await app?.close();
    await rm(dir, { recursive: true, force: true });
  }
});
