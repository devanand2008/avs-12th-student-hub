import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  FileText,
  Headphones,
  Languages,
  Sparkles,
  GraduationCap,
  Layers,
  Phone,
  ShieldCheck,
  ChevronRight,
  Compass,
  Smartphone,
  Zap,
  WifiOff,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import BrandLogo from "@/components/layout/BrandLogo";
import InstallButton from "@/components/pwa/InstallButton";


const features = [
  {
    index: "01",
    title: "Handwritten Notes",
    tag: "FACULTY CURATED",
    icon: FileText,
    href: "/notes",
    action: "Explore Notes",
    color: "from-blue-600 via-blue-500 to-cyan-500",
    tagBg: "bg-blue-50 text-blue-700 border-blue-200",
    iconGradient: "from-blue-600 to-cyan-600",
    description:
      "Step-by-step verified handwritten derivations, formula sheets, and chapter definitions curated by senior AVS faculty.",
    highlights: [
      "Formula & derivation cheat-sheets",
      "Neat diagrams with SI units",
      "Verified by senior AVS teachers",
    ],
  },
  {
    index: "02",
    title: "In-Book & Creative MCQs",
    tag: "EXAM QUESTION BANK",
    icon: CheckSquare,
    href: "/practice",
    action: "Practice MCQs",
    color: "from-cyan-500 via-teal-500 to-emerald-500",
    tagBg: "bg-cyan-50 text-teal-700 border-cyan-200",
    iconGradient: "from-cyan-500 to-teal-600",
    description:
      "Distinctly separated In-Book and Out-of-Book practice sets with full explanations and instant answer modes.",
    highlights: [
      "Instant feedback & exam modes",
      "Official TN board answer keys",
      "Step reasoning for each question",
    ],
  },
  {
    index: "03",
    title: "NotebookLM Video Guides",
    tag: "STUDY VIDEOS & AUDIO",
    icon: Headphones,
    href: "/videos",
    action: "Watch Guides",
    color: "from-indigo-600 via-purple-600 to-pink-500",
    tagBg: "bg-purple-50 text-purple-700 border-purple-200",
    iconGradient: "from-indigo-600 to-purple-600",
    description:
      "High-yield conversational audio & video guides breaking down core syllabus concepts for effortless revision.",
    highlights: [
      "Unit breakdown for quick revision",
      "Audio revision of core definitions",
      "Optimized for mobile playback",
    ],
  },
  {
    index: "04",
    title: "Official 12th Textbooks",
    tag: "TN STATE BOARD",
    icon: BookOpen,
    href: "/textbooks",
    action: "Read Textbooks",
    color: "from-emerald-500 via-teal-600 to-cyan-600",
    tagBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconGradient: "from-emerald-600 to-teal-600",
    description:
      "Instant in-site interactive reader and PDF downloads for all Tamil Nadu State Board 12th standard subjects.",
    highlights: [
      "English & Tamil medium editions",
      "Volume 1 & Volume 2 complete",
      "Interactive in-site reader with zoom",
    ],
  },
  {
    index: "05",
    title: "SkillUp AI Study Assistant",
    tag: "24/7 BILINGUAL TUTOR",
    icon: Sparkles,
    href: "/ai-helper",
    action: "Ask AI Tutor",
    color: "from-purple-600 via-fuchsia-600 to-indigo-600",
    tagBg: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    iconGradient: "from-purple-600 to-fuchsia-600",
    description:
      "Ask study doubts anytime. Get step-by-step explanations in English, pure Tamil, or easy Tanglish.",
    highlights: [
      "Tamil + English explanations",
      "Instant doubt solver with formulas",
      "Grounded in official textbooks",
    ],
  },
];

