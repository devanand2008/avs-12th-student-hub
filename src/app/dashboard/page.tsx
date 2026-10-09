"use client";

import Sidebar from "@/components/layout/Sidebar";
import type { getStudentProgress } from "@/lib/db";
import type { QuizSession, StreamType } from "@/types";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Box,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  Phone,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  Video,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import InstallButton from "@/components/pwa/InstallButton";


interface DashboardData {
  user: {
    studentName?: string;
    studentId?: string;
    stream?: StreamType;
    role: string;
  };
  progress: Awaited<ReturnType<typeof getStudentProgress>>;
  sessions: QuizSession[];
  announcements: { id: string; title: string; description: string }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/performance"),
      fetch("/api/announcements"),
    ])
      .then(async (responses) => {
        if (responses.some((r) => !r.ok)) {
          throw new Error(
            "Your workspace could not be loaded. Please sign in again or retry.",
          );
        }
        const [auth, performance, announcements] = await Promise.all(
          responses.map((r) => r.json()),
        );
        setData({
          user: auth.user,
          progress: performance.progress,
          sessions: performance.recentSessions || [],
          announcements: announcements.announcements || [],
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="flex flex-1 bg-[#eff5ff]">
        <Sidebar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div
            role="alert"
            className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 shadow-sm"
          >
            <h3 className="font-bold text-rose-900 mb-1">
              Session Notification
            </h3>
            <p>{error}</p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-700 text-white font-bold text-xs shadow-sm"
            >
              Go to Sign In <ArrowRight size={14} />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 bg-[#eff5ff]">
        <Sidebar />
        <main
          className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          role="status"
          aria-label="Loading your dashboard"
        >
          <div className="h-44 animate-pulse rounded-3xl bg-slate-200/80" />
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-3xl bg-slate-200/80"
              />
            ))}
          </div>
          <div className="mt-6 h-64 animate-pulse rounded-3xl bg-slate-200/60" />
        </main>
      </div>
    );
  }

  const hour = Number(
    new Date().toLocaleString("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }),
  );
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const firstName = data.user.studentName?.split(" ")[0] || "Learner";
  const isCS = data.user.stream === "Computer Science";
  const streamLabel = isCS ? "Computer Science" : "Biology";

  // Calculate circular progress geometry for overall mastery
  const progressPercent = Math.min(
    100,
    Math.max(0, data.progress.overallProgress || 0),
  );
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (progressPercent / 100) * circumference;

  const streamSubjects = isCS
    ? [
        { name: "Computer Science", code: "CS", color: "from-indigo-600 to-purple-600", tagBg: "bg-indigo-50 text-indigo-700 border-indigo-200", chapters: "16 Chapters", mcqs: "150 MCQs" },
        { name: "Physics", code: "PHY", color: "from-blue-600 to-cyan-500", tagBg: "bg-blue-50 text-blue-700 border-blue-200", chapters: "10 Units", mcqs: "160 MCQs" },
        { name: "Chemistry", code: "CHEM", color: "from-emerald-500 to-teal-500", tagBg: "bg-emerald-50 text-emerald-700 border-emerald-200", chapters: "15 Units", mcqs: "210 MCQs" },
        { name: "Mathematics", code: "MATH", color: "from-amber-500 to-orange-500", tagBg: "bg-amber-50 text-amber-700 border-amber-200", chapters: "12 Units", mcqs: "180 MCQs" },
      ]
    : [
        { name: "Bio-Botany", code: "BOT", color: "from-teal-500 to-emerald-600", tagBg: "bg-teal-50 text-teal-700 border-teal-200", chapters: "10 Chapters", mcqs: "120 MCQs" },
        { name: "Bio-Zoology", code: "ZOO", color: "from-rose-500 to-pink-600", tagBg: "bg-rose-50 text-rose-700 border-rose-200", chapters: "12 Chapters", mcqs: "130 MCQs" },
        { name: "Physics", code: "PHY", color: "from-blue-600 to-cyan-500", tagBg: "bg-blue-50 text-blue-700 border-blue-200", chapters: "10 Units", mcqs: "160 MCQs" },
        { name: "Chemistry", code: "CHEM", color: "from-emerald-500 to-teal-500", tagBg: "bg-emerald-50 text-emerald-700 border-emerald-200", chapters: "15 Units", mcqs: "210 MCQs" },
      ];

  return (
    <div className="flex flex-1 bg-[#eff5ff]">
      <Sidebar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7 min-w-0">
        {/* Top Header Strip with Greeting and Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>TN CLASS 12 · {streamLabel.toUpperCase()} STREAM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
              {greeting}, {firstName}
              <span className="text-blue-600">.</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Roll No:{" "}
              <span className="font-mono font-bold text-slate-700">
                {data.user.studentId || "Student"}
              </span>{" "}
              · SkillUp Learning Hub
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak Counter Badge */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs shadow-md shadow-amber-500/20">
              <Flame
                size={16}
                className="text-amber-100 fill-amber-100 animate-bounce"
              />
              <span>{data.progress.currentStreak} Day Streak</span>
            </div>

            {/* Quick Practice shortcut */}
            <Link
              href="/practice"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-white font-extrabold text-xs shadow-electric transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb, #0ea5e9)" }}
            >
              <Zap size={15} />
              <span>Quick Test</span>
            </Link>

            {/* Install PWA Mobile Shortcut */}
            <div className="hidden sm:block">
              <InstallButton variant="nav" />
            </div>
          </div>
        </div>

        {/* Hero Interactive Workspace Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#051336] via-[#0b2866] to-[#154699] p-6 sm:p-9 text-white shadow-xl border border-blue-900/50 group">
          {/* Ambient Glowing Floating Orbs */}
          <div className="orb-animate absolute -top-16 -right-16 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform" />
          <div className="orb-animate-2 absolute -bottom-16 -left-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-cyan-200 text-xs font-bold border border-white/15 backdrop-blur-md">
              <Sparkles size={13} className="text-cyan-300" />
              <span>CONTINUE YOUR REVISION PROGRESS</span>
            </span>

            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white leading-tight">
              Ready for your next chapter breakthrough?
            </h2>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Explore handwritten faculty notes, watch NotebookLM audio podcasts, and take Book-In & Book-Out one-mark practice tests to lock in your board exam score.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/subjects"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-cyan-50 text-blue-900 font-extrabold text-xs shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <span>Browse All Chapters</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/notes"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-extrabold text-xs border border-white/20 backdrop-blur-md transition-all active:scale-95"
              >
                <FileText size={15} />
                <span>Read Notes</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 4 Colorful Bento Stat Cards (Matching avs-12-hub.netlify.app) */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Card 1: Chapters Completed (Blue) */}
          <div className="rounded-3xl border border-blue-100 bg-white/95 p-5 sm:p-6 shadow-sm hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
                  Chapters Done
                </span>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
                  {data.progress.chaptersCompleted}
                  <span className="text-xs font-bold text-slate-400"> / 38</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md shrink-0">
                <Check size={18} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full bg-blue-50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (data.progress.chaptersCompleted / 38) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-1.5 block">
                {Math.round((data.progress.chaptersCompleted / 38) * 100)}% syllabus completed
              </span>
            </div>
          </div>

          {/* Card 2: MCQs Attempted (Purple) */}
          <div className="rounded-3xl border border-purple-100 bg-white/95 p-5 sm:p-6 shadow-sm hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-600">
                  MCQs Solved
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
              <span className="text-slate-500 font-medium">Practice sets</span>
              <span className="font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                Book-In & Out
              </span>
            </div>
          </div>

          {/* Card 3: Average Accuracy (Emerald) */}
          <div className="rounded-3xl border border-emerald-100 bg-white/95 p-5 sm:p-6 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                  Avg Accuracy
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
              <span className="text-slate-500 font-medium">Readiness</span>
              <span
                className={`font-black px-2 py-0.5 rounded-md ${
                  data.progress.averageScore >= 70
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {data.progress.averageScore >= 70 ? "Board Ready" : "Practicing"}
              </span>
            </div>
          </div>

          {/* Card 4: Overall Syllabus Mastery (Cyan / Gauge) */}
          <div className="rounded-3xl border border-cyan-100 bg-white/95 p-5 sm:p-6 shadow-sm hover:border-cyan-400 hover:shadow-md transition-all flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-700">
                Overall Mastery
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
                {progressPercent}%
              </div>
              <span className="text-[10px] text-slate-400 font-bold block mt-1">
                Goal: 100% Mastery
              </span>
            </div>

            {/* Circular Gauge */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 90 90">
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  className="text-slate-100"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  className="text-blue-600 transition-all duration-700"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-xs font-black text-slate-900">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Dedicated Stream Subjects Quick Access Bar */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-heading">
                Your Stream Core Subjects
              </h2>
              <p className="text-xs text-slate-500">
                Direct access to chapter notes and practice sets for {streamLabel}.
              </p>
            </div>
            <Link
              href="/subjects"
              className="text-xs font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Explore all</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {streamSubjects.map((s) => (
              <div
                key={s.name}
                className="info-card-capsule group relative flex flex-col justify-between rounded-3xl bg-white/95 border border-blue-100/90 p-5 shadow-sm hover:border-blue-400 transition-all overflow-hidden"
              >
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${s.color}`} />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${s.tagBg}`}>
                      {s.code}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {s.chapters}
                    </span>
                  </div>
                  <h3 className="font-heading font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-[11px] font-bold text-teal-600">
                    {s.mcqs} available
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <Link
                    href={`/subjects`}
                    className="font-bold text-blue-600 hover:underline text-[11px]"
                  >
                    View Units
                  </Link>
                  <Link
                    href={`/practice`}
                    className="font-bold text-slate-500 hover:text-slate-800 text-[11px]"
                  >
                    MCQs →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Action Toolkit Tiles */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-heading">
                Learning Modules & Tools
              </h2>
              <p className="text-xs text-slate-500">
                Pick any learning resource to continue.
              </p>
            </div>
            <Link
              href="/subjects"
              className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-800"
            >
              <span>View All 38 Chapters</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {/* Featured Textbook Library Banner */}
          <Link
            href="/textbooks"
            className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 p-5 sm:p-6 transition hover:shadow-md group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Official Class 12 SCERT Textbooks
                </h3>
                <p className="mt-0.5 text-xs text-slate-600">
                  Read complete textbooks in Tamil and English medium, or download the PDFs for offline revision.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-xs font-extrabold text-blue-700 shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
              <span>Open Library</span>
              <ArrowRight size={14} />
            </span>
          </Link>

          {/* 6 Toolkit Tiles */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                label: "Handwritten Notes",
                text: "Read crisp, faculty-authored revision notes with formulas and derivations.",
                icon: FileText,
                href: "/notes",
                badge: "Notes Reader",
                color: "from-blue-600 to-cyan-600",
                borderAccent: "hover:border-blue-400",
              },
              {
                label: "Video Lessons & Audios",
                text: "Watch chapter video lectures and listen to NotebookLM audio summaries.",
                icon: Video,
                href: "/videos",
                badge: "Media Studio",
                color: "from-purple-600 to-pink-600",
                borderAccent: "hover:border-purple-400",
              },
              {
                label: "3D Interactive Lab",
                text: "Inspect interactive 3D structures, molecular models, and biological specimens.",
                icon: Box,
                href: "/models",
                badge: "WebGL 3D",
                color: "from-cyan-500 to-teal-600",
                borderAccent: "hover:border-cyan-400",
              },
              {
                label: "One-Mark Practice Hub",
                text: "Solve Book-In textbook and Book-Out application questions with instant score.",
                icon: Target,
                href: "/practice",
                badge: "500+ MCQs",
                color: "from-amber-500 to-orange-600",
                borderAccent: "hover:border-amber-400",
              },
              {
                label: "AI Study Assistant",
                text: "Ask questions in English or Tamil with grounded syllabus citations.",
                icon: Sparkles,
                href: "/ai-helper",
                badge: "Bilingual AI",
                color: "from-fuchsia-600 to-purple-600",
                borderAccent: "hover:border-fuchsia-400",
              },
              {
                label: "Performance Analytics",
                text: "Track your chapter accuracy, time speed, and board exam readiness score.",
                icon: TrendingUp,
                href: "/performance",
                badge: "Detailed Metrics",
                color: "from-emerald-600 to-teal-600",
                borderAccent: "hover:border-emerald-400",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`info-card-capsule group flex flex-col justify-between p-5 sm:p-6 rounded-3xl border border-blue-100/90 bg-white/95 hover:shadow-md transition-all duration-200 ${item.borderAccent}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform`}
                    >
                      <item.icon size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.label}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {item.text}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 group-hover:text-blue-600">
                  <span>Open module</span>
                  <ArrowUpRight
                    size={14}
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Practice History & Weak Chapters Focus */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Recent Practice Tests */}
          <section className="rounded-3xl border border-blue-100/90 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Clock size={17} className="text-blue-600" />
                <span>Recent Practice Sessions</span>
              </h2>
              <Link
                href="/practice"
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                New Test +
              </Link>
            </div>

            {!data.sessions.length ? (
              <div className="p-6 text-center rounded-2xl bg-blue-50/50 border border-dashed border-blue-200">
                <Target size={32} className="mx-auto text-blue-300 mb-2" />
                <p className="text-xs text-slate-500">
                  You haven&apos;t taken a practice test yet.
                </p>
                <Link
                  href="/practice"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  <span>Start your first quick test</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.sessions.slice(0, 4).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs hover:border-blue-200 transition-colors"
                  >
                    <div>
                      <span className="font-extrabold text-slate-900 capitalize">
                        {session.mode} Mode
                      </span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="text-slate-500 font-medium">
                        {session.sourceFilter || "Mixed"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {session.score} / {session.totalQuestions}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Chapters Needing Attention */}
          <section className="rounded-3xl border border-amber-100/90 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <RotateCcw size={17} className="text-amber-600" />
                <span>Targeted Revision Focus</span>
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Recommended
              </span>
            </div>

            {!data.progress.weakChapters.length ? (
              <div className="p-6 text-center rounded-2xl bg-emerald-50/50 border border-dashed border-emerald-200">
                <CheckCircle2
                  size={32}
                  className="mx-auto text-emerald-400 mb-2"
                />
                <p className="text-xs text-slate-600 font-medium">
                  Great work! No weak chapters identified yet. Take more timed tests to benchmark your accuracy.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.progress.weakChapters.slice(0, 4).map((chapter) => (
                  <Link
                    key={chapter.chapterId}
                    href={`/practice?chapterId=${chapter.chapterId}`}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/70 text-xs hover:border-amber-400 transition-colors group"
                  >
                    <span className="font-bold text-slate-800 group-hover:text-amber-900 truncate max-w-[220px]">
                      {chapter.title}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-amber-700">
                        {chapter.score}%
                      </span>
                      <ArrowRight
                        size={13}
                        className="text-amber-500 group-hover:translate-x-0.5 transition-transform"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Institutional Academic Desk & Dr. Joshua Help Banner */}
        <section className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-black text-blue-900">
              <Phone size={14} className="text-blue-600" />
              <span>AVS Engineering College · Academic Helpline</span>
            </div>
            <p className="text-xs text-slate-600">
              Guidance provided under <strong>Dr. Joshua</strong>, Vice Principal (+91 7200008770). Need syllabus help or additional study material?
            </p>
          </div>
          <a
            href="tel:+917200008770"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors shrink-0"
          >
            <Phone size={13} />
            <span>Call Helpline</span>
          </a>
        </section>

        {/* Campus Announcements */}
        {data.announcements.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Campus & Academic Announcements
            </h3>
            {data.announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="rounded-3xl border border-blue-200/80 bg-white p-5 shadow-xs"
              >
                <h4 className="font-extrabold text-sm text-slate-900">
                  {announcement.title}
                </h4>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {announcement.description}
                </p>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
