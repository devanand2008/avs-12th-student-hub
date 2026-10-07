"use client";

import { useState } from "react";
import {
  Check,
  Sparkles,
  BookOpen,
  ArrowRight,
  Dna,
  Code2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface SampleQuestion {
  stream: "cs" | "bio";
  badge: string;
  question: string;
  questionTamil: string;
  chapter: string;
  options: { key: "A" | "B" | "C" | "D"; text: string }[];
  correct: "A" | "B" | "C" | "D";
  explanation: string;
}

const SAMPLE_QUESTIONS: SampleQuestion[] = [
  {
    stream: "cs",
    badge: "CS · Book-In (SCERT)",
    chapter: "Chapter 1: Functions",
    question:
      "Which of the following functions does not modify arguments and yields identical output for identical arguments?",
    questionTamil:
      "பின்வருவனவற்றில் எந்தச் செயற்கூறு செயலுருபுகளை மாற்றியமைக்காது மற்றும் அதே உள்ளீட்டிற்கு அதே வெளியீட்டைத் தரும்?",
    options: [
      { key: "A", text: "Pure Function" },
      { key: "B", text: "Impure Function" },
      { key: "C", text: "Dynamic Function" },
      { key: "D", text: "Recursive Function" },
    ],
    correct: "A",
    explanation:
      "Pure functions have no side effects on external state or input arguments (SCERT CS Ch 1, Sec 1.2).",
  },
  {
    stream: "bio",
    badge: "Bio-Botany · Book-In (SCERT)",
    chapter: "Chapter 1: Asexual & Sexual Reproduction",
    question:
      "The innermost nutritive layer of the anther wall that nourishes developing microspores is called:",
    questionTamil:
      "வளரும் நுண்வித்துக்களுக்கு ஊட்டமளிக்கும் மகரந்தப்பையின் உட்புற அடுக்கு எது?",
    options: [
      { key: "A", text: "Endothecium" },
      { key: "B", text: "Middle layers" },
      { key: "C", text: "Tapetum" },
      { key: "D", text: "Epidermis" },
    ],
    correct: "C",
    explanation:
      "Tapetum is the innermost nutritive tissue layer essential for pollen wall formation and microspore nutrition (SCERT Bio-Botany Ch 1).",
  },
];

export default function HeroInteractiveWidget() {
  const [activeTab, setActiveTab] = useState<"cs" | "bio">("cs");
  const [selectedKey, setSelectedKey] = useState<"A" | "B" | "C" | "D" | null>(
    null,
  );
  const [showTamil, setShowTamil] = useState(false);

  const currentQ =
    SAMPLE_QUESTIONS.find((q) => q.stream === activeTab) || SAMPLE_QUESTIONS[0];

  const handleSelect = (key: "A" | "B" | "C" | "D") => {
    setSelectedKey(key);
  };

  const handleTabChange = (stream: "cs" | "bio") => {
    setActiveTab(stream);
    setSelectedKey(null);
  };

  const isAnswered = selectedKey !== null;
  const isCorrect = selectedKey === currentQ.correct;

  return (
    <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white/95 p-5 sm:p-6 shadow-xl backdrop-blur-md transition-all">
      {/* Top Header Badge & Stream Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-slate-100">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>Live One-Mark MCQ Preview</span>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleTabChange("cs")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              activeTab === "cs"
                ? "bg-white text-blue-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>Comp. Sci</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("bio")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              activeTab === "bio"
                ? "bg-white text-emerald-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Dna className="w-3 h-3" />
            <span>Biology</span>
          </button>
        </div>
      </div>

      {/* Chapter & Bilingual Toggle */}
      <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold text-slate-600 truncate max-w-[210px]">
          {currentQ.chapter}
        </span>
        <button
          type="button"
          onClick={() => setShowTamil(!showTamil)}
          className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 decoration-blue-300"
        >
          {showTamil ? "Show English" : "தமிழ் வடிவம்"}
        </button>
      </div>

      {/* Question Text */}
      <div className="mt-3">
        <h4 className="text-sm sm:text-base font-bold text-[#071A3D] leading-snug">
          {showTamil ? currentQ.questionTamil : currentQ.question}
        </h4>
      </div>

      {/* Options List */}
      <div className="mt-4 space-y-2">
        {currentQ.options.map((opt) => {
          const isThisSelected = selectedKey === opt.key;
          const isThisCorrect = opt.key === currentQ.correct;

          let btnClasses =
            "w-full text-left p-3 rounded-xl border transition-all text-xs sm:text-sm font-medium flex items-center justify-between ";

          if (!isAnswered) {
            btnClasses +=
              "border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-slate-700 bg-slate-50/40";
          } else if (isThisSelected) {
            if (isThisCorrect) {
              btnClasses +=
                "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500";
            } else {
              btnClasses +=
                "border-rose-400 bg-rose-50 text-rose-900 font-bold ring-1 ring-rose-400";
            }
          } else if (isThisCorrect) {
            btnClasses +=
              "border-emerald-400 bg-emerald-50/70 text-emerald-800 font-bold";
          } else {
            btnClasses +=
              "border-slate-100 bg-slate-50/20 text-slate-400 opacity-60";
          }

          return (
            <button
              key={opt.key}
              type="button"
              disabled={isAnswered}
              onClick={() => handleSelect(opt.key)}
              className={btnClasses}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                    isThisSelected
                      ? isThisCorrect
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white"
                      : "bg-white border border-slate-200 text-slate-700 shadow-2xs"
                  }`}
                >
                  {opt.key}
                </span>
                <span>{opt.text}</span>
              </div>

              {isAnswered && isThisCorrect && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full shadow-2xs">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Correct
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Banner when answered */}
      {isAnswered && (
        <div
          className={`mt-3.5 p-3 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-200 ${
            isCorrect
              ? "bg-emerald-50/90 border-emerald-200 text-emerald-900"
              : "bg-amber-50/90 border-amber-200 text-amber-900"
          }`}
        >
          <div className="font-bold flex items-center gap-1.5 mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>
              {isCorrect
                ? "Spot on! Verified Answer"
                : "Explanation & SCERT Citation"}
            </span>
          </div>
          <p>{currentQ.explanation}</p>

          <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedKey(null)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <RefreshCw className="w-3 h-3" /> Try again
            </button>
            <Link
              href={`/practice?subjectId=${activeTab === "cs" ? "sub-cs" : "sub-bio-botany"}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"
            >
              Practice full chapter <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Bottom CTA footer */}
      {!isAnswered && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Click any option to test your knowledge</span>
          <Link
            href="/practice"
            className="text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1"
          >
            Launch 500+ MCQs <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
