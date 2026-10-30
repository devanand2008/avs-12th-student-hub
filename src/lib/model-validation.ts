// Scientific support for retained general models does not establish Class 12 chapter alignment.
export const generalModelReferences: Record<
  string,
  { source: string; note: string }
> = {
  "animal-cell": {
    source:
      "https://openstax.org/books/concepts-biology/pages/3-3-eukaryotic-cells",
    note: "Selected eukaryotic organelles only; curriculum mapping remains unverified.",
  },
  cell: {
    source:
      "https://openstax.org/books/concepts-biology/pages/3-3-eukaryotic-cells",
    note: "A generic photosynthetic plant cell; not every plant cell has chloroplasts. The existing tissue-culture label is a topic context, not a checked chapter association.",
  },
  neuron: {
    source:
      "https://openstax.org/books/biology-2e/pages/35-1-neurons-and-glial-cells",
    note: "Myelin is produced by glial cells. This selected schematic is not mapped to a verified Class 12 chapter.",
  },
  water: {
    source:
      "https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity",
    note: "Bent schematic geometry; lone pairs omitted. This is supporting general chemistry, not a verified Class 12 chapter.",
  },
  methane: {
    source:
      "https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity",
    note: "Ideal tetrahedral directions; stick lengths and sphere sizes are schematic. Chapter mapping unverified.",
  },
  ammonia: {
    source:
      "https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity",
    note: "Trigonal-pyramidal schematic; lone pair omitted. Chapter mapping unverified.",
  },
  "carbon-dioxide": {
    source:
      "https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity",
    note: "Linear ball-and-stick depiction, not orbital electron density. Chapter mapping unverified.",
  },
  chromosome: {
    source: "https://openstax.org/books/biology-2e/pages/10-1-cell-division",
    note: "Condensed replicated chromosome, not the appearance throughout a cell cycle. Exact chapter mapping unverified.",
  },
  bacterium: {
    source:
      "https://openstax.org/books/concepts-biology/pages/3-2-comparing-prokaryotic-and-eukaryotic-cells",
    note: "Selected prokaryotic features only; bacterial envelopes and flagella vary. Chapter mapping unverified.",
  },
  tree: {
    source:
      "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/lecture-5-binary-search-trees-bst-sort/",
    note: "Conceptual binary-search structure. A verified source chapter association for this particular tree has not been established.",
  },
};
