import assert from "node:assert/strict";
import test from "node:test";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { chromium } from "@playwright/test";
import catalog from "../src/lib/textbooks-catalog.json";
import definitions from "../scripts/data/computer-source-sections.json";
import { extractComputerSourceSections } from "../scripts/lib/computer-source-extraction";
import { loadComputerReviewBatches } from "../scripts/lib/computer-review-batches";
import { localTranscriptionProposals } from "../scripts/lib/tamil-transcription-proposals";
import {
  provisionReviewer,
  startLocalPhysicsReview,
} from "../scripts/lib/local-physics-review-server";
import { auditTeacherManifest } from "../scripts/lib/teacher-decision-audit";
import { requiredSourcePages } from "../scripts/lib/local-physics-review";
import { selectPracticeQuestions } from "../src/lib/textbook-practice-selection";
import type { Textbook } from "../src/lib/textbooks";
import type { Question } from "../src/types";

const root = process.cwd();
const identity = {
  name: "Isolated computer-batch fixture",
  email: "computer-fixture@example.test",
};
async function packet(id: string) {
  return JSON.parse(
    await readFile(`.local/teacher-review/extracted-books/${id}.json`, "utf8"),
  );
}

test("Fresh bounded computer extraction preserves 24 stable IDs, split-column choices, raw Unicode and excludes non-MCQs/glossary without guessing answers", async () => {
  // This regression covers the original PageMaker/InDesign Chapter 2 pair.
  // Computer Science has a separate ten-question Chapter 2 source test.
  for (const definition of definitions.filter(
    (d) => d.chapterNumber === 2 && d.subject !== "Computer Science",
  )) {
    const book = catalog.books.find(
      (b) => b.id === definition.bookId,
    ) as Textbook;
    const saved = await packet(book.id);
    const before = JSON.stringify(saved.candidates);
    const source = JSON.parse(
      await readFile(`.local/textbook-text/${book.id}.json`, "utf8"),
    );
    const result = await extractComputerSourceSections(
      book,
      source,
      saved.candidates,
    );
    const repeated = await extractComputerSourceSections(
      book,
      source,
      saved.candidates,
    );
    assert.deepEqual(result, repeated);
    result.candidates = result.candidates.filter((c) =>
      c.chapterId.endsWith("-ch-2"),
    );
    result.summaries = result.summaries.filter((c) => c.chapterNumber === 2);
    assert.deepEqual(
      result.candidates,
      saved.sourceBoundedProposals.filter((c: { chapterId: string }) =>
        c.chapterId.endsWith("-ch-2"),
      ),
    );
    assert.equal(result.candidates.length, 12);
    assert.equal(new Set(result.candidates.map((c) => c.id)).size, 12);
    assert.equal(JSON.stringify(saved.candidates), before);
    for (const c of result.candidates) {
      assert.ok(
        saved.candidates.some((old: { id: string }) => old.id === c.id),
      );
      assert.equal(c.correctAnswer, null);
      assert.equal(c.extractionEvidence.keyPdfPage, null);
      assert.equal(c.extractionEvidence.keyMatched, false);
      assert.equal(c.options.length, 4);
      assert.ok(c.options.every((o) => o.trim()));
      assert.equal(c.status, "Needs Review");
      assert.equal(c.practicePublished, false);
      assert.ok(
        !c.extractionEvidence.proposedColumnOrderedSpan.includes(".indd"),
      );
      assert.ok(
        !c.extractionEvidence.proposedColumnOrderedSpan.includes("II."),
      );
      assert.ok(c.qualityFlags.some((w) => /Tamil/.test(w)));
      assert.deepEqual(
        c.originalExtraction,
        saved.candidates.find((old: { id: string }) => old.id === c.id)
          .originalExtraction,
      );
    }
    if (book.subject === "Computer Applications") {
      assert.deepEqual(result.candidates[4].options, [
        "Ctrl+A",
        "Ctrl +B",
        "Ctrl+C",
        "Ctrl+W",
      ]);
      assert.deepEqual(
        result.summaries[0].excludedItems.flatMap((i) => i.numbers),
        [13, 14, 15, 16, 17, 18, 19, 20, 21],
      );
    } else {
      assert.ok(!result.candidates[0].questionText.includes("Bounding"));
      assert.ok(
        result.candidates[0].extractionEvidence.originalPageText[0].text.includes(
          "Bounding",
        ),
      );
      assert.equal(result.candidates[5].options[0], "Gatter");
      assert.ok(result.candidates[2].options[3].includes("vaccum"));
      assert.deepEqual(
        result.summaries[0].excludedItems.flatMap((i) => i.numbers),
        [13],
      );
    }
    const conflicting = [
      ...saved.candidates,
      {
        ...saved.candidates.find(
          (c: { id: string }) => c.id === result.candidates[0].id,
        ),
        id: "conflicting-copy-fixture",
      },
    ];
    await assert.rejects(
      extractComputerSourceSections(book, source, conflicting),
      /Ambiguous existing IDs/,
    );
  }
});

