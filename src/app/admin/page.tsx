"use client";

import Sidebar from "@/components/layout/Sidebar";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  FileText,
  HelpCircle,
  ShieldCheck,
  Upload,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Record<string, number> | null>(null);
  const [weakChapters, setWeakChapters] = useState<
    {
      chapterTitle: string;
      subject: string;
      attempts: number;
      avgAccuracy: number;
    }[]
  >([]);
  const [hardestQuestions, setHardestQuestions] = useState<
    { id: string; text: string; accuracy: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Could not load admin analytics.");
        return data;
      })
      .then((data) => {
        setMetrics(data.metrics);
        setStorageMode(data.storageMode);
        setWeakChapters(data.weakChapters || []);
        setHardestQuestions(data.hardestQuestions || []);
      })
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : "Could not load admin analytics.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex flex-1">
        <Sidebar isAdmin />
        <main
          className="workspace"
          role="status"
          aria-label="Loading admin overview"
        >
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
        </main>
      </div>
    );

  return (
    <div className="flex-1 flex bg-[#F8FAFC]">
      <Sidebar isAdmin={true} />

      <main className="workspace min-w-0 flex-1 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-xs font-bold text-amber-800 mb-1 border border-amber-200">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>AVS Institutional Administration Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A3D]">
              Admin Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage user accounts, publish learning material, and follow your
              students&apos; progress.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/students/import"
              className="touch-target px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>Bulk Student Import</span>
            </Link>
            <Link
              href="/admin/students/create"
              className="touch-target px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Student</span>
            </Link>
          </div>
        </div>

        {storageMode === "demo" && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Demo mode: accounts and learning records are temporary. Connect
            Supabase in Database connection before adding real student data.
          </p>
        )}
        {storageMode === "supabase" && (
          <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <ShieldCheck size={16} /> Connected to Supabase. Accounts and
            published resources are saved to your database.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            {error}{" "}
            <Link href="/admin/backend" className="font-semibold underline">
              Check database connection
            </Link>
          </p>
        )}

        {/* 11 Main Administrative Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500">
              Total Enrolled Students
            </div>
            <div className="text-2xl font-black text-[#071A3D] mt-1">
              {metrics?.totalStudents ?? 0}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-1">
              {metrics?.activeStudents ?? 0} Active Accounts
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500">
              Computer Science Track
            </div>
            <div className="text-2xl font-black text-[#2563EB] mt-1">
              {metrics?.csStudentsCount ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">
              16 Syllabus Chapters
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500">
              Biology Track
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {metrics?.bioStudentsCount ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">
              22 Botany + Zoology Ch
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500">
              Handwritten Notes
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {metrics?.totalNotes ?? 0}
            </div>
            <div className="text-[10px] text-blue-600 font-medium mt-1">
              Faculty verified
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500">
              NotebookLM Videos
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {metrics?.totalVideos ?? 0}
            </div>
            <div className="text-[10px] text-purple-600 font-medium mt-1">
              Gemini synthesized
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500">
              1-Mark Question Bank
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {metrics?.totalQuestions ?? 0}
            </div>
            <div className="text-[10px] text-amber-600 font-medium mt-1">
              Book-In & Book-Out
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500">
              Quiz Drills Attempted
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {metrics?.quizAttempts ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">
              Completed sessions
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500">
              Average Student Score
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {metrics?.averageScore ?? 0}%
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">
              Institutional aggregate
            </div>
          </div>
        </div>

        {/* Weak Chapters Advisory & Hardest Questions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Institutional Weak Chapters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-[#071A3D]">
                  Class-Level Weak Chapters
                </h3>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                Remediation Needed
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Chapters where aggregate class accuracy is lower than 70%. High
              priority for faculty revision classes.
            </p>

            <div className="space-y-2 pt-1">
              {weakChapters.map((w, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-[#071A3D]">
                      {w.chapterTitle}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {w.subject} • {w.attempts} Total Attempts
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      {w.avgAccuracy}% Accuracy
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hardest Questions Telemetry */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#071A3D]">
                  Most Challenging Questions
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">
                Lowest Accuracy
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Questions frequently answered incorrectly during practice tests.
            </p>

            <div className="space-y-2 pt-1">
              {hardestQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#071A3D] line-clamp-1">
                      {q.text}
                    </span>
                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded shrink-0">
                      {q.accuracy}% Correct
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Administration Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <Link
            href="/admin/students"
            className="p-5 rounded-2xl bg-white border border-slate-200 blue-card-hover flex items-center justify-between"
          >
            <div>
              <Users className="w-6 h-6 text-[#2563EB] mb-2" />
              <h4 className="font-bold text-sm text-[#071A3D]">All users</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Profiles, learning activity, CSV export
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            href="/admin/notes"
            className="p-5 rounded-2xl bg-white border border-slate-200 blue-card-hover flex items-center justify-between"
          >
            <div>
              <FileText className="w-6 h-6 text-blue-600 mb-2" />
              <h4 className="font-bold text-sm text-[#071A3D]">
                Handwritten notes
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload PDF or scans, save drafts, publish
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link
            href="/admin/videos"
            className="p-5 rounded-2xl bg-white border border-slate-200 blue-card-hover flex items-center justify-between"
          >
            <div>
              <Video className="w-6 h-6 text-rose-500 mb-2" />
              <h4 className="font-bold text-sm text-[#071A3D]">
                Video lessons
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                YouTube, MP4, and NotebookLM lessons
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link
            href="/admin/textbooks"
            className="p-5 rounded-2xl bg-white border border-slate-200 blue-card-hover flex items-center justify-between"
          >
            <div>
              <BookOpen className="w-6 h-6 text-indigo-600 mb-2" />
              <h4 className="font-bold text-sm text-[#071A3D]">
                Official textbooks
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Class 12 books in Tamil and English
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            href="/admin/questions"
            className="p-5 rounded-2xl bg-white border border-slate-200 blue-card-hover flex items-center justify-between"
          >
            <div>
              <HelpCircle className="w-6 h-6 text-emerald-600 mb-2" />
              <h4 className="font-bold text-sm text-[#071A3D]">
                Question Bank
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Book-In/Book-Out, teacher review
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            href="/admin/students/import"
            className="p-5 rounded-2xl bg-white border border-slate-200 blue-card-hover flex items-center justify-between"
          >
            <div>
              <Upload className="w-6 h-6 text-purple-600 mb-2" />
              <h4 className="font-bold text-sm text-[#071A3D]">
                Bulk CSV/Excel Import
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Auto-generate IDs & temp passwords
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </main>
    </div>
  );
}
