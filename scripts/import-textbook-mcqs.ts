import { loadEnvConfig } from "@next/env";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createHash } from "node:crypto";
import path from "node:path";
import catalogJson from "../src/lib/textbooks-catalog.json";
import {
  extractBookMcqs,
  type ExtractedBook,
} from "./lib/textbook-question-parser";
import { requireSupabase } from "../src/lib/supabase/server";
import type { TextbookCatalog } from "../src/lib/textbooks";
import type { Question, Chapter, Subject } from "../src/types";
import type { TextbookMcqCoverage } from "../src/lib/textbook-question-types";

loadEnvConfig(process.cwd());
const dryRun = process.argv.includes("--dry-run");
const catalog = catalogJson as TextbookCatalog;
const directory = ".local/textbook-text";
async function retry<
  T extends { error: { code?: string } | null; status?: number },
>(operation: () => PromiseLike<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const result = await operation();
    if (
      !result.error ||
      attempt >= 3 ||
      (result.error.code &&
        !["40001", "57014", "XX000"].includes(result.error.code) &&
        (result.status || 0) < 500)
    )
      return result;
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
  }
}

async function extractText(
  book: TextbookCatalog["books"][number],
): Promise<ExtractedBook> {
  const cache = path.join(directory, `${book.id}.json`);
  let saved: (ExtractedBook & { outlineResolved?: boolean }) | undefined;
  try {
    saved = JSON.parse(await readFile(cache, "utf8"));
  } catch {}
  if (saved?.sha256 === book.sha256 && saved.outlineResolved) return saved;
  if (!book.localPath || !book.sha256)
    throw new Error(`Download and verify ${book.id} first.`);
  const bytes = await readFile(path.join("public", book.localPath));
  if (createHash("sha256").update(bytes).digest("hex") !== book.sha256)
    throw new Error(`Source checksum mismatch: ${book.id}`);
  const task = getDocument({
    data: new Uint8Array(bytes),
    verbosity: 0,
    useSystemFonts: true,
  });
  try {
    const document = await task.promise;
    async function resolve(
      items: Awaited<ReturnType<typeof document.getOutline>>,
    ): Promise<ExtractedBook["outline"]> {
      return Promise.all(
        (items || []).map(async (item) => {
          const dest =
            typeof item.dest === "string"
              ? await document.getDestination(item.dest)
              : item.dest;
          let page: number | undefined;
          try {
            if (dest)
              page =
                typeof dest[0] === "number"
                  ? dest[0] + 1
                  : (await document.getPageIndex(dest[0])) + 1;
          } catch {}
          return {
            title: item.title,
            page,
            items: (await resolve(item.items)) || [],
          };
        }),
      );
    }
    const pages = saved?.sha256 === book.sha256 ? saved.pages : [];
    if (!pages.length)
      for (let number = 1; number <= document.numPages; number++) {
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
        pages.push({ page: number, text });
        page.cleanup();
      }
    const result = {
      id: book.id,
      sha256: book.sha256,
      pages,
      outline: await resolve(await document.getOutline()),
      outlineResolved: true,
    };
    await writeFile(cache, JSON.stringify(result));
    return result;
  } finally {
    await task.destroy();
  }
}

