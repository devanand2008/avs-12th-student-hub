import type { Metadata } from "next";
import Link from "@/components/layout/IntentLink";
import { ArrowLeft, BookOpen, CheckSquare, Sparkles } from "lucide-react";
import MathFormulaGame from "@/components/games/MathFormulaGame";

export const metadata: Metadata = {
  title: "Class 12 Maths Formula Game | SkillUp",
  description:
    "Play interactive math formula games for Tamil Nadu State Board Class 12. Learn Matrices, Calculus, Vectors, Complex Numbers, and Geometry formulas easily with speed recall, memory flip, and fill-in-the-blank puzzles.",
};

export default function MathGamePage() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/practice"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#142B63] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Practice Hub</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/notes"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hidden sm:inline-flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Maths Handwritten Notes</span>
            </Link>
          </div>
        </div>

        {/* Main Interactive Game Component */}
        <MathFormulaGame />

        {/* Supporting Study Links */}
        <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Need more practice on Class 12 Mathematics?
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Solve textbook book-back MCQs, download formula cheat sheets, or chat with the AI Math Tutor.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/practice"
              className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Book-Back MCQs</span>
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
