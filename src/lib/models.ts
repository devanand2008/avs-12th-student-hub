export const learningModels = [
  {
    id: "dna",
    title: "DNA double helix",
    subject: "Bio-Zoology",
    chapter: "Molecular Genetics",
    chapterId: "zoo-ch-5",
    color: "#2563eb",
    tag: "Genetics",
    description:
      "Explore two strands and complementary base pairs in a simplified DNA model.",
    parts: [
      {
        id: "backbone",
        name: "Sugar–phosphate backbone",
        color: "#60a5fa",
        description:
          "Alternating sugar and phosphate groups form the outside of each DNA strand.",
      },
      {
        id: "at",
        name: "Adenine–thymine pair",
        color: "#fbbf24",
        description:
          "Adenine pairs with thymine. An A–T pair is held together by two hydrogen bonds.",
      },
      {
        id: "gc",
        name: "Guanine–cytosine pair",
        color: "#34d399",
        description:
          "Guanine pairs with cytosine. A G–C pair has three hydrogen bonds.",
      },
    ],
  },
  {
    id: "cell",
    title: "Inside a plant cell",
    subject: "Bio-Botany",
    chapter: "Plant Tissue Culture",
    chapterId: "bot-ch-5",
    color: "#059669",
    tag: "Cell biology",
    description:
      "Look inside a cutaway plant cell and identify its main structures.",
    parts: [
      {
        id: "wall",
        name: "Cell wall",
        color: "#34d399",
        description:
          "The cellulose-rich cell wall supports and protects the cell. A membrane lies just inside it.",
      },
      {
        id: "nucleus",
        name: "Nucleus",
        color: "#a78bfa",
        description:
          "The nucleus contains genetic material and helps control the activities of the cell.",
      },
      {
        id: "vacuole",
        name: "Central vacuole",
        color: "#38bdf8",
        description:
          "The central vacuole stores cell sap and helps maintain turgor pressure.",
      },
      {
        id: "chloroplast",
        name: "Chloroplast",
        color: "#16a34a",
        description:
          "Chloroplasts contain chlorophyll and are the site of photosynthesis.",
      },
    ],
  },
  {
    id: "tree",
    title: "Binary search tree",
    subject: "Computer Science",
    chapter: "Algorithmic Strategies",
    chapterId: "cs-ch-4",
    color: "#7c3aed",
    tag: "Algorithms",
    description:
      "Explore a conceptual search structure. Smaller values branch left; larger values branch right.",
    parts: [
      {
        id: "root",
        name: "Root · 50",
        color: "#60a5fa",
        description:
          "The search starts at the root. Compare your target value with 50 to choose a branch.",
      },
      {
        id: "left",
        name: "Left subtree · 25, 10, 35",
        color: "#34d399",
        description:
          "These values are smaller than the root. Each node follows the same left-smaller, right-larger rule.",
      },
      {
        id: "right",
        name: "Right subtree · 75, 60, 90",
        color: "#a78bfa",
        description:
          "These values are larger than the root. Balanced trees can reduce the number of comparisons.",
      },
    ],
  },
] as const;

export type ModelId = (typeof learningModels)[number]["id"];
