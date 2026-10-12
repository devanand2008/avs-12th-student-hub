import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import catalog from "../src/lib/textbooks-catalog.json";
import transcription from "./data/tamil-physics-unit1-transcription.json";
import baseline from "../docs/tamil-physics-unit1-baseline.json";
import type { Textbook } from "../src/lib/textbooks";
import type { TextbookMcqCandidate } from "../src/lib/textbook-question-types";
import {
  mergeLocalReviewQueue,
  preparePhysicsUnit1,
  type Unit1Candidate,
  type Unit1SourcePage,
} from "./lib/tamil-physics-unit1";

// Intentionally offline. --apply/import flags are rejected; no Supabase client.
assert.ok(
  process.argv.slice(2).every((arg) => arg === "--render"),
  "Only --render is supported; production import is forbidden",
);
const destination = "docs/tamil-physics-unit1-candidates.json";
const queuePath = ".local/teacher-review/tamil-physics-unit1.json";
async function optional<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return fallback;
  }
}
async function main() {
  const checkedAt = new Date().toISOString();
  const previous = await optional<{ preparedAt?: string }>(destination, {});
  const preparedAt = previous.preparedAt ?? checkedAt;
  const book = catalog.books.find(
    (b) => b.id === transcription.bookId,
  )! as Textbook;
  assert.ok(book.localPath);
  const bytes = await readFile("public" + book.localPath);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    transcription.sourceSha256,
  );
  const cache = JSON.parse(
    await readFile(`.local/textbook-text/${book.id}.json`, "utf8"),
  );
  assert.equal(cache.sha256, book.sha256);
  assert.ok(
    cache.outline.some(
      (o: { title: string; page: number }) =>
        o.page === 9 && /UNIT-1\(/.test(o.title),
    ),
  );
  assert.ok(
    cache.outline.some(
      (o: { title: string; page: number }) =>
        o.page === 88 && /UNIT-2\(/.test(o.title),
    ),
  );
  const task = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
    verbosity: 0,
  });
  const pages: Unit1SourcePage[] = [];
  const pageChecks: {
    pdfPage: number;
    printedPage: number;
    cacheMatches: boolean;
    freshTextSha256: string;
  }[] = [];
  await mkdir(".local/teacher-review", { recursive: true });
  try {
    const doc = await task.promise;
    assert.equal(doc.numPages, book.pages);
    for (const n of [9, 79, 80, 81]) {
      const page = await doc.getPage(n),
        content = await page.getTextContent();
      const text = content.items
        .filter((i) => "str" in i)
        .map((i) => ("str" in i ? i.str + (i.hasEOL ? "\n" : " ") : ""))
        .join("")
        .toWellFormed()
        .replaceAll("\u0000", " ")
        .replace(/[^\S\n]+/g, " ")
        .replace(/ *\n */g, "\n")
        .trim();
      const cacheMatches =
        text === cache.pages.find((p: Unit1SourcePage) => p.page === n)?.text;
      assert.ok(cacheMatches, `Fresh PDF ${n} differs from cached source`);
      pageChecks.push({
        pdfPage: n,
        printedPage: n === 9 ? 1 : n - 8,
        cacheMatches,
        freshTextSha256: createHash("sha256").update(text).digest("hex"),
      });
      pages.push({ page: n, text });
      if (process.argv.includes("--render")) {
        const { createCanvas } = await import("@napi-rs/canvas");
        const viewport = page.getViewport({ scale: 2 });
        const canvas = createCanvas(
          Math.ceil(viewport.width),
          Math.ceil(viewport.height),
        );
        await page.render({
          canvas: canvas as never,
          canvasContext: canvas.getContext("2d") as never,
          viewport,
        }).promise;
        await writeFile(
          `.local/physics-unit1-page-${n}.png`,
          canvas.toBuffer("image/png"),
        );
      }
      page.cleanup();
    }
  } finally {
    await task.destroy();
  }
  const candidates = preparePhysicsUnit1(
    book,
    baseline.book,
    pages,
    baseline.candidates as TextbookMcqCandidate[],
    transcription,
    preparedAt,
  );
  const existing = await optional<Unit1Candidate[]>(queuePath, []);
  const localQueue = mergeLocalReviewQueue(existing, candidates);
  const repeatQueue = mergeLocalReviewQueue(localQueue, candidates);
  assert.deepEqual(
    repeatQueue,
    localQueue,
    "Rerun must preserve every local record",
  );
  const packet = {
    preparedAt,
    scope:
      "local-only; not imported into Supabase or visible in the live admin queue",
    sourceFile: transcription.sourceFile,
    localPdf: book.localPath,
    sourceSha256: book.sha256,
    metadataSource: "Read-only public.textbooks snapshot",
    baselineReadAt: baseline.checkedAt,
    chapter: {
      number: 1,
      title: transcription.chapterTitle,
      pdfStart: 9,
      pdfEnd: 87,
    },
    sourcePages: pages,
    candidates,
  };
  const summary = {
    checkedAt,
    preparedAt,
    sourceSha256: book.sha256,
    bookId: book.id,
    chapterId: `tb-${book.id}-ch-1`,
    candidates: candidates.length,
    reusedIds: candidates.filter((c) => c.extractionEvidence.reusedExistingId)
      .length,
    newLocalIds: candidates.filter(
      (c) => !c.extractionEvidence.reusedExistingId,
    ).length,
    scopedPrintedKeyMatches: candidates.filter(
      (c) => c.reviewPreparation!.keyCheck === "matched",
    ).length,
    sourceTranscriptionsRequiringTeacherReview: candidates.length,
    diagramDependent: candidates.filter(
      (c) => c.extractionEvidence.requiresDiagram,
    ).length,
    incompleteGraphChoiceSets: candidates.filter(
      (c) => !c.extractionEvidence.completeTextOptions,
    ).length,
    pending: candidates.filter((c) => c.reviewStatus === "needs_teacher_review")
      .length,
    approved: candidates.filter((c) => c.reviewStatus === "approved").length,
    rejected: candidates.filter((c) => c.reviewStatus === "rejected").length,
    published: candidates.filter(
      (c) => c.status === "Published" || c.practicePublished,
    ).length,
    existingLocalRows: existing.length,
    insertedLocalRows: localQueue.length - existing.length,
    localQueueRows: localQueue.length,
    rerunInsertedRows: repeatQueue.length - localQueue.length,
    excludedBaselineRows: baseline.candidates
      .filter((c) => c.page < 79 || c.page > 81)
      .map((c) => ({
        id: c.id,
        page: c.page,
        number: c.number,
        reason: "Outside the bounded Unit 1 section-I pages; unchanged",
      })),
    pageChecks,
    productionWrites: 0,
    teacherDecisionsMade: 0,
    limits:
      "15 source MCQs are identified; 11 existing IDs retained and 4 missing questions have new local IDs. Every candidate is held. Graph-choice labels are incomplete and cannot be considered student-ready. Printed-key agreement is evidence only; raw source and proposed transcription are separate. No production imports or approvals.",
  };
  await writeFile(destination, JSON.stringify(packet, null, 2) + "\n");
  await writeFile(queuePath, JSON.stringify(localQueue, null, 2) + "\n");
  await writeFile(
    "docs/tamil-physics-unit1-extraction-audit.json",
    JSON.stringify(summary, null, 2) + "\n",
  );
  await writeFile(
    "docs/TAMIL_PHYSICS_UNIT1_REVIEW.md",
    `# Tamil Physics Volume 1 — Unit 1 local review packet\n\nPrepared ${preparedAt}; extraction audit ${checkedAt}. Source: \`${transcription.sourceFile}\`, local \`public${book.localPath}\`, SHA-256 \`${book.sha256}\`. Metadata is from the read-only public.textbooks snapshot ${baseline.checkedAt}: Physics / Tamil / Volume 1, 352 pages. The actual PDF 9 opening is Unit 1, நிலை மின்னியல்; Unit 2 opens at PDF 88.\n\n**${summary.candidates} local candidates; pending ${summary.pending}; approved ${summary.approved}; rejected ${summary.rejected}; published ${summary.published}.** ${summary.reusedIds} existing candidate IDs are retained; ${summary.newLocalIds} new local IDs fill missing questions 8, 10, 13 and 14. These do not add four questions to the production count. The three existing candidates outside this section are untouched.\n\nAll ${summary.scopedPrintedKeyMatches} proposed letters match the printed numbered key on PDF 81 / printed 73. This is source evidence, not teacher approval or an independent academic answer check. All source checks remain uncertain pending teacher comparison of Tamil, notation and choice order.\n\nFreshly rendered PDF pages 9, 79, 80 and 81 were inspected during this task. Run \`npm run mcqs:physics-unit1 -- --render\` to regenerate their local images. PDF pages 79–81 have printed labels 71–73. Question 6 crosses PDF 79–80. The source has 15 numbered one-mark questions before the printed key and section II; ordinary lesson text, worked examples and short-answer questions are excluded.\n\nThe proposed text below is a visual source transcription, not corrected official wording. [Full schema-compatible candidates](tamil-physics-unit1-candidates.json) keep immutable original extraction, original source spans, full page text, printed key text and per-question warnings separately. [Baseline](tamil-physics-unit1-baseline.json) retains all 14 existing Unit 1 rows. [Audit](tamil-physics-unit1-extraction-audit.json) checks fresh source hashes/pages and rerun identity.\n\nThe local queue is \`.local/teacher-review/tamil-physics-unit1.json\`; batch \`${candidates[0].reviewPreparation!.batchId}\`. Preparation inserts missing IDs only and preserves existing local edits/history on reruns. **No production import or deployment occurred; these proposed records are not in the live admin queue.** The production chapter still has its old front-matter title and in-text classifications. A later authorised import must reconcile the 11 existing IDs, retain the other candidates and preserve individual teacher decisions. There is no import/approval flag on this command.\n\nSeven questions (1, 3, 5, 6, 8, 10, 14) require diagram evidence. Question 10 stores the original graph labels only; those are incomplete text options and must not be published. Questions 7, 8, 9 and 13 also retain the printed ambiguities/conditions rather than guessing corrections. Teacher must resolve these explicitly.\n\n| Question | PDF pages | Printed pages | Proposed key | ID disposition | Diagram | Status |\n|---|---|---|---|---|---|---|\n` +
      candidates
        .map(
          (c) =>
            `| ${c.number} | ${c.page}${c.endPage !== c.page ? `–${c.endPage}` : ""} | ${c.extractionEvidence.printedPages.join(", ")} | ${c.correctAnswer} | ${c.extractionEvidence.reusedExistingId ? "Retained" : "New local"} | ${c.extractionEvidence.requiresDiagram ? "Required" : "No"} | Held |`,
        )
        .join("\n") +
      '\n\n## Local individual teacher review\n\nUse the separate [local teacher workflow](LOCAL_TAMIL_PHYSICS_REVIEW.md) to inspect original and proposed text, locally rendered source pages and key evidence, and save authenticated individual decisions in a separate local manifest. Run `npm run mcqs:physics-review`. Provision each actual teacher with `-- --add-reviewer teacher@example.com --name "Teacher name"`. The workflow never changes these held candidates or publishes anything. Question 10 approval is blocked while graph options remain incomplete. Extraction reruns do not read or write that decision manifest.\n\n## Scoped printed answer key\n\n```text\n' +
      transcription.visualKeyText +
      "\n```\n\n## Individual source transcriptions and unresolved issues\n\n" +
      candidates
        .map(
          (c) =>
            `### Question ${c.number}\n\nCandidate: \`${c.id}\`. Original PDF ${c.page}${c.endPage !== c.page ? `–${c.endPage}` : ""}, printed ${c.extractionEvidence.printedPages.join("–")}. Proposed answer: ${c.correctAnswer}; printed entry \`${c.extractionEvidence.printedKeyEntry}\`. No reviewer or decision history.\n\n${c.questionText}\n\n${c.options.map((o, i) => `- ${"ABCD"[i]}. ${o}`).join("\n")}\n\n${c.extractionEvidence.diagramEvidence ? `Diagram evidence: ${c.extractionEvidence.diagramEvidence}\n\n` : ""}Review warnings:\n\n${c.qualityFlags.map((w) => `- ${w}`).join("\n")}\n`,
        )
        .join("\n"),
  );
  console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
