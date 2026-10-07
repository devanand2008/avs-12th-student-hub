"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Search,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import {
  filterTextbooks,
  textbookFileSize,
  type TextbookCatalog,
} from "@/lib/textbooks";

const categoryColors: Record<string, string> = {
  Languages: "from-indigo-600 via-purple-600 to-pink-600",
  Science: "from-blue-600 via-cyan-600 to-teal-600",
  Commerce: "from-emerald-600 via-teal-600 to-cyan-700",
  Arts: "from-amber-600 via-orange-600 to-red-600",
  Vocational: "from-slate-700 via-blue-800 to-indigo-900",
};

export default function TextbookLibrary({
  catalog,
  isAdmin = false,
  initialSearch = "",
}: {
  catalog: TextbookCatalog;
  isAdmin?: boolean;
  initialSearch?: string;
}) {
  const [medium, setMedium] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState(initialSearch);
  const books = useMemo(
    () => filterTextbooks(catalog.books, { medium, category, search }),
    [catalog.books, medium, category, search],
  );
  const ready = catalog.books.filter(
    (book) => book.status === "downloaded",
  ).length;
  const subjects = new Set(catalog.books.map((book) => book.subject)).size;

  return (
    <div className="flex min-w-0 flex-1 bg-[#eff5ff]">
      <Sidebar isAdmin={isAdmin} />
      <main className="mx-auto min-w-0 max-w-7xl flex-1 space-y-7 px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero Banner with Orbs */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#051336] via-[#0b2866] to-[#154699] p-6 text-white shadow-xl sm:p-9 group">
          <div className="orb-animate absolute -top-16 -right-16 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="orb-animate-2 absolute -bottom-16 -left-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-bold text-cyan-200 backdrop-blur-md">
              <BookOpen className="h-3.5 w-3.5 text-cyan-300" />
              <span>TAMIL NADU STATE BOARD · CLASS 12</span>
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-white">
              Official Class 12 SCERT Textbook Library
            </h1>
            <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-blue-100/90">
              Tamil and English medium textbooks from SCERT Tamil Nadu, covering languages, science, commerce, arts and vocational subjects. Read inside the portal, open the original PDF, or download for offline study.
            </p>
            <div className="flex flex-wrap gap-3 pt-2 text-xs text-blue-100 font-bold">
              <span className="rounded-xl bg-white/10 px-3 py-2 border border-white/15 backdrop-blur-md">
                {subjects} subjects · {catalog.books.length} source records
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 px-3 py-2 border border-emerald-400/30 text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />{" "}
                {ready} PDFs saved locally
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_200px_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search textbooks"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search subject or textbook title..."
              className="w-full rounded-2xl border border-blue-200/90 bg-white py-3 pr-4 pl-10 text-xs sm:text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-xs"
            />
          </div>
          <select
            aria-label="Textbook medium"
            value={medium}
            onChange={(event) => setMedium(event.target.value)}
            className="rounded-2xl border border-blue-200/90 bg-white px-4 py-3 text-xs sm:text-sm text-slate-700 shadow-xs font-medium focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">Both mediums</option>
            <option value="Tamil">Tamil medium</option>
            <option value="English">English medium</option>
          </select>
          <select
            aria-label="Subject group"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-2xl border border-blue-200/90 bg-white px-4 py-3 text-xs sm:text-sm text-slate-700 shadow-xs font-medium focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All subject groups</option>
            {Object.keys(categoryColors).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
          <p>
            {books.length} textbook{books.length === 1 ? "" : "s"} shown.
          </p>
          <a
            href={catalog.sourcePage}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-blue-700 hover:underline"
          >
            SCERT official source catalog <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Textbook Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => (
            <article
              key={book.id}
              className="info-card-capsule group relative flex flex-col overflow-hidden rounded-3xl border border-blue-100/90 bg-white/95 shadow-sm hover:border-blue-400 hover:shadow-md transition-all duration-300"
            >
              {/* Header Gradient */}
              <div
                className={`bg-gradient-to-r ${categoryColors[book.category] || "from-blue-600 to-indigo-700"} p-5 text-white`}
              >
                <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider">
                  <span className="rounded-full bg-black/20 px-2.5 py-0.5 backdrop-blur-xs border border-white/20">
                    {book.category}
                  </span>
                  <span className="bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    {book.medium === "Common"
                      ? "Common language"
                      : `${book.medium} medium`}
                  </span>
                </div>
                <h2 className="mt-3 font-heading text-base sm:text-lg font-black leading-snug">
                  {book.title}
                </h2>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span
                    className={
                      book.status === "downloaded"
                        ? "rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-700 border border-emerald-200 text-[10px]"
                        : "rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-700 border border-amber-200 text-[10px]"
                    }
                  >
                    {book.status === "downloaded"
                      ? "Saved locally"
                      : "Source link ready"}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {textbookFileSize(book.sizeBytes)}
                  </span>
                  {book.pages && (
                    <span className="text-slate-500 text-[11px]">· {book.pages} pages</span>
                  )}
                </div>

                <p className="text-xs leading-relaxed text-slate-500">
                  {book.sourceTitle}
                </p>

                <div className="mt-auto space-y-2 pt-2">
                  {book.localPath ? (
                    <div className="space-y-2">
                      <Link
                        href={`/textbooks/${book.id}`}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#1b3574] hover:bg-blue-900 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
                      >
                        <BookOpen className="h-4 w-4" /> Read in Portal
                      </Link>
                      <div className="flex gap-2">
                        <a
                          href={book.localPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <BookOpen className="h-3.5 w-3.5" /> Open PDF
                        </a>
                        <a
                          href={book.localPath}
                          download={`${book.title}-${book.sourceMedium}.pdf`}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 font-medium">
                      PDF available via SCERT official server.
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-3 text-[11px] pt-1">
                    <a
                      href={book.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-700 hover:underline font-bold"
                    >
                      Official PDF <ExternalLink className="h-3 w-3" />
                    </a>
                    <Link
                      href="/notes"
                      className="inline-flex items-center gap-1 font-bold text-slate-500 hover:text-blue-700"
                    >
                      <span>Notes</span>
                      <FileText className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
