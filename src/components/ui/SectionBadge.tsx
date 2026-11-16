import Image from "next/image";
import {
  FileText,
  Video,
  CheckSquare,
  BookOpen,
  Sparkles,
  Box,
  Trophy,
  GraduationCap,
  Atom,
  FlaskConical,
  Dna,
  Calculator,
  Code2,
  TrendingUp,
  Layers,
  Gamepad2,
  LucideIcon,
} from "lucide-react";

export type SectionType =
  | "notes"
  | "videos"
  | "practice"
  | "textbooks"
  | "ai"
  | "lab"
  | "scoreboard"
  | "founder"
  | "game"
  | "physics"
  | "chemistry"
  | "biology"
  | "math"
  | "computer"
  | "commerce";

interface SectionConfig {
  title: string;
  tag: string;
  gradient: string;
  iconBg: string;
  borderGlow: string;
  badgeBg: string;
  badgeText: string;
  icon: LucideIcon;
  subIconText?: string;
  image?: string;
}

export const SECTION_CONFIGS: Record<SectionType, SectionConfig> = {
  notes: {
    title: "Handwritten Notes",
    tag: "A4 FORMULA SHEETS",
    gradient: "from-blue-600 via-sky-500 to-cyan-500",
    iconBg: "bg-gradient-to-br from-blue-600 to-cyan-600",
    borderGlow: "shadow-blue-500/20",
    badgeBg: "bg-blue-50 border-blue-200",
    badgeText: "text-blue-700",
    icon: FileText,
    subIconText: "PDF",
  },
  videos: {
    title: "Video Lessons",
    tag: "260+ VIDEO GUIDES",
    gradient: "from-indigo-600 via-purple-600 to-pink-500",
    iconBg: "bg-gradient-to-br from-indigo-600 to-purple-600",
    borderGlow: "shadow-purple-500/20",
    badgeBg: "bg-purple-50 border-purple-200",
    badgeText: "text-purple-700",
    icon: Video,
    subIconText: "HD",
  },
  practice: {
    title: "One-Mark MCQs",
    tag: "3,000+ QUESTION BANK",
    gradient: "from-emerald-600 via-teal-500 to-cyan-500",
    iconBg: "bg-gradient-to-br from-emerald-600 to-teal-600",
    borderGlow: "shadow-emerald-500/20",
    badgeBg: "bg-emerald-50 border-emerald-200",
    badgeText: "text-emerald-700",
    icon: CheckSquare,
    subIconText: "MCQ",
  },
  textbooks: {
    title: "TN State Textbooks",
    tag: "DIGITAL READER",
    gradient: "from-cyan-600 via-blue-600 to-indigo-600",
    iconBg: "bg-gradient-to-br from-cyan-600 to-blue-700",
    borderGlow: "shadow-cyan-500/20",
    badgeBg: "bg-cyan-50 border-cyan-200",
    badgeText: "text-cyan-800",
    icon: BookOpen,
    subIconText: "TN",
  },
  ai: {
    title: "AI Study Tutor",
    tag: "24/7 BILINGUAL MENTOR",
    gradient: "from-purple-600 via-violet-600 to-indigo-700",
    iconBg: "bg-gradient-to-br from-violet-600 to-indigo-700",
    borderGlow: "shadow-violet-500/20",
    badgeBg: "bg-violet-50 border-violet-200",
    badgeText: "text-violet-700",
    icon: Sparkles,
    subIconText: "AI",
  },
  lab: {
    title: "3D Learning Lab",
    tag: "INTERACTIVE THREE.JS",
    gradient: "from-rose-500 via-pink-600 to-amber-500",
    iconBg: "bg-gradient-to-br from-rose-500 to-amber-600",
    borderGlow: "shadow-rose-500/20",
    badgeBg: "bg-rose-50 border-rose-200",
    badgeText: "text-rose-700",
    icon: Box,
    subIconText: "3D",
  },
  scoreboard: {
    title: "Student Scoreboard",
    tag: "RANKS & STREAKS",
    gradient: "from-amber-500 via-orange-500 to-yellow-500",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    borderGlow: "shadow-amber-500/25",
    badgeBg: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-800",
    icon: Trophy,
    subIconText: "PTS",
  },
  founder: {
    title: "Founder & Leadership",
    tag: "ACADEMIC ADVISORY",
    gradient: "from-slate-800 via-blue-900 to-indigo-950",
    iconBg: "bg-gradient-to-br from-[#142B63] to-[#0A1633]",
    borderGlow: "shadow-blue-900/30",
    badgeBg: "bg-slate-100 border-slate-300",
    badgeText: "text-slate-800",
    icon: GraduationCap,
    subIconText: "DR",
    image: "/images/joshua-introduction.png",
  },
  game: {
    title: "Math Formula Quest",
    tag: "MATH FORMULA GAME",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    borderGlow: "shadow-amber-500/20",
    badgeBg: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-700",
    icon: Gamepad2,
    subIconText: "PLAY",
  },
  physics: {
    title: "Physics",
    tag: "ELECTROSTATICS & OPTICS",
    gradient: "from-blue-600 via-sky-500 to-cyan-500",
    iconBg: "bg-gradient-to-br from-blue-600 to-cyan-600",
    borderGlow: "shadow-blue-500/20",
    badgeBg: "bg-blue-50 border-blue-200",
    badgeText: "text-blue-700",
    icon: Atom,
    image: "/subject-images/physics.jpg",
  },
  chemistry: {
    title: "Chemistry",
    tag: "ORGANIC & INORGANIC",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    borderGlow: "shadow-emerald-500/20",
    badgeBg: "bg-emerald-50 border-emerald-200",
    badgeText: "text-emerald-700",
    icon: FlaskConical,
    image: "/subject-images/chemistry.jpg",
  },
  biology: {
    title: "Bio-Botany & Zoology",
    tag: "PHYSIOLOGY & GENETICS",
    gradient: "from-teal-500 via-emerald-600 to-green-500",
    iconBg: "bg-gradient-to-br from-teal-500 to-emerald-600",
    borderGlow: "shadow-teal-500/20",
    badgeBg: "bg-teal-50 border-teal-200",
    badgeText: "text-teal-700",
    icon: Dna,
    image: "/subject-images/botany.jpg",
  },
  math: {
    title: "Mathematics",
    tag: "CALCULUS & MATRICES",
    gradient: "from-amber-500 via-orange-500 to-amber-600",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    borderGlow: "shadow-amber-500/20",
    badgeBg: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-800",
    icon: Calculator,
    image: "/subject-images/mathematics.jpg",
  },
  computer: {
    title: "Computer Science",
    tag: "PYTHON & SQL DATABASE",
    gradient: "from-indigo-600 via-purple-600 to-indigo-700",
    iconBg: "bg-gradient-to-br from-indigo-600 to-purple-600",
    borderGlow: "shadow-indigo-500/20",
    badgeBg: "bg-indigo-50 border-indigo-200",
    badgeText: "text-indigo-700",
    icon: Code2,
    image: "/subject-images/computer-science.jpg",
  },
  commerce: {
    title: "Commerce & Accounts",
    tag: "COMMERCE STREAM",
    gradient: "from-cyan-600 via-blue-600 to-indigo-700",
    iconBg: "bg-gradient-to-br from-cyan-600 to-blue-700",
    borderGlow: "shadow-cyan-500/20",
    badgeBg: "bg-cyan-50 border-cyan-200",
    badgeText: "text-cyan-800",
    icon: TrendingUp,
    image: "/subject-images/english.jpg",
  },
};

