import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { chromium } from "@playwright/test";
import {
  loadAdditionalPhysicsBatches,
  adaptBoundedReviewCandidates,
} from "../scripts/lib/physics-review-batches";
import { loadComputerReviewBatches } from "../scripts/lib/computer-review-batches";
import { loadCommerceReviewBatches } from "../scripts/lib/commerce-review-batches";
import { loadSharedSourceReviewBatches } from "../scripts/lib/shared-source-review";
import {
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
import { selectPracticeQuestions } from "../src/lib/textbook-practice-selection";
import type { Question } from "../src/types";

const root = process.cwd();
const reviewer = {
  id: "isolated-fixture-only",
  name: "Isolated test reviewer",
  email: "physics-fixture@example.test",
};
const sha = (input: Buffer | string) =>
  createHash("sha256").update(input).digest("hex");

test("Actual held Physics records remain excluded beside the retained 995-row English snapshot", async () => {
  const batches = await loadAdditionalPhysicsBatches(root);
  const snapshot = JSON.parse(
    await readFile(
      path.join(root, ".local/independent-live-content.json"),
      "utf8",
    ),
  );
  const existing = snapshot.tables.avs_questions.map(
    (row: { data: Question }) => row.data,
  ) as Question[];
  const ready = selectPracticeQuestions(existing, {});
  assert.equal(ready.length, 995);
  const candidates = batches.flatMap((b) => b.candidates);
  assert.ok(ready.every((q) => !candidates.some((c) => c.id === q.id)));
  // Simulate a mistaken status-only publication to verify that the independent
  // approval gate still excludes every real ID, even the ten recovered option sets.
  const accidentallyPublished = candidates.map(
    (c) =>
      ({
        id: c.id,
        sourceTextbookId: c.bookId,
        subjectId: c.subjectId,
        chapterId: c.chapterId,
        questionText: c.questionText,
        optionA: c.options[0],
        optionB: c.options[1],
        optionC: c.options[2],
        optionD: c.options[3],
        correctAnswer: c.correctAnswer,
        status: "Published",
        sourceType: "Book-In",
        language: "Tamil",
      }) as Question,
  );
  assert.deepEqual(
    selectPracticeQuestions([...existing, ...accidentallyPublished], {}).map(
      (q) => q.id,
    ),
    ready.map((q) => q.id),
  );
});

test("Actual 60 source candidates adapt without changing extraction; stable recovered IDs and all original warnings survive", async () => {
  const file = path.join(
    root,
    ".local/teacher-review/extracted-books/12-physics-tamil-v1-c1623725.json",
  );
  const before = await readFile(file);
  const original = JSON.parse(before.toString()).sourceBoundedProposals;
  const batches = await loadAdditionalPhysicsBatches(root);
  const records = batches.flatMap((b) => b.candidates);
  assert.equal(records.length, 60);
  assert.equal(new Set(records.map((c) => c.id)).size, 60);
  assert.equal(
    records.filter((c) => !c.extractionEvidence.reusedExistingId).length,
    6,
  );
  assert.equal(
    records.filter((c) => c.localReviewRequirements!.optionRecovery).length,
    10,
  );
  assert.equal(
    records.filter((c) => !c.extractionEvidence.completeTextOptions).length,
    1,
  );
  assert.equal(
    records.filter((c) => c.extractionEvidence.requiresDiagram).length,
    13,
  );
  const receipts = JSON.parse(
    await readFile(
      path.join(
        root,
        ".local/teacher-review/physics-unit1-workflow/units2-5-source-assets/source-assets.json",
      ),
      "utf8",
    ),
  );
  for (const c of records) {
    const raw = original.find((r: { id: string }) => r.id === c.id);
    assert.deepEqual(c.originalExtraction, raw.originalExtraction);
    assert.ok(
      raw.qualityFlags.every((w: string) => c.qualityFlags.includes(w)),
    );
    assert.equal(
      c.localReviewRequirements!.originalProposalSha256,
      sha(JSON.stringify(raw)),
    );
    assert.equal(c.status, "Needs Review");
    assert.equal(c.reviewStatus, "needs_teacher_review");
    assert.equal(c.practicePublished, false);
    if (c.correctAnswer) assert.ok(c.options["ABCD".indexOf(c.correctAnswer)]);
    for (const f of [
      ...c.localReviewRequirements!.figures,
      ...[c.localReviewRequirements!.optionRecovery].filter((v) => v !== null),
    ]) {
      const receipt = receipts.assets.find(
        (a: { file: string }) => a.file === f.file,
      );
      assert.equal(receipt.candidateId, c.id);
      assert.equal(receipt.page, f.page);
      assert.deepEqual(receipt.rect, f.rect);
      assert.equal(
        sha(
          await readFile(
            path.join(
              root,
              ".local/teacher-review/physics-unit1-workflow/units2-5-source-assets",
              f.file,
            ),
          ),
        ),
        receipt.sha256,
      );
    }
  }
  for (const batch of batches)
    assert.deepEqual(
      reconcileManifest(batch.candidates),
      reconcileManifest(batch.candidates),
    );
  assert.deepEqual(await readFile(file), before);
  const duplicated = structuredClone(original);
  duplicated[1].id = duplicated[0].id;
  assert.throws(() => adaptBoundedReviewCandidates(duplicated), /Duplicate/);
});

test("New approvals require recorded Tamil corrections, source mapping, valid options and diagrams; graph-only choices stay blocked in save and audit", async () => {
  const batches = await loadAdditionalPhysicsBatches(root);
  const batch = batches[0],
    candidate = batch.candidates[0];
  const input: LocalDecisionInput = {
    id: candidate.id,
    expectedRevision: 0,
    decision: "approved",
    notes: "Isolated fixture only; not an actual teacher decision",
    unresolvedIssues: [],
    inspectedPages: requiredSourcePages(candidate),
    textConfirmed: true,
    keyConfirmed: true,
    diagramConfirmed: true,
  };
  const before = reconcileManifest(batch.candidates);
  assert.throws(
    () => recordDecision(before, batch.candidates, input, reviewer),
    /teacher-corrected Tamil/,
  );
  const correction = {
    questionText: "Isolated fixture transcription only",
    options: ["a", "b", "c", "d"] as [string, string, string, string],
    correctAnswer: candidate.correctAnswer!,
    sourceMappingConfirmed: true,
  };
  assert.throws(
    () =>
      recordDecision(
        before,
        batch.candidates,
        {
          ...input,
          correction: { ...correction, sourceMappingConfirmed: false },
        },
        reviewer,
      ),
    /source mapping/,
  );
  assert.throws(
    () =>
      recordDecision(
        before,
        batch.candidates,
        { ...input, correction, diagramConfirmed: false },
        reviewer,
      ),
    /original diagram/,
  );
  const result = recordDecision(
    before,
    batch.candidates,
    { ...input, correction },
    reviewer,
  );
  assert.deepEqual(result.entries[0].history[0].correction, correction);
  assert.equal(
    auditTeacherManifest(result, {
      candidates: batch.candidates,
      persisted: result,
      reviewers: [reviewer],
      requireExport: false,
    }).valid,
    true,
  );
  const tampered = structuredClone(result);
  delete tampered.entries[0].history[0].correction;
  assert.equal(
    auditTeacherManifest(tampered, {
      candidates: batch.candidates,
      persisted: tampered,
      reviewers: [reviewer],
      requireExport: false,
    }).valid,
    false,
  );
  const graphBatch = batches.find((b) => b.unit === 4)!,
    graph = graphBatch.candidates.find((c) => c.number === 5)!;
  assert.equal(
    graph.localReviewRequirements!.figures.filter((f) => f.option).length,
    4,
  );
  assert.throws(
    () =>
      recordDecision(
        reconcileManifest(graphBatch.candidates),
        graphBatch.candidates,
        {
          ...input,
          id: graph.id,
          inspectedPages: requiredSourcePages(graph),
          correction: { ...correction, correctAnswer: "A" },
        },
        reviewer,
      ),
    /options are incomplete/,
  );
});

test("Unit batches isolate IDs, authenticate decisions, audit exports and retain history across a server restart without changing Unit 1", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "avs-physics-batches-test-"),
  );
  let app: Awaited<ReturnType<typeof startLocalPhysicsReview>> | undefined;
  try {
    const provision = await provisionReviewer(
      directory,
      reviewer.email,
      reviewer.name,
    );
    const password = (await readFile(provision.credentialsFile, "utf8")).match(
      /Password: (.+)/,
    )![1];
    app = await startLocalPhysicsReview({ root, directory, port: 0 });
    const unit1 = await readFile(app.manifestFile);
    const call = (route: string, body?: unknown, cookie = "") =>
      fetch(app!.origin + route, {
        method: body ? "POST" : "GET",
        headers: {
          Origin: app!.origin,
          Cookie: cookie,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    assert.equal((await call("/api/queue?batch=unit-2")).status, 401);
    assert.equal((await call("/api/decision?batch=unit-2", {})).status, 401);
    const login = await call("/api/login", { email: reviewer.email, password });
    let cookie = login.headers.get("set-cookie")!.split(";")[0];
    const identity = (await login.json()).reviewer;
    for (const unit of [2, 3, 4, 5]) {
      const queue = await (
        await call(`/api/queue?batch=unit-${unit}`, undefined, cookie)
      ).json();
      assert.equal(queue.candidates.length, 15);
      const c = queue.candidates[0];
      const input = {
        id: c.id,
        expectedRevision: 0,
        decision: "needs_correction",
        notes: `Isolated fixture unit ${unit}: Tamil transcription needs correction`,
        unresolvedIssues: c.qualityFlags,
        inspectedPages: [],
        textConfirmed: false,
        keyConfirmed: false,
        diagramConfirmed: false,
      };
      assert.equal(
        (await call(`/api/decision?batch=unit-${unit}`, input, cookie)).status,
        200,
      );
      assert.equal(
        (await call(`/api/decision?batch=unit-${unit}`, input, cookie)).status,
        409,
      );
      assert.equal(
        (
          await call(
            `/api/decision?batch=unit-${unit === 5 ? 2 : unit + 1}`,
            input,
            cookie,
          )
        ).status,
        404,
      );
      const response = await call(
        `/api/export?batch=unit-${unit}`,
        undefined,
        cookie,
      );
      assert.equal(response.status, 200);
      const exported = await response.json(),
        file = response.headers.get("x-local-export-path")!;
      assert.ok(
        file.startsWith(path.join(directory, `unit-${unit}`, "exports")),
      );
      assert.deepEqual(JSON.parse(await readFile(file, "utf8")), exported);
      const saved = JSON.parse(
        await readFile(
          path.join(directory, `unit-${unit}/decisions.json`),
          "utf8",
        ),
      );
      assert.equal(
        auditTeacherManifest(exported, {
          candidates: queue.candidates,
          persisted: saved,
          reviewers: [identity],
          requireExport: true,
        }).valid,
        true,
      );
    }
    assert.equal(
      (await call("/source/79.png?batch=unit-2", undefined, cookie)).status,
      404,
    );
    assert.equal(
      (
        await call(
          "/figure/unit-3-q-1-figure-1.png?batch=unit-2",
          undefined,
          cookie,
        )
      ).status,
      404,
    );
    assert.deepEqual(await readFile(app.manifestFile), unit1);
    await app.close();
    app = undefined;
    app = await startLocalPhysicsReview({ root, directory, port: 0 });
    assert.equal(
      (await call("/api/queue?batch=unit-2", undefined, cookie)).status,
      401,
    );
    const relogin = await call("/api/login", {
      email: reviewer.email,
      password,
    });
    cookie = relogin.headers.get("set-cookie")!.split(";")[0];
    for (const unit of [2, 3, 4, 5]) {
      const queue = await (
        await call(`/api/queue?batch=unit-${unit}`, undefined, cookie)
      ).json();
      assert.equal(queue.manifest.entries[0].decision, "needs_correction");
      assert.equal(queue.manifest.entries[0].history.length, 1);
      assert.equal(queue.manifest.entries[0].reviewer.id, identity.id);
    }
    assert.deepEqual(await readFile(app.manifestFile), unit1);
  } finally {
    await app?.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("Desktop and mobile teachers can inspect all 60 individual questions, exact source crops and blocked graph choices locally", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "avs-physics-batches-browser-"),
  );
  const browser = await chromium.launch({ headless: true });
  let app: Awaited<ReturnType<typeof startLocalPhysicsReview>> | undefined;
  try {
    const batches = await loadAdditionalPhysicsBatches(root);
    const provision = await provisionReviewer(
      directory,
      reviewer.email,
      reviewer.name,
    );
    const password = (await readFile(provision.credentialsFile, "utf8")).match(
      /Password: (.+)/,
    )![1];
    app = await startLocalPhysicsReview({ root, directory, port: 0 });
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({ viewport }),
        page = await context.newPage();
      const errors: string[] = [],
        external: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
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
      assert.equal(
        await page.locator("#batch option").count(),
        1 +
          batches.length +
          (await loadComputerReviewBatches(root)).length +
          (await loadCommerceReviewBatches(root)).length +
          (await loadSharedSourceReviewBatches(root)).length,
      );
      for (const batch of batches) {
        await page.locator("#batch").selectOption(batch.id);
        await page.waitForFunction(
          (id) =>
            document.getElementById("references")!.textContent!.includes(id),
          batch.candidates[0].id,
        );
        for (const c of batch.candidates) {
          await page.locator("#question").selectOption(c.id);
          assert.equal(
            await page.locator("#original").innerText(),
            c.originalExtraction!.questionText,
          );
          assert.equal(
            await page.locator("#proposed").innerText(),
            c.extractionEvidence.proposedTranscription.questionText,
          );
          assert.equal(
            await page.locator("#proposedOptions li").count(),
            c.options.length,
          );
          assert.ok(
            (await page.locator("#references").innerText()).includes(c.id),
          );
          const expected =
            c.localReviewRequirements!.figures.length +
            (c.localReviewRequirements!.optionRecovery ? 1 : 0);
          assert.equal(await page.locator("#figures img").count(), expected);
          for (const img of await page.locator("#figures img").all()) {
            await img.evaluate((image: HTMLImageElement) => image.decode());
            assert.equal(await img.getAttribute("data-candidate-id"), c.id);
            assert.ok(
              await img.evaluate(
                (image: HTMLImageElement) =>
                  image.naturalWidth > 100 && image.naturalHeight > 90,
              ),
            );
          }
          if (!c.extractionEvidence.completeTextOptions) {
            assert.equal(
              await page
                .locator('#decision option[value="approved"]')
                .evaluate((o: HTMLOptionElement) => o.disabled),
              true,
            );
            assert.equal(await page.locator("#incomplete").isVisible(), true);
          }
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            true,
          );
        }
      }
      await page.locator("#batch").selectOption("unit-2");
      await page.waitForFunction(
        (id) =>
          document.getElementById("references")!.textContent!.includes(id),
        batches[0].candidates[0].id,
      );
      await page.locator("#decision").selectOption("needs_correction");
      await page
        .locator("#notes")
        .fill(
          "Isolated browser fixture only: source Tamil requires correction.",
        );
      await page.locator("#save").click();
      await page.waitForFunction(() =>
        document
          .getElementById("message")!
          .textContent!.includes("saved locally"),
      );
      await page.reload();
      await page.locator("#review").waitFor({ state: "visible" });
      await page.locator("#batch").selectOption("unit-2");
      await page.waitForFunction(
        () =>
          (document.getElementById("decision") as HTMLSelectElement).value ===
          "needs_correction",
      );
      const downloadPromise = page.waitForEvent("download");
      await page.locator("#export").click();
      const download = await downloadPromise;
      assert.equal(
        download.suggestedFilename(),
        "tamil-physics-unit-2-decisions.json",
      );
      const exported = JSON.parse(
        await readFile((await download.path())!, "utf8"),
      );
      assert.equal(exported.entries.length, 15);
      assert.equal(exported.entries[0].decision, "needs_correction");
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
      await context.close();
    }
  } finally {
    await browser.close();
    await app?.close();
    await rm(directory, { recursive: true, force: true });
  }
});
