"use client";
import { useState } from "react";
import Link from "next/link";
import { BookOpen, Download, ShieldCheck } from "lucide-react";
import { guideSubjects, openPdfGuides } from "@/lib/open-pdf-guides";
export default function OpenGuideLibrary() {
  const [subject, setSubject] = useState("all"),
    [query, setQuery] = useState("");
  const q = query.trim().toLocaleLowerCase();
  const shown = openPdfGuides.filter(
    (g) =>
      (subject === "all" || g.subjects.includes(subject)) &&
      [g.title, ...g.subjects, ...g.topics]
        .join(" ")
        .toLocaleLowerCase()
        .includes(q),
  );
  return (
    <main className="mx-auto max-w-7xl space-y-7 px-4 py-8 pb-28 sm:px-8">
      <Link href="/resources" className="font-bold text-blue-700">
        ← Study Resources
      </Link>
      <header className="rounded-3xl bg-gradient-to-br from-indigo-950 via-blue-800 to-teal-700 p-7 text-white sm:p-10">
        <ShieldCheck size={32} />
        <h1 className="mt-4 text-3xl font-black sm:text-4xl">
          Open PDF references
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-blue-50">
          Authorised reading you can keep. Read inside Skill Up or download the
          complete, unmodified PDF with its original attribution and licence.
        </p>
        <p className="mt-3 text-sm text-blue-100">
          {openPdfGuides.length} verified open references · English ·
          Supplementary reading, not official Tamil Nadu examination guides
        </p>
        <p lang="ta" className="mt-3 text-sm">
          திறந்த உரிமம் கொண்ட கூடுதல் கற்றல் நூல்கள். பாடத்திட்ட வழிகாட்டி
          கிடைக்காத பாடங்கள் கீழே தெளிவாகக் காட்டப்படும்.
        </p>
      </header>
      <div className="grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2">
        <label className="font-semibold">
          Subject
          <select
            aria-label="Subject"
            className="mt-2 w-full rounded-xl border p-3"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="all">All subjects</option>
            {guideSubjects.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="font-semibold">
          Search references
          <input
            className="mt-2 w-full rounded-xl border p-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Book, subject or topic"
          />
        </label>
        <button
          onClick={() => {
            setSubject("all");
            setQuery("");
          }}
          className="w-fit font-bold text-blue-700"
        >
          Clear filters
        </button>
      </div>
      <p role="status" className="text-sm text-slate-600">
        {shown.length} matching references
      </p>
      <section
        aria-label="Open references"
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      >
        {shown.map((g) => (
          <article
            key={g.id}
            className="flex flex-col rounded-2xl border bg-white p-6 shadow-sm"
          >
            <BookOpen className="text-blue-700" />
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-teal-800">
              {g.licence} · {g.medium}
            </p>
            <h2 className="mt-2 text-xl font-black">{g.title}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {g.subjects.join(" · ")} · {g.pages.toLocaleString()} pages ·{" "}
              {(g.sizeBytes / 1048576).toFixed(1)} MB
            </p>
            <p className="mt-3 flex-1 text-sm leading-6">
              {g.topics.join("; ")}
            </p>
            <p className="mt-3 text-xs leading-5 text-slate-600">
              {g.limitations}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/resources/guides/${g.id}`}
                className="rounded-xl bg-blue-700 px-4 py-3 font-bold text-white"
              >
                Read & licence
              </Link>
              <a
                href={`/resources/guides/${g.id}/download`}
                className="inline-flex items-center gap-1 px-2 py-3 text-sm font-bold text-blue-700"
              >
                <Download size={16} />
                Download PDF
              </a>
            </div>
          </article>
        ))}
      </section>
      {!shown.length && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-bold">
            No verified open reference matches this selection.
          </h2>
          <p className="mt-2 text-sm">
            A complete authorised exam guide has not been verified for this
            subject and medium. Your official textbooks remain available.
          </p>
          <Link
            href={`/textbooks${subject === "all" ? "" : "?search=" + encodeURIComponent(subject)}`}
            className="mt-3 inline-block font-bold text-blue-700"
          >
            Open official textbook library →
          </Link>
        </div>
      )}
      <details className="rounded-2xl border bg-white p-5">
        <summary className="cursor-pointer font-bold">
          Availability across all {guideSubjects.length} registered subjects
        </summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {guideSubjects.map((s) => {
            const n = openPdfGuides.filter((g) =>
              g.subjects.includes(s),
            ).length;
            return (
              <div key={s} className="rounded-xl bg-slate-50 p-3 text-sm">
                <button
                  onClick={() => {
                    setSubject(s);
                    setQuery("");
                    window.scrollTo({ top: 0, behavior: "instant" });
                  }}
                  className="font-bold text-blue-800"
                >
                  {s}
                </button>
                <p className="mt-1">
                  {n
                    ? `${n} supplementary reference${n === 1 ? "" : "s"}`
                    : "No verified open reference yet"}
                </p>
                <Link
                  href={`/textbooks?search=${encodeURIComponent(s)}`}
                  className="mt-1 inline-block text-blue-700"
                >
                  Official textbooks →
                </Link>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-slate-600">
          No complete subject/medium exam-guide coverage is claimed.
          Tamil-language open guides remain a gap.
        </p>
      </details>
    </main>
  );
}