test("All configured computer batches stay outside the unchanged English publication snapshot, even with a mistaken Published flag", async () => {
  const batches = await loadComputerReviewBatches(root);
  assert.equal(batches.length, definitions.length);
  const snapshot = JSON.parse(
    await readFile(".local/independent-live-content.json", "utf8"),
  );
  const existing = snapshot.tables.avs_questions.map(
    (r: { data: Question }) => r.data,
  ) as Question[];
  const ready = selectPracticeQuestions(existing, {});
  assert.equal(ready.length, 995);
  const candidates = batches.flatMap((b) => b.candidates);
  const inventoriedItems = definitions.reduce(
    (total, definition) =>
      total +
      definition.pages.reduce(
        (count, page) =>
          count +
          ("numbers" in page
            ? (page.numbers as number[]).length
            : page.last - page.first + 1),
        0,
      ),
    0,
  );
  assert.equal(new Set(candidates.map((c) => c.id)).size, inventoriedItems);
  const wrongStatus = candidates.map(
    (c) =>
      ({
        id: c.id,
        questionText: c.questionText,
        chapterId: c.chapterId,
        subjectId: c.subjectId,
        sourceTextbookId: c.bookId,
        status: "Published",
        correctAnswer: "A",
        optionA: c.options[0],
        optionB: c.options[1],
        optionC: c.options[2],
        optionD: c.options[3],
      }) as Question,
  );
  assert.deepEqual(
    selectPracticeQuestions([...existing, ...wrongStatus], {}).map((q) => q.id),
    ready.map((q) => q.id),
  );
});

