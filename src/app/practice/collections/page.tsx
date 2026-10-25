"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import { ArrowRight, BookOpen, Search, ShieldCheck } from "lucide-react";
import type { CollectionSummary } from "@/lib/supplied-practice/types";

export default function SuppliedCollectionsPage() {
  const [collections, setCollections] = useState<CollectionSummary[]>([]),
    [canPreview, setCanPreview] = useState(false),
    [search, setSearch] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/supplied-practice", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error || "Could not load collections.");
        if (!controller.signal.aborted) {
          setCollections(d.collections);
          setCanPreview(d.canPreview);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  const filtered = collections.filter((c) =>
    `${c.subject} ${c.volume ? `Volume ${c.volume}` : ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className="flex-1 flex bg-[#eff5ff]">
      <Sidebar />
      <main className="w-full min-w-0 max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Link href="/practice" className="text-sm font-bold text-blue-700">
          ← Practice hub
        </Link>
        <header className="rounded-3xl bg-slate-900 p-6 sm:p-9 text-white space-y-4">
          <span className="text-xs font-bold tracking-widest text-cyan-300">
            SKILL UP · CLASS 12
          </span>
          <h1 className="text-3xl sm:text-4xl font-black">
            Your one-mark practice library
          </h1>
          <p className="max-w-2xl text-slate-300">
            Choose a subject, study one question at a time and revise in English
            or Tamil.
          </p>
          <Link
            href="/textbook-practice"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-blue-900"
          >
            Start published textbook practice <ArrowRight size={18} />
          </Link>
        </header>
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex gap-3">
          <ShieldCheck className="shrink-0 text-amber-700" />
          <div>
            <h2 className="font-bold text-amber-950">
              Practise using the supplied answer keys
            </h2>
            <p className="text-sm text-amber-900 mt-1">
              These collections are available for practice. Their questions and
              answers come from the supplied files and have not been
              independently teacher verified. Check any uncertain answer with
              your textbook.
            </p>
          </div>
        </section>
        <label className="flex items-center gap-3 rounded-xl border bg-white p-3">
          <Search size={20} aria-hidden />
          <span className="sr-only">Search collections</span>
          <input
            className="w-full outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find Chemistry, Tamil, Computer Science…"
          />
        </label>
        {loading ? <p role="status">Loading collections…</p> : null}
        {error ? (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        ) : null}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <article
              key={c.id}
              className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm"
            >
              <div className="flex justify-between gap-2">
                <BookOpen className="text-blue-700" />
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                  Supplied · unverified
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {c.subject}
                </h2>
                <p className="text-sm text-slate-500">
                  {c.volume ? `Volume ${c.volume} · ` : ""}
                  {c.mediums.join(" / ")}
                </p>
              </div>
              <div className="grid grid-cols-2 rounded-xl bg-slate-50 p-3 text-sm">
                <p>
                  <strong className="block text-xl">{c.available}</strong>
                  Practice questions
                </p>
                <p>
                  <strong className="block text-xl">
                    {c.sectionCounts.length}
                  </strong>
                  Sections
                </p>
              </div>
              <details>
                <summary className="cursor-pointer font-semibold text-sm text-blue-800">
                  {c.sectionCounts.length} supplied sections
                </summary>
                <ul className="mt-3 space-y-2 text-sm">
                  {c.sectionCounts.map((s) => (
                    <li key={s.id} className="flex justify-between gap-3">
                      <span className="min-w-0 break-words">{s.title}</span>
                      <span className="shrink-0 text-slate-500">
                        {s.available} questions
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  Section names come from the supplied pages and await textbook
                  mapping checks.
                </p>
              </details>
              <Link
                href={`/practice/collections/${c.id}`}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-bold text-white"
              >
                Start practice <ArrowRight size={16} />
              </Link>
              {canPreview ? (
                <Link
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700"
                  href={`/admin/supplied-practice?collection=${c.id}`}
                >
                  Preview & export for review <ArrowRight size={16} />
                </Link>
              ) : null}
            </article>
          ))}
        </div>
        {!loading && !error && !filtered.length ? (
          <p role="status">No collections match. Try a different subject.</p>
        ) : null}
      </main>
    </div>
  );
}
