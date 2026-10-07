"use client";

import Sidebar from "@/components/layout/Sidebar";
import { learningModels } from "@/lib/models";
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
import { useState } from "react";

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
  const [modelIndex, setModelIndex] = useState(0);
  const [partIndex, setPartIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [rotating, setRotating] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const model = learningModels[modelIndex];
  const part = model.parts[partIndex];
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
          </div>
          <span className="status-pill">3 interactive models</span>
        </div>
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {learningModels.map((item, index) => (
            <button
              key={item.id}
              onClick={() => {
                setModelIndex(index);
                setPartIndex(0);
              }}
              aria-pressed={modelIndex === index}
              className={`model-option ${modelIndex === index ? "model-option-active" : ""}`}
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
          ))}
        </div>
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
                onSelect={(id) => {
                  const index = model.parts.findIndex((p) => p.id === id);
                  if (index >= 0) setPartIndex(index);
                }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <div className="mb-5 grid h-24 w-24 place-items-center rounded-3xl border border-blue-200 bg-white shadow-xl shadow-blue-100">
                  <Box size={44} className="text-blue-600" strokeWidth={1.25} />
                </div>
                <h2 className="text-xl font-bold text-navy">
                  See it from every angle
                </h2>
                <p className="mb-5 mt-2 max-w-xs text-sm text-slate-500">
                  Load the model when you’re ready. Drag to rotate, pinch to
                  zoom.
                </p>
                <button className="btn-primary" onClick={() => setActive(true)}>
                  <Play size={16} /> Explore in 3D
                </button>
              </div>
            )}
            {active && (
              <div className="absolute bottom-5 left-5 right-5 z-10 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs text-slate-600">
                  <MousePointer2 size={14} /> Drag to rotate · scroll to zoom
                </span>
                <div className="flex gap-2">
                  <button
                    className="model-control"
                    title={rotating ? "Pause rotation" : "Resume rotation"}
                    aria-label={rotating ? "Pause rotation" : "Resume rotation"}
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
            <h2 className="mt-3 text-2xl font-bold text-navy">{model.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {model.description}
            </p>
            <h3 className="mb-3 mt-7 text-xs font-bold uppercase tracking-wider text-slate-500">
              Explore the parts
            </h3>
            <div className="space-y-2">
              {model.parts.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setPartIndex(index)}
                  aria-pressed={index === partIndex}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm ${index === partIndex ? "border-blue-200 bg-blue-50 font-semibold text-blue-700" : "border-slate-200 text-slate-600"}`}
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
            <Link
              className="mt-5 flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-600"
              href={`/subjects#${model.chapterId}`}
            >
              Browse related chapter <ArrowRight size={16} />
            </Link>
          </aside>
        </div>
      </main>
    </div>
  );
}
