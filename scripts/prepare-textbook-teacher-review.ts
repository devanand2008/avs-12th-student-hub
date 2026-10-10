import { loadEnvConfig } from "@next/env";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import catalog from "../src/lib/textbooks-catalog.json";
import { requireSupabase } from "../src/lib/supabase/server";
import {
  extractBookMcqs,
  type ExtractedBook,
} from "./lib/textbook-question-parser";
import { parsePrintedAnswerKey } from "./lib/textbook-answer-keys";
import type { Textbook } from "../src/lib/textbooks";
import type { Question } from "../src/types";
import type {
  TextbookMcqCandidate,
  TextbookReviewPreparation,
} from "../src/lib/textbook-question-types";

// Preparation is evidence gathering, never teacher approval or corrected official wording.
loadEnvConfig(process.cwd());
const client = requireSupabase();
async function rows<T>(table: string): Promise<T[]> {
  const result: T[] = [];
  let total = 0;
  do {
    const response = await client
      .from(table)
      .select("data", { count: "exact" })
      .order("id")
      .range(result.length, result.length + 999);
    if (response.error) throw new Error(`${table}: ${response.error.code}`);
    total = response.count || 0;
    const page = (response.data || []).map((row) => row.data as T);
    if (!page.length && result.length < total)
      throw new Error(`Incomplete ${table} read`);
    result.push(...page);
  } while (result.length < total);
  if (result.length !== total) throw new Error(`Inconsistent ${table} count`);
  return result;
}
const normalize = (text: string) =>
  text.toLowerCase().replace(/\s+/g, " ").trim();
const fingerprint = (c: TextbookMcqCandidate) =>
  `${c.bookId}|${c.chapterId}|${normalize(c.questionText)}|${c.options.map(normalize).join("|")}`;
type Prepared = {
  id: string;
  originalExtraction: TextbookMcqCandidate;
  reviewPreparation: TextbookReviewPreparation;
};

