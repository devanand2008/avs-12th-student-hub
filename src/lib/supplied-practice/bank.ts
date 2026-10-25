import { readFileSync } from "node:fs";
import path from "node:path";
import { hasUsableSuppliedAnswer } from "./eligibility";
export { hasUsableSuppliedAnswer } from "./eligibility";
import type {
  CollectionSummary,
  SuppliedQuestion,
  SuppliedCollection,
} from "./types";

// Keep this source bank out of the browser bundle and the TypeScript literal
// type graph. Next's route tracing explicitly includes the data file.
const data = JSON.parse(
  readFileSync(
    path.join(process.cwd(), "src/lib/supplied-practice/data.json"),
    "utf8",
  ),
) as { collections: SuppliedCollection[]; questions: SuppliedQuestion[] };
// Imported HTML answers are proposals, not teacher approval receipts. This bank
// is separate from the protected, existing textbook publications.
// The project owner explicitly enabled supplied, unverified practice on
// 2026-10-25. This does not create teacher decisions or verified publications.
export const suppliedQuestions: readonly SuppliedQuestion[] = data.questions;
export function suppliedPracticeQuestions(collectionId: string) {
  return suppliedQuestions.filter(
    (q) => q.collectionId === collectionId && hasUsableSuppliedAnswer(q),
  );
}
export function suppliedCollectionSummaries(): CollectionSummary[] {
  return data.collections.map((collection) => {
    const questions = suppliedQuestions.filter(
      (q) => q.collectionId === collection.id,
    );
    return {
      ...collection,
      ready: 0,
      held: questions.length,
      available: questions.filter(hasUsableSuppliedAnswer).length,
      sectionCounts: collection.sections.map((id) => {
        const section = questions.filter((q) => q.section === id);
        return {
          id,
          title: section[0]?.sectionTitle || id,
          total: section.length,
          ready: 0,
          available: section.filter(hasUsableSuppliedAnswer).length,
        };
      }),
    };
  });
}
export function selectSuppliedPreview(params: URLSearchParams) {
  const collection = params.get("collection");
  const section = params.get("section");
  const search = (params.get("q") || "")
    .trim()
    .toLocaleLowerCase()
    .slice(0, 200);
  const matching = suppliedQuestions.filter(
    (q) =>
      (!collection || q.collectionId === collection) &&
      (!section || section === "all" || q.section === section) &&
      (!search ||
        [
          q.id,
          q.questionEn,
          q.questionTa,
          ...q.optionsEn,
          ...q.optionsTa,
          ...q.sources.map((s) => s.originalId),
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(search)),
  );
  const rawPage = Number(params.get("page") || 1);
  const page = Math.max(
    1,
    Math.min(
      Math.ceil(matching.length / 25) || 1,
      Number.isSafeInteger(rawPage) ? rawPage : 1,
    ),
  );
  return {
    questions: matching.slice((page - 1) * 25, page * 25),
    total: matching.length,
    page,
    pages: Math.ceil(matching.length / 25),
  };
}
