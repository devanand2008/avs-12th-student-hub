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
    id: "pollen-wall",
    title: "Pollen grain wall cutaway",
    subject: "Bio-Botany",
    bookId: "12-bio-botany-english-f15d4524",
    chapter: "Asexual and Sexual Reproduction in Plants",
    chapterNumber: 1,
    pdfPage: 14,
    printedPage: 8,
    kind: "3d",
    description:
      "Rotate the cutaway to locate the outer exine, inner intine and enclosed cytoplasm.",
    objective:
      "Rotate the cutaway to locate the outer exine, inner intine and enclosed cytoplasm.",
    limitations:
      "The openings are viewing cuts. Surface sculpture, germ pores and cellular contents are omitted. Layer thicknesses are exaggerated.",
    controls: ["rotate", "zoom", "select", "hide selected", "reset"],
    stages: [],
    parts: [
      {
        id: "exine",
        name: "Exine",
        color: "#f59e0b",
        description: "Outer protective wall layer.",
      },
      {
        id: "intine",
        name: "Intine",
        color: "#34d399",
        description: "Thin inner wall beneath the exine.",
      },
      {
        id: "cytoplasm",
        name: "Cytoplasm",
        color: "#a78bfa",
        description: "Living contents enclosed by the pollen wall.",
      },
    ],
    check: {
      question: "Which wall layer lies immediately beneath the exine?",
      options: ["Intine", "Cytoplasm", "Exine"],
      answer: 0,
      explanation: "Thin inner wall beneath the exine.",
    },
  }),
  make({
    id: "ethernet-pinouts",
    title: "Ethernet wiring schemes A and B",
    subject: "Computer Applications",
    bookId: "12-computer-applications-english-627c1490",
    chapter: "Network Cabling",
    chapterNumber: 13,
    pdfPage: 188,
    printedPage: 182,
    kind: "3d",
    description:
      "Compare the eight conductor positions in T568A (upper row) and T568B (lower row). Count pins left to right in the front view.",
    objective:
      "Compare the eight conductor positions in T568A (upper row) and T568B (lower row). Count pins left to right in the front view.",
    limitations:
      "This is a colour-order diagram. White bands represent striped conductors. Connector housings, twists and electrical signals are omitted.",
    controls: ["rotate", "zoom", "select", "hide selected", "reset"],
    stages: [],
    parts: [
      {
        id: "scheme-a",
        name: "T568A row",
        color: "#34d399",
        description:
          "Left to right: white/green, green, white/orange, blue, white/blue, orange, white/brown, brown.",
      },
      {
        id: "scheme-b",
        name: "T568B row",
        color: "#fb923c",
        description:
          "Left to right: white/orange, orange, white/green, blue, white/blue, green, white/brown, brown.",
      },
    ],
    check: {
      question: "Which pairs exchange positions between these two schemes?",
      options: ["Green and orange", "Blue and brown", "Blue and green"],
      answer: 0,
      explanation:
        "The green and orange pairs exchange positions. Blue and brown stay in place.",
    },
  }),
  make({
    id: "serial-parallel",
    title: "Serial and parallel data paths",
    subject: "Computer Applications",
    chapter: "Network Cabling",
    bookId: "12-computer-applications-english-627c1490",
    chapterNumber: 13,
    pdfPage: 185,
    printedPage: 179,
    kind: "3d",
    description:
      "Compare a single serial lane with eight parallel lanes during one transfer interval.",
    objective:
      "Count how many bit positions each interface can carry in the illustrated interval.",
    limitations:
      "This static snapshot counts data lanes only. Markers stand for bit positions, irrespective of their values. Clock, ground and control lines are omitted. Real transfer speeds depend on signalling rates.",
    controls: ["rotate", "zoom", "select", "hide selected", "reset"],
    stages: [],
    parts: [
      {
        id: "serial",
        name: "Serial data lane",
        color: "#38bdf8",
        description:
          "The upper path carries successive bits of the byte in sequence.",
      },
      {
        id: "parallel",
        name: "Eight parallel data lanes",
        color: "#a78bfa",
        description:
          "Each lower path carries a different bit of the same byte in this interval.",
      },
      {
        id: "bits",
        name: "Bits in one interval",
        color: "#fbbf24",
        description:
          "One gold marker sits on the serial lane. Eight markers line up across the parallel lanes at the same instant.",
      },
    ],
    check: {
      question:
        "At one bit per lane per interval, how many intervals carry one byte on the serial path?",
      options: ["One", "Eight", "Sixteen"],
      answer: 1,
      explanation:
        "A byte has eight bits. The single lane carries them one after another.",
    },
  }),
  make({
    id: "anther-section",
    title: "Anther cross-section and pollen sacs",
    subject: "Bio-Botany",
    chapter: "Asexual and Sexual Reproduction in Plants",
    bookId: bot,
    chapterNumber: 1,
    pdfPage: 13,
    printedPage: 7,
    kind: "3d",
    description:
      "Look into a cut section of a typical anther and find the two pollen sacs in each lobe.",
    objective:
      "Locate four pollen sacs around the central connective and distinguish the pollen from the surrounding tissue.",
    limitations:
      "A thickened schematic section shows the four-sac arrangement before opening. Wall layers, vascular detail and individual pollen surface features are omitted. Colours and sizes are illustrative.",
    controls: ["rotate", "zoom", "select", "hide selected", "reset"],
    stages: [],
    parts: [
      {
        id: "wall",
        name: "Pollen sac walls",
        color: "#fb7185",
        description:
          "Each opening is a section through one pollen sac. Count two on each side of the connective.",
      },
      {
        id: "connective",
        name: "Connective tissue",
        color: "#34d399",
        description: "This central tissue joins the two lobes of the anther.",
      },
      {
        id: "pollen",
        name: "Pollen grains",
        color: "#fbbf24",
        description:
          "The gold grains occupy the cavities of the pollen sacs. Hide the grains to inspect the cavities.",
      },
    ],
    check: {
      question:
        "How many pollen sacs does this typical four-sporangiate anther have in each lobe?",
      options: ["One", "Two", "Four"],
      answer: 1,
      explanation: "The four sacs form two pairs, one pair in each lobe.",
    },
  }),
  make({
    id: "simple-cubic",
    title: "Simple cubic unit cell",
    subject: "Chemistry",
    chapter: "Solid State",
    bookId: "12-chemistry-english-v1-2d0e27cb",
    chapterNumber: 6,
    pdfPage: 193,
    printedPage: 183,
    kind: "3d",
    description: "Count eight shared corners to obtain one atom per cell.",
    objective: "Count eight shared corners to obtain one atom per cell.",
    limitations:
      "Reduced sphere radii expose lattice sites. Lines are geometric guides. Neighbouring cells and realistic atomic sizes are omitted. Exploded view changes distances for inspection.",
    stages: [],
    controls: ["rotate", "zoom", "select", "hide selected", "explode", "reset"],
    parts: [
      {
        id: "corners",
        name: "Eight shared corners",
        color: "#34d399",
        description: "Each corner contributes one eighth of an atom.",
      },
      {
        id: "edges",
        name: "Twelve cell edges",
        color: "#34d399",
        description: "The cell repeats along three perpendicular directions.",
      },
    ],
    check: {
      question: "How many atoms contribute to a simple cubic cell?",
      options: ["1", "8", "4"],
      answer: 0,
      explanation: "Count eight shared corners to obtain one atom per cell.",
    },
  }),
  make({
    id: "sc-neighbours",
    title: "Simple cubic nearest neighbours",
    subject: "Chemistry",
    chapter: "Solid State",
    bookId: "12-chemistry-english-v1-2d0e27cb",
    chapterNumber: 6,
    pdfPage: 193,
    printedPage: 183,
    kind: "3d",
    description:
      "Identify six equally distant neighbours along the three coordinate axes.",
    objective:
      "Identify six equally distant neighbours along the three coordinate axes.",
    limitations:
      "Reduced sphere radii expose lattice sites. Lines are geometric guides. Neighbouring cells and realistic atomic sizes are omitted. Exploded view changes distances for inspection.",
    stages: [],
    controls: ["rotate", "zoom", "select", "hide selected", "explode", "reset"],
    parts: [
      {
        id: "centre",
        name: "Reference atom",
        color: "#34d399",
        description: "Choose an atom within the extended simple cubic lattice.",
      },
      {
        id: "neighbours",
        name: "Six nearest neighbours",
        color: "#34d399",
        description:
          "Two neighbours lie along each axis, giving coordination number six.",
      },
      {
        id: "directions",
        name: "Neighbour directions",
        color: "#34d399",
        description: "Lines indicate equal nearest-neighbour distances.",
      },
    ],
    check: {
      question: "What is the simple cubic coordination number?",
      options: ["6", "8", "4"],
      answer: 0,
      explanation:
        "Identify six equally distant neighbours along the three coordinate axes.",
    },
  }),
  make({
    id: "fcc",
    title: "Face-centred cubic · unit cell",
    subject: "Chemistry",
    chapter: "Solid State",
    bookId: chem,
    chapterNumber: 6,
    pdfPage: 194,
    printedPage: 184,
    kind: "3d",
    description:
      "Inspect eight corner sites and six face-centre sites. Work out the contribution of shared atoms to one FCC unit cell.",
    objective: "Use 8 × ⅛ + 6 × ½ to obtain four atoms per FCC unit cell.",
    limitations:
      "Separated spheres show lattice sites and sharing, with reduced radii for visibility. Colours distinguish site positions of identical atoms. The cubic edges are geometric guides. The display omits neighbouring cells and does not depict close-packed atomic radii.",
    sourceUrl:
      "https://openstax.org/books/chemistry/pages/10-6-lattice-structures-in-crystalline-solids",
    stages: [],
    controls: [
      "rotate",
      "zoom",
      "select",
      "hide selected",
      "explode",
      "surface mesh",
      "reset",
    ],
    parts: [
      {
        id: "corners",
        name: "Eight corner sites",
        color: "#34d399",
        description:
          "Each corner atom is shared by eight cells. The eight corners together contribute one atom to this cell.",
      },
      {
        id: "faces",
        name: "Six face-centre sites",
        color: "#fb7185",
        description:
          "One atom sits at the centre of each of the six faces. Each is shared by two cells, giving three atoms per cell in total.",
      },
      {
        id: "edges",
        name: "Cubic cell boundary",
        color: "#60a5fa",
        description:
          "Twelve equal edges outline the repeat unit. The blue lines mark the cell boundary and are geometric guides.",
      },
    ],
    check: {
      question: "How many atoms belong to one FCC unit cell?",
      options: ["14", "4", "6"],
      answer: 1,
      explanation:
        "Eight corner contributions give one atom and six face contributions give three, totalling four.",
    },
  }),
  make({
    id: "square-planar",
    title: "Square-planar coordination geometry",
    subject: "Chemistry",
    chapter: "Coordination Chemistry",
    bookId: chem,
    chapterNumber: 5,
    pdfPage: 153,
    printedPage: 143,
    kind: "3d",
    description:
      "Compare four ligand positions in a common plane around a central metal. Turn to a side view to see their coplanar arrangement.",
    objective:
      "Distinguish square-planar coordination, with adjacent 90° and opposite 180° directions, from tetrahedral geometry.",
    limitations:
      "Generic idealised coordination geometry. Spheres represent donor positions and sticks represent coordination directions. No particular chemical formula, bond length, orbital hybridisation, ligand charge or magnetic property is assigned.",
    sourceUrl:
      "https://openstax.org/books/chemistry-atoms-first-2e/pages/19-2-coordination-chemistry-of-transition-metals",
    stages: [],
    controls: [
      "rotate",
      "zoom",
      "select",
      "hide selected",
      "explode",
      "surface mesh",
      "reset",
    ],
    parts: [
      {
        id: "metal",
        name: "Central metal position",
        color: "#2563eb",
        description:
          "The metal lies at the centre of the square, in the same plane as the four donor positions.",
      },
      {
        id: "ligands",
        name: "Four coplanar donor positions",
        color: "#34d399",
        description:
          "Four ligand donor positions lie along two perpendicular axes in one plane. Adjacent directions meet at 90° and opposite directions at 180°.",
      },
      {
        id: "bonds",
        name: "Coordination directions",
        color: "#fbbf24",
        description:
          "Four sticks connect the central position to the donors. The sticks show the ideal geometry and do not represent electron density.",
      },
    ],
    check: {
      question: "What is the angle between adjacent coordination directions?",
      options: ["109.5°", "120°", "90°"],
      answer: 2,
      explanation:
        "Adjacent directions in an ideal square-planar arrangement are perpendicular.",
    },
  }),
  make({
    id: "nucleosome",
    title: "Nucleosome · DNA packaging",
    subject: "Bio-Zoology",
    chapter: "Molecular Genetics",
    bookId: zoo,
    chapterNumber: 5,
    pdfPage: 72,
    printedPage: 64,
    kind: "3d",
    description:
      "Explore a DNA path wrapped around eight core histones and follow the linker DNA leaving the core.",
    objective:
      "Recognise the histone octamer and distinguish core-associated DNA from linker DNA.",
    limitations:
      "Conceptual packaging model with eight enlarged protein beads. One tube traces the DNA duplex path, with individual strands, bases, histone tails and H1 omitted. Protein shapes, distances and colours are schematic. Higher-order chromatin folding is outside this model.",
    sourceUrl: "https://pdb101-east.rcsb.org/motm/7",
    stages: [],
    controls: [
      "rotate",
      "zoom",
      "select",
      "hide selected",
      "explode",
      "surface mesh",
      "reset",
    ],
    parts: [
      {
        id: "histones",
        name: "Eight core histones",
        color: "#a78bfa",
        description:
          "The core is an octamer containing two copies each of H2A, H2B, H3 and H4. The eight purple beads indicate the count, with protein shapes simplified.",
      },
      {
        id: "wrapped",
        name: "Wrapped DNA duplex path",
        color: "#fbbf24",
        description:
          "DNA winds around the histone core. The gold tube follows the path of the duplex as a whole.",
      },
      {
        id: "linker",
        name: "Linker DNA",
        color: "#38bdf8",
        description:
          "The blue extensions show DNA continuing away from the core toward neighbouring nucleosomes, which are omitted.",
      },
    ],
    check: {
      question: "How many histone proteins form the core octamer?",
      options: ["8", "4", "2"],
      answer: 0,
      explanation:
        "Two copies of each of four core histone types give eight proteins.",
    },
  }),
  make({
    id: "ac-generator",
    title: "AC generator · coil angle and induction",
    subject: "Physics",
    chapter: "Electromagnetic Induction and Alternating Current",
    bookId: phy,
    chapterNumber: 4,
    pdfPage: 231,
    printedPage: 223,
    kind: "3d",
    description:
      "Turn a rectangular coil between magnetic poles. Compare the angle of its normal with the magnetic field and explore normalised flux and induced emf.",
    objective:
      "Relate flux NBA cos θ and emf NBAω sin θ for a coil turning uniformly in a uniform magnetic field.",
    limitations:
      "Rotating-coil teaching arrangement described in the textbook note. Commercial rotating-field alternators use another arrangement. Uniform-field arrows are conceptual. Readouts are dimensionless normalised values, with a chosen polarity convention, rather than voltages. Wiring, external load, brush losses and magnetic fringing are omitted.",
    sourceUrl:
      "https://openstax.org/books/university-physics-volume-2/pages/13-6-electric-generators-and-back-emf",
    stages: [],
    controls: [
      "rotate",
      "zoom",
      "select",
      "hide selected",
      "coil angle",
      "play/pause coil",
      "quarter-turn step",
      "reset",
    ],
    parts: [
      {
        id: "north",
        name: "North magnetic pole",
        color: "#fb7185",
        description:
          "The red pole supplies the field on the left. The illustrated gap field points toward the south pole on the right.",
      },
      {
        id: "south",
        name: "South magnetic pole",
        color: "#60a5fa",
        description:
          "The blue pole is on the right. Field arrows across the gap run from north to south.",
      },
      {
        id: "coil",
        name: "Rotating armature coil",
        color: "#fbbf24",
        description:
          "The rectangular coil turns around the vertical shaft. θ measures its normal relative to the gap field. Turning the coil changes its linked flux.",
      },
      {
        id: "field",
        name: "Gap magnetic field",
        color: "#34d399",
        description:
          "Green arrows indicate the assumed uniform field direction. Flux is maximal at θ = 0° and zero at θ = 90°.",
      },
      {
        id: "shaft",
        name: "Rotation shaft",
        color: "#94a3b8",
        description:
          "The shaft marks the rotation axis. External mechanical work drives the generator.",
      },
      {
        id: "rings",
        name: "Two slip rings",
        color: "#f59e0b",
        description:
          "Separate continuous rings turn with the coil. The full electrical connections are omitted in this structural schematic.",
      },
      {
        id: "brushes",
        name: "Stationary brushes",
        color: "#475569",
        description:
          "Brushes contact the slip rings while remaining stationary. An external circuit would connect here.",
      },
    ],
    check: {
      question: "At θ = 90°, what happens for nonzero constant angular speed?",
      options: [
        "Flux and emf are both maximal",
        "Flux is zero and emf magnitude is maximal",
        "Flux is maximal and emf is zero",
      ],
      answer: 1,
      explanation:
        "cos 90° = 0 while sin 90° = 1. The normalised flux is zero and normalised emf is at its positive peak.",
    },
  }),
  make({
    id: "coaxial-cable",
    title: "Coaxial cable cutaway",
    subject: "Computer Applications",
    chapter: "Network Cabling",
    bookId: "12-computer-applications-english-627c1490",
    chapterNumber: 13,
    pdfPage: 184,
    printedPage: 178,
    kind: "3d",
    description:
      "Peel back a cable to distinguish its central conductor, insulation, surrounding shield and jacket.",
    objective:
      "Identify the concentric layers of a coaxial cable and distinguish its metal conductors from insulation.",
    limitations:
      "Enlarged stepped cutaway, not to scale. The shield is a smooth shell standing for a metallic braid or foil. No impedance, signal-speed or wiring simulation. Product construction varies.",
    sourceUrl:
      "https://www.belden.com/products/cable/video-cable/coaxial-video-cable/8241f",
    stages: [],
    controls: [
      "rotate",
      "zoom",
      "select",
      "hide selected",
      "explode",
      "surface mesh",
      "reset",
    ],
    parts: [
      {
        id: "conductor",
        name: "Central conductor",
        color: "#f59e0b",
        description:
          "A central metallic conductor runs along the cable axis. Copper is a common material.",
      },
      {
        id: "dielectric",
        name: "Dielectric insulation",
        color: "#e2e8f0",
        description:
          "An insulating layer separates the central conductor from the surrounding metallic shield.",
      },
      {
        id: "shield",
        name: "Metallic shield",
        color: "#94a3b8",
        description:
          "The outer conductor surrounds the dielectric. Its braid or foil structure is simplified here as a shell.",
      },
      {
        id: "jacket",
        name: "Outer jacket",
        color: "#334155",
        description:
          "The outer insulating covering protects the cable layers. It is distinct from the conductive shield.",
      },
    ],
    check: {
      question: "Which layer separates the central conductor and shield?",
      options: [
        "Dielectric insulation",
        "Outer jacket only",
        "An Ethernet socket",
      ],
      answer: 0,
      explanation: "The dielectric lies between the two conductors.",
    },
  }),
  make({
    id: "optical-fibre",
    title: "Optical fibre cutaway",
    subject: "Computer Applications",
    chapter: "Network Cabling",
    bookId: "12-computer-applications-english-627c1490",
    chapterNumber: 13,
    pdfPage: 184,
    printedPage: 178,
    kind: "3d",
    description:
      "Explore the core, surrounding cladding and protective coating of one optical fibre.",
    objective:
      "Distinguish the light-guiding core and cladding from the protective coating.",
    limitations:
      "Schematic single-fibre stepped cutaway, not an entire multi-fibre cable. Colours and relative diameters are illustrative. No ray tracing, optical modes, attenuation or transmission-rate simulation; glass is shown opaque so layers remain distinguishable.",
    sourceUrl: "https://www.thefoa.org/tech/ref/basic/fiber.html",
    stages: [],
    controls: [
      "rotate",
      "zoom",
      "select",
      "hide selected",
      "explode",
      "surface mesh",
      "reset",
    ],
    parts: [
      {
        id: "core",
        name: "Light-guiding core",
        color: "#38bdf8",
        description:
          "The central core guides optical signals. In a conventional step-index fibre, its refractive index is higher than the cladding's.",
      },
      {
        id: "cladding",
        name: "Optical cladding",
        color: "#a78bfa",
        description:
          "The surrounding optical material helps confine light. Core and cladding form the optical structure; the cladding is not the outer plastic coating.",
      },
      {
        id: "coating",
        name: "Protective coating",
        color: "#f97316",
        description:
          "A protective coating surrounds the glass fibre to reduce damage. A complete cable can add strength members and an outer jacket.",
      },
    ],
    check: {
      question:
        "Which component provides mechanical protection around this fibre?",
      options: [
        "A copper conductor",
        "Protective coating",
        "An Ethernet contact",
      ],
      answer: 1,
      explanation:
        "The coating protects the fibre; the core and cladding form its optical structure.",
    },
  }),
  make({
    id: "ethernet-plug",
    title: "Eight-contact Ethernet plug",
    subject: "Computer Applications",
    chapter: "Network Cabling",
    bookId: "12-computer-applications-english-627c1490",
    chapterNumber: 13,
    pdfPage: 188,
    printedPage: 182,
    kind: "3d",
    description:
      "Inspect an enlarged 8P8C plug, commonly called RJ45, and count its eight separate contacts.",
    objective:
      "Recognise the eight contacts and distinguish the cable plug from the network card socket.",
    limitations:
      "Simplified open-sided housing and enlarged contacts, not a manufacturing drawing. No pin numbering, wire colour code or termination instructions. The retaining latch is schematic; connector variants differ.",
    stages: [],
    controls: [
      "rotate",
      "zoom",
      "select",
      "hide selected",
      "explode",
      "surface mesh",
      "reset",
    ],
    parts: [
      {
        id: "housing",
        name: "Plug housing",
        color: "#93c5fd",
        description:
          "The insulating housing supports eight contact positions. Its sides are cut away here for visibility.",
      },
      {
        id: "contacts",
        name: "Eight metal contacts",
        color: "#fbbf24",
        description:
          "Eight separate contacts connect to the mating Ethernet socket. No pin assignments are shown in this model.",
      },
      {
        id: "latch",
        name: "Retaining latch",
        color: "#60a5fa",
        description:
          "A retaining tab helps keep the plug seated in its socket. This is a schematic representation.",
      },
    ],
    check: {
      question: "How many contacts does an 8P8C plug have?",
      options: ["Four", "Six", "Eight"],
      answer: 2,
      explanation: "8P8C means eight positions and eight contacts.",
    },
  }),
  make({
    id: "ethernet-card",
    title: "Ethernet network interface card",
    subject: "Computer Applications",
    chapter: "Network Cabling",
    bookId: "12-computer-applications-english-627c1490",
    chapterNumber: 13,
    pdfPage: 190,
    printedPage: 184,
    kind: "3d",
    description:
      "Inspect a schematic expansion network card, its board connection and Ethernet socket.",
    objective:
      "Distinguish a network interface card from its Ethernet port and the cable plugged into it.",
    limitations:
      "Simplified expansion-card layout, not a particular product or wiring diagram. The port is shown empty; controller circuitry, pin assignments and electrical signals are omitted. Integrated network interfaces can look different.",
    stages: [],
    controls: ["rotate", "zoom", "select", "hide selected", "explode", "reset"],
    parts: [
      {
        id: "board",
        name: "Network interface card",
        color: "#16a34a",
        description:
          "The expansion circuit board provides the computer with a wired network interface. The textbook also describes built-in interfaces.",
      },
      {
        id: "connector",
        name: "Motherboard connection",
        color: "#fbbf24",
        description:
          "An expansion card connects to a compatible motherboard slot. This edge connection is schematic, with no pinout or installation instructions.",
      },
      {
        id: "port",
        name: "Ethernet port",
        color: "#94a3b8",
        description:
          "The socket accepts the cable's 8P8C modular plug, commonly called RJ45. A port is one component of the interface, not the entire card.",
      },
    ],
    check: {
      question: "Which component accepts the Ethernet cable plug?",
      options: ["Ethernet port", "The entire motherboard", "A display screen"],
      answer: 0,
      explanation:
        "The cable plug fits into the Ethernet port on the network interface.",
    },
  }),
  make({
    id: "twisted-pair",
    title: "Twisted-pair Ethernet cable",
    subject: "Computer Applications",
    chapter: "Network Cabling",
    bookId: "12-computer-applications-english-627c1490",
    chapterNumber: 13,
    pdfPage: 187,
    printedPage: 181,
    kind: "3d",
    description:
      "Explore four separate pairs of insulated conductors in a cutaway UTP cable.",
    objective:
      "Identify eight insulated conductors arranged as four twisted pairs inside a protective jacket.",
    limitations:
      "Schematic enlarged cutaway: equal twist pitches and spacing are illustrative. No connector pin order, signal propagation, shielding or performance simulation. Light-coloured partners stand for white-striped insulation; this is not a termination guide.",
    stages: [],
    controls: ["rotate", "zoom", "select", "hide selected", "explode", "reset"],
    parts: [
      {
        id: "orange",
        name: "Orange pair",
        color: "#f97316",
        description:
          "Two insulated conductors form one twisted pair: orange and its white/orange partner.",
      },
      {
        id: "green",
        name: "Green pair",
        color: "#22c55e",
        description:
          "Green and white/green form a separate pair; the conductors remain electrically separate.",
      },
      {
        id: "blue",
        name: "Blue pair",
        color: "#3b82f6",
        description:
          "Blue and white/blue form the third pair. Each pair contains two conductors.",
      },
      {
        id: "brown",
        name: "Brown pair",
        color: "#a16207",
        description:
          "Brown and white/brown form the fourth pair: four pairs give eight conductors.",
      },
      {
        id: "jacket",
        name: "Protective jacket",
        color: "#94a3b8",
        description:
          "The outer covering protects the insulated wires. It is cut away here to reveal the four pairs.",
      },
    ],
    check: {
      question: "How many conductors are in four twisted pairs?",
      options: ["4", "8", "16"],
      answer: 1,
      explanation: "Each of the four pairs contains two conductors: 4 × 2 = 8.",
    },
  }),
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
  make({
    id: "sperm",
    title: "Human sperm · structure and function",
    subject: "Bio-Zoology",
    chapter: "Human Reproduction",
    bookId: zoo,
    chapterNumber: 2,
    pdfPage: 25,
    printedPage: 17,
    kind: "3d",
    description:
      "Explore the acrosome, nucleus, neck, mitochondrial middle piece and flagellar tail.",
    objective:
      "Relate each region of a spermatozoon to its role in fertilisation or movement.",
    limitations:
      "Schematic external and internal parts, with exaggerated widths and spacing. The membrane and detailed axoneme are omitted; this is not a swimming simulation or a diagnostic model.",
    stages: [],
    controls: ["rotate", "zoom", "select", "hide selected", "explode", "reset"],
    parts: [
      {
        id: "acrosome",
        name: "Acrosome",
        color: "#fb7185",
        description:
          "The cap at the anterior head contains enzymes involved in penetration of the egg coverings during fertilisation.",
      },
      {
        id: "nucleus",
        name: "Head nucleus",
        color: "#a78bfa",
        description:
          "The head contains the haploid paternal genetic material. The flattened oval is shown schematically.",
      },
      {
        id: "neck",
        name: "Neck",
        color: "#fbbf24",
        description:
          "The short junction between head and middle piece contains centrioles; their fine structure is omitted.",
      },
      {
        id: "middle",
        name: "Mitochondrial middle piece",
        color: "#34d399",
        description:
          "Mitochondria arranged around the axial filament supply ATP for sperm movement.",
      },
      {
        id: "tail",
        name: "Flagellar tail",
        color: "#60a5fa",
        description:
          "The long tail produces movement through flagellar beating. The curved resting shape here is illustrative.",
      },
    ],
    check: {
      question: "Which region contains the mitochondrial spiral?",
      options: ["Acrosome", "Middle piece", "Head nucleus"],
      answer: 1,
      explanation:
        "Mitochondria surround the axial filament in the middle piece and supply ATP.",
    },
  }),
  make({
    id: "embryo-sac",
    title: "Embryo sac · seven cells, eight nuclei",
    subject: "Bio-Botany",
    chapter: "Asexual and Sexual Reproduction in Plants",
    bookId: bot,
    chapterNumber: 1,
    pdfPage: 18,
    printedPage: 12,
    kind: "3d",
    description:
      "Inspect the egg apparatus, central cell with two polar nuclei and three antipodal cells in a typical Polygonum-type embryo sac.",
    objective:
      "Count seven cells and eight nuclei and locate the micropylar egg apparatus and chalazal antipodals.",
    limitations:
      "A schematic Polygonum-type embryo sac before fusion of its two polar nuclei. Sizes and cell outlines are simplified; not all flowering plants share this developmental pattern. Top is micropylar, bottom is chalazal in this view.",
    stages: [],
    controls: ["rotate", "zoom", "select", "hide selected", "explode", "reset"],
    parts: [
      {
        id: "central",
        name: "Central cell",
        color: "#fbbf24",
        description:
          "The large central cell surrounds two polar nuclei in the stage illustrated. Its translucent outline also marks the sac boundary schematically.",
      },
      {
        id: "polar",
        name: "Two polar nuclei",
        color: "#a78bfa",
        description:
          "Two nuclei lie in the central cell before they fuse. They are not two additional cells.",
      },
      {
        id: "egg",
        name: "Egg cell",
        color: "#fb7185",
        description:
          "One egg cell is flanked by two synergids at the micropylar end, shown at the top.",
      },
      {
        id: "synergids",
        name: "Two synergids",
        color: "#38bdf8",
        description:
          "Two cells beside the egg help guide the pollen tube. Each has one nucleus; filiform apparatus detail is omitted.",
      },
      {
        id: "antipodals",
        name: "Three antipodal cells",
        color: "#34d399",
        description:
          "Three cells with one nucleus each occupy the chalazal end, shown at the bottom.",
      },
    ],
    check: {
      question: "Why are there eight nuclei but seven cells?",
      options: [
        "Every cell has two nuclei",
        "The central cell contains two polar nuclei",
        "The egg has three nuclei",
      ],
      answer: 1,
      explanation:
        "Six small cells each have one nucleus and the central cell has two: seven cells, eight nuclei.",
    },
  }),
  make({
    id: "bcc",
    title: "Body-centred cubic · unit cell",
    subject: "Chemistry",
    chapter: "Solid State",
    bookId: chem,
    chapterNumber: 6,
    pdfPage: 193,
    printedPage: 183,
    kind: "3d",
    description:
      "Rotate a cubic cell with eight corner atom centres and one body-centre atom; inspect its eight nearest-neighbour directions.",
    objective:
      "Distinguish nine drawn atom centres from the two atoms contributed to one BCC unit cell: 8 × ⅛ + 1 = 2.",
    limitations:
      "Ball-and-stick schematic with deliberately reduced atom radii, not a space-filling or scaled crystal. Corner spheres extend outside the cell and are shared between eight cells. Lines to the centre indicate nearest-neighbour directions, not molecular bonds.",
    stages: [],
    controls: ["rotate", "zoom", "select", "hide selected", "explode", "reset"],
    parts: [
      {
        id: "corners",
        name: "Eight corner atom centres",
        color: "#34d399",
        description:
          "Each corner atom is shared by eight adjacent cells, contributing one eighth to this cell.",
      },
      {
        id: "centre",
        name: "Body-centre atom",
        color: "#fb7185",
        description:
          "One atom lies wholly inside the cell. Together with the corner contributions this gives two atoms per cell.",
      },
      {
        id: "edges",
        name: "Unit-cell edges",
        color: "#60a5fa",
        description:
          "Twelve edges outline the cubic repeat unit. These are geometric guides, not bonds.",
      },
      {
        id: "neighbours",
        name: "Eight nearest neighbours",
        color: "#fbbf24",
        description:
          "The centre atom has eight nearest neighbours at the corners: the BCC coordination number is eight.",
      },
    ],
    check: {
      question: "How many atoms are contributed to one BCC unit cell?",
      options: ["9", "8", "2"],
      answer: 2,
      explanation:
        "Eight corners contribute 8 × ⅛ = 1 atom, and the body centre contributes one more.",
    },
  }),
  make({
    id: "pn-junction",
    title: "p–n junction · equilibrium depletion region",
    subject: "Physics",
    chapter: "Electronics and Communication",
    bookId: "12-physics-english-v2-0ce6704c",
    chapterNumber: 10,
    pdfPage: 210,
    printedPage: 202,
    kind: "3d",
    description:
      "Explore holes on the p-side, electrons on the n-side and fixed ions in the depletion region. The built-in field points from n to p.",
    objective:
      "Distinguish mobile carriers in the bulk from fixed acceptor and donor ions near an unbiased junction.",
    limitations:
      "Extruded conceptual diagram at equilibrium, not an atomic lattice or a numerical device simulation. Carrier counts and depletion widths are arbitrary; minority carriers, neutral-bulk ion balance and drift/diffusion currents are omitted. Field direction is shown without a magnitude. Printed page 203 continues the field explanation.",
    stages: [],
    controls: ["rotate", "zoom", "select", "hide selected", "explode", "reset"],
    parts: [
      {
        id: "holes",
        name: "p-side holes (left)",
        color: "#fb7185",
        description:
          "Open rings represent mobile holes in the p-type bulk, to the left of the depletion region.",
      },
      {
        id: "electrons",
        name: "n-side electrons (right)",
        color: "#38bdf8",
        description:
          "Small blue spheres represent mobile electrons in the n-type bulk, to the right of the depletion region.",
      },
      {
        id: "acceptors",
        name: "Fixed negative acceptor ions",
        color: "#a78bfa",
        description:
          "Negative acceptor ions remain on the p-side of the depletion region. Minus marks indicate their charge; the ions do not move.",
      },
      {
        id: "donors",
        name: "Fixed positive donor ions",
        color: "#fbbf24",
        description:
          "Positive donor ions remain on the n-side of the depletion region. Plus marks indicate their charge; the ions do not move.",
      },
      {
        id: "field",
        name: "Built-in electric field (n → p)",
        color: "#34d399",
        description:
          "Arrows point from positive donor ions on the right toward negative acceptor ions on the left. The region between them is depleted of mobile carriers.",
      },
    ],
    check: {
      question: "Which way does the built-in electric field point?",
      options: [
        "From n-side positive ions toward p-side negative ions",
        "From p to n",
        "It follows a circular orbit",
      ],
      answer: 0,
      explanation:
        "The built-in electric field points from the positive donor layer on the n-side toward the negative acceptor layer on the p-side.",
    },
  }),
];
export function advancedLesson(id: string) {
  return advancedModels.find((m) => m.id === id);
}
