"use client";

import Sidebar from "@/components/layout/Sidebar";
import textbookCatalog from "@/lib/textbooks-catalog.json";
import { Chapter, PracticeMode, Subject } from "@/types";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckSquare,
  Clock,
  Code2,
  Dna,
  Flame,
  History,
  Leaf,
  RotateCcw,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getPracticeHistory,
  clearPracticeHistory,
  type PracticeAttemptRecord,
} from "@/lib/practice-history";

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
  const [history, setHistory] = useState<PracticeAttemptRecord[]>([]);
  const [historyOwner, setHistoryOwner] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    Promise.all([
      fetch("/api/subjects").then(async (res) => {
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Could not load practice subjects.");
        return data;
      }),
      fetch("/api/auth/me", { cache: "no-store" }).then((res) => res.json()),
    ])
      .then(([data, auth]) => {
        if (disposed) return;
        if (data.subjects && data.subjects.length > 0) {
          setSubjects(data.subjects);
          setSelectedSubjectId(data.subjects[0].id);
          setChapters(data.subjects[0].chapters || []);
        }
        if (auth.authenticated && auth.user?.id) {
          setHistoryOwner(auth.user.id);
          setHistory(getPracticeHistory(auth.user.id));
        }
      })
      .catch((error) => {
        if (!disposed)
          setError(error.message || "Could not load practice subjects.");
      });
    return () => {
      disposed = true;
    };
  }, []);

  const handleClearHistory = () => {
    clearPracticeHistory(historyOwner);
    setHistory([]);
  };

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
  const readyQuestions =
    selectedChapterId === "all"
      ? chapters.reduce((count, chapter) => count + (chapter.totalMcqs || 0), 0)
      : chapters.find((chapter) => chapter.id === selectedChapterId)
          ?.totalMcqs || 0;

  const getSubjectIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("computer")) return Code2;
    if (lower.includes("botany")) return Leaf;
    if (lower.includes("zoology")) return Dna;
    if (lower.includes("math")) return Calculator;
    return BookOpen;
  };

  return (
    <div className="flex-1 flex bg-[#eff5ff]">
      <Sidebar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            {error}
          </p>
        )}
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                    Ch {ch.chapterNumber}: {ch.title} ({ch.totalMcqs ?? 0} MCQs)
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
            <div className="flex flex-wrap items-center gap-2">
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
            disabled={loading || !!error || !subjects.length || !readyQuestions}
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

        {subjects.length > 0 && !readyQuestions && (
          <p role="status" className="text-sm text-slate-600">
            This selection has no published practice questions yet. Choose
            another chapter or textbook while it awaits review.
          </p>
        )}
        {/* 4. ATTEMPT HISTORY & RECENT PRACTICE TESTS */}
        {history.length > 0 && (
          <section className="bg-white/95 rounded-3xl border border-blue-100/90 p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Your Recent Practice Attempts ({history.length})
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearHistory}
                className="min-h-[44px] scroll-mt-32 scroll-mb-40 text-xs text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                title="Clear local practice history"
              >
                <Trash2 size={13} />
                <span>Clear History</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.slice(0, 6).map((attempt) => {
                const subj = subjects.find((s) => s.id === attempt.subjectId);
                const textbook = textbookCatalog.books.find(
                  (book) => `tb-${book.id}` === attempt.subjectId,
                );
                const subjName =
                  subj?.name ||
                  attempt.subjectName ||
                  (textbook
                    ? `${textbook.subject}${textbook.volume ? ` · Volume ${textbook.volume}` : ""} (${textbook.sourceMedium})`
                    : "Subject unavailable");
                const dateStr = new Date(attempt.timestamp).toLocaleDateString(
                  undefined,
                  {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                );
                const retakeQuery = new URLSearchParams({
                  subjectId: attempt.subjectId,
                  ...(attempt.chapterId && attempt.chapterId !== "all"
                    ? { chapterId: attempt.chapterId }
                    : {}),
                  mode: attempt.mode as PracticeMode,
                  sourceFilter: attempt.sourceFilter || "All",
                  count: String(attempt.totalQuestions),
                });
                return (
                  <div
                    key={attempt.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="min-w-0 break-words font-bold text-slate-800">
                        {subjName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          attempt.accuracy >= 80
                            ? "bg-emerald-100 text-emerald-800"
                            : attempt.accuracy >= 50
                              ? "bg-blue-100 text-blue-800"
                              : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {attempt.accuracy}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Score:{" "}
                        <strong className="text-slate-800">
                          {attempt.score}/{attempt.totalQuestions}
                        </strong>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {dateStr}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {attempt.mode}
                      </span>
                      <Link
                        href={`/practice/session?${retakeQuery}`}
                        onClick={(event) => {
                          if (
                            event.ctrlKey ||
                            event.metaKey ||
                            event.shiftKey ||
                            event.altKey
                          )
                            return;
                          event.preventDefault();
                          const fresh = new URLSearchParams(retakeQuery);
                          fresh.set("attempt", crypto.randomUUID());
                          router.push(`/practice/session?${fresh}`);
                        }}
                        className="min-h-[44px] scroll-mt-32 scroll-mb-40 text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                      >
                        <RotateCcw size={12} /> Re-take
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              Practice history is saved locally in this browser so you can track
              your accuracy and repeat exercises anytime.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