interface SectionBadgeProps {
  type: SectionType;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  className?: string;
}

export default function SectionBadge({
  type,
  size = "md",
  showLabel = false,
  className = "",
}: SectionBadgeProps) {
  const config = SECTION_CONFIGS[type] || SECTION_CONFIGS.notes;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "w-8 h-8 rounded-lg",
    md: "w-11 h-11 rounded-xl",
    lg: "w-14 h-14 rounded-2xl",
    xl: "w-16 h-16 rounded-2xl",
  };

  const iconSizes = {
    sm: 15,
    md: 20,
    lg: 26,
    xl: 30,
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative ${sizeClasses[size]} ${config.iconBg} text-white flex items-center justify-center shadow-md ${config.borderGlow} transition-transform duration-200 group-hover:scale-105 group-hover:rotate-1 shrink-0 overflow-hidden`}
      >
        {/* Subtle geometric glass shine */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 pointer-events-none" />

        {/* Crisp vector icon */}
        <Icon size={iconSizes[size]} className="relative z-10 drop-shadow-xs" />

        {/* Small corner pill indicator */}
        {config.subIconText && (
          <span className="absolute bottom-0.5 right-0.5 bg-black/40 backdrop-blur-xs text-[8px] font-black px-1 rounded-xs tracking-tighter uppercase text-white/90">
            {config.subIconText}
          </span>
        )}
      </div>

      {showLabel && (
        <div className="min-w-0">
          <span
            className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.badgeBg} ${config.badgeText}`}
          >
            {config.tag}
          </span>
          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
            {config.title}
          </h4>
        </div>
      )}
    </div>
  );
}

