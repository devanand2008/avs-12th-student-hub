import type { Metadata } from "next";
import Link from "@/components/layout/IntentLink";
import { ArrowLeft, BookOpen, CheckSquare, Sparkles, FileText, ArrowUpRight } from "lucide-react";
import MathFormulaGame from "@/components/games/MathFormulaGame";

export const metadata: Metadata = {
  title: "Class 12 Science & Maths Formula Arcade | SkillUp",
  description:
    "Play interactive formula games for Tamil Nadu Class 12: Mathematics, Physics, Chemistry, and Biology. Master laws, reactions, ratios, and formulas easily with speed recall, memory flip, and puzzles.",
};

export default function MathGamePage() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Golden Material Link */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/practice"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#142B63] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Practice Hub</span>
          </Link>

          <div className="flex items-center gap-2">
            <a
              href="/api/pdf/golden-formula-sheet"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Maths Golden Formula Sheet (12 Pages)</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <Link
              href="/notes"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hidden md:inline-flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Handwritten Notes</span>
            </Link>
          </div>
        </div>

        {/* Main Interactive Multi-Subject Game Component */}
        <MathFormulaGame />

        {/* Supporting Study Links */}
        <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Need more study materials for Class 12?
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Solve official SCERT textbook MCQs, read handwritten notes, or ask doubts to the AI Tutor.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/notes"
              className="px-4 py-2 bg-amber-50 text-amber-900 hover:bg-amber-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-amber-200"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>All Notes & Golden PDFs</span>
            </Link>
            <Link
              href="/practice"
              className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>1-Mark MCQs</span>
            </Link>
            <Link
              href="/ai-helper"
              className="px-4 py-2 bg-[#142B63] text-white hover:bg-blue-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Ask AI Tutor</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
