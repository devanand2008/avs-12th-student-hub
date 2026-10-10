"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import catalogJson from "@/lib/textbooks-catalog.json";
import type { TextbookMcqCoverage } from "@/lib/textbook-question-types";
import { BookOpen, ArrowRight } from "lucide-react";

export default function TextbookPracticePage() {
  const router = useRouter();
  const [coverage, setCoverage] = useState<TextbookMcqCoverage[]>([]);
  const [search, setSearch] = useState("");
  const [medium, setMedium] = useState("all");
  const [bookId, setBookId] = useState("");
  const [chapterId, setChapterId] = useState("all");
  const [count, setCount] = useState(10);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const selectedChapter = coverage
    .find((item) => item.bookId === bookId)
    ?.chapters.find((item) => item.id === chapterId);
  useEffect(() => {
    fetch("/api/textbook-practice", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setCoverage(data.coverage || []);
      })
      .catch((error) =>
        setError(error.message || "Could not load textbook practice."),
      )
      .finally(() => setLoading(false));
  }, []);
  const books = useMemo(
    () =>
      catalogJson.books.filter(
        (book) =>
          (medium === "all" || book.sourceMedium === medium) &&
          `${book.title} ${book.category}`
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase()),
      ),
    [medium, search],
  );
  const selected = coverage.find((item) => item.bookId === bookId);
  const book = catalogJson.books.find((item) => item.id === bookId);
  const available =
    chapterId === "all"
      ? selected?.published || 0
      : selected?.chapters.find((item) => item.id === chapterId)?.published ||
        0;
  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="workspace min-w-0 flex-1 space-y-6">
        <div>
          <span className="eyebrow">OFFICIAL TEXTBOOK PRACTICE</span>
          <h1 className="page-title">One-mark MCQs by subject and chapter</h1>
          <p className="mt-2 text-sm text-slate-600">
            Choose a textbook and practise questions checked against its printed
            answer key or reviewed by a teacher. You can practise again at any
            time, or read the original exercises for every book.
          </p>
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">
            {error}
          </p>
        )}
        <section className="rounded-2xl border border-blue-100 bg-white p-5 sm:p-7 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              Find a subject
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Physics, Commerce, Tamil…"
              />
            </label>
            <label>
              Textbook medium
              <select
                value={medium}
                onChange={(event) => {
                  setMedium(event.target.value);
                  setBookId("");
                  setChapterId("all");
                }}
              >
                <option value="all">English and Tamil</option>
                <option value="English">English</option>
                <option value="Tamil">Tamil</option>
              </select>
            </label>
          </div>
          <label className="block">
            Subject and textbook
            <select
              value={bookId}
              onChange={(event) => {
                setBookId(event.target.value);
                setChapterId("all");
              }}
            >
              <option value="">Choose a textbook</option>
              {books.map((book) => {
                const bank = coverage.find((item) => item.bookId === book.id);
                return (
                  <option key={book.id} value={book.id}>
                    {book.title} · {book.sourceMedium} · {bank?.published || 0}{" "}
                    ready
                  </option>
                );
              })}
            </select>
          </label>
          {selected && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  Chapter
                  <select
                    value={chapterId}
                    onChange={(event) => setChapterId(event.target.value)}
                  >
                    <option value="all">
                      All chapters · {selected.published} questions
                    </option>
                    {selected.chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.number}. {chapter.title} · {chapter.published}{" "}
                        questions
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Questions in this practice
                  <select
                    value={count}
                    onChange={(event) => setCount(Number(event.target.value))}
                  >
                    {[5, 10, 20, 25, 50, 100].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                    <option value={500}>
                      All available questions (up to 500)
                    </option>
                  </select>
                </label>
              </div>
              <p role="status" className="text-sm text-slate-600">
                {available
                  ? `${available} questions available. Each answer includes its textbook source.`
                  : "Questions for this selection are awaiting review. You can still read the original textbook exercises."}
              </p>
            </>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              className="btn-primary"
              disabled={loading || !selected || !available}
              onClick={() => {
                const params = new URLSearchParams({
                  subjectId: selected!.subjectId,
                  mode: "chapter",
                  sourceFilter: "Book-In",
                  count: String(Math.min(count, available)),
                  ...(chapterId !== "all" ? { chapterId } : {}),
                });
                router.push("/practice/session?" + params);
              }}
            >
              Start textbook practice <ArrowRight size={16} />
            </button>
            {book && (
              <Link
                href={`/textbooks/${book.id}?page=${selectedChapter?.exercisePage || selectedChapter?.page || 1}`}
                className="btn-secondary"
              >
                <BookOpen size={16} /> Read original exercises
              </Link>
            )}
          </div>
        </section>
        <p className="text-xs text-slate-500">
          The library contains {catalogJson.books.length} official textbook
          records. Questions without a verified answer stay in the teacher
          review queue.
        </p>
        {selected && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="text-lg font-bold">
              Chapter practice and original exercises
            </h2>
            <p className="text-sm text-slate-600">
              Open any chapter to read every printed question. Automatic answer
              checking is available for questions with verified answers.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {selected.chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="rounded-xl border border-slate-200 p-3 space-y-2"
                >
                  <h3 className="font-semibold">
                    {chapter.number}. {chapter.title}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {chapter.published} verified questions available
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {!!chapter.published && (
                      <Link
                        className="font-semibold text-blue-700"
                        href={`/practice/session?${new URLSearchParams({ subjectId: selected.subjectId, chapterId: chapter.id, mode: "chapter", sourceFilter: "Book-In", count: String(Math.min(chapter.published, 500)) })}`}
                      >
                        Practise this chapter
                      </Link>
                    )}
                    <Link
                      className="text-blue-700 underline"
                      href={`/textbooks/${bookId}?page=${chapter.exercisePage || chapter.page}`}
                    >
                      Original exercises
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
