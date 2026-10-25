"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import SuppliedText from "@/components/practice/SuppliedText";
import type {
  CollectionSummary,
  SuppliedQuestion,
} from "@/lib/supplied-practice/types";
import {
  readSuppliedHistory,
  recordSuppliedAnswer,
  saveSuppliedAttempt,
  suppliedScore,
  type SuppliedAnswers,
  type SuppliedAttempt,
} from "@/lib/supplied-practice/session";

export default function SuppliedPracticePage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const { collectionId } = use(params);
  const [collection, setCollection] = useState<CollectionSummary | null>(null),
    [bank, setBank] = useState<SuppliedQuestion[]>([]),
    [owner, setOwner] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [section, setSection] = useState("all"),
    [language, setLanguage] = useState("both"),
    [count, setCount] = useState("10"),
    [shuffle, setShuffle] = useState(false),
    [questions, setQuestions] = useState<SuppliedQuestion[]>([]),
    [answers, setAnswers] = useState<SuppliedAnswers>({}),
    [position, setPosition] = useState(0),
    [draft, setDraft] = useState<number | null>(null),
    [finished, setFinished] = useState(false),
    [attemptId, setAttemptId] = useState(""),
    [history, setHistory] = useState<SuppliedAttempt[]>([]),
    [saveNotice, setSaveNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(
      `/api/supplied-practice?questions=1&collection=${encodeURIComponent(collectionId)}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw Error(data.error || "Could not load this collection.");
        if (!controller.signal.aborted) {
          setCollection(data.collection);
          setBank(data.questions);
          setOwner(data.ownerId);
          setHistory(readSuppliedHistory(data.ownerId));
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [collectionId]);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [attemptId, finished, position]);
  const matching = bank.filter(
      (q) =>
        (section === "all" || q.section === section) &&
        (language === "both" ||
          (language === "en" ? q.questionEn : q.questionTa)),
    ),
    active = questions[position],
    score = suppliedScore(questions, answers),
    locked = active && Object.hasOwn(answers, active.id);
  const options = active
    ? language === "ta" && active.optionsTa.length
      ? active.optionsTa
      : active.optionsEn.length
        ? active.optionsEn
        : active.optionsTa
    : [];
  function begin(rows: SuppliedQuestion[]) {
    const selected = [...rows];
    if (shuffle)
      for (let i = selected.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selected[i], selected[j]] = [selected[j], selected[i]];
      }
    setQuestions(
      selected.slice(0, count === "all" ? selected.length : Number(count)),
    );
    setAnswers({});
    setPosition(0);
    setDraft(null);
    setFinished(false);
    setAttemptId(crypto.randomUUID());
    setSaveNotice("");
  }
  function navigate(index: number) {
    setPosition(index);
    setDraft(null);
  }
  function finish() {
    if (finished || !questions.length) return;
    const attempt = {
      id: attemptId,
      collectionId,
      section,
      timestamp: new Date().toISOString(),
      ...score,
    };
    const saved = saveSuppliedAttempt(owner, attempt);
    setHistory(readSuppliedHistory(owner));
    setSaveNotice(
      saved
        ? "Saved to your supplied-practice history in this browser."
        : "This browser could not save your result. Your score is still shown below.",
    );
    setFinished(true);
  }
  const missed = questions.filter((q) => answers[q.id] !== q.proposedAnswer);
  return (
    <div className="flex-1 flex bg-[#eff5ff]">
      <Sidebar />
      <main className="min-w-0 w-full max-w-5xl mx-auto px-4 py-7 space-y-5">
        <Link
          href="/practice/collections"
          className="text-sm font-bold text-blue-700"
        >
          ← All question collections
        </Link>
        <header>
          <p className="text-xs tracking-widest font-bold text-blue-700">
            SKILL UP · ONE-MARK PRACTICE
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black">
            {collection?.subject || "Question collection"}
            {collection?.volume ? ` · Volume ${collection.volume}` : ""}
          </h1>
        </header>
        <p className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          Supplied questions and answers · Not teacher verified. Scores and
          feedback use the answer key in the supplied files.
        </p>
        {loading ? (
          <p role="status">Loading questions…</p>
        ) : error ? (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">
            {error}
          </p>
        ) : !questions.length ? (
          <>
            <section className="rounded-3xl border bg-white p-5 sm:p-7 space-y-5">
              <h2 className="text-xl font-bold">Set up your practice</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <label className="text-sm font-bold">
                  Chapter or section
                  <select
                    aria-label="Chapter or section"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="mt-2 w-full rounded-xl border bg-slate-50 p-3 font-normal"
                  >
                    <option value="all">All supplied sections</option>
                    {collection?.sectionCounts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.available})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-bold">
                  Practice language
                  <select
                    aria-label="Practice language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="mt-2 w-full rounded-xl border bg-slate-50 p-3 font-normal"
                  >
                    <option value="both">English + தமிழ்</option>
                    {collection?.mediums.includes("English") ? (
                      <option value="en">English</option>
                    ) : null}
                    {collection?.mediums.includes("Tamil") ? (
                      <option value="ta">தமிழ்</option>
                    ) : null}
                  </select>
                </label>
                <label className="text-sm font-bold">
                  Number of questions
                  <select
                    aria-label="Number of questions"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="mt-2 w-full rounded-xl border bg-slate-50 p-3 font-normal"
                  >
                    <option value="10">10 questions</option>
                    <option value="25">25 questions</option>
                    <option value="50">50 questions</option>
                    <option value="all">All matching questions</option>
                  </select>
                </label>
              </div>
              <label className="flex gap-3 items-center text-sm">
                <input
                  type="checkbox"
                  checked={shuffle}
                  onChange={(e) => setShuffle(e.target.checked)}
                />
                Shuffle question order
              </label>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-slate-600">
                  {matching.length} questions match your selection.
                </p>
                <button
                  disabled={!matching.length}
                  onClick={() => begin(matching)}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white disabled:opacity-40"
                >
                  Start practice
                </button>
              </div>
              {!matching.length ? (
                <p role="status" className="text-sm text-slate-600">
                  No questions are available for this selection. Choose another
                  section or language.
                </p>
              ) : null}
            </section>
            {history.some((h) => h.collectionId === collectionId) ? (
              <section className="rounded-2xl border bg-white p-5">
                <h2 className="font-bold">
                  Your recent supplied-practice results
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {history
                    .filter((h) => h.collectionId === collectionId)
                    .slice(0, 6)
                    .map((h) => (
                      <li
                        key={h.id}
                        className="flex flex-wrap justify-between gap-3 border-t py-3"
                      >
                        <span>
                          {new Date(h.timestamp).toLocaleString()} ·{" "}
                          {h.section === "all" ? "All sections" : h.section}
                        </span>
                        <strong>
                          {h.correct}/{h.total} · {h.percentage}%
                        </strong>
                      </li>
                    ))}
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  Saved on this browser for your account. These results are
                  separate from textbook-practice history.
                </p>
              </section>
            ) : null}
          </>
        ) : finished ? (
          <section className="rounded-3xl border bg-white p-6 sm:p-9 space-y-6">
            <h2 className="text-2xl font-black">Practice complete</h2>
            <p className="text-4xl font-black text-blue-700">
              {score.correct} / {score.total}
            </p>
            <p className="text-sm text-slate-600">
              Score against supplied key: {score.percentage}%
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-emerald-50 p-4">
                <strong className="block text-2xl">{score.correct}</strong>
                <span className="text-sm">Matched key</span>
              </div>
              <div className="rounded-xl bg-rose-50 p-4">
                <strong className="block text-2xl">{score.wrong}</strong>
                <span className="text-sm">Different answer</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <strong className="block text-2xl">{score.unanswered}</strong>
                <span className="text-sm">Unanswered</span>
              </div>
            </div>
            <p role="status" className="text-sm text-slate-600">
              {saveNotice}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => begin(questions)}
                className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
              >
                Practice again
              </button>
              <button
                disabled={!missed.length}
                onClick={() => begin(missed)}
                className="rounded-xl border px-5 py-3 font-bold disabled:opacity-40"
              >
                Retry missed or skipped
              </button>
              <button
                onClick={() => {
                  setQuestions([]);
                  setFinished(false);
                }}
                className="rounded-xl border px-5 py-3 font-bold"
              >
                Change section
              </button>
            </div>
          </section>
        ) : active ? (
          <>
            <div className="rounded-xl bg-white border p-4">
              <div className="flex justify-between gap-3 text-sm font-semibold">
                <span>
                  Question {position + 1} of {questions.length}
                </span>
                <span>
                  {score.total - score.unanswered} answered · {score.correct}{" "}
                  matched
                </span>
              </div>
              <progress
                aria-label="Answered questions"
                className="mt-3 w-full h-2 accent-blue-700"
                value={score.total - score.unanswered}
                max={questions.length}
              />
            </div>
            <article className="rounded-3xl border bg-white p-5 sm:p-8 space-y-5 shadow-sm">
              <p className="text-xs font-bold text-slate-500">
                {active.sectionTitle}
              </p>
              <div className="text-lg font-semibold space-y-3">
                {language !== "ta" && active.questionEn ? (
                  <SuppliedText text={active.questionEn} />
                ) : null}
                {language !== "en" && active.questionTa ? (
                  <div lang="ta">
                    <SuppliedText text={active.questionTa} />
                  </div>
                ) : null}
              </div>
              {active.originalDiagram ? (
                <figure className="rounded-xl bg-slate-50 p-3">
                  <SuppliedText text={active.originalDiagram} />
                  <figcaption className="text-xs text-slate-500 mt-2">
                    Diagram from supplied question file
                  </figcaption>
                </figure>
              ) : null}
              {active.warnings.length > 1 ? (
                <details className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                  <summary className="cursor-pointer font-bold">
                    Source notes for this question
                  </summary>
                  <ul className="mt-2 list-disc pl-5">
                    {active.warnings.slice(1).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
              <div className="grid gap-3">
                {options.map((option, i) => (
                  <button
                    type="button"
                    key={`${active.id}-${i}`}
                    disabled={Boolean(locked)}
                    aria-pressed={(locked ? answers[active.id] : draft) === i}
                    onClick={() => setDraft(i)}
                    className={`flex min-h-14 items-start gap-3 rounded-2xl border-2 p-4 text-left ${locked && i === active.proposedAnswer ? "border-emerald-600 bg-emerald-50" : (locked ? answers[active.id] : draft) === i ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <div className="min-w-0">
                      <SuppliedText text={option} />
                      {language === "both" &&
                      active.optionsEn.length &&
                      active.optionsTa[i] ? (
                        <div lang="ta" className="mt-2 text-slate-600">
                          <SuppliedText text={active.optionsTa[i]} />
                        </div>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  disabled={draft === null || Boolean(locked)}
                  onClick={() => {
                    if (draft !== null)
                      setAnswers((old) =>
                        recordSuppliedAnswer(questions, old, active.id, draft),
                      );
                  }}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white disabled:opacity-40"
                >
                  Check answer
                </button>
                <button
                  disabled={Boolean(locked) || draft === null}
                  onClick={() => setDraft(null)}
                  className="rounded-xl border px-5 py-3 font-semibold disabled:opacity-40"
                >
                  Clear selection
                </button>
              </div>
              {locked ? (
                <div
                  role="status"
                  className="rounded-xl bg-blue-50 p-4 space-y-2"
                >
                  <p className="font-bold">
                    {answers[active.id] === active.proposedAnswer
                      ? "Matches the supplied answer"
                      : "Does not match the supplied answer"}{" "}
                    · Answer {String.fromCharCode(65 + active.proposedAnswer!)}
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
              <details className="text-xs text-slate-500">
                <summary className="cursor-pointer">Question source</summary>
                {active.sources.map((s, i) => (
                  <p className="mt-2 break-words" key={i}>
                    {s.file} · {s.originalId} · {s.reference || `row ${s.row}`}
                  </p>
                ))}
              </details>
              <nav
                aria-label="Practice navigation"
                className="flex flex-wrap justify-between gap-3 border-t pt-5"
              >
                <button
                  disabled={position === 0}
                  onClick={() => navigate(position - 1)}
                  className="rounded-xl border px-5 py-3 font-bold disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={finish}
                  className="rounded-xl border border-blue-200 px-5 py-3 font-bold text-blue-800"
                >
                  Finish practice
                </button>
                <button
                  disabled={position === questions.length - 1}
                  onClick={() => navigate(position + 1)}
                  className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white disabled:opacity-40"
                >
                  Next
                </button>
              </nav>
            </article>
            <details className="rounded-xl border bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold">
                Jump to a question
              </summary>
              <div className="mt-3 flex max-h-52 overflow-auto flex-wrap gap-2">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    aria-label={`Go to question ${i + 1}`}
                    aria-current={i === position ? "step" : undefined}
                    className={`h-11 min-w-11 rounded-lg border px-2 text-sm ${Object.hasOwn(answers, q.id) ? "bg-blue-100 text-blue-900" : "bg-white"} ${i === position ? "ring-2 ring-blue-600" : ""}`}
                    onClick={() => navigate(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </details>
          </>
        ) : null}
      </main>
    </div>
  );
}
