import { readFile, writeFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import catalog from "../src/lib/textbooks-catalog.json";
import type { ExtractedBook } from "./lib/textbook-question-parser";

// Independently re-extract sample original PDF pages rather than accepting
// the saved text cache's provenance fields as proof of matching contents.
async function main() {
  const coverage = JSON.parse(
    await readFile("docs/independent-textbook-coverage.json", "utf8"),
  );
  const checks: {
    bookId: string;
    page: number;
    matched: boolean;
    reason?: string;
  }[] = [];
  for (const book of catalog.books) {
    const measured = coverage.books.find(
      (item: { id: string }) => item.id === book.id,
    );
    const cache = JSON.parse(
      await readFile(`.local/textbook-text/${book.id}.json`, "utf8"),
    ) as ExtractedBook;
    const exercisePages = measured.chapters
      .map((chapter: { exercisePage: number }) => chapter.exercisePage)
      .filter((page: number) => page > 0);
    const samplePages = new Set<number>([
      8,
      measured.actualPages,
      ...exercisePages,
    ]);
    for (const check of measured.legacyPrintedKeyChecks)
      samplePages.add(check.keyPage);
    const bytes = await readFile("public" + book.localPath);
    const task = getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: true,
      verbosity: 0,
    });
    try {
      const document = await task.promise;
      for (const pageNumber of [...samplePages].sort((a, b) => a - b)) {
        const page = await document.getPage(pageNumber);
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
        const matched =
          text === cache.pages.find((item) => item.page === pageNumber)?.text;
        checks.push({
          bookId: book.id,
          page: pageNumber,
          matched,
          ...(!matched
            ? {
                reason:
                  "Saved text differs from a fresh original PDF extraction",
              }
            : {}),
        });
        page.cleanup();
      }
    } finally {
      await task.destroy();
    }
  }
  const summary = {
    checkedAt: new Date().toISOString(),
    books: catalog.books.length,
    pagesChecked: checks.length,
    mismatches: checks.filter((check) => !check.matched).length,
    method:
      "Fresh PDF.js text extraction compared exactly to saved cache for every identified exercise-start page, PDF page 8, final page and retained Electronics answer-key pages. This is a sample text/provenance check, not a visual/academic verification of every page or question.",
  };
  await writeFile(
    "docs/independent-pdf-text-check.json",
    JSON.stringify({ ...summary, checks }, null, 2) + "\n",
  );
  console.log(JSON.stringify(summary));
  if (summary.mismatches) process.exitCode = 1;
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