const subjects = [
  {
    id: "sub-physics",
    name: "Physics",
    image: "physics",
    tag: "SCIENCE · CORE",
    units: "10 Units",
    mcqs: "160 MCQs",
    color: "from-blue-600 to-cyan-500",
    tagBg: "bg-blue-50 text-blue-700 border-blue-200",
    borderHover: "hover:border-blue-400",
    description:
      "Electrostatics, Magnetism, Optics, Modern Physics and Electronics with handwritten derivations.",
    href: "/subjects",
  },
  {
    id: "sub-chemistry",
    name: "Chemistry",
    image: "chemistry",
    tag: "SCIENCE · CORE",
    units: "15 Units",
    mcqs: "210 MCQs",
    color: "from-emerald-500 to-teal-500",
    tagBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    borderHover: "hover:border-emerald-400",
    description:
      "Solid State, Coordination Compounds, Organic Reactions, Electrochemistry and Metallurgy concepts.",
    href: "/subjects",
  },
  {
    id: "sub-mathematics",
    name: "Mathematics",
    image: "mathematics",
    tag: "SCIENCE & ENG",
    units: "12 Units",
    mcqs: "180 MCQs",
    color: "from-amber-500 to-orange-500",
    tagBg: "bg-amber-50 text-amber-700 border-amber-200",
    borderHover: "hover:border-amber-400",
    description:
      "Matrices, Complex Numbers, Differential Calculus, Integral Calculus and Probability Distributions.",
    href: "/subjects",
  },
  {
    id: "sub-computer-science",
    name: "Computer Science",
    image: "computer-science",
    tag: "CS STREAM",
    units: "16 Chapters",
    mcqs: "150 MCQs",
    color: "from-indigo-600 to-purple-600",
    tagBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    borderHover: "hover:border-indigo-400",
    description:
      "Object-Oriented Programming with Python, Data Abstraction, Algorithms, SQL, and CSV manipulation.",
    href: "/subjects",
  },
  {
    id: "sub-botany",
    name: "Bio-Botany",
    image: "botany",
    tag: "BIO STREAM",
    units: "10 Chapters",
    mcqs: "120 MCQs",
    color: "from-teal-500 to-emerald-600",
    tagBg: "bg-teal-50 text-teal-700 border-teal-200",
    borderHover: "hover:border-teal-400",
    description:
      "Reproduction in Plants, Classical Genetics, Molecular Genetics, Plant Tissue Culture and Ecosystem.",
    href: "/subjects",
  },
  {
    id: "sub-zoology",
    name: "Bio-Zoology",
    image: "zoology",
    tag: "BIO STREAM",
    units: "12 Chapters",
    mcqs: "130 MCQs",
    color: "from-rose-500 to-pink-600",
    tagBg: "bg-rose-50 text-rose-700 border-rose-200",
    borderHover: "hover:border-rose-400",
    description:
      "Human Reproduction, Immunology, Genetics, Microbes in Human Welfare and Environmental Issues.",
    href: "/subjects",
  },
  {
    id: "sub-tamil",
    name: "பொதுத்தமிழ்",
    image: "tamil",
    tag: "LANGUAGE",
    units: "8 இயல்கள்",
    mcqs: "140 MCQs",
    color: "from-red-500 to-rose-600",
    tagBg: "bg-red-50 text-red-700 border-red-200",
    borderHover: "hover:border-red-400",
    description:
      "செய்யுள், உரைநடை, இலக்கணம், துணைப்பாடம் மற்றும் அரசு பொதுத்தேர்வு படைப்பாக்கப் பயிற்சிகள்.",
    href: "/textbooks?search=Tamil",
  },
  {
    id: "sub-english",
    name: "General English",
    image: "english",
    tag: "LANGUAGE",
    units: "6 Units",
    mcqs: "110 MCQs",
    color: "from-sky-500 to-blue-600",
    tagBg: "bg-sky-50 text-sky-700 border-sky-200",
    borderHover: "hover:border-sky-400",
    description:
      "Prose, Poetry, Supplementary Reader, Grammar, Vocabulary, and Comprehensive reading skills.",
    href: "/textbooks?search=English",
  },
];

