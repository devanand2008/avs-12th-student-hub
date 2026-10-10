import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import catalogJson from "../src/lib/textbooks-catalog.json";
import type { TextbookCatalog } from "../src/lib/textbooks";
import {
  extractBookMcqs,
  type ExtractedBook,
} from "./lib/textbook-question-parser";
async function main() {
  const books = [];
  for (const book of (catalogJson as TextbookCatalog).books) {
    const extracted = JSON.parse(
      await readFile(`.local/textbook-text/${book.id}.json`, "utf8"),
    ) as ExtractedBook;
    const { candidates, chapters } = extractBookMcqs(book, extracted);
    const published = candidates.filter((q) => q.status === "Published");
    for (const question of published) {
      assert.equal(question.options.length, 4, `${question.id}: four choices`);
      assert.ok(question.correctAnswer, `${question.id}: verified answer`);
      assert.equal(question.section, "Book-back", `${question.id}: exercise`);
      assert.ok(
        question.page > 0 &&
          question.page <= extracted.pages.length &&
          question.keyPage &&
          question.keyPage > 0 &&
          question.keyPage <= extracted.pages.length,
        `${question.id}: original question and key pages`,
      );
      assert.ok(
        chapters.some(
          (chapter) =>
            chapter.id === question.chapterId && chapter.page <= question.page,
        ),
        `${question.id}: source chapter`,
      );
    }
    books.push({
      id: book.id,
      subject: book.subject,
      medium: book.sourceMedium,
      volume: book.volume,
      sourceSha256: book.sha256,
      pages: extracted.pages.length,
      chapters: chapters.map((ch) => ({
        number: ch.number,
        page: ch.page,
        exercisePage: ch.exercisePage,
        verifiedQuestions: ch.published,
      })),
      extractedCandidates: candidates.length,
      verifiedQuestions: published.length,
      originalPageQuestions: published.filter(
        (q) => q.presentation === "Original PDF",
      ).length,
      unkeyedBookBackCandidates: candidates.filter(
        (q) => q.section === "Book-back" && !q.correctAnswer,
      ).length,
      pendingCandidates: candidates.length - published.length,
      answerSource: "Printed original textbook keys only",
    });
  }
  const report = {
    extractionVersion: 2,
    checkedAt: new Date().toISOString(),
    booksAnalysed: books.length,
    verifiedQuestions: books.reduce((n, b) => n + b.verifiedQuestions, 0),
    pendingCandidates: books.reduce((n, b) => n + b.pendingCandidates, 0),
    note: "This extraction audit is not an assertion that every exercise or academic answer is complete. Raw text with unreadable glyphs or formulas is displayed using the original PDF page. Missing or conflicting answers are not invented.",
    books,
  };
  await writeFile(
    "docs/textbook-question-audit.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      books: report.booksAnalysed,
      verified: report.verifiedQuestions,
      pending: report.pendingCandidates,
    }),
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
