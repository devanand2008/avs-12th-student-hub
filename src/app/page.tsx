import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  FileText,
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
  Video,
  Box,
  ExternalLink,
  Award,
  BookMarked,
  Search,
} from "lucide-react";
import Image from "next/image";
import Link from "@/components/layout/IntentLink";
import BrandLogo from "@/components/layout/BrandLogo";
import InstallButton from "@/components/pwa/InstallButton";
import StudentReadySummary from "@/components/practice/StudentReadySummary";
import { pageMetadata, websiteStructuredData } from "@/lib/seo";

export const metadata = pageMetadata("/");

const FOUNDER_PORTFOLIO_URL = "https://dr-d-r-joshua-skillup.vercel.app/";

const featureCards = [
  {
    title: "Handwritten Notes",
    tag: "A4 REVISION SHEETS",
    icon: FileText,
    href: "/notes",
    action: "Read Notes",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50 border-blue-100",
    description:
      "Handwritten derivations, formula summaries, diagrams, and problem steps in clean student-friendly format.",
  },
  {
    title: "Video Lessons",
    tag: "260+ LESSON GUIDES",
    icon: Video,
    href: "/videos",
    action: "Watch Lessons",
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50 border-purple-100",
    description:
      "Curated topic-by-topic video revisions breaking down core concepts for Physics, Chemistry, Biology and CS.",
  },
  {
    title: "One-Mark MCQs",
    tag: "EXAM QUESTION BANK",
    icon: CheckSquare,
    href: "/practice",
    action: "Start Practice",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50 border-emerald-100",
    description:
      "Official book-back one-mark tests with instant scoring, explanations, and repeated self-evaluation.",
  },
  {
    title: "AI Study Tutor",
    tag: "24/7 BILINGUAL MENTOR",
    icon: Sparkles,
    href: "/ai-helper",
    action: "Ask AI Tutor",
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50 border-indigo-100",
    description:
      "Ask study doubts anytime. Get step-by-step guidance in English, pure Tamil, or easy conversational Tanglish.",
  },
  {
    title: "Tamil & English Textbooks",
    tag: "TN STATE BOARD",
    icon: BookOpen,
    href: "/textbooks",
    action: "Browse Textbooks",
    iconColor: "text-cyan-600",
    iconBg: "bg-cyan-50 border-cyan-100",
    description:
      "Complete Tamil Nadu State Board Class 12 textbooks with in-site responsive PDF viewer and zoom controls.",
  },
  {
    title: "3D Learning Lab",
    tag: "INTERACTIVE VISUALS",
    icon: Box,
    href: "/models",
    action: "Launch 3D Lab",
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50 border-rose-100",
    description:
      "Interactive 3D molecular structures, physics setups, and biological models powered by real-time Three.js graphics.",
  },
];

const studentJourneySteps = [
  {
    step: "01",
    title: "Choose Subject",
    desc: "Select from Physics, Chemistry, Biology, Math, Computer Science, and Arts.",
    icon: BookMarked,
  },
  {
    step: "02",
    title: "Select Chapter",
    desc: "Browse state board unit-wise syllabus modules in Tamil or English medium.",
    icon: Layers,
  },
  {
    step: "03",
    title: "Study Notes",
    desc: "Review concise handwritten notes, derivation steps, and key equations.",
    icon: FileText,
  },
  {
    step: "04",
    title: "Watch Videos",
    desc: "Stream high-yield revision lessons with byte-range instant playback.",
    icon: Video,
  },
  {
    step: "05",
    title: "Practice Questions",
    desc: "Solve book-back one-mark MCQs and measure your exam readiness.",
    icon: CheckSquare,
  },
];

