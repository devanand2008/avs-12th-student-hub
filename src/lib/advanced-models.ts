// Source-page references describe checked contexts, not complete chapter coverage.
export interface LabLesson {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  chapterId: string;
  color: string;
  tag: string;
  description: string;
  parts: { id: string; name: string; color: string; description: string }[];
  kind: "3d" | "process" | "graph" | "algorithm";
  bookId: string;
  chapterNumber: number;
  pdfPage: number;
  printedPage: number;
  objective: string;
  limitations: string;
  stages: string[];
  controls: string[];
  check: {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  };
  validation: "Source-checked simplified illustration";
  sourceUrl?: string;
}
const zoo = "12-bio-zoology-english-7e848813";
const bot = "12-bio-botany-english-f15d4524";
const phy = "12-physics-english-v1-1b1de8f8";
const chem = "12-chemistry-english-v1-2d0e27cb";
const cs = "12-computer-science-english-37bdae5b";
const make = (
  v: Omit<LabLesson, "chapterId" | "color" | "tag" | "parts" | "validation"> & {
    parts?: LabLesson["parts"];
  },
): LabLesson => ({
  chapterId: "",
  color: "#2563eb",
  tag:
    v.kind === "3d" ? "Selectable 3D structure" : "Guided interactive lesson",
  validation: "Source-checked simplified illustration",
  parts: [
    {
      id: "concept",
      name: "Learning objective",
      color: "#2563eb",
      description: v.objective,
    },
    {
      id: "limits",
      name: "Known simplifications",
      color: "#b45309",
      description: v.limitations,
    },
  ],
  ...v,
});
export const advancedModels: LabLesson[] = [
  make({
    id: "ovum",
    title: "Human ovum · protective layers",
    subject: "Bio-Zoology",
    chapter: "Human Reproduction",
    bookId: zoo,
    chapterNumber: 2,
    pdfPage: 26,
    printedPage: 18,
    kind: "3d",
    description:
      "A cutaway of the textbook's human egg illustration: select the cell, zona pellucida and surrounding corona radiata.",
    objective:
      "Distinguish the egg cell from its extracellular coat and surrounding follicular cells.",
    limitations:
      "Schematic cutaway, not to scale; meiotic stage, polar body and cytoplasmic detail are omitted. No diagnostic use.",
    stages: [],
    controls: ["rotate", "zoom", "select", "hide selected", "explode", "reset"],
    parts: [
      {
        id: "egg",
        name: "Egg cell",
        color: "#fbbf24",
        description:
          "The plasma membrane encloses the egg cytoplasm. The internal sphere marks genetic material schematically, not a precisely staged nucleus.",
      },
      {
        id: "zona",
        name: "Zona pellucida",
        color: "#a78bfa",
        description:
          "An extracellular glycoprotein coat surrounds the egg cell.",
      },
      {
        id: "corona",
        name: "Corona radiata",
        color: "#fb7185",
        description:
          "Surrounding follicular cells form the corona radiata; these are separate cells, not part of the egg cytoplasm.",
      },
    ],
    check: {
      question: "Which structure is an extracellular coat?",
      options: ["Zona pellucida", "Egg cytoplasm", "Genetic material"],
      answer: 0,
      explanation:
        "The zona pellucida surrounds the egg outside its plasma membrane.",
    },
  }),
  make({
    id: "nacl",
    title: "Sodium chloride · ionic lattice",
    subject: "Chemistry",
    chapter: "Solid State",
    bookId: chem,
    chapterNumber: 6,
    pdfPage: 202,
    printedPage: 192,
    kind: "3d",
    description:
      "A finite alternating-ion fragment of the rock-salt structure. Inspect six opposite-charge nearest neighbours around an interior ion.",
    objective:
      "Recognise an extended ionic lattice rather than a discrete NaCl molecule.",
    limitations:
      "Finite fragment; edge ions have missing neighbours. Ion sizes and spacing are schematic. Rods indicate neighbour connections, not individual covalent bonds.",
    stages: [],
    controls: ["rotate", "zoom", "select", "hide selected", "explode", "reset"],
    sourceUrl:
      "https://openstax.org/books/chemistry-2e/pages/10-6-lattice-structures-in-crystalline-solids",
    parts: [
      {
        id: "sodium",
        name: "Na⁺ ions",
        color: "#a78bfa",
        description:
          "Sodium cations alternate with chloride anions; an interior cation has six nearest chloride neighbours.",
      },
      {
        id: "chloride",
        name: "Cl⁻ ions",
        color: "#34d399",
        description:
          "Chloride anions occupy the complementary positions. The extended crystal has a 1:1 ratio of Na⁺ to Cl⁻.",
      },
      {
        id: "neighbours",
        name: "Nearest-neighbour guides",
        color: "#94a3b8",
        description:
          "Guide rods show the six axial nearest neighbours of the central ion, not molecular sticks.",
      },
    ],
    check: {
      question:
        "How many nearest opposite-charge neighbours surround an interior Na⁺ ion?",
      options: ["Four", "Six", "Eight"],
      answer: 1,
      explanation: "Rock-salt coordination is six for both ion species.",
    },
  }),
  make({
    id: "octahedral",
    title: "Octahedral coordination geometry",
    subject: "Chemistry",
    chapter: "Coordination Chemistry",
    bookId: chem,
    chapterNumber: 5,
    pdfPage: 143,
    printedPage: 133,
    kind: "3d",
    description:
      "Six donor positions surround a central metal along three perpendicular axes. Select axial or equatorial positions.",
    objective: "Identify coordination number six and ideal 90°/180° angles.",
    limitations:
      "Generic monodentate donor positions, not a named compound, electron density or orbital simulation. Ligand atoms beyond the donor site are omitted.",
    stages: [],
    controls: ["rotate", "zoom", "select", "hide selected", "explode", "reset"],
    parts: [
      {
        id: "metal",
        name: "Central metal",
        color: "#2563eb",
        description:
          "The centre represents a metal atom or ion; no element or oxidation state is assigned.",
      },
      {
        id: "axial",
        name: "Two axial donor sites",
        color: "#fbbf24",
        description:
          "The two opposite axial sites form a 180° angle through the centre.",
      },
      {
        id: "equatorial",
        name: "Four equatorial donor sites",
        color: "#34d399",
        description:
          "Four sites form a square plane; adjacent donor–metal–donor angles are 90°. All six positions are equivalent in an ideal octahedron.",
      },
    ],
    check: {
      question: "What is the coordination number shown?",
      options: ["Two", "Four", "Six"],
      answer: 2,
      explanation: "Six donor sites connect directly to the centre.",
    },
  }),
  make({
    id: "replication",
    title: "DNA replication · old and new strands",
    subject: "Bio-Zoology",
    chapter: "Molecular Genetics",
    bookId: zoo,
    chapterNumber: 5,
    pdfPage: 74,
    printedPage: 66,
    kind: "process",
    description:
      "Follow parental strands separating and complementary daughter strands forming.",
    objective:
      "Explain semiconservative replication through the strand colours.",
    limitations:
      "A stage diagram: omits enzymes, primers, strand polarity and leading/lagging-strand chemistry; no nucleotide-rate simulation.",
    stages: [
      "Parent DNA has two old strands.",
      "The parental strands separate; each becomes a template.",
      "Complementary new strands form against each template.",
      "Each daughter duplex contains one old strand and one new strand.",
    ],
    controls: [
      "play",
      "pause",
      "speed",
      "previous stage",
      "next stage",
      "reset",
    ],
    sourceUrl:
      "https://openstax.org/books/biology-2e/pages/14-3-basics-of-dna-replication",
    check: {
      question: "Each daughter duplex contains…",
      options: [
        "Two old strands",
        "One old and one new strand",
        "Two new strands only",
      ],
      answer: 1,
      explanation:
        "One parental strand is conserved in each daughter DNA duplex.",
    },
  }),
  make({
    id: "transcription",
    title: "DNA template to RNA",
    subject: "Bio-Zoology",
    chapter: "Molecular Genetics",
    bookId: zoo,
    chapterNumber: 5,
    pdfPage: 77,
    printedPage: 69,
    kind: "process",
    description:
      "Step through complementary RNA production from a short illustrative DNA template.",
    objective:
      "Read a 3′→5′ DNA template and build the complementary 5′→3′ RNA.",
    limitations:
      "Invented illustrative sequence, not a textbook question or complete gene. Promoters, enzymes, processing and translation are omitted.",
    stages: [
      "Read template DNA 3′–TACGGA–5′.",
      "RNA synthesis begins: 5′–AUG–3′ is complementary to TAC.",
      "Continue synthesis: 5′–AUGCCU–3′.",
      "The RNA is complementary to the template; RNA uses U instead of T.",
    ],
    controls: [
      "play",
      "pause",
      "speed",
      "previous stage",
      "next stage",
      "reset",
    ],
    check: {
      question: "Which RNA base pairs with template DNA A?",
      options: ["T", "U", "C"],
      answer: 1,
      explanation: "RNA uses uracil (U) opposite template adenine.",
    },
  }),
  make({
    id: "mendel",
    title: "Monohybrid cross · Tt × Tt",
    subject: "Bio-Botany",
    chapter: "Classical Genetics",
    bookId: bot,
    chapterNumber: 2,
    pdfPage: 42,
    printedPage: 36,
    kind: "process",
    description:
      "Combine segregating T and t alleles in a Punnett square and inspect each possible genotype.",
    objective:
      "Separate expected genotype ratio 1:2:1 from dominant phenotype ratio 3:1.",
    limitations:
      "One locus, equal gamete probabilities, complete dominance and random fertilisation. Expected probabilities do not guarantee a small family's exact counts.",
    stages: [
      "Both parents are Tt; each produces T or t gametes with probability 1/2.",
      "Combine one gamete from each parent in each square.",
      "Genotypes: 1/4 TT, 1/2 Tt, 1/4 tt.",
      "With complete dominance, dominant phenotype probability is 3/4.",
    ],
    controls: [
      "play",
      "pause",
      "speed",
      "previous stage",
      "next stage",
      "select genotype",
      "reset",
    ],
    check: {
      question: "Expected probability of tt in Tt × Tt?",
      options: ["1/4", "1/2", "3/4"],
      answer: 0,
      explanation:
        "The t gamete from each parent has probability 1/2; (1/2)(1/2)=1/4.",
    },
  }),
  make({
    id: "pollination",
    title: "Pollination to fertilisation",
    subject: "Bio-Botany",
    chapter: "Asexual and Sexual Reproduction in Plants",
    bookId: bot,
    chapterNumber: 1,
    pdfPage: 19,
    printedPage: 13,
    kind: "process",
    description:
      "Follow pollen transfer to a stigma and a schematic pollen tube towards an ovule.",
    objective: "Distinguish pollen transfer from the later fusion of gametes.",
    limitations:
      "Generic angiosperm diagram; not to scale. Double fertilisation, embryo-sac detail and compatibility mechanisms are omitted.",
    stages: [
      "Pollen is carried from the anther.",
      "Pollination deposits pollen on a compatible stigma.",
      "A pollen tube grows through the style towards an ovule.",
      "Male gametes are delivered; fertilisation is a later event than pollination.",
    ],
    controls: [
      "play",
      "pause",
      "speed",
      "previous stage",
      "next stage",
      "reset",
    ],
    check: {
      question: "Pollination is…",
      options: [
        "Pollen transfer to stigma",
        "Fusion of gametes",
        "Seed germination",
      ],
      answer: 0,
      explanation:
        "In angiosperms pollen is deposited on a stigma; fertilisation happens later.",
    },
  }),
  make({
    id: "ecosystem",
    title: "Energy through trophic levels",
    subject: "Bio-Botany",
    chapter: "Ecosystem",
    bookId: bot,
    chapterNumber: 7,
    pdfPage: 144,
    printedPage: 138,
    kind: "graph",
    description:
      "Explore a four-level energy pyramid with an adjustable illustrative transfer efficiency.",
    objective:
      "Calculate diminishing energy available to successive trophic levels.",
    limitations:
      "Fixed efficiency is an illustrative assumption, not a universal constant. Excludes decomposer pathways; energy is dissipated and is not recycled like matter.",
    stages: [],
    controls: ["transfer efficiency", "reset"],
    check: {
      question:
        "At 10% efficiency, 1000 kJ at producers gives primary consumers…",
      options: ["100 kJ", "900 kJ", "1000 kJ"],
      answer: 0,
      explanation:
        "1000 × 0.10 = 100 kJ; the remaining energy is not passed to that next level.",
    },
  }),
  make({
    id: "ac-wave",
    title: "Alternating voltage · frequency and peak",
    subject: "Physics",
    chapter: "Electromagnetic Induction and Alternating Current",
    bookId: phy,
    chapterNumber: 4,
    pdfPage: 241,
    printedPage: 233,
    kind: "graph",
    description:
      "Adjust peak voltage and frequency in v(t)=V₀ sin(2πft). Inspect a two-second time window.",
    objective:
      "Relate frequency to period and distinguish peak from RMS voltage.",
    limitations:
      "Ideal sinusoidal voltage, no load, phase shift or transient. Time is a plotted mathematical parameter; this is not a wave-speed model.",
    stages: [
      "At t=0 the voltage is zero.",
      "At T/4 the voltage is +V₀.",
      "At T/2 it crosses zero.",
      "At 3T/4 it is −V₀; after T the cycle repeats.",
    ],
    controls: [
      "peak voltage",
      "frequency",
      "play",
      "pause",
      "speed",
      "previous stage",
      "next stage",
      "reset",
    ],
    check: {
      question: "If frequency doubles, period…",
      options: ["Doubles", "Halves", "Stays fixed"],
      answer: 1,
      explanation: "T=1/f, so twice the frequency gives half the period.",
    },
  }),
  make({
    id: "thin-lens",
    title: "Converging lens · object and image",
    subject: "Physics",
    chapter: "Ray Optics",
    bookId: "12-physics-english-v2-0ce6704c",
    chapterNumber: 6,
    pdfPage: 38,
    printedPage: 30,
    kind: "graph",
    description:
      "Move an object outside the focal point of an ideal converging lens. Compare two principal rays and the real inverted image.",
    objective:
      "Use 1/f=1/dₒ+1/dᵢ with positive distance magnitudes for this real-image setup.",
    limitations:
      "Paraxial thin lens; object distance restricted to 1.5f–4f. No virtual-image case, diffraction or aberration. Diagram coordinates are scaled, not real centimetres on screen.",
    stages: [],
    controls: ["object distance", "reset"],
    sourceUrl:
      "https://openstax.org/books/university-physics-volume-3/pages/2-4-thin-lenses",
    check: {
      question: "For dₒ=2f, the real image forms at…",
      options: ["f", "2f", "Infinity"],
      answer: 1,
      explanation: "The thin-lens equation gives dᵢ=2f and magnification −1.",
    },
  }),
  make({
    id: "ohm",
    title: "Ohmic circuit · V, I and R",
    subject: "Physics",
    chapter: "Current Electricity",
    bookId: phy,
    chapterNumber: 2,
    pdfPage: 95,
    printedPage: 87,
    kind: "graph",
    description:
      "Change an ideal source voltage and a fixed-temperature resistor; inspect current and dissipated power.",
    objective: "Verify I=V/R and P=VI, with units.",
    limitations:
      "Ideal DC source, one ohmic resistor at constant temperature; wire resistance, heating feedback and non-ohmic devices omitted.",
    stages: [],
    controls: ["voltage", "resistance", "reset"],
    check: {
      question: "12 V across 6 Ω produces…",
      options: ["2 A", "72 A", "0.5 A"],
      answer: 0,
      explanation: "I=12/6=2 A.",
    },
  }),
  make({
    id: "derivative",
    title: "Curve and tangent · y = x²",
    subject: "Mathematics",
    chapter: "Applications of Differential Calculus",
    bookId: "12-mathematics-english-v2-d4925ec0",
    chapterNumber: 7,
    pdfPage: 16,
    printedPage: 12,
    kind: "graph",
    description:
      "Move a point on y=x² and compare the tangent slope 2a with a nearby secant slope.",
    objective: "Observe [f(a+h)−f(a)]/h approaching f′(a)=2a.",
    limitations:
      "A specific polynomial example, not a general symbolic differentiator. Nonzero h is constrained; graph clipping does not change the exact displayed calculation.",
    stages: [],
    controls: ["point a", "secant h", "reset"],
    check: {
      question: "For y=x² at x=2, tangent slope is…",
      options: ["2", "4", "8"],
      answer: 1,
      explanation: "f′(x)=2x, so f′(2)=4.",
    },
  }),
  make({
    id: "binary-search",
    title: "Binary search · comparison trace",
    subject: "Computer Science",
    chapter: "Algorithmic Strategies",
    bookId: cs,
    chapterNumber: 4,
    pdfPage: 43,
    printedPage: 37,
    kind: "algorithm",
    description:
      "Search a sorted numeric list. Each displayed step records the actual bounds, midpoint and comparison.",
    objective:
      "Explain why a comparison discards half the remaining sorted search interval.",
    limitations:
      "Ascending numeric arrays of at most 12 integers. Input is visibly sorted before searching; zero-based indices. Not a tree traversal.",
    stages: [],
    controls: [
      "input array",
      "target",
      "apply input",
      "play",
      "pause",
      "speed",
      "previous stage",
      "next stage",
      "select element",
      "reset",
    ],
    check: {
      question: "Binary search requires…",
      options: ["Sorted input", "Random ordering", "Only positive numbers"],
      answer: 0,
      explanation:
        "The ordering allows a comparison to exclude an entire interval.",
    },
  }),
  make({
    id: "insertion-sort",
    title: "Insertion sort · shifting and insertion",
    subject: "Computer Science",
    chapter: "Algorithmic Strategies",
    bookId: cs,
    chapterNumber: 4,
    pdfPage: 47,
    printedPage: 41,
    kind: "algorithm",
    description:
      "Trace each comparison, shift and insertion into the sorted prefix of a numeric array.",
    objective:
      "Explain how insertion sort grows its sorted prefix one key at a time.",
    limitations:
      "At most 12 integers; a separate key card preserves the value while shifts temporarily duplicate array entries. No benchmark or general complexity proof.",
    stages: [],
    controls: [
      "input array",
      "apply input",
      "play",
      "pause",
      "speed",
      "previous stage",
      "next stage",
      "select element",
      "reset",
    ],
    check: {
      question: "Insertion sort places each key into…",
      options: ["Its sorted prefix", "An unrelated tree", "A random location"],
      answer: 0,
      explanation:
        "Larger preceding values shift right and the key is inserted into the gap.",
    },
  }),
  make({
    id: "transformer",
    title: "Ideal transformer · turns and voltage",
    subject: "Basic Electrical Engineering",
    chapter: "Power transmission and distribution",
    bookId: "12-basic-electrical-engineering-english-13c7fc7b",
    chapterNumber: 1,
    pdfPage: 12,
    printedPage: 4,
    kind: "graph",
    description:
      "Compare step-up and step-down action by adjusting the secondary-to-primary turns ratio.",
    objective:
      "Apply Vₛ/Vₚ=Nₛ/Nₚ and distinguish an AC transformer from a DC supply.",
    limitations:
      "Ideal transformer under sinusoidal AC. No losses, saturation, frequency response or live electrical instructions. Drawn turns symbolise windings, not the numerical turn count.",
    stages: [],
    controls: ["turns ratio", "reset"],
    sourceUrl:
      "https://openstax.org/books/university-physics-volume-2/pages/15-6-transformers",
    check: {
      question: "With Nₛ/Nₚ=2 and Vₚ=12 V RMS, ideal Vₛ is…",
      options: ["6 V RMS", "12 V RMS", "24 V RMS"],
      answer: 2,
      explanation: "Vₛ=12×2=24 V RMS.",
    },
  }),
];
export function advancedLesson(id: string) {
  return advancedModels.find((m) => m.id === id);
}
