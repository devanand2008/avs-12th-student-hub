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
  (r) => r.status !== "retired" && r.status !== "unavailable",
);
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
