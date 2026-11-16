// Tamil Nadu State Board Class 12 Mathematics Formulas
// Curated syllabus content across Matrices, Complex Numbers, Geometry, Vectors, Calculus, and Probability

export interface MathFormula {
  id: string;
  chapter: string;
  topic: string;
  name: string;
  tamilName?: string;
  formula: string;
  description: string;
  options: string[]; // 4 choices (index 0 is correct initially, shuffled in game)
  fillBlank: {
    template: string; // contains [?]
    correct: string;
    options: string[];
  };
  examTip: string;
}

export const MATH_CHAPTERS = [
  "All Chapters",
  "Matrices & Determinants",
  "Complex Numbers",
  "Inverse Trigonometry",
  "Analytical Geometry",
  "Vector Algebra",
  "Differential Calculus",
  "Integral Calculus",
  "Differential Equations",
  "Probability Distributions",
] as const;

export type MathChapter = (typeof MATH_CHAPTERS)[number];

export const MATH_FORMULAS: MathFormula[] = [
  // 1. Matrices & Determinants
  {
    id: "mat-inv",
    chapter: "Matrices & Determinants",
    topic: "Inverse Matrix",
    name: "Inverse of a Square Matrix A",
    tamilName: "அணியின் நேர்மாறு",
    formula: "A⁻¹ = (1 / |A|) · adj(A)",
    description: "The inverse of non-singular matrix A exists only when determinant |A| ≠ 0.",
    options: [
      "A⁻¹ = (1 / |A|) · adj(A)",
      "A⁻¹ = |A| · adj(A)",
      "A⁻¹ = (1 / adj(A)) · |A|",
      "A⁻¹ = adj(A⁻¹)",
    ],
    fillBlank: {
      template: "A⁻¹ = [?] · adj(A)",
      correct: "1 / |A|",
      options: ["1 / |A|", "|A|", "1 / adj(A)", "|A|²"],
    },
    examTip: "Always verify |A| ≠ 0 first before computing adjoint!",
  },
  {
    id: "mat-ortho",
    chapter: "Matrices & Determinants",
    topic: "Orthogonal Matrix",
    name: "Condition for Orthogonal Matrix",
    tamilName: "செங்குத்து அணி",
    formula: "A · Aᵀ = Aᵀ · A = I",
    description: "A square matrix A is orthogonal if its transpose equals its inverse: A⁻¹ = Aᵀ.",
    options: [
      "A · Aᵀ = Aᵀ · A = I",
      "A · Aᵀ = 0",
      "Aᵀ = -A",
      "|A| = 0",
    ],
    fillBlank: {
      template: "A matrix is orthogonal if A · Aᵀ = [?]",
      correct: "I",
      options: ["I", "0", "-I", "A²"],
    },
    examTip: "For an orthogonal matrix, |A| is always +1 or -1.",
  },
  {
    id: "mat-cramer",
    chapter: "Matrices & Determinants",
    topic: "Cramer's Rule",
    name: "Cramer's Rule for Solving Linear Systems",
    tamilName: "கிராமரின் விதி",
    formula: "x = Δ₁ / Δ,  y = Δ₂ / Δ,  z = Δ₃ / Δ  (Δ ≠ 0)",
    description: "Solves a system of linear equations using determinants when Δ ≠ 0.",
    options: [
      "x = Δ₁ / Δ, y = Δ₂ / Δ, z = Δ₃ / Δ",
      "x = Δ / Δ₁, y = Δ / Δ₂, z = Δ / Δ₃",
      "x = Δ₁ · Δ, y = Δ₂ · Δ, z = Δ₃ · Δ",
      "x = Δ₁ + Δ, y = Δ₂ + Δ, z = Δ₃ + Δ",
    ],
    fillBlank: {
      template: "By Cramer's rule, x = [?] / Δ where Δ ≠ 0",
      correct: "Δ₁",
      options: ["Δ₁", "Δ²", "1", "adj(Δ)"],
    },
    examTip: "If Δ = 0, Cramer's rule fails. Use Gaussian elimination instead.",
  },

  // 2. Complex Numbers
  {
    id: "cplx-euler",
    chapter: "Complex Numbers",
    topic: "Euler's Form",
    name: "Euler's Formula for Complex Numbers",
    tamilName: "ஆய்லரின் வடிவம்",
    formula: "e^(iθ) = cos θ + i sin θ",
    description: "Represents a point on the unit circle in the complex plane.",
    options: [
      "e^(iθ) = cos θ + i sin θ",
      "e^(iθ) = cos θ - i sin θ",
      "e^(iθ) = sin θ + i cos θ",
      "e^(iθ) = tan θ + i cot θ",
    ],
    fillBlank: {
      template: "e^(iθ) = [?] + i sin θ",
      correct: "cos θ",
      options: ["cos θ", "-cos θ", "sin θ", "1"],
    },
    examTip: "Euler's identity: e^(iπ) + 1 = 0 connects e, i, π, 1, and 0!",
  },
  {
    id: "cplx-demoivre",
    chapter: "Complex Numbers",
    topic: "De Moivre's Theorem",
    name: "De Moivre's Theorem",
    tamilName: "டி மாய்வரின் தேற்றம்",
    formula: "(cos θ + i sin θ)ⁿ = cos(nθ) + i sin(nθ)",
    description: "Applies for any real or rational power n.",
    options: [
      "(cos θ + i sin θ)ⁿ = cos(nθ) + i sin(nθ)",
      "(cos θ + i sin θ)ⁿ = cosⁿ θ + i sinⁿ θ",
      "(cos θ + i sin θ)ⁿ = n(cos θ + i sin θ)",
      "(cos θ + i sin θ)ⁿ = cos(θ/n) + i sin(θ/n)",
    ],
    fillBlank: {
      template: "(cos θ + i sin θ)ⁿ = cos(nθ) + [?]",
      correct: "i sin(nθ)",
      options: ["i sin(nθ)", "sin(nθ)", "i cos(nθ)", "i sinⁿ θ"],
    },
    examTip: "First convert (a + ib) to polar form r(cos θ + i sin θ) before using De Moivre's.",
  },
  {
    id: "cplx-roots-unity",
    chapter: "Complex Numbers",
    topic: "Cube Roots of Unity",
    name: "Cube Roots of Unity Properties",
    tamilName: "ஒன்றின் முப்படி மூலங்கள்",
    formula: "1 + ω + ω² = 0  and  ω³ = 1",
    description: "The 3 cube roots of 1 are 1, ω, and ω².",
    options: [
      "1 + ω + ω² = 0 and ω³ = 1",
      "1 + ω + ω² = 1 and ω³ = 0",
      "1 - ω + ω² = 0 and ω³ = -1",
      "ω + ω² = 1 and ω³ = 1",
    ],
    fillBlank: {
      template: "Sum of cube roots of unity: 1 + ω + ω² = [?]",
      correct: "0",
      options: ["0", "1", "-1", "3"],
    },
    examTip: "Use ω³ = 1 to reduce high powers like ω²⁰²⁴ = (ω³)^674 · ω² = ω².",
  },

  // 3. Inverse Trigonometry
  {
    id: "trig-sin-cos-inv",
    chapter: "Inverse Trigonometry",
    topic: "Complementary Angles",
    name: "Sum of Inverse Sine and Cosine",
    tamilName: "நேர்மாறு திரிகோணமிதி கூடுதல்",
    formula: "sin⁻¹(x) + cos⁻¹(x) = π/2  (for x ∈ [-1, 1])",
    description: "The sum of complementary inverse trigonometric functions is always 90° (π/2).",
    options: [
      "sin⁻¹(x) + cos⁻¹(x) = π/2",
      "sin⁻¹(x) + cos⁻¹(x) = π",
      "sin⁻¹(x) - cos⁻¹(x) = π/2",
      "sin⁻¹(x) + cos⁻¹(x) = 1",
    ],
    fillBlank: {
      template: "sin⁻¹(x) + cos⁻¹(x) = [?]  where x ∈ [-1, 1]",
      correct: "π/2",
      options: ["π/2", "π", "2π", "0"],
    },
    examTip: "Likewise, tan⁻¹(x) + cot⁻¹(x) = π/2 and sec⁻¹(x) + csc⁻¹(x) = π/2.",
  },
  {
    id: "trig-tan-add",
    chapter: "Inverse Trigonometry",
    topic: "Addition Formula",
    name: "Addition Formula for tan⁻¹",
    tamilName: "tan⁻¹ கூடுதல் சூத்திரம்",
    formula: "tan⁻¹(x) + tan⁻¹(y) = tan⁻¹((x + y) / (1 - xy))",
    description: "Valid when xy < 1.",
    options: [
      "tan⁻¹((x + y) / (1 - xy))",
      "tan⁻¹((x - y) / (1 + xy))",
      "tan⁻¹((x + y) / (1 + xy))",
      "tan⁻¹(xy / (x + y))",
    ],
    fillBlank: {
      template: "tan⁻¹(x) + tan⁻¹(y) = tan⁻¹(([?] / (1 - xy)))",
      correct: "x + y",
      options: ["x + y", "x - y", "xy", "2x"],
    },
    examTip: "If xy > 1 and x, y > 0, add π to the right-hand side!",
  },

  // 4. Analytical Geometry (Conics)
  {
    id: "geom-parabola",
    chapter: "Analytical Geometry",
    topic: "Parabola",
    name: "Standard Parabola Open Right",
    tamilName: "பரவளையம் சமன்பாடு",
    formula: "y² = 4ax  (Focus: (a, 0), Directrix: x = -a)",
    description: "Symmetric about the x-axis with vertex at the origin (0, 0).",
    options: [
      "y² = 4ax",
      "x² = 4ay",
      "y² = -4ax",
      "x² = -4ay",
    ],
    fillBlank: {
      template: "Focus of standard parabola y² = 4ax is [?]",
      correct: "(a, 0)",
      options: ["(a, 0)", "(0, a)", "(-a, 0)", "(a, a)"],
    },
    examTip: "Length of latus rectum for all parabolas is 4a.",
  },
  {
    id: "geom-ellipse-ecc",
    chapter: "Analytical Geometry",
    topic: "Ellipse",
    name: "Eccentricity of Ellipse (a > b)",
    tamilName: "நீள்வட்டத்தின் மையத்தொலைத் தகவு",
    formula: "e = √(1 - b²/a²)  where e < 1",
    description: "Eccentricity e measures how much the conic section deviates from being circular.",
    options: [
      "e = √(1 - b²/a²)",
      "e = √(1 + b²/a²)",
      "e = √(b²/a² - 1)",
      "e = b / a",
    ],
    fillBlank: {
      template: "For an ellipse (a > b), b² = a² · [?]",
      correct: "(1 - e²)",
      options: ["(1 - e²)", "(e² - 1)", "(1 + e²)", "e²"],
    },
    examTip: "Circle: e = 0. Ellipse: 0 < e < 1. Parabola: e = 1. Hyperbola: e > 1.",
  },
  {
    id: "geom-hyperbola-latus",
    chapter: "Analytical Geometry",
    topic: "Hyperbola",
    name: "Length of Latus Rectum of Ellipse/Hyperbola",
    tamilName: "செவ்வகலத்தின் நீளம்",
    formula: "Length = 2b² / a",
    description: "Chord passing through a focus perpendicular to the major/transverse axis.",
    options: [
      "2b² / a",
      "2a² / b",
      "4b² / a",
      "b² / 2a",
    ],
    fillBlank: {
      template: "Latus rectum of x²/a² - y²/b² = 1 is [?] / a",
      correct: "2b²",
      options: ["2b²", "b²", "4b²", "2a²"],
    },
    examTip: "Formula 2b²/a is identical for both ellipse and hyperbola!",
  },

  // 5. Vector Algebra
  {
    id: "vec-dot",
    chapter: "Vector Algebra",
    topic: "Dot Product",
    name: "Scalar (Dot) Product",
    tamilName: "திசையிலிப் பெருக்கல்",
    formula: "a⃗ · b⃗ = |a⃗| · |b⃗| · cos θ",
    description: "Perpendicular vectors: a⃗ · b⃗ = 0 (since cos 90° = 0).",
    options: [
      "a⃗ · b⃗ = |a⃗| · |b⃗| · cos θ",
      "a⃗ · b⃗ = |a⃗| · |b⃗| · sin θ",
      "a⃗ · b⃗ = |a⃗| + |b⃗|",
      "a⃗ · b⃗ = |a⃗ × b⃗|",
    ],
    fillBlank: {
      template: "Two non-zero vectors are perpendicular if a⃗ · b⃗ = [?]",
      correct: "0",
      options: ["0", "1", "-1", "|a⃗||b⃗|"],
    },
    examTip: "Projection of a⃗ on b⃗ is (a⃗ · b⃗) / |b⃗|.",
  },
  {
    id: "vec-box",
    chapter: "Vector Algebra",
    topic: "Scalar Triple Product",
    name: "Volume of Parallelepiped",
    tamilName: "இணைகரத் திண்மத்தின் கன அளவு",
    formula: "Volume = [a⃗  b⃗  c⃗] = a⃗ · (b⃗ × c⃗)",
    description: "The scalar triple product represents the volume of a parallelepiped with coterminous edges.",
    options: [
      "[a⃗  b⃗  c⃗] = a⃗ · (b⃗ × c⃗)",
      "[a⃗  b⃗  c⃗] = a⃗ × (b⃗ × c⃗)",
      "[a⃗  b⃗  c⃗] = (a⃗ · b⃗) · c⃗",
      "[a⃗  b⃗  c⃗] = |a⃗| + |b⃗| + |c⃗|",
    ],
    fillBlank: {
      template: "Three vectors are coplanar if [a⃗  b⃗  c⃗] = [?]",
      correct: "0",
      options: ["0", "1", "π", "I"],
    },
    examTip: "Cyclic order is preserved: [a⃗ b⃗ c⃗] = [b⃗ c⃗ a⃗] = [c⃗ a⃗ b⃗].",
  },
  {
    id: "vec-triple-cross",
    chapter: "Vector Algebra",
    topic: "Vector Triple Product",
    name: "Vector Triple Product Expansion",
    tamilName: "வெக்டர் முப்பெருக்கல்",
    formula: "a⃗ × (b⃗ × c⃗) = (a⃗ · c⃗)b⃗ - (a⃗ · b⃗)c⃗",
    description: "Remember the BAC-CAB rule: (a⃗ · c⃗)b⃗ - (a⃗ · b⃗)c⃗.",
    options: [
      "(a⃗ · c⃗)b⃗ - (a⃗ · b⃗)c⃗",
      "(a⃗ · b⃗)c⃗ - (a⃗ · c⃗)b⃗",
      "(a⃗ × b⃗) · c⃗",
      "a⃗(b⃗ · c⃗) - b⃗(a⃗ · c⃗)",
    ],
    fillBlank: {
      template: "a⃗ × (b⃗ × c⃗) = (a⃗ · c⃗)[?] - (a⃗ · b⃗)c⃗",
      correct: "b⃗",
      options: ["b⃗", "a⃗", "c⃗", "0⃗"],
    },
    examTip: "Mnemonic: 'BAC minus CAB' rule! The middle vector 'b' comes first.",
  },

  // 6. Differential Calculus
  {
    id: "diff-tan",
    chapter: "Differential Calculus",
    topic: "Trig Derivatives",
    name: "Derivative of tan(x)",
    tamilName: "tan(x) வகையீடு",
    formula: "d/dx [tan(x)] = sec²(x)",
    description: "Rate of change of tangent trigonometric function.",
    options: [
      "sec²(x)",
      "-sec²(x)",
      "sec(x) tan(x)",
      "cot(x)",
    ],
    fillBlank: {
      template: "d/dx [tan(x)] = [?]",
      correct: "sec²(x)",
      options: ["sec²(x)", "-sec²(x)", "sec(x)", "cos²(x)"],
    },
    examTip: "Similarly, d/dx [cot(x)] = -csc²(x). Note the negative sign for 'co' functions!",
  },
  {
    id: "diff-inv-sin",
    chapter: "Differential Calculus",
    topic: "Inverse Trig Derivatives",
    name: "Derivative of sin⁻¹(x)",
    tamilName: "sin⁻¹(x) வகையீடு",
    formula: "d/dx [sin⁻¹(x)] = 1 / √(1 - x²)",
    description: "Defined on the open interval (-1, 1).",
    options: [
      "1 / √(1 - x²)",
      "-1 / √(1 - x²)",
      "1 / (1 + x²)",
      "1 / (1 - x²)",
    ],
    fillBlank: {
      template: "d/dx [sin⁻¹(x)] = 1 / [?]",
      correct: "√(1 - x²)",
      options: ["√(1 - x²)", "(1 + x²)", "√(x² - 1)", "(1 - x²)"],
    },
    examTip: "Derivative of cos⁻¹(x) is simply the negative: -1 / √(1 - x²).",
  },
  {
    id: "diff-quotient",
    chapter: "Differential Calculus",
    topic: "Quotient Rule",
    name: "Quotient Rule of Differentiation",
    tamilName: "வகுத்தல் விதி",
    formula: "d/dx [u / v] = (v · u' - u · v') / v²",
    description: "Differentiating a ratio of two differentiable functions.",
    options: [
      "(v · u' - u · v') / v²",
      "(u · v' - v · u') / v²",
      "(u' · v') / v²",
      "(v · u' + u · v') / v²",
    ],
    fillBlank: {
      template: "d/dx [u / v] = (v · u' - [?]) / v²",
      correct: "u · v'",
      options: ["u · v'", "v · u'", "u' · v'", "u / v"],
    },
    examTip: "Mnemonic: 'Low D-High minus High D-Low, over the square of what's below!'",
  },

  // 7. Integral Calculus
  {
    id: "int-tan-inv",
    chapter: "Integral Calculus",
    topic: "Standard Integrals",
    name: "Integral of 1 / (a² + x²)",
    tamilName: "நிலையான தொகை நுண்கணிதம்",
    formula: "∫ dx / (a² + x²) = (1 / a) · tan⁻¹(x / a) + C",
    description: "One of the most frequently asked standard forms in Class 12 board exams.",
    options: [
      "(1 / a) · tan⁻¹(x / a) + C",
      "tan⁻¹(x / a) + C",
      "(1 / 2a) · ln|(a+x)/(a-x)| + C",
      "(1 / a) · sin⁻¹(x / a) + C",
    ],
    fillBlank: {
      template: "∫ dx / (a² + x²) = [?] · tan⁻¹(x / a) + C",
      correct: "1 / a",
      options: ["1 / a", "1 / 2a", "a", "1 / a²"],
    },
    examTip: "Do not forget the factor (1/a) in front!",
  },
  {
    id: "int-sin-inv",
    chapter: "Integral Calculus",
    topic: "Standard Integrals",
    name: "Integral of 1 / √(a² - x²)",
    tamilName: "sin⁻¹(x/a) தொகையீடு",
    formula: "∫ dx / √(a² - x²) = sin⁻¹(x / a) + C",
    description: "Notice that unlike tan⁻¹, there is NO 1/a coefficient in front!",
    options: [
      "sin⁻¹(x / a) + C",
      "(1 / a) · sin⁻¹(x / a) + C",
      "cos⁻¹(x / a) + C",
      "ln|x + √(a² - x²)| + C",
    ],
    fillBlank: {
      template: "∫ dx / √(a² - x²) = [?] + C",
      correct: "sin⁻¹(x / a)",
      options: ["sin⁻¹(x / a)", "(1/a)sin⁻¹(x/a)", "cos⁻¹(x / a)", "tan⁻¹(x / a)"],
    },
    examTip: "Crucial difference: tan⁻¹ gets 1/a; sin⁻¹ does NOT get 1/a!",
  },
  {
    id: "int-by-parts",
    chapter: "Integral Calculus",
    topic: "Integration by Parts",
    name: "Integration by Parts Formula",
    tamilName: "பகுதி வாரியான தொகையிடல்",
    formula: "∫ u dv = u·v - ∫ v du",
    description: "Choose u using the ILATE rule (Inverse, Log, Algebraic, Trig, Exponential).",
    options: [
      "∫ u dv = u·v - ∫ v du",
      "∫ u dv = u·v + ∫ v du",
      "∫ u dv = u'·v - u·v'",
      "∫ u dv = (u·v) / 2",
    ],
    fillBlank: {
      template: "∫ u dv = u·v - [?]",
      correct: "∫ v du",
      options: ["∫ v du", "∫ u du", "∫ v dv", "u·v"],
    },
    examTip: "ILATE priority helps you choose 'u': Inverse > Log > Algebraic > Trig > Exponential.",
  },
  {
    id: "int-bernoulli",
    chapter: "Integral Calculus",
    topic: "Bernoulli's Formula",
    name: "Bernoulli's Formula for Repeated Integration",
    tamilName: "பெர்னொலியின் சூத்திரம்",
    formula: "∫ u v dx = u·v₁ - u'·v₂ + u''·v₃ - u'''·v₄ + ...",
    description: "Used when u is a polynomial that differentiates to zero after a few steps.",
    options: [
      "u·v₁ - u'·v₂ + u''·v₃ - ...",
      "u·v₁ + u'·v₂ + u''·v₃ + ...",
      "u'·v₁ - u''·v₂ + u'''·v₃ - ...",
      "u·v - u'·v + u''·v - ...",
    ],
    fillBlank: {
      template: "Signs in Bernoulli's formula alternate: + u·v₁ [?] u'·v₂ + u''·v₃ ...",
      correct: "-",
      options: ["-", "+", "×", "/"],
    },
    examTip: "v₁ = ∫ v dx, v₂ = ∫ v₁ dx, and signs strictly alternate (+, -, +, -, ...).",
  },

  // 8. Differential Equations
  {
    id: "de-linear-if",
    chapter: "Differential Equations",
    topic: "Linear Differential Equation",
    name: "Integrating Factor (I.F.) for dy/dx + Py = Q",
    tamilName: "தொகையீட்டுக் காரணி",
    formula: "I.F. = e^(∫ P dx)",
    description: "Multiply through by this factor to make the left-hand side an exact derivative.",
    options: [
      "I.F. = e^(∫ P dx)",
      "I.F. = e^(∫ Q dx)",
      "I.F. = ∫ P dx",
      "I.F. = ln(P)",
    ],
    fillBlank: {
      template: "For dy/dx + Py = Q, the Integrating Factor is e^[?]",
      correct: "∫ P dx",
      options: ["∫ P dx", "∫ Q dx", "P·x", "P²"],
    },
    examTip: "General solution is: y · (I.F.) = ∫ Q · (I.F.) dx + C.",
  },

  // 9. Probability Distributions
  {
    id: "prob-binomial-var",
    chapter: "Probability Distributions",
    topic: "Binomial Distribution",
    name: "Mean and Variance of Binomial Distribution",
    tamilName: "ஈருறுப்புப் பரவலின் சராசரி மற்றும் பரவற்படி",
    formula: "Mean = np,  Variance = npq  (where p + q = 1)",
    description: "Notice that for Binomial distribution, Variance is always strictly less than Mean (npq < np).",
    options: [
      "Mean = np, Variance = npq",
      "Mean = npq, Variance = np",
      "Mean = n/p, Variance = n/pq",
      "Mean = p/n, Variance = pq/n",
    ],
    fillBlank: {
      template: "For a Binomial distribution B(n, p), Variance = [?]",
      correct: "npq",
      options: ["npq", "np", "n²p", "√npq"],
    },
    examTip: "Standard deviation is √(npq). Always remember: Variance < Mean!",
  },
  {
    id: "prob-poisson-mean",
    chapter: "Probability Distributions",
    topic: "Poisson Distribution",
    name: "Property of Poisson Distribution",
    tamilName: "பாய்சான் பரவல் பண்பு",
    formula: "Mean = Variance = λ",
    description: "In a Poisson distribution with parameter λ, the mean and variance are equal.",
    options: [
      "Mean = Variance = λ",
      "Mean = λ, Variance = λ²",
      "Mean = λ, Variance = √λ",
      "Mean = 1/λ, Variance = 1/λ²",
    ],
    fillBlank: {
      template: "In a Poisson distribution, Mean and Variance are both equal to [?]",
      correct: "λ",
      options: ["λ", "λ²", "npq", "0"],
    },
    examTip: "If a problem states 'Mean and Variance are equal', identify it as Poisson immediately!",
  },
];

