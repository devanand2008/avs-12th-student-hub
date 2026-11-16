// Comprehensive Science & Mathematics Game Data for Tamil Nadu Class 12
// Covers Mathematics, Physics, Chemistry, and Biology (Bio-Botany & Bio-Zoology)

export type GameSubject = "maths" | "physics" | "chemistry" | "biology";

export interface SubjectTheme {
  id: GameSubject;
  name: string;
  tamilName: string;
  tagline: string;
  badge: string;
  heroGradient: string;
  accentColor: string;
  cardBorder: string;
  activeRing: string;
  bgGlow: string;
  primaryButton: string;
  accentText: string;
  pillBg: string;
  blankPill: string;
  iconName: "calculator" | "atom" | "flask" | "dna";
}

export const SUBJECT_THEMES: Record<GameSubject, SubjectTheme> = {
  maths: {
    id: "maths",
    name: "Mathematics",
    tamilName: "கணிதம்",
    tagline: "Master Matrices, Calculus, Vectors & Conics",
    badge: "12TH MATHS FORMULA QUEST",
    heroGradient: "from-[#142B63] via-[#1E3A8A] to-[#0F172A]",
    accentColor: "amber",
    cardBorder: "border-amber-300/40 hover:border-amber-400",
    activeRing: "ring-amber-400/40",
    bgGlow: "bg-amber-500/10",
    primaryButton: "bg-amber-400 hover:bg-amber-300 text-slate-950",
    accentText: "text-amber-400",
    pillBg: "bg-amber-50 text-amber-800 border-amber-200",
    blankPill: "bg-amber-400 text-slate-950 ring-amber-300",
    iconName: "calculator",
  },
  physics: {
    id: "physics",
    name: "Physics",
    tamilName: "இயற்பியல்",
    tagline: "Master Electrostatics, Magnetism, Optics & Quantum Laws",
    badge: "QUANTUM PHYSICS LAW ARCADE",
    heroGradient: "from-[#0A0F2C] via-[#1E1B4B] to-[#082F49]",
    accentColor: "cyan",
    cardBorder: "border-cyan-400/40 hover:border-cyan-400",
    activeRing: "ring-cyan-400/50",
    bgGlow: "bg-cyan-500/15",
    primaryButton: "bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black",
    accentText: "text-cyan-400",
    pillBg: "bg-cyan-50 text-cyan-800 border-cyan-200",
    blankPill: "bg-cyan-400 text-slate-950 ring-cyan-300",
    iconName: "atom",
  },
  chemistry: {
    id: "chemistry",
    name: "Chemistry",
    tamilName: "வேதியியல்",
    tagline: "Master Solid State, Electrochemistry, Kinetics & Solutions",
    badge: "REACTION & EQUATION LAB",
    heroGradient: "from-[#022C22] via-[#064E3B] to-[#0F172A]",
    accentColor: "emerald",
    cardBorder: "border-emerald-400/40 hover:border-emerald-400",
    activeRing: "ring-emerald-400/50",
    bgGlow: "bg-emerald-500/15",
    primaryButton: "bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black",
    accentText: "text-emerald-400",
    pillBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    blankPill: "bg-emerald-400 text-slate-950 ring-emerald-300",
    iconName: "flask",
  },
  biology: {
    id: "biology",
    name: "Biology",
    tamilName: "உயிரியல்",
    tagline: "Master Genetics, Mendelian Ratios, Ecology & Biotech",
    badge: "GENETICS & LIFE QUEST",
    heroGradient: "from-[#3B0764] via-[#831843] to-[#052E16]",
    accentColor: "fuchsia",
    cardBorder: "border-fuchsia-400/40 hover:border-fuchsia-400",
    activeRing: "ring-fuchsia-400/50",
    bgGlow: "bg-fuchsia-500/15",
    primaryButton: "bg-fuchsia-400 hover:bg-fuchsia-300 text-slate-950 font-black",
    accentText: "text-fuchsia-400",
    pillBg: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
    blankPill: "bg-fuchsia-400 text-slate-950 ring-fuchsia-300",
    iconName: "dna",
  },
};

export interface ScienceQuestion {
  id: string;
  subject: GameSubject;
  chapter: string;
  name: string;
  tamilName?: string;
  formula: string;
  description: string;
  options: string[]; // index 0 is correct
  fillBlank: {
    template: string; // contains [?]
    correct: string;
    options: string[];
  };
  examTip: string;
}