async function main() {
  await mkdir(directory, { recursive: true });
  const reports: TextbookMcqCoverage[] = [];
  let completed: TextbookMcqCoverage[] = [];
  if (!dryRun && process.argv.includes("--resume")) {
    try {
      const previous = JSON.parse(
        await readFile(".local/textbook-mcq-import-report.json", "utf8"),
      );
      if (!previous.dryRun) completed = previous.books || [];
    } catch {}
  }
  const client = dryRun ? null : requireSupabase();
  for (const [index, book] of catalog.books.entries()) {
    const previous = completed.find(
      (item) => item.bookId === book.id && item.sourceSha256 === book.sha256,
    );
    if (previous) {
      reports.push(previous);
      console.log(
        `${book.title} (${book.sourceMedium}): previous completed import retained.`,
      );
      continue;
    }
    const extracted = await extractText(book);
    const { candidates, chapters } = extractBookMcqs(book, extracted);
    const subjectId = `tb-${book.id}`;
    const subject: Subject = {
      id: subjectId,
      streamId: "Common",
      name: `${book.title} (${book.sourceMedium})`,
      code: book.subject.slice(0, 16).toUpperCase(),
      icon: "BookOpen",
      description: `Official textbook one-mark practice. ${book.sourceMedium} medium.`,
      orderIndex: 100 + index,
      totalChapters: chapters.length,
    };
    const curriculum: { kind: string; id: string; data: Subject | Chapter }[] =
      [
        { kind: "subject", id: subject.id, data: subject },
        ...chapters.map((chapter) => ({
          kind: "chapter",
          id: chapter.id,
          data: {
            id: chapter.id,
            subjectId,
            bookId: book.id,
            chapterNumber: chapter.number,
            title: chapter.title,
            titleTamil: book.sourceMedium === "Tamil" ? chapter.title : "",
            description: `Textbook chapter beginning at PDF page ${chapter.page}.`,
            totalNotes: 0,
            totalVideos: 0,
            totalMcqs: chapter.published,
            isActive: true,
            orderIndex: chapter.number,
          } as Chapter,
        })),
      ];
    const published = candidates
      .filter(
        (candidate) =>
          candidate.status === "Published" && candidate.correctAnswer,
      )
      .map((candidate) => {
        const data: Question = {
          id: candidate.id,
          chapterId: candidate.chapterId,
          subjectId,
          questionText: candidate.questionText,
          questionTextTamil:
            book.sourceMedium === "Tamil" ? candidate.questionText : "",
          optionA: candidate.options[0],
          optionB: candidate.options[1],
          optionC: candidate.options[2] || "",
          optionD: candidate.options[3] || "",
          correctAnswer: candidate.correctAnswer!,
          explanation: `Printed textbook answer key: PDF page ${candidate.keyPage}, question ${candidate.number}.`,
          explanationTamil: "",
          difficulty: "Medium",
          sourceType: "Book-In",
          status: "Published",
          stream: "Common",
          createdAt: new Date().toISOString(),
          sourceTextbookId: book.id,
          sourcePage: candidate.page,
          sourceQuestionNumber: candidate.number,
          language: book.sourceMedium,
          answerVerification: "Textbook Answer Key",
        };
        return { id: data.id, data };
      });
    const report: TextbookMcqCoverage = {
      bookId: book.id,
      subjectId,
      chapters,
      total: candidates.length,
      published: published.length,
      review: candidates.length - published.length,
      pages: extracted.pages.length,
      sourceSha256: book.sha256!,
      importedAt: new Date().toISOString(),
      notes: candidates.length
        ? []
        : [
            "No reliably structured multiple-choice exercises were detected. Review this book's original exercise pages before adding questions.",
          ],
    };
    if (client) {
      async function save(table: string, rows: Record<string, unknown>[]) {
        for (let start = 0; start < rows.length; start += 100) {
          const { error } = await retry(() =>
            client!.from(table).upsert(rows.slice(start, start + 100)),
          );
          if (error)
            throw new Error(
              `Could not import ${book.id} into ${table}: ${error.code || "request failed"}`,
            );
        }
      }
      // Preserve every teacher-reviewed record and its published correction on
      // repeated imports. Source IDs contain the textbook hash.
      const reviewed = new Set<string>();
      for (let offset = 0; ; offset += 1000) {
        const { data: existing, error } = await retry(() =>
          client
            .from("textbook_mcq_candidates")
            .select("id,data")
            .eq("book_id", book.id)
            .order("id")
            .range(offset, offset + 999),
        );
        if (error)
          throw new Error("Apply the textbook MCQ migration before importing.");
        for (const row of existing || [])
          if (row.data.reviewedAt) reviewed.add(row.id);
        if (!existing || existing.length < 1000) break;
      }
      await save("avs_curriculum", curriculum);
      await save(
        "textbook_mcq_candidates",
        candidates
          .filter((candidate) => !reviewed.has(candidate.id))
          .map((candidate) => ({
            id: candidate.id,
            book_id: book.id,
            data: candidate,
          })),
      );
      // Existing published questions may have been moderated in the admin panel.
      // Never overwrite them or restore a question that an admin unpublished.
      for (let start = 0; start < published.length; start += 50) {
        const { error } = await retry(() =>
          client.from("avs_questions").upsert(
            published
              .slice(start, start + 50)
              .filter((question) => !reviewed.has(question.id)),
            { onConflict: "id", ignoreDuplicates: true },
          ),
        );
        if (error)
          throw new Error(
            `Could not save verified questions for ${book.id}: ${error.code}`,
          );
      }
      await save("textbook_mcq_imports", [{ book_id: book.id, data: report }]);
    }
    reports.push(report);
    await writeFile(
      ".local/textbook-mcq-import-report.json",
      JSON.stringify(
        { dryRun, books: reports, checkedAt: new Date().toISOString() },
        null,
        2,
      ),
    );
    console.log(
      `${book.title} (${book.sourceMedium}): ${candidates.length} extracted; ${published.length} with verified keys; ${report.review} for review.`,
    );
  }
  console.log(
    JSON.stringify({
      books: reports.length,
      chapters: reports.reduce(
        (sum, report) => sum + report.chapters.length,
        0,
      ),
      total: reports.reduce((sum, report) => sum + report.total, 0),
      published: reports.reduce((sum, report) => sum + report.published, 0),
      review: reports.reduce((sum, report) => sum + report.review, 0),
      dryRun,
    }),
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
