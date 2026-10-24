"use client";

import Sidebar from "@/components/layout/Sidebar";
import { learningModels } from "@/lib/models";
import {
  chapterBook,
  chapterKey,
  modelChapters,
  modelSubjects,
  proceduralModelAttribution,
} from "@/lib/model-curriculum";
import {
  ArrowRight,
  Box,
  Maximize2,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

const ModelCanvas = dynamic(() => import("@/components/learning/ModelCanvas"), {
  ssr: false,
  loading: () => (
    <div
      className="absolute inset-0 grid place-items-center text-sm text-slate-500"
      role="status"
    >
      Preparing your 3D workspace…
    </div>
  ),
});

export default function ModelsPage() {
  const [modelIndex, setModelIndex] = useState(() =>
    learningModels.findIndex((item) => item.id === "dna"),
  );
  const [subject, setSubject] = useState("All");
  const [search, setSearch] = useState("");
  const [medium, setMedium] = useState("All");
  const [chapter, setChapter] = useState("All");
  const matchesSubject = (
    item: (typeof learningModels)[number],
    value: string,
  ) =>
    value === "All" ||
    (value === "Biology"
      ? item.subject.startsWith("Bio")
      : item.subject === value);
  const [partIndex, setPartIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [vectorScale, setVectorScale] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [speed, setSpeed] = useState(1);
  const visible = learningModels.filter((item) => {
    const mappings = modelChapters.filter((m) => m.modelId === item.id);
    return (
      matchesSubject(item, subject) &&
      `${item.title} ${item.tag} ${item.chapter} ${item.description}`
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()) &&
      (medium === "All" ||
        mappings.some((m) => chapterBook(m).sourceMedium === medium)) &&
      (chapter === "All" || mappings.some((m) => chapterKey(m) === chapter))
    );
  });
  const model = visible.includes(learningModels[modelIndex])
    ? learningModels[modelIndex]
    : (visible[0] ?? learningModels[modelIndex]);
  const part = model.parts[partIndex] ?? model.parts[0];
  const selectedMappings = modelChapters.filter((m) => m.modelId === model.id);
  useEffect(() => {
    if (!animating || model.id !== "vectors" || !active || !visible.length)
      return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = window.setInterval(() => {
      if (!document.hidden && !preference.matches)
        setVectorScale((t) => (t >= 1 ? 0 : Math.min(1, t + 0.01 * speed)));
    }, 50);
    return () => window.clearInterval(timer);
  }, [animating, speed, model.id, active, visible.length]);
  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="workspace min-w-0 flex-1">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">
              <Box size={15} /> A new perspective on learning
            </span>
            <h1 className="page-title">
              Your 3D learning lab<span className="text-blue-600">.</span>
            </h1>
            <p className="page-description">
              Turn abstract ideas into something you can explore.
            </p>
            <Link
              href="/resources"
              className="text-sm font-semibold text-blue-700"
            >
              Study Resources →
            </Link>
          </div>
          <span className="status-pill">
            {learningModels.length} interactive models
          </span>
        </div>
        <div className="mb-5 flex flex-wrap gap-2" aria-label="Model subjects">
          {[
            "All",
            "Biology",
            "Physics",
            "Chemistry",
            "Mathematics",
            "Computer Science",
          ].map((value) => (
            <button
              key={value}
              aria-pressed={subject === value}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${subject === value ? "bg-blue-700 text-white" : "bg-white text-blue-800"}`}
              onClick={() => {
                setSubject(value);
                setChapter("All");
                const first = learningModels.findIndex((item) =>
                  matchesSubject(item, value),
                );
                setModelIndex(first);
                setPartIndex(0);
              }}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold">
            Search models
            <input
              className="mt-1 w-full rounded-xl border p-3"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Topic or title"
            />
          </label>
          <label className="text-sm font-semibold">
            Subject
            <select
              className="mt-1 w-full rounded-xl border p-3"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setChapter("All");
              }}
            >
              {["All", "Biology", ...modelSubjects].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Textbook medium
            <select
              className="mt-1 w-full rounded-xl border p-3"
              value={medium}
              onChange={(e) => {
                setMedium(e.target.value);
                setChapter("All");
              }}
            >
              <option value="All">All / general concepts</option>
              <option>English</option>
              <option>Tamil</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Source chapter
            <select
              className="mt-1 w-full rounded-xl border p-3"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
            >
              <option value="All">All chapters / general concepts</option>
              {modelChapters
                .filter(
                  (m, i, all) =>
                    all.findIndex((n) => chapterKey(n) === chapterKey(m)) ===
                      i &&
                    (medium === "All" ||
                      chapterBook(m).sourceMedium === medium) &&
                    (subject === "All" ||
                      (subject === "Biology" &&
                        chapterBook(m).subject.startsWith("Bio")) ||
                      chapterBook(m).subject === subject),
                )
                .map((m) => (
                  <option key={chapterKey(m)} value={chapterKey(m)}>
                    {chapterBook(m).sourceMedium} · {m.chapter}. {m.title}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <p className="mb-4 text-sm text-slate-600" role="status">
          {visible.length} matching models. Labels are in English. Medium
          filters show source-checked textbook associations; general concepts
          have no verified chapter mapping.
        </p>
        {!visible.length && (
          <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            No verified model matches these filters. This coverage gap is
            pending source review. Try another subject or select all mediums.
          </p>
        )}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {learningModels.map(
            (item, index) =>
              visible.includes(item) && (
                <button
                  key={item.id}
                  onClick={() => {
                    setModelIndex(index);
                    setPartIndex(0);
                  }}
                  aria-pressed={model.id === item.id}
                  className={`model-option ${model.id === item.id ? "model-option-active" : ""}`}
                >
                  <span className="text-xs font-semibold text-slate-500">
                    0{index + 1} / {item.subject}
                  </span>
                  <span className="mt-2 block font-bold text-navy">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {item.tag}
                  </span>
                </button>
              ),
          )}
        </div>
        {visible.includes(model) && (
          <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white lg:grid-cols-[1fr_320px]">
            <div className="model-stage relative min-h-[360px] sm:min-h-[480px]">
              <div className="absolute left-5 top-5 z-10">
                <span className="status-pill bg-white/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
                  Interactive workspace
                </span>
              </div>
              {active ? (
                <ModelCanvas
                  model={model.id}
                  selected={part.id}
                  rotating={rotating}
                  resetKey={resetKey}
                  vectorScale={vectorScale}
                  onSelect={(id) => {
                    const index = model.parts.findIndex((p) => p.id === id);
                    if (index >= 0) setPartIndex(index);
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                  <div className="mb-5 grid h-24 w-24 place-items-center rounded-3xl border border-blue-200 bg-white shadow-xl shadow-blue-100">
                    <Box
                      size={44}
                      className="text-blue-600"
                      strokeWidth={1.25}
                    />
                  </div>
                  <h2 className="text-xl font-bold text-navy">
                    See it from every angle
                  </h2>
                  <p className="mb-5 mt-2 max-w-xs text-sm text-slate-500">
                    Load the model when you’re ready. Drag to rotate, pinch to
                    zoom. Rotation starts paused.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => setActive(true)}
                  >
                    <Play size={16} /> Explore in 3D
                  </button>
                </div>
              )}
              {active && (
                <div className="absolute bottom-5 left-5 right-5 z-10 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs text-slate-600">
                    <MousePointer2 size={14} /> Drag · pinch/scroll · arrows / +
                    / − / Home
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="model-control"
                      title={rotating ? "Pause rotation" : "Resume rotation"}
                      aria-label={
                        rotating ? "Pause rotation" : "Resume rotation"
                      }
                      onClick={() => setRotating(!rotating)}
                    >
                      {rotating ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button
                      className="model-control"
                      aria-label="Reset view"
                      onClick={() => setResetKey((key) => key + 1)}
                    >
                      <RotateCcw size={18} />
                    </button>
                    <button
                      className="model-control"
                      aria-label="Fullscreen model"
                      onClick={(e) => {
                        const stage = e.currentTarget.closest(".model-stage");
                        if (document.fullscreenElement)
                          void document.exitFullscreen().catch(() => {});
                        else if (stage?.requestFullscreen)
                          void stage.requestFullscreen().catch(() => {});
                      }}
                    >
                      <Maximize2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <aside className="border-t border-slate-200 p-6 lg:border-l lg:border-t-0">
              <span className="eyebrow">{model.subject}</span>
              <h2 className="mt-3 text-2xl font-bold text-navy">
                {model.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {model.description}
              </p>
              {model.id === "vectors" && (
                <div className="mt-4 rounded-xl border p-3 text-sm">
                  <label className="block font-semibold">
                    Vector scale t
                    <input
                      className="mt-2 w-full"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={vectorScale}
                      onChange={(e) => {
                        setAnimating(false);
                        setVectorScale(Number(e.target.value));
                      }}
                    />
                  </label>
                  <p aria-live={animating ? "off" : "polite"}>
                    t = {vectorScale.toFixed(2)} · length ={" "}
                    {(3 * vectorScale).toFixed(2)} units
                  </p>
                  <p className="my-2 text-xs">
                    Observe t(2i + 2j + k). Direction is unchanged for t &gt; 0;
                    at t = 0 the vector has zero length. Animation pauses with
                    reduced motion.
                  </p>
                  <button
                    className="min-h-11 font-semibold text-blue-700"
                    onClick={() => {
                      setModelIndex(
                        learningModels.findIndex((m) => m.id === "vectors"),
                      );
                      setAnimating(!animating);
                    }}
                  >
                    {animating
                      ? "Pause scalar animation"
                      : "Play scalar animation"}
                  </button>
                  <label className="block">
                    Animation speed{" "}
                    <select
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                    >
                      <option value="0.5">0.5×</option>
                      <option value="1">1×</option>
                      <option value="2">2×</option>
                    </select>
                  </label>
                </div>
              )}
              <h3 className="mb-3 mt-7 text-xs font-bold uppercase tracking-wider text-slate-500">
                Explore the parts
              </h3>
              <div className="space-y-2">
                {model.parts.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setPartIndex(index)}
                    aria-pressed={part.id === item.id}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm ${part.id === item.id ? "border-blue-200 bg-blue-50 font-semibold text-blue-700" : "border-slate-200 text-slate-600"}`}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: item.color }}
                    />
                    {item.name}
                  </button>
                ))}
              </div>
              <div
                className="mt-5 rounded-2xl bg-slate-50 p-4"
                aria-live="polite"
              >
                <h4 className="text-sm font-bold text-navy">{part.name}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {part.description}
                </p>
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-500">
                Simplified concept illustration; proportions are schematic. Use
                your approved textbook for exam diagrams.
              </p>
              <dl className="mt-4 space-y-2 text-xs leading-5 text-slate-600">
                <div>
                  <dt className="font-bold">Creator and source</dt>
                  <dd>
                    {proceduralModelAttribution.creator}.{" "}
                    {proceduralModelAttribution.source}.
                  </dd>
                </div>
                <div>
                  <dt className="font-bold">Licence and format</dt>
                  <dd>
                    {proceduralModelAttribution.licence}.{" "}
                    {proceduralModelAttribution.format}.
                  </dd>
                </div>
                <div>
                  <dt className="font-bold">Curriculum context</dt>
                  <dd>
                    {selectedMappings.length
                      ? selectedMappings.map((m) => (
                          <Link
                            className="block text-blue-700 underline"
                            key={chapterKey(m)}
                            href={`/textbooks/${m.bookId}?page=${m.pdfPage}`}
                          >
                            {m.title} · Chapter {m.chapter} · PDF {m.pdfPage} /
                            printed {m.printedPage} ·{" "}
                            {chapterBook(m).sourceMedium}
                          </Link>
                        ))
                      : "General concept — chapter association not verified."}
                  </dd>
                </div>
              </dl>
              <Link
                className="mt-5 flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-600"
                href={
                  selectedMappings.length
                    ? `/ai-study-tools?subject=tb-${selectedMappings[0].bookId}&chapter=tb-${selectedMappings[0].bookId}-ch-${selectedMappings[0].chapter}`
                    : "/ai-study-tools"
                }
              >
                Build an AI study prompt <ArrowRight size={16} />
              </Link>
              <Link
                className="mt-5 flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-600"
                href="/subjects"
              >
                Browse subjects <ArrowRight size={16} />
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