const academicSubjects = [
  {
    id: "sub-physics",
    name: "Physics",
    image: "physics",
    tag: "SCIENCE · CORE",
    color: "from-blue-600 to-cyan-500",
    description: "Electrostatics, Magnetism, Optics, Dual Nature, Semiconductor & Communications.",
    href: "/subjects",
  },
  {
    id: "sub-chemistry",
    name: "Chemistry",
    image: "chemistry",
    tag: "SCIENCE · CORE",
    color: "from-emerald-500 to-teal-600",
    description: "Solid State, Metallurgy, Coordination Chemistry, Organic Reactions & Polymers.",
    href: "/subjects",
  },
  {
    id: "sub-biology",
    name: "Bio-Botany & Zoology",
    image: "botany",
    tag: "BIO STREAM",
    color: "from-teal-500 to-emerald-600",
    description: "Plant Reproduction, Genetics, Biotechnology, Human Physiology & Ecology.",
    href: "/subjects",
  },
  {
    id: "sub-math",
    name: "Mathematics",
    image: "maths",
    tag: "SCIENCE · CORE",
    color: "from-amber-500 to-orange-600",
    description: "Matrices, Complex Numbers, Differential Calculus, Vector Algebra & Probability.",
    href: "/subjects",
  },
  {
    id: "sub-cs",
    name: "Computer Science",
    image: "computer",
    tag: "TECH STREAM",
    color: "from-indigo-600 to-blue-600",
    description: "Python, OOP, Data Structures, SQL Database Management & Web Applications.",
    href: "/subjects",
  },
  {
    id: "sub-commerce",
    name: "Commerce & Accounts",
    image: "english",
    tag: "COMMERCE STREAM",
    color: "from-cyan-600 to-blue-700",
    description: "Management Process, Financial Markets, Partnership Accounts & Economics.",
    href: "/subjects",
  },
];

