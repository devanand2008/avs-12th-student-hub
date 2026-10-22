import assert from "node:assert/strict";
import test from "node:test";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";
import catalog from "../src/lib/textbooks-catalog.json";
import definition from "../scripts/data/commerce-source-section.json";
import { extractCommerceSourceSection } from "../scripts/lib/commerce-source-extraction";
import { loadCommerceReviewBatches } from "../scripts/lib/commerce-review-batches";
import {
  provisionReviewer,
  startLocalPhysicsReview,
} from "../scripts/lib/local-physics-review-server";
import type { Textbook } from "../src/lib/textbooks";
import { selectPracticeQuestions } from "../src/lib/textbook-practice-selection";

test("Previously empty Tamil Commerce chapter recovers five unique held IDs with scoped Tamil key evidence, preserves raw control characters and is reproducible", async () => {
  const book = catalog.books.find(
    (b) => b.id === definition.bookId,
  ) as Textbook;
  const original = JSON.parse(
    await readFile(`.local/textbook-text/${book.id}.json`, "utf8"),
  );
  const saved = JSON.parse(
    await readFile(
      `.local/teacher-review/extracted-books/${book.id}.json`,
      "utf8",
    ),
  );
  const first = await extractCommerceSourceSection(book, original, []);
  const rerun = await extractCommerceSourceSection(
    book,
    original,
    saved.candidates,
  );
  assert.deepEqual(first, rerun);
  assert.deepEqual(rerun.candidates, saved.sourceBoundedProposals);
  assert.equal(first.candidates.length, 5);
  assert.equal(new Set(first.candidates.map((c) => c.id)).size, 5);
  assert.deepEqual(
    first.candidates.map((c) => c.correctAnswer),
    ["C", "D", "C", "D", "C"],
  );
  assert.equal(first.summaries[0].keyMatched, 5);
  for (const c of first.candidates) {
    assert.equal(c.page, 272);
    assert.equal(c.keyPage, 272);
    assert.deepEqual(c.extractionEvidence.printedPages, [258]);
    assert.equal(c.options.length, 4);
    assert.ok(c.options["ABCD".indexOf(c.correctAnswer)]);
    assert.equal(c.status, "Needs Review");
    assert.equal(c.practicePublished, false);
    assert.equal(c.extractionEvidence.wordingTeacherVerified, false);
    assert.ok(c.originalExtraction.questionText.includes("\u0007"));
    assert.ok(!c.questionText.includes("\u0007"));
    assert.ok(!c.questionText.includes("CEO"));
    assert.ok(saved.candidates.some((old: { id: string }) => old.id === c.id));
  }
  const snapshot = JSON.parse(
    await readFile(".local/independent-live-content.json", "utf8"),
  );
  const ready = selectPracticeQuestions(
    snapshot.tables.avs_questions.map(
      (r: { data: import("../src/types").Question }) => r.data,
    ),
    {},
  );
  assert.equal(ready.length, 995);
  assert.ok(first.candidates.every((c) => !ready.some((q) => q.id === c.id)));
  const badKey = structuredClone(original);
  badKey.pages.find((p: { page: number }) => p.page === 272).text =
    "Changed source";
  await assert.rejects(extractCommerceSourceSection(book, badKey, []));
});

test("Commerce's five local HTML questions show real printed-key references on desktop/mobile and require explicit source verification before any approval", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "skillup-commerce-review-test-"),
  );
  const browser = await chromium.launch({ headless: true });
  let app: Awaited<ReturnType<typeof startLocalPhysicsReview>> | undefined;
  try {
    const email = "commerce-fixture@example.test",
      provision = await provisionReviewer(
        directory,
        email,
        "Isolated Commerce test fixture",
      );
    const password = (await readFile(provision.credentialsFile, "utf8")).match(
      /Password: (.+)/,
    )![1];
    const [batch] = await loadCommerceReviewBatches(process.cwd());
    app = await startLocalPhysicsReview({
      root: process.cwd(),
      directory,
      port: 0,
    });
    const unit1Before = await readFile(app.manifestFile);
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({ viewport }),
        page = await context.newPage();
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
      await page.locator("#email").fill(email);
      await page.locator("#password").fill(password);
      await page.getByRole("button", { name: "Sign in locally" }).click();
      await page.locator("#review").waitFor({ state: "visible" });
      await page.locator("#batch").selectOption(batch.id);
      await page.waitForFunction(
        (id) =>
          document.getElementById("references")!.textContent!.includes(id),
        batch.candidates[0].id,
      );
      for (const c of batch.candidates) {
        await page.locator("#question").selectOption(c.id);
        assert.equal(
          await page.locator("#proposed").innerText(),
          c.questionText,
        );
        assert.equal(await page.locator("#proposedOptions li").count(), 4);
        await page
          .locator("#sourceEvidence")
          .evaluate((element: HTMLDetailsElement) => {
            element.open = true;
          });
        assert.equal(await page.locator("#images img").count(), 1);
        await page
          .locator("#images img")
          .evaluate((image: HTMLImageElement) => image.decode());
        assert.ok(
          (await page.locator("#images img").getAttribute("alt"))!.includes(
            "printed page 258",
          ),
        );
        assert.ok(
          (await page.locator("#references").innerText()).includes(
            "printed 258",
          ),
        );
        assert.ok(
          (await page.locator("#answer").innerText()).includes(
            c.extractionEvidence.printedKeyEntry,
          ),
        );
        assert.equal(
          await page.locator("#answerUnavailable").isVisible(),
          false,
        );
        assert.equal(await page.locator("#decision").inputValue(), "pending");
        assert.equal(await page.locator("#correctedQuestion").inputValue(), "");
        assert.equal(
          await page.locator("#history").innerText(),
          "No teacher decisions recorded.",
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
      }
      const current = batch.candidates.at(-1)!;
      const blocked: import("@playwright/test").APIResponse =
        await page.request.post(
          `${app.origin}/api/decision?batch=${batch.id}`,
          {
            headers: { Origin: app.origin },
            data: {
              id: current.id,
              expectedRevision: 0,
              decision: "approved",
              notes: "Isolated unverified test attempt",
              unresolvedIssues: [],
              inspectedPages: [],
              textConfirmed: false,
              keyConfirmed: false,
              diagramConfirmed: false,
            },
          },
        );
      assert.equal(blocked.status(), 400);
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
      await context.close();
    }
    assert.deepEqual(await readFile(app.manifestFile), unit1Before);
    const manifest = JSON.parse(
      await readFile(path.join(directory, batch.id, "decisions.json"), "utf8"),
    );
    assert.ok(
      manifest.entries.every(
        (e: { decision: string; history: unknown[] }) =>
          e.decision === "pending" && e.history.length === 0,
      ),
    );
  } finally {
    await browser.close();
    await app?.close();
    await rm(directory, { recursive: true, force: true });
  }
});