export const SCIENCE_QUESTIONS: ScienceQuestion[] = [
  // ==========================================
  // PHYSICS (Tamil Nadu Class 12 Curriculum)
  // ==========================================
  {
    id: "phy-coulomb",
    subject: "physics",
    chapter: "Electrostatics",
    name: "Coulomb's Law of Electrostatics",
    tamilName: "கூலும் விதி",
    formula: "F = (1 / 4πε₀) · (q₁ · q₂ / r²)",
    description: "Electrostatic force between two point charges in vacuum.",
    options: [
      "F = (1 / 4πε₀) · (q₁ · q₂ / r²)",
      "F = (1 / 4πε₀) · (q₁ · q₂ / r)",
      "F = (4πε₀) · (q₁ · q₂ / r²)",
      "F = (1 / 2πε₀) · (q₁ · q₂ / r²)",
    ],
    fillBlank: {
      template: "F = (1 / 4πε₀) · (q₁ · q₂ / [?])",
      correct: "r²",
      options: ["r²", "r", "r³", "2r"],
    },
    examTip: "1 / (4πε₀) ≈ 9 × 10⁹ N·m²/C² in SI units.",
  },
  {
    id: "phy-gauss",
    subject: "physics",
    chapter: "Electrostatics",
    name: "Gauss's Law in Electrostatics",
    tamilName: "காஸ் விதி",
    formula: "Φ_E = ∮ E⃗ · dA⃗ = Q_enclosed / ε₀",
    description: "Total electric flux through any closed Gaussian surface equals enclosed charge divided by ε₀.",
    options: [
      "Φ_E = Q_enclosed / ε₀",
      "Φ_E = Q_enclosed · ε₀",
      "Φ_E = 0 (always)",
      "Φ_E = ε₀ / Q_enclosed",
    ],
    fillBlank: {
      template: "Electric flux through closed surface: Φ_E = [?] / ε₀",
      correct: "Q_enclosed",
      options: ["Q_enclosed", "E⃗ · r", "4π", "V"],
    },
    examTip: "Electric flux depends only on charge inside, completely independent of the shape of the surface!",
  },
  {
    id: "phy-cap-parallel",
    subject: "physics",
    chapter: "Electrostatics",
    name: "Capacitance of Parallel Plate Capacitor",
    tamilName: "இணைத்தட்டு மின்தேக்கியின் மின்தேக்குத்திறன்",
    formula: "C = ε₀ · A / d",
    description: "Capacitance is directly proportional to plate area A and inversely to separation d.",
    options: [
      "C = ε₀ · A / d",
      "C = ε₀ · d / A",
      "C = A · d / ε₀",
      "C = 2πε₀ · A / d",
    ],
    fillBlank: {
      template: "C = ε₀ · [?] / d",
      correct: "A",
      options: ["A", "d", "A²", "q"],
    },
    examTip: "Introducing a dielectric of constant K increases capacitance to K · C₀.",
  },
  {
    id: "phy-drift-velocity",
    subject: "physics",
    chapter: "Current Electricity",
    name: "Drift Velocity & Electron Mobility",
    tamilName: "இழுப்புத் திசைவேகம் மற்றும் இயக்க எண்",
    formula: "v_d = -μ · E  and  v_d = -(eτ / m) · E",
    description: "Average velocity acquired by conduction electrons due to applied electric field E.",
    options: [
      "v_d = -μ · E",
      "v_d = -μ / E",
      "v_d = E / μ",
      "v_d = μ · E²",
    ],
    fillBlank: {
      template: "Mobility is ratio of drift velocity to field: μ = [?] / E",
      correct: "v_d",
      options: ["v_d", "I", "R", "m·e"],
    },
    examTip: "Unit of mobility μ is m²/(V·s). Always positive!",
  },
  {
    id: "phy-biot-savart",
    subject: "physics",
    chapter: "Magnetism & Magnetic Effects",
    name: "Biot-Savart Law",
    tamilName: "பயோட்-சாவர்ட் விதி",
    formula: "dB⃗ = (μ₀ / 4π) · (I · dl⃗ × r̂) / r²",
    description: "Magnetic field produced by a steady current element I·dl at distance r.",
    options: [
      "dB⃗ = (μ₀ / 4π) · (I · dl⃗ × r̂) / r²",
      "dB⃗ = (μ₀ / 4π) · (I · dl⃗ · r̂) / r²",
      "dB⃗ = (μ₀ / 2π) · (I · dl⃗) / r",
      "dB⃗ = μ₀ · I · r²",
    ],
    fillBlank: {
      template: "dB = (μ₀ / 4π) · (I · dl · sin θ) / [?]",
      correct: "r²",
      options: ["r²", "r", "r³", "2r"],
    },
    examTip: "μ₀ / 4π = 10⁻⁷ T·m/A. At center of circular coil: B = μ₀I / 2R.",
  },
  {
    id: "phy-faraday-lenz",
    subject: "physics",
    chapter: "Electromagnetic Induction",
    name: "Faraday-Lenz Law of Induction",
    tamilName: "பாரடே-லென்ஸ் தூண்டல் விதி",
    formula: "ε = -dΦ_B / dt",
    description: "Induced electromotive force equals the negative time rate of change of magnetic flux.",
    options: [
      "ε = -dΦ_B / dt",
      "ε = +dΦ_B / dt",
      "ε = -Φ_B · t",
      "ε = -L · (dΦ_B / dt)",
    ],
    fillBlank: {
      template: "Induced emf: ε = [?] · (dΦ_B / dt)",
      correct: "-",
      options: ["-", "+", "2", "1/2"],
    },
    examTip: "The minus sign is Lenz's law, expressing conservation of energy!",
  },
  {
    id: "phy-transformer-ratio",
    subject: "physics",
    chapter: "Alternating Current",
    name: "Transformer Turns & Voltage Ratio",
    tamilName: "மின்மாற்றி சுற்றுகளின் விகிதம்",
    formula: "V_s / V_p = N_s / N_p = I_p / I_s = k",
    description: "Transformation ratio k determines step-up (k > 1) or step-down (k < 1) transformers.",
    options: [
      "V_s / V_p = N_s / N_p = I_p / I_s",
      "V_s / V_p = N_p / N_s = I_s / I_p",
      "V_s / V_p = N_s / N_p = I_s / I_p",
      "V_s · V_p = N_s · N_p",
    ],
    fillBlank: {
      template: "In an ideal transformer, V_s / V_p = [?] / N_p",
      correct: "N_s",
      options: ["N_s", "I_s", "R_s", "P_s"],
    },
    examTip: "Notice current is inversely proportional: V_s / V_p = I_p / I_s!",
  },
  {
    id: "phy-einstein-photo",
    subject: "physics",
    chapter: "Dual Nature of Radiation",
    name: "Einstein's Photoelectric Equation",
    tamilName: "ஐன்ஸ்டீனின் ஒளிமின் சமன்பாடு",
    formula: "hν = W₀ + (1/2)m·v_max²  = hν₀ + K_max",
    description: "Incident photon energy hν splits into work function W₀ and maximum kinetic energy.",
    options: [
      "hν = W₀ + (1/2)m·v_max²",
      "hν = W₀ - (1/2)m·v_max²",
      "K_max = hν + W₀",
      "hν = W₀ / K_max",
    ],
    fillBlank: {
      template: "hν = [?] + K_max",
      correct: "W₀",
      options: ["W₀", "λ", "eV₀²", "c"],
    },
    examTip: "Stopping potential equation: eV₀ = K_max = h(ν - ν₀). Slope of V₀ vs ν is h/e!",
  },
  {
    id: "phy-debroglie",
    subject: "physics",
    chapter: "Dual Nature of Radiation",
    name: "de Broglie Wavelength of an Electron",
    tamilName: "டி பிராய் அலைநீளம்",
    formula: "λ = h / p = 12.27 / √V  Å",
    description: "Matter wave wavelength for an electron accelerated through potential difference V volts.",
    options: [
      "λ = 12.27 / √V  Å",
      "λ = 12.27 · √V  Å",
      "λ = 1.227 / V  Å",
      "λ = √V / 12.27  Å",
    ],
    fillBlank: {
      template: "de Broglie wavelength: λ = h / [?]",
      correct: "p",
      options: ["p", "E", "c", "m·c²"],
    },
    examTip: "Momentum p = √(2mE) = √(2mqV).",
  },
  {
    id: "phy-half-life",
    subject: "physics",
    chapter: "Atomic & Nuclear Physics",
    name: "Radioactive Half-Life Relation",
    tamilName: "அரை ஆயுட்காலம்",
    formula: "T_(1/2) = ln(2) / λ ≈ 0.693 / λ",
    description: "Time required for half the radioactive nuclei to disintegrate.",
    options: [
      "T_(1/2) = 0.693 / λ",
      "T_(1/2) = λ / 0.693",
      "T_(1/2) = 1.44 · λ",
      "T_(1/2) = 0.693 · λ",
    ],
    fillBlank: {
      template: "T_(1/2) = [?] / λ",
      correct: "0.693",
      options: ["0.693", "1.414", "2.303", "3.14"],
    },
    examTip: "Mean life τ = 1/λ = T_(1/2) / 0.693 ≈ 1.44 · T_(1/2).",
  },

  // ==========================================
  // CHEMISTRY (Tamil Nadu Class 12 Curriculum)
  // ==========================================
  {
    id: "chem-bragg",
    subject: "chemistry",
    chapter: "Solid State",
    name: "Bragg's Law of X-ray Diffraction",
    tamilName: "பிராக் சமன்பாடு",
    formula: "n · λ = 2d · sin θ",
    description: "Condition for constructive interference of X-rays scattered by crystal planes separated by distance d.",
    options: [
      "n · λ = 2d · sin θ",
      "n · λ = d · sin θ",
      "n · λ = 2d · cos θ",
      "λ = 2n · d · sin θ",
    ],
    fillBlank: {
      template: "n · λ = [?] · sin θ",
      correct: "2d",
      options: ["2d", "d", "d²", "4d"],
    },
    examTip: "n is order of diffraction (n = 1, 2, ...), λ is wavelength, θ is glancing angle.",
  },
  {
    id: "chem-density-crystal",
    subject: "chemistry",
    chapter: "Solid State",
    name: "Density of a Cubic Unit Cell",
    tamilName: "அலகுக்கூட்டின் அடர்த்தி",
    formula: "ρ = (z · M) / (a³ · N_A)",
    description: "Density calculation from number of atoms z, molar mass M, edge length a, and Avogadro's number N_A.",
    options: [
      "ρ = (z · M) / (a³ · N_A)",
      "ρ = (a³ · N_A) / (z · M)",
      "ρ = (z · N_A) / (a³ · M)",
      "ρ = (z · M · a³) / N_A",
    ],
    fillBlank: {
      template: "ρ = (z · M) / ([?] · N_A)",
      correct: "a³",
      options: ["a³", "a²", "a", "6a"],
    },
    examTip: "For SC: z = 1; for BCC: z = 2; for FCC: z = 4. Always convert edge length a from pm to cm (1 pm = 10⁻¹⁰ cm)!",
  },
  {
    id: "chem-arrhenius",
    subject: "chemistry",
    chapter: "Chemical Kinetics",
    name: "Arrhenius Rate Equation",
    tamilName: "அர்ஹீனியஸ் சமன்பாடு",
    formula: "k = A · e^(-E_a / RT)",
    description: "Relates rate constant k to activation energy E_a and absolute temperature T.",
    options: [
      "k = A · e^(-E_a / RT)",
      "k = A · e^(+E_a / RT)",
      "k = E_a · e^(-A / RT)",
      "k = A · ln(-E_a / RT)",
    ],
    fillBlank: {
      template: "log(k₂/k₁) = (E_a / 2.303R) · [?]",
      correct: "(T₂ - T₁) / (T₁ · T₂)",
      options: ["(T₂ - T₁) / (T₁ · T₂)", "(T₁ + T₂) / R", "T₂ / T₁", "(T₁ · T₂) / (T₂ - T₁)"],
    },
    examTip: "Plot of ln(k) vs 1/T yields a straight line with slope = -E_a / R.",
  },
  {
    id: "chem-nernst",
    subject: "chemistry",
    chapter: "Electrochemistry",
    name: "Nernst Equation at 298 K",
    tamilName: "நெர்ன்ஸ்ட் சமன்பாடு",
    formula: "E_cell = E°_cell - (0.0591 / n) · log Q",
    description: "Calculates cell potential under non-standard concentration conditions at 25°C.",
    options: [
      "E_cell = E°_cell - (0.0591 / n) · log Q",
      "E_cell = E°_cell + (0.0591 / n) · log Q",
      "E_cell = E°_cell - (0.0591 · n) · log Q",
      "E_cell = (0.0591 / n) · log K_c",
    ],
    fillBlank: {
      template: "E_cell = E°_cell - ([?] / n) · log Q  (at 298 K)",
      correct: "0.0591",
      options: ["0.0591", "2.303", "8.314", "96500"],
    },
    examTip: "At equilibrium, E_cell = 0 and Q = K_c, giving E°_cell = (0.0591/n) log K_c.",
  },
  {
    id: "chem-kohlrausch",
    subject: "chemistry",
    chapter: "Electrochemistry",
    name: "Kohlrausch's Law of Independent Migration",
    tamilName: "கோல்ராஷ் விதி",
    formula: "Λ°_m = ν₊ · λ°₊ + ν₋ · λ°₋",
    description: "Limiting molar conductivity of an electrolyte is the sum of limiting conductivities of its constituent ions.",
    options: [
      "Λ°_m = ν₊ · λ°₊ + ν₋ · λ°₋",
      "Λ°_m = ν₊ · λ°₊ - ν₋ · λ°₋",
      "Λ°_m = (λ°₊ + λ°₋) / 2",
      "Λ°_m = κ · 1000 / M",
    ],
    fillBlank: {
      template: "For NaCl: Λ°_m(NaCl) = λ°(Na⁺) + [?]",
      correct: "λ°(Cl⁻)",
      options: ["λ°(Cl⁻)", "λ°(H⁺)", "2λ°(Cl⁻)", "κ"],
    },
    examTip: "Allows determination of Λ°_m for weak electrolytes like CH₃COOH from strong electrolytes!",
  },
  {
    id: "chem-first-order",
    subject: "chemistry",
    chapter: "Chemical Kinetics",
    name: "Integrated Rate Law for First Order Reaction",
    tamilName: "முதல் வகை வினைச் சமன்பாடு",
    formula: "k = (2.303 / t) · log([A]₀ / [A])  and  t_(1/2) = 0.693 / k",
    description: "First order half-life is completely independent of initial concentration [A]₀.",
    options: [
      "k = (2.303 / t) · log([A]₀ / [A])",
      "k = (1 / t) · ([A]₀ - [A])",
      "k = (2.303 / t) · log([A] / [A]₀)",
      "k = (1 / 2t) · ([A]₀² - [A]²)",
    ],
    fillBlank: {
      template: "First-order half life: t_(1/2) = [?] / k",
      correct: "0.693",
      options: ["0.693", "2.303", "[A]₀/2", "1/[A]₀"],
    },
    examTip: "Unit of first-order rate constant k is s⁻¹ or time⁻¹ (no concentration unit).",
  },
  {
    id: "chem-henderson",
    subject: "chemistry",
    chapter: "Ionic Equilibrium",
    name: "Henderson-Hasselbalch Equation for Acid Buffer",
    tamilName: "ஹெண்டர்சன் சமன்பாடு",
    formula: "pH = pK_a + log([Salt] / [Acid])",
    description: "Calculates pH of an acidic buffer solution containing weak acid and its salt.",
    options: [
      "pH = pK_a + log([Salt] / [Acid])",
      "pH = pK_a - log([Salt] / [Acid])",
      "pH = pK_a + log([Acid] / [Salt])",
      "pH = pK_w - pK_a",
    ],
    fillBlank: {
      template: "pH = pK_a + log([?] / [Acid])",
      correct: "[Salt]",
      options: ["[Salt]", "[Base]", "[H⁺]", "[H₂O]"],
    },
    examTip: "For basic buffer: pOH = pK_b + log([Salt] / [Base]), and pH = 14 - pOH.",
  },
  {
    id: "chem-raoult",
    subject: "chemistry",
    chapter: "Solutions",
    name: "Raoult's Law for Ideal Solutions",
    tamilName: "ரௌல்ட் விதி",
    formula: "P_A = P°_A · x_A",
    description: "Partial vapour pressure of any volatile component equals its mole fraction x_A times pure vapour pressure P°_A.",
    options: [
      "P_A = P°_A · x_A",
      "P_A = P°_A / x_A",
      "P_A = x_A / P°_A",
      "P_A = P°_A + x_A",
    ],
    fillBlank: {
      template: "Relative lowering of vapour pressure: (P° - P) / P° = [?]",
      correct: "x_solute",
      options: ["x_solute", "x_solvent", "m", "K_b"],
    },
    examTip: "Colligative property: depends only on the number of solute particles, not their nature!",
  },

  // ==========================================
  // BIOLOGY (Bio-Botany & Bio-Zoology)
  // ==========================================
  {
    id: "bio-monohybrid",
    subject: "biology",
    chapter: "Classical Genetics",
    name: "Mendelian Monohybrid Cross Ratios",
    tamilName: "ஒரு பண்புக் கலப்பு விகிதம்",
    formula: "Phenotypic: 3 : 1  |  Genotypic: 1 : 2 : 1",
    description: "Inheritance of a single trait (e.g. Tall vs Dwarf pea plants) in the F₂ generation.",
    options: [
      "Phenotypic: 3 : 1, Genotypic: 1 : 2 : 1",
      "Phenotypic: 1 : 2 : 1, Genotypic: 3 : 1",
      "Phenotypic: 9 : 3 : 3 : 1, Genotypic: 1 : 1",
      "Phenotypic: 1 : 1, Genotypic: 3 : 1",
    ],
    fillBlank: {
      template: "Monohybrid F₂ phenotypic ratio is [?] : 1",
      correct: "3",
      options: ["3", "9", "1", "2"],
    },
    examTip: "Monohybrid test cross ratio is always 1 : 1 (heterozygote crossed with homozygous recessive).",
  },
  {
    id: "bio-dihybrid",
    subject: "biology",
    chapter: "Classical Genetics",
    name: "Mendelian Dihybrid Cross Ratio",
    tamilName: "இரு பண்புக் கலப்பு விகிதம்",
    formula: "F₂ Phenotypic Ratio = 9 : 3 : 3 : 1",
    description: "Independent assortment of two contrasting gene pairs (e.g. Yellow Round vs Green Wrinkled).",
    options: [
      "9 : 3 : 3 : 1",
      "9 : 6 : 1",
      "12 : 3 : 1",
      "15 : 1",
    ],
    fillBlank: {
      template: "Dihybrid F₂ phenotypic ratio: 9 : [?] : 3 : 1",
      correct: "3",
      options: ["3", "6", "2", "1"],
    },
    examTip: "Dihybrid test cross ratio is 1 : 1 : 1 : 1.",
  },
  {
    id: "bio-incomplete-dom",
    subject: "biology",
    chapter: "Classical Genetics",
    name: "Incomplete Dominance Ratio (Mirabilis jalapa)",
    tamilName: "முழுமையற்ற ஓங்குதன்மை",
    formula: "Phenotypic = Genotypic = 1 : 2 : 1 (Red : Pink : White)",
    description: "Heterozygote shows intermediate pink phenotype due to quantitative enzyme dosage effect.",
    options: [
      "1 : 2 : 1 (Red : Pink : White)",
      "3 : 1 (Red : White)",
      "9 : 7 (Complementary)",
      "2 : 1 (Lethal)",
    ],
    fillBlank: {
      template: "In 4 o'clock plant, F₂ ratio is 1 Red : [?] Pink : 1 White",
      correct: "2",
      options: ["2", "3", "1", "4"],
    },
    examTip: "In incomplete dominance, phenotypic ratio strictly matches the genotypic ratio (1:2:1)!",
  },
  {
    id: "bio-hardy-weinberg",
    subject: "biology",
    chapter: "Evolution",
    name: "Hardy-Weinberg Genetic Equilibrium",
    tamilName: "ஹார்டி-வெயின்பெர்க் சமன்பாடு",
    formula: "p² + 2pq + q² = 1  and  p + q = 1",
    description: "Allele and genotype frequencies in a large, randomly mating population remain constant without evolutionary forces.",
    options: [
      "p² + 2pq + q² = 1",
      "p² - 2pq + q² = 1",
      "p + q = 2",
      "p² + q² = 1",
    ],
    fillBlank: {
      template: "In Hardy-Weinberg equilibrium, frequency of heterozygotes is [?]",
      correct: "2pq",
      options: ["2pq", "p²", "q²", "pq"],
    },
    examTip: "p² = homozygous dominant, 2pq = heterozygous, q² = homozygous recessive.",
  },
  {
    id: "bio-chargaff",
    subject: "biology",
    chapter: "Molecular Genetics",
    name: "Chargaff's Base-Pairing Rules for dsDNA",
    tamilName: "சார்காப் விதி",
    formula: "A = T  and  G ≡ C,  hence (A + G) / (T + C) = 1",
    description: "In double-stranded DNA, the ratio of Purines (A + G) to Pyrimidines (T + C) is strictly equal to 1.",
    options: [
      "(A + G) / (T + C) = 1",
      "(A + T) / (G + C) = 1",
      "A = G and T = C",
      "Purines / Pyrimidines = 2",
    ],
    fillBlank: {
      template: "In dsDNA, amount of Adenine strictly equals [?]",
      correct: "Thymine",
      options: ["Thymine", "Guanine", "Cytosine", "Uracil"],
    },
    examTip: "Notice (A + T)/(G + C) varies by species, but (A + G)/(T + C) is ALWAYS 1 in double-stranded DNA!",
  },
  {
    id: "bio-central-dogma",
    subject: "biology",
    chapter: "Molecular Genetics",
    name: "Central Dogma of Molecular Biology",
    tamilName: "மூலக்கூறு உயிரியலின் மையக் கொள்கை",
    formula: "DNA ──(Transcription)──> mRNA ──(Translation)──> Protein",
    description: "Proposed by Francis Crick in 1958 for unidirectional genetic information flow.",
    options: [
      "DNA → mRNA → Protein",
      "Protein → mRNA → DNA",
      "mRNA → DNA → Protein",
      "DNA → Protein → mRNA",
    ],
    fillBlank: {
      template: "DNA to mRNA conversion is called [?]",
      correct: "Transcription",
      options: ["Transcription", "Translation", "Replication", "Transformation"],
    },
    examTip: "Reverse Transcription (RNA → cDNA) occurs in retroviruses like HIV via Reverse Transcriptase (Teminism)!",
  },
  {
    id: "bio-golden-rice",
    subject: "biology",
    chapter: "Biotechnology & Its Applications",
    name: "Golden Rice Genetically Engineered Genes",
    tamilName: "தங்க அரிசி மரபணுக்கள்",
    formula: "psy (daffodil) + crtI (bacterium Erwinia) ──> β-carotene",
    description: "Biofortified transgenic rice providing Provitamin A to combat blindness in developing nations.",
    options: [
      "psy and crtI genes biosynthesize beta-carotene",
      "cry1Ac and cry2Ab genes for pest resistance",
      "bar gene for herbicide tolerance",
      "insulin A and B genes",
    ],
    fillBlank: {
      template: "Golden Rice produces provitamin [?] in the endosperm",
      correct: "A",
      options: ["A", "B12", "C", "D"],
    },
    examTip: "Developed by Ingo Potrykus and Peter Beyer. The yellow-golden endosperm is due to beta-carotene!",
  },
  {
    id: "bio-parthenogenesis",
    subject: "biology",
    chapter: "Reproduction in Organisms",
    name: "Types of Parthenogenesis (Male vs Female)",
    tamilName: "கன்னி இனப்பெருக்க வகைகள்",
    formula: "Arrhenotoky = Males only | Thelytoky = Females only | Amphitoky = Both",
    description: "Development of an embryo from an unfertilized egg cell.",
    options: [
      "Arrhenotoky = Males only (e.g. Honeybees)",
      "Arrhenotoky = Females only",
      "Thelytoky = Males only",
      "Amphitoky = Sterile offspring only",
    ],
    fillBlank: {
      template: "Parthenogenesis where only males are produced is [?]",
      correct: "Arrhenotoky",
      options: ["Arrhenotoky", "Thelytoky", "Amphitoky", "Paedogenesis"],
    },
    examTip: "Honeybee drones are haploid males produced by arrhenotoky from unfertilized eggs!",
  },
  {
    id: "bio-lindeman-energy",
    subject: "biology",
    chapter: "Ecosystem",
    name: "Lindeman's 10% Ecological Efficiency Law",
    tamilName: "லிண்ட்மேனின் 10 விழுக்காடு விதி",
    formula: "Only 10% of energy transfers from one trophic level to the next",
    description: "90% of energy is lost as heat, respiration, and catabolic processes at each step in food chains.",
    options: [
      "10% transferred to next trophic level",
      "50% transferred to next trophic level",
      "90% transferred to next trophic level",
      "1% transferred to next trophic level",
    ],
    fillBlank: {
      template: "At each trophic step, [?]% of energy is transferred to the next level",
      correct: "10%",
      options: ["10%", "50%", "25%", "90%"],
    },
    examTip: "This is why food chains rarely exceed 4 or 5 trophic levels!",
  },
];