export default function HomePage() {
  return (
    <main className="landing-page min-h-screen bg-[#F7F9FC] text-[#172033] antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData).replace(/</g, "\\u003c"),
        }}
      />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden px-4 pt-12 pb-16 sm:pt-20 sm:pb-24 text-center bg-gradient-to-b from-[#EBF3FF] via-[#F3F7FF] to-[#F7F9FC]">
        {/* Ambient Subtle Glows */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-5xl z-10 space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/90 border border-blue-200/90 shadow-xs text-left">
            <BrandLogo size={24} />
            <span className="text-xs font-bold text-[#142B63]">
              SkillUp 12th Hub
            </span>
            <span className="h-3 w-px bg-slate-200" />
            <span className="text-[11px] font-semibold text-blue-700">
              Tamil Nadu State Board
            </span>
          </div>

          {/* Requested Headline */}
          <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#142B63] leading-[1.12]">
            Learn Smarter. Score Higher.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#0EA5E9]">
              Grow with SkillUp.
            </span>
          </h1>

          {/* Requested Subtitle */}
          <p className="mx-auto max-w-2xl text-sm sm:text-lg text-slate-600 leading-relaxed">
            Your complete Class 12 learning companion for handwritten notes, video lessons, textbooks, one-mark practice and AI-powered learning.
          </p>

          {/* Requested Actions: Start Learning & Explore Study Materials */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm bg-[#142B63] hover:bg-blue-900 shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <span>Start Learning</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/resources"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-[#142B63] border border-blue-200 bg-white hover:bg-blue-50/70 shadow-xs transition-all active:scale-95"
            >
              <BookOpen size={16} className="text-blue-600" />
              <span>Explore Study Materials</span>
            </Link>

            <InstallButton
              variant="pill"
              className="!w-full sm:!w-auto !py-3 !px-5 !bg-white !text-slate-800 !border !border-slate-200 !shadow-xs"
            />
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
              <p className="text-lg sm:text-xl font-extrabold text-[#142B63]">260+</p>
              <p className="text-[11px] text-slate-500 font-medium">Video Lessons</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
              <p className="text-lg sm:text-xl font-extrabold text-[#142B63]">3,000+</p>
              <p className="text-[11px] text-slate-500 font-medium">Book-Back MCQs</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
              <p className="text-lg sm:text-xl font-extrabold text-[#142B63]">100% Free</p>
              <p className="text-[11px] text-slate-500 font-medium">Open to Students</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
              <p className="text-lg sm:text-xl font-extrabold text-[#142B63]">Tamil & Eng</p>
              <p className="text-[11px] text-slate-500 font-medium">Bilingual Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE OVERVIEW SECTION */}
      <section className="px-4 py-14 max-w-6xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={13} />
            <span>Comprehensive Learning Suite</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142B63] tracking-tight">
            Everything You Need for Class 12 Success
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Tailored tools designed specifically for Tamil Nadu Higher Secondary curriculum.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="group p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center border ${card.iconBg} ${card.iconColor}`}
                    >
                      <Icon size={22} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">
                      {card.tag}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <Link
                    href={card.href}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>{card.action}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* STUDENT EXPERIENCE JOURNEY SECTION */}
      <section className="bg-white border-y border-slate-200/80 px-4 py-14">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Student Learning Pathway
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142B63] tracking-tight">
              How to Study & Score High with SkillUp
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              A structured 5-step approach to master every lesson with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {studentJourneySteps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 relative flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-md">
                        Step {item.step}
                      </span>
                      <Icon size={16} className="text-slate-400" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  {idx < studentJourneySteps.length - 1 && (
                    <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-300">
                      →
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SUBJECTS PREVIEW */}
      <section className="px-4 py-14 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Curriculum Coverage
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142B63] tracking-tight">
              Class 12 Core Subjects
            </h2>
          </div>
          <Link
            href="/subjects"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            <span>Explore All Subjects</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {academicSubjects.map((sub) => (
            <Link
              key={sub.id}
              href={sub.href}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                  {sub.tag}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1.5 group-hover:text-blue-600 transition-colors">
                  {sub.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                  {sub.description}
                </p>
              </div>
              <ChevronRight
                size={18}
                className="text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all shrink-0"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* FOUNDER SPOTLIGHT SECTION */}
      <section className="bg-white border-y border-slate-200/80 px-4 py-14 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-blue-50/40 p-6 sm:p-10 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Founder Image */}
              <div className="md:col-span-4 flex justify-center">
                <div className="relative p-2 rounded-2xl bg-white border border-blue-200 shadow-md">
                  <Image
                    src="/images/joshua-introduction.png"
                    alt="Dr. D. R. Joshua, Founder of SkillUp and Vice Principal of AVS Engineering College"
                    width={180}
                    height={180}
                    className="w-36 h-36 sm:w-44 sm:h-44 object-cover rounded-xl"
                  />
                  <div className="mt-2 text-center">
                    <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                      Founder · SkillUp
                    </span>
                  </div>
                </div>
              </div>

              {/* Founder Bio & Actions */}
              <div className="md:col-span-8 text-center md:text-left space-y-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wide">
                  <Award size={15} />
                  <span>Meet the Founder</span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142B63] font-heading">
                    Dr. D. R. Joshua
                  </h2>
                  <p className="text-sm font-semibold text-blue-700 mt-0.5">
                    Founder, SkillUp · Vice Principal, AVS Engineering College, Salem
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Dedicated to engineering education and school-to-college transition. Dr. Joshua initiated SkillUp as a digital patronship providing Tamil Nadu Higher Secondary students with free, high-quality handwritten study notes, video tutorials, 3D simulations, and AI support.
                </p>

                {/* Requested Buttons: "Learn More" (internal) and "Visit Portfolio" (external) */}
                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <Link
                    href="/founder"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#142B63] hover:bg-blue-900 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                  >
                    <span>Learn More</span>
                    <ArrowRight size={14} />
                  </Link>

                  <a
                    href={FOUNDER_PORTFOLIO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-[#142B63] border border-blue-200 font-bold text-xs shadow-2xs transition-all active:scale-95"
                  >
                    <span>Visit Portfolio</span>
                    <ExternalLink size={13} className="text-blue-600" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PWA MOBILE APP BANNER */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <div className="p-6 sm:p-8 rounded-3xl bg-[#142B63] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-full">
              Mobile App Experience
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold">
              Study Anywhere with the SkillUp PWA
            </h3>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-lg leading-relaxed">
              Install SkillUp directly to your Android phone or iPhone home screen with one tap. Zero app store delay, ultra-fast loading, and offline access.
            </p>
          </div>

          <div className="shrink-0">
            <InstallButton
              variant="pill"
              className="!py-3 !px-6 !text-xs !bg-blue-500 hover:!bg-blue-600 !text-white !font-bold !rounded-xl !shadow-md cursor-pointer"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
