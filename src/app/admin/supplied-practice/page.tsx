"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import SuppliedText from "@/components/practice/SuppliedText";
import type {
  CollectionSummary,
  SuppliedQuestion,
} from "@/lib/supplied-practice/types";

export default function SuppliedReviewPreview() {
  const [collections, setCollections] = useState<CollectionSummary[]>([]),
    [collection, setCollection] = useState(""),
    [section, setSection] = useState("all"),
    [language, setLanguage] = useState("both"),
    [page, setPage] = useState(1),
    [pages, setPages] = useState(0),
    [total, setTotal] = useState(0),
    [questions, setQuestions] = useState<SuppliedQuestion[]>([]),
    [position, setPosition] = useState(0),
    [selected, setSelected] = useState<Record<string, number>>({}),
    [revealed, setRevealed] = useState<Record<string, boolean>>({}),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/supplied-practice", { signal: controller.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok || !d.canPreview)
          throw Error(d.error || "Administrator access required.");
        if (!controller.signal.aborted) {
          setCollections(d.collections);
          const initial = new URLSearchParams(window.location.search).get(
            "collection",
          );
          setCollection(
            d.collections.some((c: CollectionSummary) => c.id === initial)
              ? initial
              : d.collections[0]?.id || "",
          );
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!collection) return;
    const controller = new AbortController();
    fetch(
      `/api/supplied-practice?preview=1&collection=${encodeURIComponent(collection)}&section=${encodeURIComponent(section)}&page=${page}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error || "Could not load supplied questions.");
        if (!controller.signal.aborted) {
          setQuestions(d.questions);
          setTotal(d.total);
          setPages(d.pages);
          setPosition(0);
          setSelected({});
          setRevealed({});
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [collection, section, page]);
  const active = questions[position],
    meta = collections.find((c) => c.id === collection),
    optionTexts = active
      ? language === "ta" && active.optionsTa.length
        ? active.optionsTa
        : active.optionsEn.length
          ? active.optionsEn
          : active.optionsTa
      : [];
  function changeCollection(value: string) {
    setLoading(true);
    setError("");
    setQuestions([]);
    setCollection(value);
    setSection("all");
    setPage(1);
  }
  function changePage(value: number) {
    setLoading(true);
    setError("");
    setQuestions([]);
    setPage(value);
  }
  const exportQuery = new URLSearchParams({ collection, section });
  return (
    <div className="flex flex-1 bg-[#eff5ff]">
      <Sidebar isAdmin />
      <main className="min-w-0 w-full max-w-5xl mx-auto px-4 py-7 space-y-5">
        <Link
          className="text-sm font-bold text-blue-700"
          href="/practice/collections"
        >
          ← One-mark library
        </Link>
        <header>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Supplied question preview
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Administrator preview · Available as supplied practice · Answers
            have not been teacher verified.
          </p>
        </header>
        <p className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          This screen previews the redesigned practice layout and exports source
          records for review. Comparing a supplied answer records no approval,
          student score or practice history. Send the actual teacher-review
          evidence if you want an individual verification audit. The owner has
          enabled student practice using the supplied, unverified keys.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-sm font-bold">
            Collection
            <select
              aria-label="Collection"
              className="block w-full mt-1 rounded-xl border bg-white p-3 font-normal"
              value={collection}
              onChange={(e) => changeCollection(e.target.value)}
            >
              {collections.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.subject}
                  {c.volume ? ` · Volume ${c.volume}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Supplied section
            <select
              aria-label="Supplied section"
              className="block w-full mt-1 rounded-xl border bg-white p-3 font-normal"
              value={section}
              onChange={(e) => {
                setLoading(true);
                setSection(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All sections</option>
              {meta?.sectionCounts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.total})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Display language
            <select
              aria-label="Display language"
              className="block w-full mt-1 rounded-xl border bg-white p-3 font-normal"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="both">English + தமிழ்</option>
              <option value="en">English</option>
              <option value="ta">தமிழ்</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <a
            className="font-bold text-blue-700 min-h-11 inline-flex items-center"
            href={`/api/admin/supplied-practice/export?${exportQuery}&format=json`}
          >
            Export source JSON
          </a>
          <a
            className="font-bold text-blue-700 min-h-11 inline-flex items-center"
            href={`/api/admin/supplied-practice/export?${exportQuery}&format=csv`}
          >
            Export teacher reference CSV
          </a>
          <span className="inline-flex items-center text-slate-500">
            {total} supplied questions
          </span>
        </div>
        {error ? (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        ) : null}
        {loading ? (
          <p role="status">Loading questions…</p>
        ) : active ? (
          <>
            <article className="rounded-3xl border bg-white p-5 sm:p-8 shadow-sm space-y-6">
              <div className="flex justify-between gap-3 text-xs font-bold text-slate-500">
                <span>
                  Question {(page - 1) * 25 + position + 1} of {total} ·{" "}
                  {active.sectionTitle}
                </span>
                <span className="text-amber-800">UNVERIFIED</span>
              </div>
              <div className="text-lg font-semibold space-y-3">
                {language !== "ta" && active.questionEn ? (
                  <SuppliedText text={active.questionEn} />
                ) : null}
                {language !== "en" && active.questionTa ? (
                  <div lang="ta">
                    <SuppliedText text={active.questionTa} />
                  </div>
                ) : null}
                {language === "ta" && !active.questionTa ? (
                  <SuppliedText text={active.questionEn} />
                ) : null}
                {language === "en" && !active.questionEn ? (
                  <div lang="ta">
                    <SuppliedText text={active.questionTa} />
                  </div>
                ) : null}
              </div>
              {active.originalDiagram ? (
                <figure className="rounded-xl bg-slate-50 p-4">
                  <SuppliedText text={active.originalDiagram} />
                  <figcaption className="text-xs text-amber-800 mt-2">
                    Supplied diagram · requires source and teacher verification
                  </figcaption>
                </figure>
              ) : null}
              <div className="grid gap-3">
                {optionTexts.map((option, i) => (
                  <button
                    key={`${active.id}-${i}`}
                    aria-pressed={selected[active.id] === i}
                    disabled={!!revealed[active.id]}
                    onClick={() =>
                      setSelected((prev) => ({ ...prev, [active.id]: i }))
                    }
                    className={`flex gap-4 rounded-2xl border-2 p-4 text-left min-h-14 ${selected[active.id] === i ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <div className="min-w-0">
                      <SuppliedText text={option} />
                      {language === "both" &&
                      active.optionsTa[i] &&
                      active.optionsEn.length ? (
                        <div className="mt-2 text-slate-600" lang="ta">
                          <SuppliedText text={active.optionsTa[i]} />
                        </div>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
              <button
                className="rounded-xl bg-blue-700 text-white font-bold px-5 py-3 disabled:opacity-50"
                disabled={
                  selected[active.id] === undefined || !!revealed[active.id]
                }
                onClick={() =>
                  setRevealed((prev) => ({ ...prev, [active.id]: true }))
                }
              >
                Compare supplied answer
              </button>
              {revealed[active.id] ? (
                <div
                  role="status"
                  className="rounded-xl bg-blue-50 p-4 space-y-2"
                >
                  <p className="font-bold">
                    Proposed answer:{" "}
                    {active.proposedAnswer === null
                      ? "Unknown"
                      : String.fromCharCode(65 + active.proposedAnswer)}{" "}
                    ·{" "}
                    {selected[active.id] === active.proposedAnswer
                      ? "Matches supplied key"
                      : "Differs from supplied key"}
                  </p>
                  <p className="text-xs text-amber-900">
                    This comparison is not a teacher-verification decision.
                  </p>
                  {language !== "ta" && active.explanationEn ? (
                    <SuppliedText text={active.explanationEn} />
                  ) : null}
                  {language !== "en" && active.explanationTa ? (
                    <div lang="ta">
                      <SuppliedText text={active.explanationTa} />
                    </div>
                  ) : null}
                </div>
              ) : null}
              <details className="rounded-xl border p-4 text-sm">
                <summary className="cursor-pointer font-bold">
                  Source, original text & review warnings
                </summary>
                <p className="mt-3 break-all font-mono text-xs">{active.id}</p>
                <ul className="list-disc pl-5 my-3 text-amber-900">
                  {active.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
                {active.sources.map((s, i) => (
                  <div className="break-words py-2" key={i}>
                    <p>{s.file}</p>
                    <p>
                      Original ID: {s.originalId} · Row {s.row} · Supplied
                      label: {s.claimedSource} · Reference:{" "}
                      {s.reference || "Not supplied"}
                    </p>
                    <p className="text-xs break-all">SHA-256: {s.sha256}</p>
                  </div>
                ))}
                <p className="my-2">
                  Supplied text is preserved verbatim. No textbook page or
                  printed-key evidence has been independently established from
                  these HTML files.
                </p>
                <pre className="overflow-auto max-h-80 rounded bg-slate-50 p-3 text-xs whitespace-pre-wrap">
                  {JSON.stringify(
                    {
                      questionEn: active.questionEn,
                      questionTa: active.questionTa,
                      optionsEn: active.optionsEn,
                      optionsTa: active.optionsTa,
                      originalDiagram: active.originalDiagram,
                      proposedAnswer: active.proposedAnswer,
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
              <nav
                aria-label="Question navigation"
                className="flex justify-between gap-3"
              >
                <button
                  disabled={position === 0}
                  onClick={() => setPosition((p) => p - 1)}
                  className="rounded-xl border px-5 py-3 font-bold disabled:opacity-40"
                >
                  Previous question
                </button>
                <button
                  disabled={position === questions.length - 1}
                  onClick={() => setPosition((p) => p + 1)}
                  className="rounded-xl bg-slate-900 text-white px-5 py-3 font-bold disabled:opacity-40"
                >
                  Next question
                </button>
              </nav>
            </article>
            <div className="flex justify-between gap-3 items-center text-sm">
              <button
                disabled={page <= 1}
                className="min-h-11 font-bold text-blue-700 disabled:opacity-40"
                onClick={() => changePage(page - 1)}
              >
                ← Previous 25
              </button>
              <span>
                Page {page} of {pages}
              </span>
              <button
                disabled={page >= pages}
                className="min-h-11 font-bold text-blue-700 disabled:opacity-40"
                onClick={() => changePage(page + 1)}
              >
                Next 25 →
              </button>
            </div>
          </>
        ) : (
          <p>No supplied questions match this selection.</p>
        )}
      </main>
    </div>
  );
}
