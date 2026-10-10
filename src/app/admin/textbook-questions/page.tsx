"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import catalog from "@/lib/textbooks-catalog.json";
import type {
  TextbookMcqCandidate,
  TextbookMcqCoverage,
  McqAnswer,
} from "@/lib/textbook-question-types";
import { BookOpen, ChevronLeft, ChevronRight, X } from "lucide-react";

export default function TextbookQuestionsPage() {
  const [coverage, setCoverage] = useState<TextbookMcqCoverage[]>([]);
  const [bookId, setBookId] = useState(catalog.books[0]?.id || "");
  const [chapterId, setChapterId] = useState("all");
  const [status, setStatus] = useState("review");
  const [search, setSearch] = useState("");
  const [questions, setQuestions] = useState<TextbookMcqCandidate[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<TextbookMcqCandidate | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [answer, setAnswer] = useState<McqAnswer | "">("");
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!selected) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), a[href], textarea, select",
        ) || [],
      );
    focusable()[0]?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function key(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        event.preventDefault();
        setSelected(null);
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0],
        last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [selected, saving]);
  const refreshCoverage = useCallback(async () => {
    const response = await fetch("/api/textbook-practice", {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setCoverage(data.coverage || []);
  }, []);
  useEffect(() => {
    void Promise.resolve()
      .then(refreshCoverage)
      .catch((error) => setError(error.message));
  }, [refreshCoverage]);
  const refreshQuestions = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          bookId,
          page: String(page),
          status,
          ...(chapterId !== "all" ? { chapterId } : {}),
        });
        const response = await fetch(
          "/api/admin/textbook-questions?" + params,
          { cache: "no-store", signal },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!signal?.aborted) {
          setQuestions(data.questions || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        if (!signal?.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Could not load questions.",
          );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [bookId, chapterId, page, status],
  );
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => refreshQuestions(controller.signal));
    return () => controller.abort();
  }, [refreshQuestions]);
  const bank = coverage.find((item) => item.bookId === bookId);
  const books = catalog.books.filter((book) =>
    `${book.title} ${book.sourceMedium}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  function edit(question: TextbookMcqCandidate) {
    setSelected(question);
    setQuestionText(question.questionText);
    setOptions([...question.options]);
    setAnswer(question.correctAnswer || "");
    setError("");
    setMessage("");
  }
  async function publish(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !answer) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/textbook-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          questionText,
          options,
          correctAnswer: answer,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSelected(null);
      setMessage("Reviewed question published. Students can practise it now.");
      await Promise.all([refreshCoverage(), refreshQuestions()]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not publish.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="flex flex-1">
      <Sidebar isAdmin />
      <main className="workspace min-w-0 flex-1 space-y-6">
        <div>
          <span className="eyebrow">TEXTBOOK QUESTION BANK</span>
          <h1 className="page-title">Review one-mark MCQs</h1>
          <p className="mt-2 text-sm text-slate-600">
            Questions with complete printed answer keys are ready for students.
            Check the original page, correct extraction errors and supply an
            answer for questions awaiting review.
          </p>
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">
            {error}
          </p>
        )}
        {message && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-4 text-emerald-800"
          >
            {message}
          </p>
        )}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              Find a textbook
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Subject or medium"
              />
            </label>
            <label>
              Textbook
              <select
                value={bookId}
                onChange={(event) => {
                  setBookId(event.target.value);
                  setChapterId("all");
                  setPage(1);
                }}
              >
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} · {book.sourceMedium}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              Chapter
              <select
                value={chapterId}
                onChange={(event) => {
                  setChapterId(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All chapters</option>
                {bank?.chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.number}. {chapter.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Question status
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="review">Needs review</option>
                <option value="published">Published</option>
                <option value="all">All questions</option>
              </select>
            </label>
          </div>
          <p className="text-sm text-slate-600">
            {bank
              ? `${bank.total} questions extracted · ${bank.published} published · ${bank.review} awaiting review`
              : "No question import has completed for this book yet."}
          </p>
          {bank?.notes.map((note) => (
            <p
              key={note}
              className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
            >
              {note}
            </p>
          ))}
          <div className="flex flex-wrap gap-3">
            <Link
              className="btn-secondary text-sm"
              href={`/textbooks/${bookId}`}
            >
              <BookOpen size={16} /> Read the full book
            </Link>
            <Link
              className="btn-secondary text-sm"
              href="/admin/questions/import"
            >
              Add or import more MCQs
            </Link>
          </div>
        </section>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Chapter",
                  "No.",
                  "Question",
                  "Source",
                  "Status",
                  "Action",
                ].map((column) => (
                  <th key={column} className="p-4">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id} className="border-t border-slate-100">
                  <td className="p-4">{question.chapterTitle}</td>
                  <td className="p-4">{question.number}</td>
                  <td className="max-w-sm p-4">
                    <p className="line-clamp-3">{question.questionText}</p>
                    <p className="mt-1 text-xs text-amber-700">
                      {question.qualityFlags.join(" · ")}
                      {!question.correctAnswer && " · Answer required"}
                    </p>
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/textbooks/${question.bookId}?page=${question.page}`}
                      target="_blank"
                      className="text-blue-700 underline"
                    >
                      PDF page {question.page}
                    </Link>
                    <p className="text-xs text-slate-500">{question.section}</p>
                  </td>
                  <td className="p-4">{question.status}</td>
                  <td className="p-4">
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => edit(question)}
                    >
                      Review MCQ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!questions.length && (
            <p role="status" className="p-6 text-sm text-slate-500">
              {loading
                ? "Loading questions…"
                : "No questions match this selection."}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {total} matching questions · Page {page} of{" "}
            {Math.max(1, Math.ceil(total / 25))}
          </p>
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              disabled={page <= 1 || loading}
              aria-label="Previous question page"
              onClick={() => setPage((value) => value - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn-secondary"
              disabled={page * 25 >= total || loading}
              aria-label="Next question page"
              onClick={() => setPage((value) => value + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        {selected && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
            <section
              role="dialog"
              aria-modal="true"
              ref={dialogRef}
              aria-labelledby="mcq-review-heading"
              className="mx-auto my-8 max-w-2xl rounded-2xl bg-white p-6 space-y-4"
            >
              <div className="flex justify-between gap-4">
                <h2 id="mcq-review-heading" className="text-xl font-bold">
                  Review textbook question
                </h2>
                <button
                  disabled={saving}
                  aria-label="Close question review"
                  onClick={() => setSelected(null)}
                >
                  <X />
                </button>
              </div>
              <Link
                href={`/textbooks/${selected.bookId}?page=${selected.page}`}
                target="_blank"
                className="inline-flex items-center gap-2 text-blue-700 underline"
              >
                <BookOpen size={16} /> Check original PDF page {selected.page}
              </Link>
              {selected.keyPage && (
                <Link
                  href={`/textbooks/${selected.bookId}?page=${selected.keyPage}`}
                  target="_blank"
                  className="ml-3 text-blue-700 underline"
                >
                  Answer key page {selected.keyPage}
                </Link>
              )}
              <form onSubmit={publish} className="space-y-4">
                <label className="block">
                  Question
                  <textarea
                    required
                    minLength={8}
                    maxLength={2500}
                    rows={4}
                    value={questionText}
                    onChange={(event) => setQuestionText(event.target.value)}
                  />
                </label>
                {options.map((option, index) => (
                  <label className="block" key={index}>
                    Option {"ABCD"[index]}
                    <textarea
                      required
                      maxLength={1000}
                      rows={2}
                      value={option}
                      onChange={(event) =>
                        setOptions((values) =>
                          values.map((value, position) =>
                            position === index ? event.target.value : value,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
                <label className="block">
                  Verified correct answer
                  <select
                    required
                    value={answer}
                    onChange={(event) =>
                      setAnswer(event.target.value as McqAnswer)
                    }
                  >
                    <option value="">Choose the correct answer</option>
                    {options.map((_, index) => (
                      <option key={index} value={"ABCD"[index]}>
                        Option {"ABCD"[index]}
                      </option>
                    ))}
                  </select>
                </label>
                {error && (
                  <p role="alert" className="text-rose-700">
                    {error}
                  </p>
                )}
                <button className="btn-primary" disabled={saving || !answer}>
                  {saving ? "Publishing…" : "Publish reviewed MCQ"}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
