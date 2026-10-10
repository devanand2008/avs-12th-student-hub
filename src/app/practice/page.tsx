"use client";

import Sidebar from "@/components/layout/Sidebar";
import { Chapter, PracticeMode, Subject } from "@/types";
import {
  ArrowRight,
  CheckSquare,
  Clock,
  Code2,
  Dna,
  Flame,
  Leaf,
  Sparkles,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PracticeHubPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<
    (Subject & { chapters: Chapter[] })[]
  >([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("sub-cs");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<
    "All" | "Book-In" | "Book-Out"
  >("All");
  const [selectedMode, setSelectedMode] = useState<PracticeMode>("quick");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        if (data.subjects && data.subjects.length > 0) {
          setSubjects(data.subjects);
          setSelectedSubjectId(data.subjects[0].id);
          setChapters(data.subjects[0].chapters || []);
        }
      });
  }, []);

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterId("all");
    const subj = subjects.find((s) => s.id === subjectId);
    if (subj && subj.chapters) {
      setChapters(subj.chapters);
    } else {
      setChapters([]);
    }
  };

  const startPractice = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      subjectId: selectedSubjectId,
      mode: selectedMode,
      sourceFilter,
      count: questionCount.toString(),
      ...(selectedChapterId !== "all" ? { chapterId: selectedChapterId } : {}),
    });
    router.push(`/practice/session?${query.toString()}`);
  };

  const getSubjectIcon = (name: string) => {
    if (name.toLowerCase().includes("computer")) return Code2;
    if (name.toLowerCase().includes("botany")) return Leaf;
    return Dna;
  };

  return (
    <div className="flex-1 flex bg-[#eff5ff]">
      <Sidebar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-xs font-bold text-blue-700 mb-2 border border-blue-200 shadow-xs">
            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>TN CLASS 12 · ONE-MARK MCQ ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
            Real-Time Practice & Timed Exams
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Answer one text question at a time with separate A, B, C and D
            choices. Practise with instant explanations or test yourself under
            exam conditions using Book-In or Book-Out questions.
          </p>
        </div>

        {/* 1. SEPARATED BOOK-IN vs BOOK-OUT CATEGORY SELECTOR */}
        <Link
          href="/textbook-practice"
          className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 font-semibold text-blue-900"
        >
          Practise official textbook MCQs by subject and chapter{" "}
          <ArrowRight className="h-5 w-5 shrink-0" />
        </Link>
        <section className="bg-white/95 rounded-3xl border border-blue-100/90 p-5 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Step 1: Choose Question Source Category
            </span>
            <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Required
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* All Questions */}
            <button
              type="button"
              onClick={() => setSourceFilter("All")}
              className={`info-card-capsule relative p-5 rounded-2xl border text-left transition-all overflow-hidden ${
                sourceFilter === "All"
                  ? "border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-600/30"
                  : "border-slate-200 hover:border-blue-300 bg-white"
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-500" />
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900">
                  All Questions
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                  Combined
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-2 leading-relaxed">
                Comprehensive mix of SCERT textbook questions and conceptual
                application drills.
              </div>
            </button>

            {/* Book-In (SCERT Textbook) */}
            <button
              type="button"
              onClick={() => setSourceFilter("Book-In")}
              className={`info-card-capsule relative p-5 rounded-2xl border text-left transition-all overflow-hidden ${
                sourceFilter === "Book-In"
                  ? "border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-600/30"
                  : "border-slate-200 hover:border-emerald-300 bg-white"
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-emerald-900">
                  A. BOOK-IN 1 MARK
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  Textbook
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-2 leading-relaxed">
                Official SCERT textbook back exercises, in-text questions, and
                core syllabus definitions.
              </div>
            </button>

            {/* Book-Out (Advanced & Application) */}
            <button
              type="button"
              onClick={() => setSourceFilter("Book-Out")}
              className={`info-card-capsule relative p-5 rounded-2xl border text-left transition-all overflow-hidden ${
                sourceFilter === "Book-Out"
                  ? "border-purple-600 bg-purple-50/70 shadow-md ring-2 ring-purple-600/30"
                  : "border-slate-200 hover:border-purple-300 bg-white"
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-500" />
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-purple-900">
                  B. BOOK-OUT 1 MARK
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-bold">
                  Application
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-2 leading-relaxed">
                Original conceptual drills, code trace problems, higher-order
                reasoning, and board exam edge cases.
              </div>
            </button>
          </div>
        </section>

        {/* 2. SUBJECT & CHAPTER SELECTOR */}
        <section className="bg-white/95 rounded-3xl border border-blue-100/90 p-5 sm:p-7 shadow-sm space-y-4">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400">
            Step 2: Subject & Chapter Target
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Select Subject
              </label>
              <div className="grid grid-cols-3 gap-2">
                {subjects.map((s) => {
                  const Icon = getSubjectIcon(s.name);
                  const isSelected = selectedSubjectId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSubjectChange(s.id)}
                      className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-md"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate w-full">{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Select Chapter (Optional)
              </label>
              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full py-3 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="all">
                  All Chapters Combined ({chapters.length} Chapters)
                </option>
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    Ch {ch.chapterNumber}: {ch.title}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[11px] text-slate-400 font-medium">
                Leave as &quot;All Chapters Combined&quot; for a full subject
                mock test.
              </p>
            </div>
          </div>
        </section>

        {/* 3. PRACTICE MODE SELECTION */}
        <section className="bg-white/95 rounded-3xl border border-blue-100/90 p-5 sm:p-7 shadow-sm space-y-5">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400">
            Step 3: Select Engine Practice Mode
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              {
                id: "quick",
                label: "Quick Practice",
                desc: "Instant feedback per answer",
                icon: Zap,
                gradient: "from-blue-600 to-cyan-500",
                color: "text-blue-600",
              },
              {
                id: "timed",
                label: "Timed Exam",
                desc: "Server timer, hidden answers",
                icon: Clock,
                gradient: "from-rose-500 to-pink-600",
                color: "text-rose-600",
              },
              {
                id: "daily10",
                label: "Daily 10 Drill",
                desc: "Fast 10-question streak",
                icon: Flame,
                gradient: "from-amber-500 to-orange-500",
                color: "text-amber-600",
              },
              {
                id: "daily25",
                label: "Daily 25 Drill",
                desc: "Comprehensive revision",
                icon: Sparkles,
                gradient: "from-purple-600 to-fuchsia-600",
                color: "text-purple-600",
              },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = selectedMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedMode(m.id as PracticeMode);
                    if (m.id === "daily10") setQuestionCount(10);
                    if (m.id === "daily25") setQuestionCount(25);
                  }}
                  className={`info-card-capsule relative p-4 rounded-2xl border text-left transition-all overflow-hidden ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-600/30"
                      : "border-slate-200 hover:border-blue-300 bg-white"
                  }`}
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${m.gradient}`}
                  />
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center mb-2">
                    <Icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {m.label}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {m.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Question count selector */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700">
              Questions Count:
            </span>
            <div className="flex items-center gap-2">
              {[5, 10, 15, 25].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    questionCount === cnt
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cnt} Questions
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Start Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={startPractice}
            disabled={loading}
            className="w-full sm:w-auto touch-target px-8 py-3.5 text-white rounded-2xl font-bold text-sm shadow-electric hover:shadow-glow-blue transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #1d4ed8, #2563eb, #0ea5e9)",
            }}
          >
            {loading ? (
              <span>Preparing Question Session...</span>
            ) : (
              <>
                <span>Launch Practice Session</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