test("Authenticated computer review persists individual corrections and null-key source references, rejects approval without answer evidence, and exports audit-valid history", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "skillup-computer-review-test-"),
  );
  let app: Awaited<ReturnType<typeof startLocalPhysicsReview>> | undefined;
  try {
    const account = await provisionReviewer(
      directory,
      identity.email,
      identity.name,
    );
    const password = (await readFile(account.credentialsFile, "utf8")).match(
      /Password: (.+)/,
    )![1];
    const batches = await loadComputerReviewBatches(root);
    app = await startLocalPhysicsReview({ root, directory, port: 0 });
    const before = await readFile(app.manifestFile);
    const call = (url: string, input?: unknown, cookie = "") =>
      fetch(app!.origin + url, {
        method: input ? "POST" : "GET",
        headers: {
          Cookie: cookie,
          Origin: app!.origin,
          "Content-Type": "application/json",
        },
        body: input ? JSON.stringify(input) : undefined,
      });
    const login = await call("/api/login", { email: identity.email, password });
    const cookie = login.headers.get("set-cookie")!.split(";")[0],
      reviewer = (await login.json()).reviewer;
    for (const batch of batches) {
      const c = batch.candidates[0],
        route = (url: string) => `${url}?batch=${batch.id}`;
      assert.equal((await call(route("/api/queue"))).status, 401);
      assert.equal((await call(route(`/source/${c.page}.png`))).status, 401);
      const queue = await (
        await call(route("/api/queue"), undefined, cookie)
      ).json();
      assert.equal(queue.candidates.length, batch.candidates.length);
      const input = {
        id: c.id,
        expectedRevision: 0,
        decision: "approved",
        notes: "Isolated fixture, not an actual teacher decision",
        unresolvedIssues: [],
        inspectedPages: requiredSourcePages(c),
        textConfirmed: true,
        keyConfirmed: true,
        diagramConfirmed: false,
        correction: {
          questionText: "Isolated fixture only",
          options: ["a", "b", "c", "d"],
          correctAnswer: "A",
          sourceMappingConfirmed: true,
        },
      };
      const blocked = await call(route("/api/decision"), input, cookie);
      assert.equal(blocked.status, 400);
      assert.match(
        (await blocked.json()).error,
        /Answer evidence is unavailable/,
      );
      const next = {
        ...input,
        decision: "needs_correction",
        unresolvedIssues: c.qualityFlags,
        keyConfirmed: false,
      };
      assert.equal(
        (await call(route("/api/decision"), next, cookie)).status,
        200,
      );
      assert.equal(
        (await call(route("/api/decision"), next, cookie)).status,
        409,
      );
      const response = await call(route("/api/export"), undefined, cookie);
      assert.equal(response.status, 200);
      const exported = await response.json();
      const manifestFile = path.join(directory, batch.id, "decisions.json");
      const stored = JSON.parse(await readFile(manifestFile, "utf8"));
      assert.equal(stored.entries[0].source.keyPdfPage, null);
      assert.equal(stored.entries[0].source.keyPrintedPage, null);
      const audit = auditTeacherManifest(exported, {
        candidates: batch.candidates,
        persisted: stored,
        reviewers: [reviewer],
        requireExport: true,
      });
      assert.equal(audit.valid, true);
      const tampered = structuredClone(stored);
      tampered.entries[0].decision = tampered.entries[0].history[0].decision =
        "approved";
      assert.equal(
        auditTeacherManifest(tampered, {
          candidates: batch.candidates,
          persisted: tampered,
          reviewers: [reviewer],
          requireExport: false,
        }).valid,
        false,
      );
      const sourceImage = await call(
        route(`/source/${c.page}.png`),
        undefined,
        cookie,
      );
      assert.equal(sourceImage.status, 200);
      assert.equal(
        Buffer.from(await sourceImage.arrayBuffer())
          .subarray(1, 4)
          .toString(),
        "PNG",
      );
      assert.equal(
        (await call(route("/source/79.png"), undefined, cookie)).status,
        404,
      );
    }
    assert.deepEqual(await readFile(app.manifestFile), before);
    await app.close();
    app = undefined;
    app = await startLocalPhysicsReview({ root, directory, port: 0 });
    for (const batch of batches) {
      const stored = JSON.parse(
        await readFile(
          path.join(directory, batch.id, "decisions.json"),
          "utf8",
        ),
      );
      assert.equal(stored.entries[0].decision, "needs_correction");
      assert.equal(stored.entries[0].history.length, 1);
      assert.equal(stored.entries[0].reviewer.id, reviewer.id);
    }
    assert.deepEqual(await readFile(app.manifestFile), before);
  } finally {
    await app?.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("Desktop/mobile local review displays every configured computer source item, preserves binary choices and saves corrections without guessing an answer", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "skillup-computer-browser-test-"),
  );
  const browser = await chromium.launch({ headless: true });
  let app: Awaited<ReturnType<typeof startLocalPhysicsReview>> | undefined;
  try {
    const account = await provisionReviewer(
      directory,
      identity.email,
      identity.name,
    );
    const password = (await readFile(account.credentialsFile, "utf8")).match(
      /Password: (.+)/,
    )![1];
    const batches = await loadComputerReviewBatches(root);
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
      await page.locator("#email").fill(identity.email);
      await page.locator("#password").fill(password);
      await page.getByRole("button", { name: "Sign in locally" }).click();
      await page.locator("#review").waitFor({ state: "visible" });
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
            c.questionText,
          );
          const supplementary = localTranscriptionProposals([c])[0];
          assert.equal(
            await page.locator("#sourceTranscriptionSection").isVisible(),
            Boolean(supplementary),
          );
          if (supplementary) {
            assert.equal(
              await page.locator("#sourceTranscriptionOptions li").count(),
              supplementary.proposedOptions?.length ?? 0,
            );
            if (supplementary.proposedQuestionText)
              assert.equal(
                await page.locator("#sourceTranscriptionText").innerText(),
                supplementary.proposedQuestionText,
              );
            assert(
              (
                await page.locator("#sourceTranscriptionStatus").innerText()
              ).includes("answer unknown"),
            );
          }
          if (c.sourceOccurrence) {
            assert(
              (await page.locator("#title").innerText()).includes(
                `source occurrence ${c.sourceOccurrence.ordinal}`,
              ),
            );
            assert(
              (
                await page.locator("#question option:checked").innerText()
              ).includes(`occurrence ${c.sourceOccurrence.ordinal}`),
            );
          }
          assert.equal(
            await page.locator("#proposedOptions li").count(),
            c.options.length,
          );
          assert.equal(await page.locator("#correctedAnswer").inputValue(), "");
          if (c.options.length === 2) {
            assert.equal(await page.locator("#correctedC").isVisible(), false);
            assert.equal(await page.locator("#correctedD").isVisible(), false);
            await page
              .locator("#correctedQuestion")
              .fill("Isolated browser fixture: unknown answer remains unknown");
            await page.locator("#correctedA").fill(c.options[0]);
            await page.locator("#correctedB").fill(c.options[1]);
            await page.locator("#decision").selectOption("needs_correction");
            await page
              .locator("#notes")
              .fill(
                "Isolated browser fixture only: two source choices and no answer evidence",
              );
            await page.locator("#save").click();
            await page.waitForFunction(() =>
              document
                .getElementById("message")!
                .textContent!.includes("saved locally"),
            );
            const saved = JSON.parse(
              await readFile(
                path.join(directory, batch.id, "decisions.json"),
                "utf8",
              ),
            );
            const correction = saved.entries
              .find((e: { id: string }) => e.id === c.id)
              .history.at(-1).correction;
            assert.equal(correction.correctAnswer, null);
            assert.deepEqual(correction.options, c.options);
          }
          assert.equal(
            await page.locator("#answerUnavailable").isVisible(),
            true,
          );
          assert.equal(
            await page
              .locator('#decision option[value="approved"]')
              .evaluate((o: HTMLOptionElement) => o.disabled),
            true,
          );
          assert.ok(
            (await page.locator("#references").innerText()).includes(
              c.reviewPreparation!.subject,
            ),
          );
          await page
            .locator("#sourceEvidence")
            .evaluate((element: HTMLDetailsElement) => (element.open = true));
          const sourceImages = await page.locator("#images img").all();
          assert.equal(
            sourceImages.length,
            c.extractionEvidence.printedPages.length,
          );
          for (const [index, img] of sourceImages.entries()) {
            await img.scrollIntoViewIfNeeded();
            await img.evaluate((i: HTMLImageElement) => i.decode());
            assert.equal(
              await img.getAttribute("alt"),
              `Original textbook PDF page ${c.page + index}, printed page ${c.extractionEvidence.printedPages[index]}`,
            );
          }
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            true,
          );
        }
      }
      await page.locator("#decision").selectOption("needs_correction");
      await page
        .locator("#notes")
        .fill(
          "Isolated browser fixture: Tamil and answer evidence require correction.",
        );
      await page.locator("#save").click();
      await page.waitForFunction(() =>
        document
          .getElementById("message")!
          .textContent!.includes("saved locally"),
      );
      const downloading = page.waitForEvent("download");
      await page.locator("#export").click();
      const download = await downloading;
      const manifest = JSON.parse(
        await readFile((await download.path())!, "utf8"),
      );
      assert.equal(manifest.entries.length, batches.at(-1)!.candidates.length);
      assert.ok(download.suggestedFilename().startsWith("textbook-computer-"));
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
