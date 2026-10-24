export const learningModels = [
  {
    id: "vectors",
    title: "Vectors in three dimensions",
    subject: "Mathematics",
    chapter: "Applications of Vector Algebra",
    chapterId: "",
    color: "#2563eb",
    tag: "Coordinate components",
    description:
      "A vector from the origin to (2, 2, 1). Compare its direction with the positive x, y and z axes. The arrows illustrate components in a right-handed coordinate system; the camera can change their apparent lengths.",
    parts: [
      {
        id: "x",
        name: "Positive x axis",
        color: "#ef4444",
        description:
          "The red arrow gives the positive x direction. The vector has x component 2.",
      },
      {
        id: "y",
        name: "Positive y axis",
        color: "#22c55e",
        description:
          "The green arrow gives the positive y direction. The vector has y component 2.",
      },
      {
        id: "z",
        name: "Positive z axis",
        color: "#3b82f6",
        description:
          "The blue arrow gives the positive z direction. The vector has z component 1.",
      },
      {
        id: "vector",
        name: "Vector (2, 2, 1)",
        color: "#a855f7",
        description:
          "The purple arrow represents 2i + 2j + k. Its length is √(4 + 4 + 1) = 3 coordinate units.",
      },
    ],
  },
  {
    id: "chromosome",
    title: "Replicated chromosome",
    subject: "Biology",
    chapter: "Genetics",
    chapterId: "",
    color: "#8b5cf6",
    tag: "Cell division",
    description:
      "A condensed replicated chromosome, shown schematically as two sister chromatids joined at a centromeric region. Chromosomes are not always X-shaped.",
    parts: [
      {
        id: "chromatids",
        name: "Sister chromatids",
        color: "#a78bfa",
        description:
          "DNA replication produces two sister chromatids. Each contains a DNA molecule associated with proteins.",
      },
      {
        id: "centromere",
        name: "Centromeric region",
        color: "#fbbf24",
        description:
          "The sister chromatids are joined in this region. Kinetochores assemble here for spindle attachment; those proteins are not drawn.",
      },
    ],
  },
  {
    id: "bacterium",
    title: "Bacterial cell",
    subject: "Biology",
    chapter: "Microbiology",
    chapterId: "",
    color: "#10b981",
    tag: "Prokaryotes",
    description:
      "A schematic rod-shaped bacterial cell with selected structures. Bacterial shapes and envelopes vary; not every bacterium has a flagellum.",
    parts: [
      {
        id: "envelope",
        name: "Cell envelope",
        color: "#34d399",
        description:
          "This simplified boundary combines the membrane and wall. Their separate layers and species-specific differences are not shown.",
      },
      {
        id: "nucleoid",
        name: "Nucleoid",
        color: "#a78bfa",
        description:
          "The nucleoid contains the main bacterial chromosome and is not enclosed by a nuclear membrane.",
      },
      {
        id: "flagellum",
        name: "Flagellum",
        color: "#fbbf24",
        description:
          "Some bacteria use rotating flagella for movement. This illustration shows one external filament.",
      },
    ],
  },
  {
    id: "dipole",
    title: "Electric dipole",
    subject: "Physics",
    chapter: "Electrostatics",
    chapterId: "",
    color: "#2563eb",
    tag: "Equal and opposite charges",
    description:
      "Two equal-magnitude opposite charges separated by a distance. The arrow shows the electric dipole moment from negative to positive; it is not an electric field line.",
    parts: [
      {
        id: "positive",
        name: "Positive charge",
        color: "#fb7185",
        description:
          "The positive charge has magnitude q, equal to the magnitude of the negative charge.",
      },
      {
        id: "negative",
        name: "Negative charge",
        color: "#60a5fa",
        description:
          "The negative charge and positive charge have zero net charge together.",
      },
      {
        id: "moment",
        name: "Dipole moment",
        color: "#fbbf24",
        description:
          "The electric dipole moment points from negative to positive. Its magnitude is charge magnitude multiplied by their separation.",
      },
    ],
  },
  {
    id: "ammonia",
    title: "Ammonia molecule · NH₃",
    subject: "Chemistry",
    chapter: "Molecular geometry",
    chapterId: "",
    color: "#2563eb",
    tag: "Trigonal pyramidal",
    description:
      "Three hydrogen atoms form a trigonal pyramid around nitrogen. The schematic H–N–H angles are approximately 107°. The nitrogen lone pair is omitted.",
    parts: [
      {
        id: "nitrogen",
        name: "Nitrogen atom",
        color: "#2563eb",
        description:
          "Nitrogen has three bonding pairs and one lone pair in the usual electron-pair description of ammonia.",
      },
      {
        id: "hydrogen",
        name: "Three hydrogen atoms",
        color: "#cbd5e1",
        description:
          "The three hydrogen atoms form the base of the trigonal pyramid.",
      },
      {
        id: "bond",
        name: "N–H bonds",
        color: "#60a5fa",
        description:
          "Each stick represents a polar covalent single bond. Sticks are a visual convention, not physical rods.",
      },
    ],
  },
  {
    id: "carbon-dioxide",
    title: "Carbon dioxide · CO₂",
    subject: "Chemistry",
    chapter: "Molecular geometry",
    chapterId: "",
    color: "#475569",
    tag: "Linear geometry",
    description:
      "A linear O=C=O molecule with a 180° bond angle. Paired sticks represent double bonds; atom sizes and distances are schematic.",
    parts: [
      {
        id: "carbon",
        name: "Central carbon",
        color: "#475569",
        description:
          "The central carbon has two regions of bonding electron density, giving a linear molecular geometry.",
      },
      {
        id: "oxygen",
        name: "Two oxygen atoms",
        color: "#f43f5e",
        description:
          "The oxygen atoms occupy opposite ends of this symmetric molecule.",
      },
      {
        id: "bond",
        name: "C=O double bonds",
        color: "#60a5fa",
        description:
          "Each carbon–oxygen double bond contains one sigma and one pi bond. The paired sticks do not depict orbital shapes.",
      },
    ],
  },
  {
    id: "animal-cell",
    title: "Inside an animal cell",
    subject: "Biology",
    chapter: "Cell biology",
    chapterId: "",
    color: "#db2777",
    tag: "Cell structures",
    description:
      "A schematic cutaway showing selected animal-cell structures. Organelles are enlarged for exploration; this is not a complete cell inventory.",
    parts: [
      {
        id: "membrane",
        name: "Cell membrane",
        color: "#f472b6",
        description:
          "The cell membrane forms a selectively permeable boundary between the cell and its surroundings.",
      },
      {
        id: "nucleus",
        name: "Nucleus",
        color: "#a78bfa",
        description:
          "The nucleus contains most of the cell’s DNA, enclosed by a nuclear envelope.",
      },
      {
        id: "mitochondria",
        name: "Mitochondria",
        color: "#fb923c",
        description:
          "Mitochondria carry out major stages of aerobic respiration and produce ATP. The shapes shown omit their internal membranes.",
      },
    ],
  },
  {
    id: "neuron",
    title: "Structure of a neuron",
    subject: "Biology",
    chapter: "Neural coordination",
    chapterId: "",
    color: "#7c3aed",
    tag: "Nervous system",
    description:
      "Explore a schematic neuron from branching dendrites through its cell body to a myelinated axon and terminals.",
    parts: [
      {
        id: "dendrites",
        name: "Dendrites",
        color: "#34d399",
        description:
          "Dendrites receive signals from other cells and conduct changes in membrane potential toward the cell body.",
      },
      {
        id: "soma",
        name: "Cell body",
        color: "#a78bfa",
        description:
          "The cell body contains the nucleus and organelles that maintain the neuron.",
      },
      {
        id: "axon",
        name: "Axon and terminals",
        color: "#fbbf24",
        description:
          "Action potentials travel along the axon. Terminal branches communicate with target cells at synapses.",
      },
      {
        id: "myelin",
        name: "Myelin segments",
        color: "#60a5fa",
        description:
          "Myelin insulates segments of the axon. Gaps between segments are nodes of Ranvier; myelination helps speed conduction.",
      },
    ],
  },
  {
    id: "capacitor",
    title: "Parallel-plate capacitor",
    subject: "Physics",
    chapter: "Electrostatics",
    chapterId: "",
    color: "#2563eb",
    tag: "Electric field",
    description:
      "Two oppositely charged conducting plates with a schematic electric field directed from the positive plate toward the negative plate. Edge effects are omitted.",
    parts: [
      {
        id: "positive",
        name: "Positive plate (+)",
        color: "#fb7185",
        description:
          "This plate carries positive charge. Its paired plate carries an equal magnitude of negative charge in the ideal isolated capacitor.",
      },
      {
        id: "negative",
        name: "Negative plate (−)",
        color: "#60a5fa",
        description:
          "The negatively charged plate is the destination of electric field arrows in the gap.",
      },
      {
        id: "field",
        name: "Electric field arrows",
        color: "#fbbf24",
        description:
          "Away from the edges, the ideal field is approximately uniform. For a vacuum gap, capacitance is C = ε₀A/d. Arrows represent field direction, not moving particles.",
      },
    ],
  },
  {
    id: "solenoid",
    title: "Solenoid coil",
    subject: "Physics",
    chapter: "Magnetism",
    chapterId: "",
    color: "#0891b2",
    tag: "Electromagnetism",
    description:
      "A helical conductor around a common axis. The reference arrow marks the axis only: magnetic-field direction depends on the direction of electric current.",
    parts: [
      {
        id: "coil",
        name: "Conducting turns",
        color: "#fb923c",
        description:
          "Current through successive turns produces magnetic fields that combine. Inside a long, closely wound solenoid, the field is approximately uniform.",
      },
      {
        id: "axis",
        name: "Reference axis",
        color: "#60a5fa",
        description:
          "Use the right-hand grip rule with a specified current direction to determine the axial magnetic field. The blue arrow is a geometric reference, not an assigned north pole.",
      },
    ],
  },
  {
    id: "water",
    title: "Water molecule · H₂O",
    subject: "Chemistry",
    chapter: "Molecular geometry",
    chapterId: "",
    color: "#e11d48",
    tag: "Bent geometry",
    description:
      "A ball-and-stick model of water, with an H–O–H bond angle of approximately 104.5°. Atom sizes and bond lengths are schematic; lone pairs are not drawn.",
    parts: [
      {
        id: "oxygen",
        name: "Oxygen atom",
        color: "#f43f5e",
        description:
          "Oxygen is the central atom. Two bonding pairs and two lone pairs around oxygen give water its bent molecular geometry.",
      },
      {
        id: "hydrogen",
        name: "Two hydrogen atoms",
        color: "#cbd5e1",
        description:
          "Each hydrogen forms a covalent bond with oxygen. The two hydrogen atoms are not arranged in a straight line.",
      },
      {
        id: "bond",
        name: "O–H bonds",
        color: "#60a5fa",
        description:
          "Each stick represents a shared electron pair in a polar covalent O–H bond, not a physical rod.",
      },
    ],
  },
  {
    id: "methane",
    title: "Methane molecule · CH₄",
    subject: "Chemistry",
    chapter: "Molecular geometry",
    chapterId: "",
    color: "#475569",
    tag: "Tetrahedral geometry",
    description:
      "Four hydrogen atoms surround carbon tetrahedrally. Ideal H–C–H bond angles are approximately 109.5°; rotate to see the three-dimensional arrangement.",
    parts: [
      {
        id: "carbon",
        name: "Central carbon",
        color: "#475569",
        description:
          "Carbon forms four equivalent single covalent bonds with hydrogen in methane.",
      },
      {
        id: "hydrogen",
        name: "Four hydrogen atoms",
        color: "#cbd5e1",
        description:
          "The hydrogen atoms occupy the four vertices of a tetrahedron around the central carbon.",
      },
      {
        id: "bond",
        name: "C–H bonds",
        color: "#60a5fa",
        description:
          "Four sticks represent four C–H single bonds. This idealised model shows molecular geometry, not electron orbitals.",
      },
    ],
  },
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