async function main() {
  const [candidates, questions] = await Promise.all([
    rows<TextbookMcqCandidate>("textbook_mcq_candidates"),
    rows<Question>("avs_questions"),
  ]);
  const readyIds = new Set(
    questions.filter((q) => q.status === "Published").map((q) => q.id),
  );
  const held = candidates.filter(
    (c) =>
      c.correctAnswer &&
      c.keyPage &&
      !readyIds.has(c.id) &&
      !c.reviewedBy &&
      c.reviewStatus !== "rejected",
  );
  const knownGroups = new Map<string, string[]>();
  const overlaps = new Map<string, string[]>();
  for (const c of candidates) {
    const key = fingerprint(c);
    knownGroups.set(key, [...(knownGroups.get(key) || []), c.id]);
    const source = `${c.bookId}|${c.chapterId}|${c.page}|${c.number}`;
    overlaps.set(source, [...(overlaps.get(source) || []), c.id]);
  }
  const prepared: Prepared[] = [];
  const checks: { bookId: string; page: number; matchesCache: boolean }[] = [];
  const batchCounts = new Map<string, number>();
  for (const c of candidates) {
    const match = c.reviewPreparation?.batchId.match(/-review-(\d+)$/);
    if (match)
      batchCounts.set(
        c.chapterId,
        Math.max(batchCounts.get(c.chapterId) || 0, Number(match[1]) * 20),
      );
  }
  const stamp = new Date().toISOString();
  for (const book of catalog.books as Textbook[]) {
    const selected = held
      .filter((c) => c.bookId === book.id)
      .sort(
        (a, b) =>
          a.chapterId.localeCompare(b.chapterId) ||
          a.page - b.page ||
          a.number - b.number ||
          a.id.localeCompare(b.id),
      );
    if (!selected.length) continue;
    const cache = JSON.parse(
      await readFile(`.local/textbook-text/${book.id}.json`, "utf8"),
    ) as ExtractedBook;
    const bytes = await readFile("public" + book.localPath);
    const sha = createHash("sha256").update(bytes).digest("hex");
    if (sha !== cache.sha256 || selected.some((c) => c.sourceSha256 !== sha))
      throw new Error(`PDF hash mismatch: ${book.id}`);
    const needed = new Set(
      selected.flatMap((c) => [c.page, c.endPage || c.page, c.keyPage!]),
    );
    const extracted = new Map<
      number,
      { text: string; printedPage: number | null; printedPageEvidence: string }
    >();
    const task = getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: true,
      verbosity: 0,
    });
    try {
      const document = await task.promise;
      for (const number of [...needed].sort((a, b) => a - b)) {
        const page = await document.getPage(number);
        const content = await page.getTextContent();
        const text = content.items
          .filter((item) => "str" in item)
          .map((item) =>
            "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "",
          )
          .join("")
          .toWellFormed()
          .replaceAll("\u0000", " ")
          .replace(/[^\S\n]+/g, " ")
          .replace(/ *\n */g, "\n")
          .trim();
        const matchesCache =
          text === cache.pages.find((p) => p.page === number)?.text;
        checks.push({ bookId: book.id, page: number, matchesCache });
        if (!matchesCache)
          throw new Error(
            `Fresh source differs from cache: ${book.id}:${number}`,
          );
        const height = page.getViewport({ scale: 1 }).height;
        const labels = content.items.filter(
          (item) =>
            "str" in item &&
            /^\d{1,4}$/.test(item.str.trim()) &&
            (item.transform[5] < height * 0.08 ||
              item.transform[5] > height * 0.94),
        );
        const unique = [
          ...new Set(
            labels.map((item) => ("str" in item ? Number(item.str.trim()) : 0)),
          ),
        ];
        extracted.set(number, {
          text,
          printedPage: unique.length === 1 ? unique[0] : null,
          printedPageEvidence:
            unique.length === 1
              ? "Isolated numeric text at the PDF header/footer; teacher must confirm the printed page label."
              : "No unambiguous numeric page label; printed page remains unknown.",
        });
        page.cleanup();
      }
    } finally {
      await task.destroy();
    }
    const sourceCandidates = new Map(
      extractBookMcqs(book, cache).candidates.map((c) => [c.id, c]),
    );
    for (const candidate of selected) {
      const source = sourceCandidates.get(candidate.id);
      const page = extracted.get(candidate.page)!;
      const key = extracted.get(candidate.keyPage!)!;
      const parsed = parsePrintedAnswerKey(key.text);
      const parsedAnswer = parsed.conflict
        ? null
        : parsed.answers.get(candidate.number) || null;
      const keyCheck = !parsedAnswer
        ? "uncertain"
        : parsedAnswer === candidate.correctAnswer
          ? "matched"
          : "mismatch";
      const sourceCheck =
        source &&
        source.questionText === candidate.questionText &&
        JSON.stringify(source.options) === JSON.stringify(candidate.options)
          ? "matched"
          : "uncertain";
      const duplicateIds = [
        ...new Set([
          ...(knownGroups.get(fingerprint(candidate)) || []),
          ...(overlaps.get(
            `${candidate.bookId}|${candidate.chapterId}|${candidate.page}|${candidate.number}`,
          ) || []),
        ]),
      ].filter((id) => id !== candidate.id);
      const warnings = [...candidate.qualityFlags];
      if (sourceCheck !== "matched")
        warnings.push(
          "Stored wording/options differ from a fresh source parse; manual comparison required.",
        );
      if (keyCheck !== "matched")
        warnings.push(
          keyCheck === "mismatch"
            ? "Printed key page parse disagrees with the proposed answer; check chapter/exercise scope."
            : "Key page is ambiguous or contains multiple exercise keys; proposed answer is not independently confirmed.",
        );
      if (candidate.section !== "Book-back")
        warnings.push(
          "Parser labels this In-text; confirm the actual book-back exercise section.",
        );
      if (candidate.options.length !== 4)
        warnings.push(
          "Fewer than four extracted options; confirm the printed option count without inventing choices.",
        );
      if (candidate.options.some((o) => !o.trim()))
        warnings.push("An extracted option is empty.");
      if (
        new Set(candidate.options.map(normalize)).size !==
        candidate.options.length
      )
        warnings.push("Duplicate option text.");
      if ("ABCD".indexOf(candidate.correctAnswer!) >= candidate.options.length)
        warnings.push("Proposed answer has no corresponding extracted option.");
      if (
        /[\uFFFD\u0080-\u009F]/u.test(
          candidate.questionText + candidate.options.join(""),
        )
      )
        warnings.push("Damaged PDF text glyphs; inspect the original page.");
      if (/figure|diagram|படம்|வரைபடம்/i.test(candidate.questionText))
        warnings.push(
          "Question may depend on a diagram; text-only practice needs teacher assessment.",
        );
      if (/math|physics|chemistry/i.test(book.subject))
        warnings.push(
          "Confirm mathematical/scientific notation against the original PDF.",
        );
      if (duplicateIds.length)
        warnings.push(
          "Potential duplicate or overlapping source question; compare records individually.",
        );
      const index = batchCounts.get(candidate.chapterId) || 0;
      if (!candidate.reviewPreparation)
        batchCounts.set(candidate.chapterId, index + 1);
      prepared.push({
        id: candidate.id,
        originalExtraction: candidate,
        reviewPreparation: {
          batchId:
            candidate.reviewPreparation?.batchId ||
            `${candidate.chapterId}-review-${String(Math.floor(index / 20) + 1).padStart(2, "0")}`,
          preparedAt: stamp,
          sourceSha256: sha,
          subject: book.subject,
          title: book.title,
          medium: book.sourceMedium,
          volume: book.volume,
          printedPage: page.printedPage,
          printedPageEvidence: page.printedPageEvidence,
          sourceCheck,
          keyCheck,
          sourceQuestionText: source?.questionText || candidate.questionText,
          sourceOptions: source?.options || candidate.options,
          englishText:
            book.sourceMedium === "English"
              ? source?.questionText || candidate.questionText
              : null,
          tamilText:
            book.sourceMedium === "Tamil"
              ? source?.questionText || candidate.questionText
              : null,
          sourcePageText:
            page.text +
            (candidate.endPage && candidate.endPage !== candidate.page
              ? "\n--- Continuation PDF page " +
                candidate.endPage +
                " ---\n" +
                extracted.get(candidate.endPage)!.text
              : ""),
          keyPageText: key.text,
          parsedAnswer,
          warnings: [...new Set(warnings)],
          duplicateIds,
        },
      });
      if (candidate.reviewPreparation) {
        const packet = prepared.at(-1)!.reviewPreparation;
        const previous = { ...candidate.reviewPreparation, preparedAt: stamp };
        if (isDeepStrictEqual(packet, previous))
          packet.preparedAt = candidate.reviewPreparation.preparedAt;
      }
    }
    console.log(
      `${book.id}: ${selected.length} candidates, ${needed.size} original pages checked`,
    );
  }
  await mkdir(".local", { recursive: true });
  await writeFile(
    ".local/textbook-review-preparation.json",
    JSON.stringify(prepared),
  );
  const batches = [
    ...new Set(prepared.map((row) => row.reviewPreparation.batchId)),
  ].map((batchId) => {
    const items = prepared.filter(
      (row) => row.reviewPreparation.batchId === batchId,
    );
    const first = items[0];
    return {
      batchId,
      bookId: first.originalExtraction.bookId,
      subject: first.reviewPreparation.subject,
      medium: first.reviewPreparation.medium,
      volume: first.reviewPreparation.volume,
      chapterId: first.originalExtraction.chapterId,
      chapter: first.originalExtraction.chapterTitle,
      total: items.length,
      sourceMatched: items.filter(
        (row) => row.reviewPreparation.sourceCheck === "matched",
      ).length,
      keyMatched: items.filter(
        (row) => row.reviewPreparation.keyCheck === "matched",
      ).length,
      keyMismatch: items.filter(
        (row) => row.reviewPreparation.keyCheck === "mismatch",
      ).length,
      uncertain: items.filter(
        (row) => row.reviewPreparation.keyCheck === "uncertain",
      ).length,
      duplicateCandidates: items.filter(
        (row) => row.reviewPreparation.duplicateIds.length,
      ).length,
      pending: items.length,
      candidateIds: items.map((row) => row.id),
    };
  });
  let applied = 0,
    skipped = 0;
  if (process.argv.includes("--apply")) {
    for (const batch of batches) {
      const input = prepared.filter(
        (row) => row.reviewPreparation.batchId === batch.batchId,
      );
      const response = await client.rpc("avs_prepare_textbook_review", {
        p_rows: input,
      });
      if (response.error)
        throw new Error(`Prepare ${batch.batchId}: ${response.error.message}`);
      applied += response.data.prepared;
      skipped += response.data.skipped;
    }
  }
  const summary = {
    checkedAt: stamp,
    mode: process.argv.includes("--apply") ? "applied" : "dry-run",
    candidateCount: prepared.length,
    books: new Set(prepared.map((r) => r.originalExtraction.bookId)).size,
    chapters: new Set(prepared.map((r) => r.originalExtraction.chapterId)).size,
    batches: batches.length,
    pagesChecked: checks.length,
    pageMismatches: checks.filter((c) => !c.matchesCache).length,
    tamil: prepared.filter((r) => r.reviewPreparation.medium === "Tamil")
      .length,
    english: prepared.filter((r) => r.reviewPreparation.medium === "English")
      .length,
    sourceMatched: prepared.filter(
      (r) => r.reviewPreparation.sourceCheck === "matched",
    ).length,
    keyMatched: prepared.filter(
      (r) => r.reviewPreparation.keyCheck === "matched",
    ).length,
    keyMismatch: prepared.filter(
      (r) => r.reviewPreparation.keyCheck === "mismatch",
    ).length,
    keyUncertain: prepared.filter(
      (r) => r.reviewPreparation.keyCheck === "uncertain",
    ).length,
    printedPageIdentified: prepared.filter(
      (r) => r.reviewPreparation.printedPage !== null,
    ).length,
    duplicateCandidates: prepared.filter(
      (r) => r.reviewPreparation.duplicateIds.length,
    ).length,
    applied,
    skipped,
    humanApprovals: 0,
    method:
      "Fresh original PDF text extraction and hash checks; source parse comparison and conservative page-wide printed-key parsing. Matching source text is not visual/academic verification. All prepared questions remain needs_teacher_review; chapter/exercise key scope, wording, notation, diagrams and page labels require human confirmation.",
  };
  await writeFile(
    "docs/teacher-review-batches.json",
    JSON.stringify({ ...summary, batches, pageChecks: checks }, null, 2) + "\n",
  );
  await writeFile(
    "docs/TEACHER_REVIEW_BATCHES.md",
    `# Held textbook question review batches\n\nMeasured ${stamp}. ${summary.candidateCount} candidates, ${summary.books} textbooks, ${summary.chapters} detected chapters, ${summary.batches} batches of at most 20.\n\n${summary.sourceMatched} source-text matches; ${summary.keyMatched} page-wide key matches, ${summary.keyMismatch} disagreements and ${summary.keyUncertain} ambiguous/unreadable key mappings. ${summary.tamil} Tamil-medium candidates. **Zero human approvals.** All require individual teacher review. Printed-page labels are conservative header/footer detections, not inferred PDF offsets.\n\n${summary.method}\n\n| Book / medium | Chapter | Batch | Pending | Source matched | Key matched | Key disagrees | Uncertain | Potential duplicate |\n|---|---|---|---:|---:|---:|---:|---:|---:|\n` +
      batches
        .map(
          (b) =>
            `| ${b.subject} ${b.volume ? `Vol ${b.volume}` : ""} / ${b.medium} | ${b.chapterId.split("-ch-")[1]} | ${b.batchId} | ${b.total} | ${b.sourceMatched} | ${b.keyMatched} | ${b.keyMismatch} | ${b.uncertain} | ${b.duplicateCandidates} |`,
        )
        .join("\n") +
      "\n",
  );
  console.log(JSON.stringify(summary));
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Review preparation failed",
  );
  process.exitCode = 1;
});