export default function HomePage() {
  return (
    <main className="landing-page min-h-screen bg-[#eff5ff] text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center bg-gradient-to-b from-[#e3eeff] via-[#eff5ff] to-[#f8fbff]">
        {/* Floating Ambient Glow Orbs */}
        <div className="orb-animate absolute -top-16 -right-16 w-80 h-80 bg-blue-400/25 rounded-full blur-3xl pointer-events-none" />
        <div className="orb-animate-2 absolute -bottom-20 -left-20 w-96 h-96 bg-cyan-400/25 rounded-full blur-3xl pointer-events-none" />
        <div className="orb-animate-3 absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="reference-grid absolute inset-0 opacity-25 pointer-events-none" />

        <div className="relative mx-auto max-w-6xl z-10">
          {/* Brand Badge */}
          <div className="mb-8 inline-flex items-center gap-3.5 px-5 py-2.5 rounded-3xl bg-white/90 border-2 border-blue-200/80 backdrop-blur-md shadow-lg shadow-blue-900/5 text-left transition-all hover:scale-[1.02]">
            <div className="w-10 h-10 rounded-2xl bg-white border border-blue-200/90 p-1 flex items-center justify-center shadow-xs shrink-0">
              <BrandLogo size={34} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                SkillUp Learning Hub
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                  CLASS 12
                </span>
              </p>
              <p className="text-[10px] font-bold text-blue-600 mt-0.5">
                Tamil Nadu · Higher Secondary Academic Initiative
              </p>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-5xl font-heading text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-7xl">
            Prepare Smarter for Your
            <br />
            <span className="relative inline-block mx-2">
              <span className="shimmer-text">12th Standard</span>
            </span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500">
              Board Exams
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base sm:text-xl leading-relaxed text-slate-600">
            Access handwritten notes, unit-wise one-mark questions, learning videos and{" "}
            <span className="font-bold text-blue-600">
              AI-powered study support
            </span>{" "}
            — all in one unified platform.
          </p>

          {/* Call to Actions */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-white font-bold text-sm overflow-hidden shadow-electric transition-all transform hover:-translate-y-1 hover:shadow-glow-blue active:scale-95"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb, #0ea5e9)" }}
            >
              <span>Start Learning Free</span>
              <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-sm text-blue-700 border-2 border-blue-200 bg-white/80 hover:bg-white backdrop-blur-md transition-all transform hover:-translate-y-0.5 shadow-subtle active:scale-95"
            >
              <GraduationCap size={18} className="text-blue-600" />
              <span>Student Sign In</span>
              <ChevronRight size={16} />
            </Link>
            <InstallButton
              variant="pill"
              className="px-6 py-4 rounded-2xl !bg-[#071a3d] hover:!bg-[#153e78] !text-white shadow-md border border-blue-900/60"
            />
          </div>

          {/* 4 Stat Highlights in Glassmorphic Cards */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3.5 sm:grid-cols-4">
            {[
              { value: "8 Core", label: "Subjects Covered", icon: BookOpen, color: "text-blue-600" },
              { value: "4,500+", label: "Unit-wise MCQs", icon: CheckSquare, color: "text-teal-600" },
              { value: "100%", label: "Handwritten Notes", icon: FileText, color: "text-indigo-600" },
              { value: "AI", label: "Tamil + English Tutor", icon: Languages, color: "text-purple-600" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-panel rounded-2xl p-4 text-center shadow-subtle hover:scale-105 transition-all"
              >
                <div className={`flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-black ${stat.color}`}>
                  <stat.icon size={19} />
                  <span>{stat.value}</span>
                </div>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 Academic Knowledge Pillars (Colorful Card Design) */}
      <section id="features" className="relative px-4 py-20 sm:py-28 bg-[#f8fbff]">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase text-blue-600 bg-blue-50 border border-blue-200/80 shadow-xs">
              ACADEMIC KNOWLEDGE PILLARS
            </span>
            <h2 className="mt-4 font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Engineered for Board Exam{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500">
                Top Scorers
              </span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 max-w-lg mx-auto">
              A comprehensive curriculum-focused ecosystem for Tamil Nadu 12th standard students, from your first revision to the final public exam.
            </p>
          </div>

          {/* 5 Colorful Feature Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="info-card-capsule group relative flex flex-col justify-between rounded-3xl bg-white/95 backdrop-blur-xl border border-blue-100/90 p-5 sm:p-6 shadow-md hover:border-blue-400 transition-all duration-300 overflow-hidden"
              >
                {/* Top colored gradient line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${feature.color}`}
                />

                {/* Ambient corner aura */}
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />

                {/* Big watermark index */}
                <span
                  className="absolute bottom-2 right-3 text-4xl sm:text-5xl font-black text-slate-100 select-none pointer-events-none font-mono"
                  aria-hidden="true"
                >
                  {feature.index}
                </span>

                <div className="space-y-3.5 relative z-10">
                  {/* Icon & Badge Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${feature.iconGradient} text-white flex items-center justify-center shadow-lg ring-4 ring-blue-500/10 group-hover:scale-110 group-hover:rotate-3 transition-transform`}
                    >
                      <feature.icon size={22} />
                    </div>
                    <span
                      className={`text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full border ${feature.tagBg}`}
                    >
                      {feature.tag}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                      {feature.description}
                    </p>
                  </div>

                  {/* Bullet Highlights */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    {feature.highlights.map((h, hi) => (
                      <div
                        key={hi}
                        className="flex items-start gap-1.5 text-[11px] font-semibold text-slate-600"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 mt-4 border-t border-slate-100 relative z-10">
                  <Link
                    href={feature.href}
                    className="inline-flex items-center justify-between w-full px-4 py-2.5 min-h-[44px] rounded-xl bg-blue-50/80 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-bold transition-all group-hover:shadow-md active:scale-95"
                  >
                    <span>{feature.action}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core 12th Subjects Section (Colorful Academic Cards) */}
      <section className="relative px-4 py-20 sm:py-28 bg-[#eef4ff] overflow-hidden">
        {/* Subtle background glow */}
        <div className="orb-animate absolute -right-36 top-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="orb-animate-2 absolute -left-32 bottom-0 w-96 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold tracking-widest uppercase text-blue-600 bg-white border border-blue-200/80 shadow-xs">
                TN STATE BOARD CURRICULUM
              </span>
              <h2 className="mt-3 font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
                12th Standard{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  Subjects & Chapters
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                Explore verified handwritten notes, in-book questions, revision videos and AI tutoring tailored to each subject.
              </p>
            </div>
            <Link
              href="/subjects"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-xs font-bold text-blue-700 border border-blue-200/80 shadow-xs transition-all hover:scale-105 active:scale-95"
            >
              <span>View All Chapters</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* 8 Colorful Academic Subject Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {subjects.map((subject) => (
              <Link
                key={subject.id}
                href={subject.href}
                className={`academic-card group relative flex flex-col rounded-3xl overflow-hidden border border-blue-100/80 bg-white shadow-subtle ${subject.borderHover}`}
              >
                {/* Image Banner with Scrim and Floating Title */}
                <div className="aspect-[16/10] w-full bg-blue-100 overflow-hidden relative">
                  <Image
                    src={`/subject-images/${subject.image}.jpg`}
                    alt={subject.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/85 via-blue-900/30 to-transparent" />
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${subject.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                  />

                  {/* Top Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/25">
                      {subject.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <span className="absolute bottom-3 left-3 text-white font-extrabold text-lg drop-shadow-md">
                    {subject.name}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {subject.description}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[11px]">
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                      <span>{subject.units}</span>
                      <span>·</span>
                      <span className="text-teal-600">{subject.mcqs}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                      <span>Explore</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Interactive 3D Lab Banner */}
          <Link
            href="/models"
            className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-blue-200 bg-white/80 backdrop-blur-md p-6 shadow-sm hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md group-hover:rotate-6 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                  Interactive 3D Learning Lab
                </h4>
                <p className="text-xs text-slate-500">
                  Manipulate 3D physical models, molecular structures, and interactive animations in real-time.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
              <span>Open 3D Lab</span>
              <ArrowRight size={14} />
            </span>
          </Link>
        </div>
      </section>

      {/* PWA Mobile App Spotlight Section */}
      <section className="relative px-4 py-16 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#071a3d] via-[#103774] to-[#1d4ed8] p-8 sm:p-12 text-white shadow-2xl overflow-hidden">
            {/* Glowing orbs in background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-[11px] font-bold text-cyan-200 uppercase tracking-wider">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Progressive Web App (PWA)</span>
                </div>
                <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                  Study Anywhere on Mobile — <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">
                    Works Offline & 1-Tap Launch
                  </span>
                </h2>
                <p className="text-sm text-blue-100/90 leading-relaxed max-w-xl">
                  Install SkillUp directly to your phone’s home screen with zero storage overhead. No App Store or Play Store login required — works on both Android and iPhone.
                </p>

                {/* 3 Mobile Badges */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs text-cyan-200">
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Instant 1-Tap</span>
                    </div>
                    <p className="text-[11px] text-blue-100">Launches like a native phone app</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs text-cyan-200">
                      <WifiOff className="w-4 h-4 text-emerald-300" />
                      <span>Offline Notes</span>
                    </div>
                    <p className="text-[11px] text-blue-100">Review notes even without Internet</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs text-cyan-200">
                      <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                      <span>Zero App Store Lag</span>
                    </div>
                    <p className="text-[11px] text-blue-100">Under 2 MB lightweight PWA</p>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <InstallButton
                    variant="pill"
                    className="!py-3.5 !px-6 !text-sm !shadow-glow-blue cursor-pointer"
                  />
                  <span className="text-xs text-blue-200">
                    Supports Android, iOS Safari & Desktop
                  </span>
                </div>
              </div>

              {/* Graphic / Visual Phone Mockup */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-64 sm:w-72 rounded-[2.5rem] p-3 bg-slate-900 border-4 border-slate-700 shadow-2xl">
                  {/* Speaker Notch */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-slate-900" />
                  </div>
                  {/* Screen Content */}
                  <div className="rounded-[2rem] bg-[#eff5ff] p-4 text-slate-900 pt-8 space-y-3 overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          SU
                        </div>
                        <span className="font-extrabold text-xs text-[#071A3D]">
                          SkillUp
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-800">
                        INSTALLED
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white shadow-xs border border-blue-100 space-y-1">
                      <div className="text-[10px] font-bold text-blue-600 uppercase">
                        Quick Practice
                      </div>
                      <div className="text-xs font-black text-slate-800">
                        Physics: Electrostatics
                      </div>
                      <div className="text-[10px] text-slate-500">
                        160 MCQs · 10 Derivations
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xs space-y-1">
                      <div className="text-[10px] font-bold text-cyan-200">
                        AI Study Tutor
                      </div>
                      <div className="text-xs font-semibold">
                        Ask any formula or doubt 24/7
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-around text-slate-400 border-t border-slate-200 text-[9px] font-medium">
                      <span className="text-blue-600 font-bold">Home</span>
                      <span>Notes</span>
                      <span>MCQs</span>
                      <span>AI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Patron Contact Box */}
      <section className="px-4 py-16 bg-white border-y border-blue-100/80">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-blue-200/90 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-cyan-50/60 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-subtle">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#071a3d] to-blue-900 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                SU
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                  Academic Guidance Desk
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Dr. Joshua, Vice Principal & Academic Patron
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  AVS Engineering College (Autonomous), Salem · Supporting Tamil Nadu 12th Standard Students
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="tel:+917200008770"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#071a3d] hover:bg-blue-900 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <Phone size={14} className="text-cyan-300" />
                <span>+91 7200008770</span>
              </a>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <ShieldCheck size={14} />
                <span>Join Free</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-600 px-4 py-20 text-center text-white sm:py-24">
        {/* Floating background lights */}
        <div className="orb-animate absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="orb-animate-2 absolute -bottom-20 -right-20 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center z-10">
          <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center shadow-lg">
            <BrandLogo size={52} />
          </div>
          <span className="mt-6 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-black tracking-widest uppercase">
            FREE FOR ALL 12TH STUDENTS
          </span>
          <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
            Start Your Free 12th Exam
            <br />
            <span className="text-cyan-200">Preparation Today</span>
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-blue-100">
            Open to 12th standard students across Salem and Tamil Nadu. Practice one-mark questions, revise with faculty notes, and study with your bilingual AI tutor.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-white px-7 py-4 text-xs font-extrabold text-blue-900 shadow-xl hover:bg-blue-50 transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              <GraduationCap size={16} className="text-blue-600" />
              <span>Create Free Account</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-md px-7 py-4 text-xs font-bold text-white hover:bg-white/20 transition-all active:scale-95"
            >
              <span>Already a member? Sign in</span>
              <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
