"use client";

import Sidebar from "@/components/layout/Sidebar";
import { Chapter, Subject } from "@/types";
import { CheckSquare, FileText, Layers, Sparkles, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface EnrichedSubject extends Subject {
  chapters: Chapter[];
}

const getSubjectTheme = (name: string, stream: string) => {
  const n = name.toLowerCase();
  if (n.includes("physics")) {
    return {
      gradient: "from-blue-600 via-sky-500 to-cyan-500",
      accentBg: "bg-blue-50 text-blue-700 border-blue-200",
      iconBg: "from-blue-600 to-cyan-600",
      borderHover: "hover:border-blue-400",
      cardBorder: "border-blue-100",
      tagText: "PHYSICS",
    };
  }
  if (n.includes("chemistry")) {
    return {
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      accentBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconBg: "from-emerald-500 to-teal-600",
      borderHover: "hover:border-emerald-400",
      cardBorder: "border-emerald-100",
      tagText: "CHEMISTRY",
    };
  }
  if (n.includes("math")) {
    return {
      gradient: "from-amber-500 via-orange-500 to-amber-600",
      accentBg: "bg-amber-50 text-amber-700 border-amber-200",
      iconBg: "from-amber-500 to-orange-600",
      borderHover: "hover:border-amber-400",
      cardBorder: "border-amber-100",
      tagText: "MATHEMATICS",
    };
  }
  if (n.includes("computer") || stream.toLowerCase().includes("computer")) {
    return {
      gradient: "from-indigo-600 via-purple-600 to-indigo-700",
      accentBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      iconBg: "from-indigo-600 to-purple-600",
      borderHover: "hover:border-indigo-400",
      cardBorder: "border-indigo-100",
      tagText: "COMPUTER SCIENCE",
    };
  }
  if (n.includes("botany")) {
    return {
      gradient: "from-teal-500 via-emerald-600 to-green-500",
      accentBg: "bg-teal-50 text-teal-700 border-teal-200",
      iconBg: "from-teal-500 to-emerald-600",
      borderHover: "hover:border-teal-400",
      cardBorder: "border-teal-100",
      tagText: "BIO-BOTANY",
    };
  }
  if (n.includes("zoology")) {
    return {
      gradient: "from-rose-500 via-pink-500 to-rose-600",
      accentBg: "bg-rose-50 text-rose-700 border-rose-200",
      iconBg: "from-rose-500 to-pink-600",
      borderHover: "hover:border-rose-400",
      cardBorder: "border-rose-100",
      tagText: "BIO-ZOOLOGY",
    };
  }
  if (n.includes("tamil")) {
    return {
      gradient: "from-red-500 via-rose-600 to-orange-500",
      accentBg: "bg-red-50 text-red-700 border-red-200",
      iconBg: "from-red-500 to-rose-600",
      borderHover: "hover:border-red-400",
      cardBorder: "border-red-100",
      tagText: "TAMIL",
    };
  }
  return {
    gradient: "from-blue-600 via-indigo-600 to-cyan-500",
    accentBg: "bg-blue-50 text-blue-700 border-blue-200",
    iconBg: "from-blue-600 to-indigo-600",
    borderHover: "hover:border-blue-400",
    cardBorder: "border-blue-100",
    tagText: "GENERAL",
  };
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<EnrichedSubject[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => setSubjects(data.subjects || []))
      .catch((err) => console.error("Failed to load subjects:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredSubjects = subjects.filter((s) => {
    if (activeTab === "cs")
      return s.streamId === "Computer Science" || s.streamId === "Common";
    if (activeTab === "bio")
      return s.streamId === "Biology" || s.streamId === "Common";
    return true;
  });

  if (loading)
    return (
      <div className="flex flex-1 bg-[#eff5ff]">
        <Sidebar />
        <main className="workspace" role="status" aria-label="Loading subjects">
          <div className="h-72 animate-pulse rounded-3xl bg-slate-200/70" />
        </main>
      </div>
    );

  return (
    <div className="flex-1 flex bg-[#eff5ff]">
      <Sidebar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-xs font-bold text-blue-700 mb-2 border border-blue-200">
              <Layers className="w-3.5 h-3.5" />
              <span>Tamil Nadu Class 12 Curriculum</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
              12th Standard Subjects & Curriculum
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Select any subject to explore unit-wise handwritten notes,
              textbook one-marks, revision videos, and bilingual AI tutoring.
            </p>
          </div>

          {/* Stream Filter Switcher */}
          <div className="flex items-center gap-1.5 p-1.5 bg-white/90 border border-blue-200/80 rounded-2xl shadow-xs self-start md:self-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`py-2 px-3 text-xs font-extrabold rounded-xl transition-all touch-target ${
                activeTab === "all"
                  ? "bg-[#1b3574] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              All Subjects ({subjects.length})
            </button>
            <button
              onClick={() => setActiveTab("cs")}
              className={`py-2 px-3 text-xs font-extrabold rounded-xl transition-all touch-target ${
                activeTab === "cs"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Computer Science (16)
            </button>
            <button
              onClick={() => setActiveTab("bio")}
              className={`py-2 px-3 text-xs font-extrabold rounded-xl transition-all touch-target ${
                activeTab === "bio"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Biology (22)
            </button>
          </div>
        </div>

        {/* Subjects List */}
        <div className="space-y-8 pb-12">
          {filteredSubjects.map((subj) => {
            const theme = getSubjectTheme(subj.name, subj.streamId);

            return (
              <div
                key={subj.id}
                className="bg-white/95 rounded-3xl border border-blue-100/90 p-5 sm:p-7 shadow-sm transition-all"
              >
                {/* Subject Header Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.iconBg} text-white flex items-center justify-center font-black text-sm shadow-md shrink-0`}
                    >
                      {subj.code || subj.name.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.accentBg}`}
                        >
                          {subj.code}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {subj.streamId}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                        {subj.name}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                        {subj.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-200">
                      {subj.chapters?.length || 0} Chapters
                    </span>
                    <Link
                      href={`/textbooks?search=${encodeURIComponent(subj.name)}`}
                      className="text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
                    >
                      Textbook
                    </Link>
                  </div>
                </div>

                {/* Chapters Grid with Colorful Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-6">
                  {subj.chapters?.map((ch) => (
                    <div
                      key={ch.id}
                      id={ch.id}
                      className={`info-card-capsule group relative flex flex-col justify-between rounded-3xl bg-white border border-blue-100/90 p-5 shadow-sm hover:border-blue-400 transition-all duration-300 overflow-hidden ${theme.borderHover}`}
                    >
                      {/* Top Accent Gradient Line */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.gradient}`}
                      />

                      {/* Ambient Glowing Aura */}
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />

                      <div className="space-y-3 relative z-10">
                        {/* Chapter Badge */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${theme.accentBg}`}
                          >
                            Chapter {ch.chapterNumber}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {ch.isActive ? "Curriculum Active" : "Reference"}
                          </span>
                        </div>

                        {/* Titles */}
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {ch.title}
                          </h3>
                          {ch.titleTamil && (
                            <p className="text-xs text-slate-500 font-semibold mt-0.5 line-clamp-1">
                              {ch.titleTamil}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                            {ch.description}
                          </p>
                        </div>

                        {/* Counts */}
                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 pt-1">
                          <span className="flex items-center gap-1 text-blue-600">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{ch.totalNotes} Notes</span>
                          </span>
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>{ch.totalMcqs} MCQs</span>
                          </span>
                        </div>
                      </div>

                      {/* 4 Colorful Action Buttons (Same as avs-12-hub.netlify.app) */}
                      <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-4 gap-1.5 relative z-10">
                        <Link
                          href={`/notes?chapterId=${ch.id}`}
                          title="Read Notes"
                          className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-[10px] font-bold transition-all hover:scale-[1.02] active:scale-95"
                        >
                          <FileText className="w-3.5 h-3.5 mb-0.5" />
                          <span>Notes</span>
                        </Link>
                        <Link
                          href={`/practice?chapterId=${ch.id}`}
                          title="Practice MCQs"
                          className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white text-[10px] font-bold transition-all hover:scale-[1.02] active:scale-95"
                        >
                          <CheckSquare className="w-3.5 h-3.5 mb-0.5" />
                          <span>MCQs</span>
                        </Link>
                        <Link
                          href={`/videos?chapterId=${ch.id}`}
                          title="Watch Video Lessons"
                          className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white text-[10px] font-bold transition-all hover:scale-[1.02] active:scale-95"
                        >
                          <Video className="w-3.5 h-3.5 mb-0.5" />
                          <span>Videos</span>
                        </Link>
                        <Link
                          href={`/ai-helper?query=${encodeURIComponent(ch.title)}`}
                          title="Ask AI Tutor"
                          className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white text-[10px] font-bold transition-all hover:scale-[1.02] active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5 mb-0.5" />
                          <span>AI</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
