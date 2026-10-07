"use client";

import Sidebar from "@/components/layout/Sidebar";
import type { HandwrittenNote } from "@/types";
import { ArrowUpRight, BookOpen, FileText, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const getNoteColor = (title: string, topic: string = "") => {
  const combined = (title + " " + topic).toLowerCase();
  if (
    combined.includes("physics") ||
    combined.includes("electric") ||
    combined.includes("gauss")
  ) {
    return {
      gradient: "from-blue-600 via-sky-500 to-cyan-500",
      iconBg: "from-blue-600 to-cyan-600",
      badge: "bg-blue-50 text-blue-700 border-blue-200",
      hoverBorder: "hover:border-blue-400",
    };
  }
  if (
    combined.includes("chemistry") ||
    combined.includes("solid") ||
    combined.includes("crystal")
  ) {
    return {
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      iconBg: "from-emerald-500 to-teal-600",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      hoverBorder: "hover:border-emerald-400",
    };
  }
  if (
    combined.includes("math") ||
    combined.includes("matrix") ||
    combined.includes("calculus")
  ) {
    return {
      gradient: "from-amber-500 via-orange-500 to-amber-600",
      iconBg: "from-amber-500 to-orange-600",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      hoverBorder: "hover:border-amber-400",
    };
  }
  if (
    combined.includes("python") ||
    combined.includes("function") ||
    combined.includes("data")
  ) {
    return {
      gradient: "from-indigo-600 via-purple-600 to-indigo-700",
      iconBg: "from-indigo-600 to-purple-600",
      badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
      hoverBorder: "hover:border-indigo-400",
    };
  }
  return {
    gradient: "from-blue-600 via-indigo-600 to-cyan-500",
    iconBg: "from-blue-600 to-indigo-600",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    hoverBorder: "hover:border-blue-400",
  };
};

export default function NotesPage() {
  const [notes, setNotes] = useState<HandwrittenNote[]>([]);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [language, setLanguage] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const chapterId = new URLSearchParams(window.location.search).get(
      "chapterId",
    );
    fetch(
      "/api/notes" +
        (chapterId ? "?chapterId=" + encodeURIComponent(chapterId) : ""),
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setNotes(data.notes || []);
      })
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, []);

  const subjects = [
    ...new Set(
      notes
        .map((note) => note.subjectName)
        .filter((name): name is string => Boolean(name)),
    ),
  ].sort();
  const filtered = notes.filter(
    (note) =>
      (subject === "all" || note.subjectName === subject) &&
      (language === "all" || note.language === language) &&
      (
        note.title +
        " " +
        note.titleTamil +
        " " +
        note.topic +
        " " +
        note.description
      )
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  return (
    <div className="flex flex-1 bg-[#eff5ff]">
      <Sidebar />
      <main className="workspace min-w-0 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-xs font-bold text-blue-700 mb-2 border border-blue-200 shadow-xs">
              <FileText className="w-3.5 h-3.5" />
              <span>FACULTY CURATED RESOURCES</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
              Handwritten Notes & Formulas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Step-by-step derivations, neatly labeled diagrams, formula sheets,
              and chapter definitions curated by senior AVS teachers.
            </p>
          </div>
          <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-200 shadow-xs">
            {filtered.length} notes
          </span>
        </div>

        <label className="flex max-w-md items-center gap-3 rounded-2xl border border-blue-200/80 bg-white px-4 py-3 shadow-xs focus-within:border-blue-500 transition-colors">
          <Search size={18} className="text-slate-400" />
          <input
            type="search"
            aria-label="Search notes"
            placeholder="Find a derivation, chapter, or keyword..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm outline-none font-medium placeholder:text-slate-400"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <label className="text-xs font-semibold text-slate-600">
            Subject
            <select
              aria-label="Filter notes by subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="ml-2 rounded-xl border border-blue-200 bg-white px-3 py-2"
            >
              <option value="all">All subjects</option>
              {subjects.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Language
            <select
              aria-label="Filter notes by language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="ml-2 rounded-xl border border-blue-200 bg-white px-3 py-2"
            >
              <option value="all">All languages</option>
              <option>English</option>
              <option>Tamil</option>
            </select>
          </label>
          <Link
            href="/notes"
            className="self-center text-xs font-semibold text-blue-700"
          >
            All notes
          </Link>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-700"
          >
            {error}
          </p>
        ) : loading ? (
          <div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            role="status"
            aria-label="Loading notes"
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-3xl bg-slate-200/70"
              />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="glass-panel p-12 text-center rounded-3xl space-y-3 max-w-lg mx-auto">
            <FileText size={40} className="mx-auto text-blue-400" />
            <h2 className="text-base font-extrabold text-slate-900">
              {notes.length
                ? "No matching notes found"
                : "Your notes are being published."}
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {notes.length
                ? "Try searching for a different topic, formula, or keyword."
                : "Senior faculty are curating handwritten derivations for this chapter. Check back shortly."}
            </p>
            <Link
              href="/subjects"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition-all"
            >
              <BookOpen size={15} />
              <span>Browse All Subjects</span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((note) => {
              const theme = getNoteColor(note.title, note.topic);

              return (
                <Link
                  key={note.id}
                  href={"/notes/" + note.id}
                  className={`info-card-capsule group relative flex flex-col justify-between rounded-3xl bg-white/95 border border-blue-100/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${theme.hoverBorder}`}
                >
                  {/* Top gradient accent line */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.gradient}`}
                  />

                  {/* Ambient glowing aura */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />

                  <div className="space-y-3.5 relative z-10">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${theme.iconBg} text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform`}
                      >
                        <FileText size={20} />
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${theme.badge}`}
                      >
                        {note.badge || "Verified"}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-1">
                        <span>{note.language || "English"}</span>
                        <span>·</span>
                        <span>{note.pageCount} Pages</span>
                      </div>
                      <h2 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-3">
                        {note.title}
                      </h2>
                      <p className="line-clamp-2 text-xs leading-relaxed text-slate-500 mt-1">
                        {note.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700 relative z-10">
                    <span>Read Handwritten Notes</span>
                    <ArrowUpRight
                      size={15}
                      className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
