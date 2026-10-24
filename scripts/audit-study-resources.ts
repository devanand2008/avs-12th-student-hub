import fs from "node:fs/promises";
import {
  studyResources,
  resourceSubjects,
  resourceCurriculumReferences,
} from "../src/lib/study-resources";
import catalog from "../src/lib/textbooks-catalog.json";
async function main() {
  const counts = (rows: typeof studyResources) => ({
    total: rows.length,
    listed: rows.filter((r) => r.status === "listed").length,
    temporary: rows.filter((r) => r.status === "temporary_unverified").length,
    unavailable: rows.filter((r) => r.availability === "unavailable").length,
    retired: rows.filter((r) => r.status === "retired").length,
  });
  const result = {
    checkedAt: new Date().toISOString(),
    scope:
      "Local validated registry; no production access or automatic curation decisions",
    counts: counts(studyResources),
    categories: ["question-papers", "learning-materials", "video-lessons"].map(
      (category) => ({
        category,
        ...counts(studyResources.filter((r) => r.category === category)),
      }),
    ),
    subjects: resourceSubjects.map((subject) => ({
      subject,
      categories: [
        "question-papers",
        "learning-materials",
        "video-lessons",
      ].map((category) => ({
        category,
        ...counts(
          studyResources.filter(
            (r) => r.subjects.includes(subject) && r.category === category,
          ),
        ),
      })),
      years: [
        ...new Set(
          studyResources
            .filter((r) => r.subjects.includes(subject) && r.year)
            .map((r) => r.year),
        ),
      ],
    })),
    papers: studyResources
      .filter((r) => r.category === "question-papers")
      .map((r) => ({
        id: r.id,
        year: r.year,
        subjects: r.subjects,
        mediums: r.mediums,
        sourceUrl: r.sourceUrl,
        pdfUrl: r.pdfUrl,
        status: r.status,
        markFormats: r.markFormats,
      })),
    textbookInventory: catalog.books.map((book) => ({
      textbookId: book.id,
      subjectId: `tb-${book.id}`,
      subject: book.subject,
      medium: book.medium,
      volume: book.volume,
      edition: book.edition,
      resources: studyResources
        .filter((r) =>
          resourceCurriculumReferences(r).some(
            (ref) => ref.textbookId === book.id,
          ),
        )
        .map((r) => ({
          id: r.id,
          status: r.status,
          category: r.category,
          chapter: r.chapter,
        })),
      limitation:
        "Subject/medium reference, not verified coverage of this volume's chapters or every examination variant.",
    })),
    downloadedNewPdfs: studyResources.filter((r) => r.localAsset).length,
    rights: studyResources.reduce(
      (out, r) => ({ ...out, [r.rights]: (out[r.rights] ?? 0) + 1 }),
      {} as Record<string, number>,
    ),
    limitations: [
      "Combined paper collections are not individual papers; heading-based subject indexing does not verify all paper variants.",
      "Temporary textbook entries retain historical catalogue provenance; fresh source ownership verification remains pending.",
      "YouTube oEmbed support does not prove successful playback in every browser/region.",
      "This audit validates recorded evidence; it does not perform fresh network checks or create teacher decisions.",
    ],
  };
  await fs.writeFile(
    "docs/study-resource-audit.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      counts: result.counts,
      categories: result.categories,
      newPdfCopies: result.downloadedNewPdfs,
    }),
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
