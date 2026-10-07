"use client";

import Sidebar from "@/components/layout/Sidebar";
import type { getStudentProgress } from "@/lib/db";
import type { QuizSession } from "@/types";
import { ArrowRight, BookOpen, Clock, Flame, Target, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface PerformanceData {
  progress: Awaited<ReturnType<typeof getStudentProgress>>;
  recentSessions: QuizSession[];
}

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/performance")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setData(data);
      })
      .catch((error) => setError(error.message));
  }, []);

  return (
    <div className="flex flex-1 bg-[#eff5ff]">
      <Sidebar />
      <main className="workspace min-w-0 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-xs font-bold text-blue-700 mb-2 border border-blue-200 shadow-xs">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>EXAM READINESS ANALYTICS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
            Academic Performance & Growth
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            A comprehensive view of your syllabus completion, practice test accuracies, and targeted revision priorities.
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-700"
          >
            {error}
          </p>
        ) : !data ? (
          <div
            className="h-64 animate-pulse rounded-3xl bg-slate-200/70"
            role="status"
            aria-label="Loading performance"
          />
        ) : (
          <>
            {/* 4 Colorful Stat Cards (Same as avs-12-hub.netlify.app) */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {/* Accuracy (Emerald) */}
              <div className="rounded-3xl border border-emerald-100 bg-white/95 p-5 sm:p-6 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                      Average Accuracy
                    </span>
                    <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
                      {data.progress.averageScore}%
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <TrendingUp size={18} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-emerald-50 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {data.progress.averageScore >= 70 ? "Mastery" : "Improving"}
                  </span>
                </div>
              </div>

              {/* Questions Attempted (Purple) */}
              <div className="rounded-3xl border border-purple-100 bg-white/95 p-5 sm:p-6 shadow-sm hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-purple-600">
                      Questions Solved
                    </span>
                    <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
                      {data.progress.mcqsAttempted}
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shrink-0">
                    <Target size={18} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-purple-50 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Source</span>
                  <span className="font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    Book-In & Out
                  </span>
                </div>
              </div>

              {/* Chapters Complete (Blue) */}
              <div className="rounded-3xl border border-blue-100 bg-white/95 p-5 sm:p-6 shadow-sm hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
                      Chapters Complete
                    </span>
                    <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
                      {data.progress.chaptersCompleted}
                      <span className="text-xs font-bold text-slate-400"> / 38</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md shrink-0">
                    <BookOpen size={18} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-1.5 w-full bg-blue-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{
                        width: `${Math.min(100, (data.progress.chaptersCompleted / 38) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Current Streak (Amber) */}
              <div className="rounded-3xl border border-amber-100 bg-white/95 p-5 sm:p-6 shadow-sm hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-600">
                      Study Streak
                    </span>
                    <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
                      {data.progress.currentStreak} Days
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shrink-0">
                    <Flame size={18} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-amber-50 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Daily Goal</span>
                  <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Practice History Section */}
            <section className="rounded-3xl border border-blue-100/90 bg-white/95 p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock size={18} className="text-blue-600" />
                  <span>Practice Session History</span>
                </h2>
                <Link
                  href="/practice"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  New Practice +
                </Link>
              </div>

              {!data.recentSessions.length ? (
                <div className="py-12 text-center rounded-2xl bg-blue-50/50 border border-dashed border-blue-200">
                  <p className="mb-4 text-xs sm:text-sm text-slate-500">
                    Take your first practice session to start building your accuracy record.
                  </p>
                  <Link
                    href="/practice"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition-all"
                  >
                    <span>Start Practice Session</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-2">Mode & Source</th>
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2">Score</th>
                        <th className="py-3 px-2">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.recentSessions.map((session) => {
                        const accuracy = Math.round(
                          (session.correctCount / session.totalQuestions) * 100,
                        );

                        return (
                          <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-2 font-bold text-slate-900 capitalize">
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 mr-2 border border-blue-200">
                                {session.mode}
                              </span>
                              <span>{session.sourceFilter || "All"}</span>
                            </td>
                            <td className="py-3.5 px-2 text-slate-500 font-medium">
                              {new Date(session.completedAt || session.startedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-3.5 px-2 font-black text-slate-900">
                              {session.score} / {session.totalQuestions}
                            </td>
                            <td className="py-3.5 px-2">
                              <span
                                className={`font-black px-2.5 py-0.5 rounded-full text-[11px] ${
                                  accuracy >= 70
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {accuracy}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Targeted Revision Chapters */}
            <section className="rounded-3xl border border-amber-100/90 bg-white/95 p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Zap size={18} className="text-amber-600" />
                  <span>Targeted Revision Recommendations</span>
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Focus Areas
                </span>
              </div>

              {!data.progress.weakChapters.length ? (
                <div className="p-6 text-center rounded-2xl bg-emerald-50/50 border border-dashed border-emerald-200">
                  <p className="text-xs text-slate-600 font-medium">
                    No weak chapters identified yet. Take more unit-wise timed exams to benchmark your performance.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.progress.weakChapters.map((chapter) => (
                    <Link
                      href={"/practice?chapterId=" + chapter.chapterId}
                      key={chapter.chapterId}
                      className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/40 border border-amber-200/70 hover:border-amber-400 hover:bg-amber-50 transition-all group"
                    >
                      <div>
                        <span className="font-bold text-slate-900 text-xs group-hover:text-amber-900 block truncate max-w-[240px]">
                          {chapter.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">Click to practice this chapter</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-amber-700 text-xs">
                          {chapter.score}%
                        </span>
                        <ArrowRight size={14} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
