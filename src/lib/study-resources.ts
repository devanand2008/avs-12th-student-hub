import manifest from "./study-resources-catalog.json";
import catalog from "./textbooks-catalog.json";
import { validateResourceManifest } from "./study-resource-schema";
export const resourceSubjects = [
  ...new Set(catalog.books.map((b) => b.subject)),
].sort();
export const studyResources = validateResourceManifest(
  manifest,
  resourceSubjects,
).resources;
export const visibleResources = studyResources.filter(
  (r) =>
    r.status !== "retired" &&
    r.status !== "unavailable" &&
    r.availability !== "unavailable",
);
/** Existing import pipeline uses tb-<book ID>; this is a reference, not a new curriculum row. */
export function resourceCurriculumReferences(
  resource: (typeof studyResources)[number],
) {
  const exact = resource.id.startsWith("textbook-reference-")
    ? resource.id.slice("textbook-reference-".length)
    : null;
  return catalog.books
    .filter((b) =>
      exact
        ? b.id === exact
        : resource.subjects.includes(b.subject) &&
          (resource.mediums.includes("Common") ||
            resource.mediums.some((m) => m === b.medium)),
    )
    .map((b) => ({
      subjectId: `tb-${b.id}`,
      textbookId: b.id,
      subject: b.subject,
      medium: b.medium,
      volume: b.volume,
    }));
}
export const resourceCategories = [
  {
    id: "question-papers",
    title: "Previous Year Question Papers",
    description:
      "Explore official examination collections by subject, medium and year.",
    icon: "papers",
  },
  {
    id: "learning-materials",
    title: "Open Learning Materials",
    description:
      "Read textbooks and references with clear source and licence information.",
    icon: "books",
  },
  {
    id: "video-lessons",
    title: "Video Lessons",
    description: "Choose a lesson and watch it inside Skill Up using YouTube.",
    icon: "video",
  },
] as const;
