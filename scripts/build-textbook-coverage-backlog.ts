import { readFile, writeFile } from "node:fs/promises";
import type { TextbookMcqCandidate } from "../src/lib/textbook-question-types";

async function main() {
  const report = JSON.parse(
    await readFile("docs/independent-textbook-coverage.json", "utf8"),
  );
  const snapshot = JSON.parse(
    await readFile(".local/independent-live-content.json", "utf8"),
  );
  const candidates = snapshot.tables.textbook_mcq_candidates.map(
    (row: { data: TextbookMcqCandidate }) => row.data,
  ) as TextbookMcqCandidate[];
  const publishedIds = new Set(
    snapshot.tables.avs_questions
      .filter(
        (row: { data: { status: string } }) => row.data.status === "Published",
      )
      .map((row: { id: string }) => row.id),
  );
  const rows = report.books
    .flatMap(
      (book: {
        id: string;
        subject: string;
        medium: string;
        volume: string | null;
        published: number;
        chapters: Record<string, unknown>[];
        damagedQuestionPages: number[];
        failure: string | null;
        unprocessedPages: number;
      }) =>
        book.chapters.map((ch) => {
          const chapterCandidates = candidates.filter(
            (c) => c.chapterId === ch.chapterId,
          );
          const pending = chapterCandidates.filter(
            (c) => !publishedIds.has(c.id) && c.reviewStatus !== "rejected",
          );
          const prepared = pending.filter((c) => c.reviewPreparation);
          const states: string[] = [];
          if (!Number(ch.bookBackCandidates)) states.push("Not processed");
          if (Number(ch.bookBackCandidates)) states.push("Extracted");
          if (
            pending.some(
              (c) =>
                !c.correctAnswer || c.reviewPreparation?.keyCheck !== "matched",
            )
          )
            states.push("Awaiting answer verification");
          if (pending.length) states.push("Awaiting teacher review");
          if (Number(ch.published)) states.push("Published (partial)");
          const needsManual =
            pending.some(
              (c) =>
                c.qualityFlags.length || c.reviewPreparation?.warnings.length,
            ) ||
            !!book.failure ||
            book.unprocessedPages > 0;
          if (needsManual) states.push("Needs manual/OCR attention");
          // Rank zero-ready books first, then zero-ready chapters, with Tamil explicitly prioritised.
          const priority =
            (book.published === 0 ? 0 : Number(ch.published) === 0 ? 2 : 4) +
            (book.medium === "Tamil" ? 0 : 1);
          return {
            priority,
            bookId: book.id,
            subject: book.subject,
            medium: book.medium,
            volume: book.volume || "",
            chapterId: ch.chapterId,
            chapter: Number(ch.chapterNumber),
            published: Number(ch.published),
            bookBackCandidates: Number(ch.bookBackCandidates),
            pending: pending.length,
            prepared: prepared.length,
            rejected: chapterCandidates.filter(
              (c) => c.reviewStatus === "rejected",
            ).length,
            keyMatched: prepared.filter(
              (c) => c.reviewPreparation?.keyCheck === "matched",
            ).length,
            keyUncertain: prepared.filter(
              (c) => c.reviewPreparation?.keyCheck !== "matched",
            ).length,
            exercisePdfPage: ch.exercisePage || "",
            states: states.join("; "),
            nextTask: !Number(ch.bookBackCandidates)
              ? "Locate and inventory the original book-back one-mark section; determine whether MCQs exist before transcription."
              : prepared.length
                ? "Individually compare prepared source/key evidence, repair OCR or notation, and explicitly approve or reject."
                : "Verify the printed options and obtain source-supported or teacher-verified answers before approval.",
            complete: false,
          };
        }),
    )
    .sort(
      (
        a: { priority: number; bookId: string; chapter: number },
        b: { priority: number; bookId: string; chapter: number },
      ) =>
        a.priority - b.priority ||
        a.bookId.localeCompare(b.bookId) ||
        a.chapter - b.chapter,
    );
  const columns = Object.keys(rows[0]);
  const csv = (value: unknown) =>
    '"' + String(value ?? "").replaceAll('"', '""') + '"';
  await writeFile(
    "docs/textbook-coverage-backlog.csv",
    [
      columns.map(csv).join(","),
      ...rows.map((row: Record<string, unknown>) =>
        columns.map((key) => csv(row[key])).join(","),
      ),
    ].join("\n") + "\n",
  );
  const summary = {
    checkedAt: report.checkedAt,
    chapters: rows.length,
    zeroReady: rows.filter((r: { published: number }) => r.published === 0)
      .length,
    states: Object.fromEntries(
      [
        "Not processed",
        "Extracted",
        "Awaiting answer verification",
        "Awaiting teacher review",
        "Published (partial)",
        "Needs manual/OCR attention",
      ].map((state) => [
        state,
        rows.filter((r: { states: string }) =>
          r.states.split("; ").includes(state),
        ).length,
      ]),
    ),
  };
  await writeFile(
    "docs/TEXTBOOK_COVERAGE_BACKLOG.md",
    `# Prioritised textbook coverage backlog\n\nMeasured ${report.checkedAt}. The [chapter CSV](textbook-coverage-backlog.csv) lists every ${rows.length} parser-detected chapter/unit entry, prioritising zero-ready Tamil books, other zero-ready books, and zero-ready chapters. No chapter or book is marked complete. Parser entries still need a teacher-confirmed contents/exercise inventory; indexing a PDF is not question extraction.\n\nStates overlap within a chapter: a few published MCQs can coexist with missing sections, unclear answers and damaged text. Published (partial) refers to actual current published database questions, not extraction eligibility. Not processed means no book-back candidates were identified, even if PDF text was indexed. Some books may not contain structured one-mark MCQs; inspect their original exercises before deciding.\n\n| State | Detected chapters/units |\n|---|---:|\n` +
      Object.entries(summary.states)
        .map(([state, n]) => `| ${state} | ${n} |`)
        .join("\n") +
      `\n\n${summary.zeroReady} detected chapter/unit entries have zero published questions. All 42 Tamil-medium textbooks still have zero published questions; 386 Tamil candidates now have source-review packets.\n\nHighest priority: a teacher should verify the first zero-ready Tamil batch, checking question boundaries, choices, notation and chapter-specific printed key, then approve each question explicitly. Continue [the prepared batches](TEACHER_REVIEW_BATCHES.md), and inventory the remaining missing sections.\n`,
  );
  console.log(JSON.stringify(summary));
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Backlog failed");
  process.exitCode = 1;
});
