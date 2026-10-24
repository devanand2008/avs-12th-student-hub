import catalog from "./textbooks-catalog.json";
import type { ModelId } from "./models";

export interface ModelChapter {
  modelId: ModelId;
  bookId: string;
  chapter: number;
  title: string;
  pdfPage: number;
  printedPage: number;
}

// Source contexts checked in the locally installed textbook edition. A context
// association does not certify the model as an official exam diagram.
export const modelChapters: ModelChapter[] = [
  {
    modelId: "dna",
    bookId: "12-bio-zoology-english-7e848813",
    chapter: 5,
    title: "Molecular Genetics",
    pdfPage: 70,
    printedPage: 62,
  },
  {
    modelId: "dipole",
    bookId: "12-physics-english-v1-1b1de8f8",
    chapter: 1,
    title: "Electrostatics",
    pdfPage: 28,
    printedPage: 20,
  },
  {
    modelId: "capacitor",
    bookId: "12-physics-english-v1-1b1de8f8",
    chapter: 1,
    title: "Electrostatics",
    pdfPage: 62,
    printedPage: 54,
  },
  {
    modelId: "solenoid",
    bookId: "12-physics-english-v1-1b1de8f8",
    chapter: 3,
    title: "Magnetism and magnetic effects of electric current",
    pdfPage: 172,
    printedPage: 164,
  },
  {
    modelId: "vectors",
    bookId: "12-mathematics-english-v1-e33ceed7",
    chapter: 6,
    title: "Applications of Vector Algebra",
    pdfPage: 230,
    printedPage: 222,
  },
];

export const modelSubjects = [
  ...new Set(catalog.books.map((b) => b.subject)),
].sort();
export function chapterBook(mapping: ModelChapter) {
  return catalog.books.find((b) => b.id === mapping.bookId)!;
}
export function chapterKey(mapping: ModelChapter) {
  return `${mapping.bookId}:ch-${mapping.chapter}`;
}
export const proceduralModelAttribution = {
  creator: "Skill Up project contributors",
  source:
    "Locally authored Three.js procedural geometry; no downloaded model asset",
  licence: "Project source; no separate redistribution licence declared",
  format: "TypeScript procedural geometry (no GLB download)",
};
