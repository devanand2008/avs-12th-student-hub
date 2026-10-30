import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { learningModels } from "../src/lib/models";
import { advancedModels } from "../src/lib/advanced-models";
import { modelChapters } from "../src/lib/model-curriculum";
import catalog from "../src/lib/textbooks-catalog.json";

const output = path.resolve("docs/advanced-learning-lab-coverage.json");
const errors: string[] = [];
const seen = new Set<string>();
for (const model of learningModels) {
  if (seen.has(model.id)) errors.push(`Duplicate model ${model.id}`);
  seen.add(model.id);
  if (!model.parts.length) errors.push(`Missing accessible parts ${model.id}`);
}
const checked = advancedModels.map((m) => {
  const book = catalog.books.find((b) => b.id === m.bookId);
  if (
    !book ||
    book.subject !== m.subject ||
    m.pdfPage < 1 ||
    m.pdfPage > (book.pages || 0)
  )
    errors.push(`Invalid source ${m.id}`);
  const file = path.resolve(`.local/textbook-text/${m.bookId}.json`);
  const source = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, "utf8"))
    : null;
  const page = source?.pages.find(
    (p: { page: number }) => p.page === m.pdfPage,
  );
  if (!page?.text) errors.push(`Missing source-page evidence ${m.id}`);
  if (source?.sha256 !== book?.sha256)
    errors.push(`Source cache fingerprint mismatch ${m.id}`);
  if (m.check.answer < 0 || m.check.answer >= m.check.options.length)
    errors.push(`Invalid local concept answer ${m.id}`);
  return {
    id: m.id,
    title: m.title,
    subjectId: `tb-${m.bookId}`,
    subject: m.subject,
    medium: book?.sourceMedium,
    volume: book?.volume,
    bookId: m.bookId,
    chapter: m.chapterNumber,
    chapterTitle: m.chapter,
    concept: m.objective,
    type: m.kind,
    status: "implemented",
    interactions: m.controls,
    validation: m.validation,
    limitations: m.limitations,
    pdfPage: m.pdfPage,
    printedPage: m.printedPage,
    sourceFile: book?.sourceFile,
    sourceSha256: book?.sha256,
    pageTextSha256: page
      ? createHash("sha256").update(page.text).digest("hex")
      : null,
    scienceReference: m.sourceUrl || "Local textbook source page",
    externalAssets: [],
    testStatus:
      "See execution receipts in report; registry audit is not a browser test",
  };
});
const inventory = JSON.parse(
  fs.readFileSync("docs/portal-coverage.json", "utf8"),
);
// The chapter inventory is provisional; do not upgrade parser detections to verified titles.
const sourceInventory = JSON.parse(
  fs.readFileSync("src/lib/ai-study-chapters.json", "utf8"),
) as { subjectId: string; number: string; title: string }[];
const books = catalog.books.map((book) => ({
  bookId: book.id,
  subject: book.subject,
  medium: book.sourceMedium,
  volume: book.volume,
  sourceAvailable: fs.existsSync(
    path.resolve("public", (book.localPath || "").replace(/^\//, "")),
  ),
  pages: book.pages,
  detectedChapters: sourceInventory
    .filter((c) => c.subjectId === `tb-${book.id}`)
    .map((c) => ({
      chapter: Number(c.number),
      inventoryTitle: c.title,
      titleStatus:
        "Provisional registry title; not source-certified by this model audit",
      modelIds: modelChapters
        .filter((m) => m.bookId === book.id && m.chapter === Number(c.number))
        .map((m) => m.modelId),
      coverage: "Partial concept context only; chapter completeness unverified",
    })),
  mappedModels: modelChapters
    .filter((m) => m.bookId === book.id)
    .map((m) => m.modelId),
  status: "Full chapter coverage not claimed",
}));
const report = {
  auditedAt: new Date().toISOString(),
  implemented: learningModels.length,
  threeDimensional: learningModels.filter(
    (m) =>
      !advancedModels.find((a) => a.id === m.id) ||
      advancedModels.find((a) => a.id === m.id)?.kind === "3d",
  ).length,
  newLessons: advancedModels.length,
  animatedNewConcepts: advancedModels.filter(
    (m) => m.stages.length || m.kind === "algorithm",
  ).length,
  books: catalog.books.length,
  subjects: new Set(catalog.books.map((b) => b.subject)).size,
  availablePdfs: books.filter((b) => b.sourceAvailable).length,
  detectedChapterEntries: sourceInventory.length,
  previousInventoryKeys: Object.keys(inventory),
  models: checked,
  legacyModels: learningModels
    .filter((m) => !advancedModels.some((a) => a.id === m.id))
    .map((m) => ({
      id: m.id,
      context: modelChapters.filter((c) => c.modelId === m.id),
      status: modelChapters.some((c) => c.modelId === m.id)
        ? "Existing source context retained; not re-certified in this audit"
        : "General concept; chapter mapping unverified",
    })),
  textbooks: books,
  errors,
};
fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
const escape = (s: unknown) => `"${String(s ?? "").replaceAll('"', '""')}"`;
fs.writeFileSync(
  "docs/advanced-learning-lab-coverage.csv",
  [
    "Subject,Medium,Volume,Chapter,Verified title,Concept,Model,Type,Interactions,Status,PDF page,Printed page,Limitations",
    ...checked.map((m) =>
      [
        m.subject,
        m.medium,
        m.volume,
        m.chapter,
        m.chapterTitle,
        m.concept,
        m.id,
        m.type,
        m.interactions.join("; "),
        m.validation,
        m.pdfPage,
        m.printedPage,
        m.limitations,
      ]
        .map(escape)
        .join(","),
    ),
  ].join("\n") + "\n",
);
console.log(
  JSON.stringify(
    {
      implemented: report.implemented,
      newLessons: report.newLessons,
      threeDimensional: report.threeDimensional,
      animatedNewConcepts: report.animatedNewConcepts,
      books: report.books,
      availablePdfs: report.availablePdfs,
      subjects: report.subjects,
      detectedChapterEntries: report.detectedChapterEntries,
      errors,
    },
    null,
    2,
  ),
);
if (errors.length) process.exitCode = 1;
