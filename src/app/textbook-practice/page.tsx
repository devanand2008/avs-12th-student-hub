"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import catalog from "@/lib/textbooks-catalog.json";
import type { TextbookMcqCoverage } from "@/lib/textbook-question-types";
import { ArrowRight } from "lucide-react";

type Preview = {
  id: string;
  questionText: string;
  chapterId: string;
  sourceQuestionNumber?: number;
  sourcePage?: number;
};
export default function TextbookPracticePage() {
  const router = useRouter();
  const [coverage, setCoverage] = useState<TextbookMcqCoverage[]>([]);
  const [search, setSearch] = useState("");
  const [medium, setMedium] = useState("all");
  const [subject, setSubject] = useState("all");
  const [chapterSearch, setChapterSearch] = useState("");
  const [bookId, setBookId] = useState("");
  const [chapterId, setChapterId] = useState("all");
  const [count, setCount] = useState("10");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [questionSearch, setQuestionSearch] = useState("");
  const [page, setPage] = useState(1);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [matched, setMatched] = useState<number | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const [revision, setRevision] = useState(0);
  const [coverageRevision, setCoverageRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/textbook-practice", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Could not load textbook practice.");
        if (controller.signal.aborted) return;
        setCoverage(data.coverage || []);
        const initial = new URLSearchParams(window.location.search).get(
          "bookId",
        );
        if (initial && catalog.books.some((b) => b.id === initial))
          setBookId((current) => current || initial);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Could not load textbook practice.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [coverageRevision]);
  const subjects = useMemo(
    () =>
      [
        ...new Set(
          catalog.books
            .filter((b) => medium === "all" || b.sourceMedium === medium)
            .map((b) => b.subject),
        ),
      ].sort(),
    [medium],
  );
  const books = useMemo(
    () =>
      catalog.books
        .filter((book) => {
          const bank = coverage.find((c) => c.bookId === book.id);
          return (
            (medium === "all" || book.sourceMedium === medium) &&
            (subject === "all" || book.subject === subject) &&
            [
              book.title,
              book.category,
              book.volume,
              ...(bank?.chapters.map((c) => `${c.number} ${c.title}`) || []),
            ]
              .join(" ")
              .toLocaleLowerCase()
              .includes(search.trim().toLocaleLowerCase())
          );
        })
        .sort(
          (a, b) =>
            Number(
              (coverage.find((c) => c.bookId === b.id)?.published || 0) > 0,
            ) -
              Number(
                (coverage.find((c) => c.bookId === a.id)?.published || 0) > 0,
              ) || a.title.localeCompare(b.title),
        ),
    [medium, subject, search, coverage],
  );
  const selected = coverage.find((c) => c.bookId === bookId);
  const book = catalog.books.find((b) => b.id === bookId);
  const visibleChapters =
    selected?.chapters.filter((c) =>
      `${c.number} ${c.title}`
        .toLocaleLowerCase()
        .includes(chapterSearch.trim().toLocaleLowerCase()),
    ) || [];
  const readyInSelection = coverage
    .filter((c) => books.some((b) => b.id === c.bookId))
    .reduce((sum, c) => sum + c.published, 0);
  const available =
    chapterId === "all"
      ? selected?.published || 0
      : selected?.chapters.find((c) => c.id === chapterId)?.published || 0;
  useEffect(() => {
    const controller = new AbortController();
    if (!bookId || !available) return () => controller.abort();
    const timer = setTimeout(async () => {
      setQuestionLoading(true);
      setQuestionError("");
      try {
        const params = new URLSearchParams({
          bookId,
          search: questionSearch,
          page: String(page),
          ...(chapterId !== "all" ? { chapterId } : {}),
        });
        const response = await fetch(
          `/api/textbook-practice/questions?${params}`,
          { cache: "no-store", signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!controller.signal.aborted) {
          setPreviews(data.questions);
          setMatched(data.total);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setQuestionError(
            error instanceof Error
              ? error.message
              : "Could not find questions.",
          );
          setMatched(null);
        }
      } finally {
        if (!controller.signal.aborted) setQuestionLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [bookId, chapterId, available, questionSearch, page, revision]);
  function resetQuestions() {
    setQuestionSearch("");
    setMatched(null);
    setPreviews([]);
    setPage(1);
    setQuestionError("");
    setQuestionLoading(false);
    setChapterSearch("");
  }
  const sessionCount = questionSearch.trim() ? matched || 0 : available;
  function start(chapter = chapterId, entireChapter = false) {
    if (!selected || !book) return;
    const params = new URLSearchParams({
      subjectId: selected.subjectId,
      bookId: book.id,
      mode: "chapter",
      sourceFilter: "Book-In",
      ...(chapter !== "all" ? { chapterId: chapter } : {}),
    });
    if (entireChapter || chapter !== chapterId || count === "all")
      params.set("allAvailable", "true");
    else params.set("count", String(Math.min(Number(count), sessionCount)));
    if (chapter === chapterId && questionSearch.trim())
      params.set("search", questionSearch.trim());
    router.push(`/practice/session?${params}`);
  }
  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="workspace textbook-practice-workspace min-w-0 flex-1 space-y-6">
        <div>
          <span className="eyebrow">CLASS 12 · BOOK-BACK PRACTICE</span>
          <h1 className="page-title">Book-Back One-Mark MCQ Practice</h1>
          <p className="mt-2 text-sm text-slate-600">
            Choose a medium, subject, textbook and chapter. Practise published
            web questions with feedback and unlimited attempts.
          </p>
        </div>
        {error && (
          <div role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">
            {error}{" "}
            <button
              onClick={() => {
                setLoading(true);
                setError("");
                setCoverageRevision((n) => n + 1);
              }}
              className="underline"
            >
              Try again
            </button>
          </div>
        )}
        <section className="space-y-5 rounded-2xl border border-blue-100 bg-white p-5 sm:p-7">
          {loading && (
            <p role="status">Loading textbooks and question counts…</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              Textbook medium
              <select
                value={medium}
                onChange={(e) => {
                  setMedium(e.target.value);
                  setSubject("all");
                  setBookId("");
                  setChapterId("all");
                  resetQuestions();
                }}
              >
                <option value="all">English and Tamil</option>
                <option value="English">English</option>
                <option value="Tamil">Tamil</option>
              </select>
            </label>
            <label>
              Subject
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setBookId("");
                  setChapterId("all");
                  resetQuestions();
                }}
              >
                <option value="all">All subjects</option>
                {subjects.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Find a subject
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setBookId("");
                  setChapterId("all");
                  resetQuestions();
                }}
                placeholder="Search books, volumes or chapters"
              />
            </label>
          </div>
          <label className="block">
            Subject and textbook
            <select
              value={bookId}
              disabled={loading || !!error}
              onChange={(e) => {
                setBookId(e.target.value);
                setChapterId("all");
                resetQuestions();
              }}
            >
              <option value="">Choose a textbook</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} · {b.sourceMedium} ·{" "}
                  {coverage.find((c) => c.bookId === b.id)?.published || 0}{" "}
                  ready
                </option>
              ))}
            </select>
          </label>
          {!loading && !error && !books.length && (
            <p role="status">
              No textbooks match. Try another subject or medium.
            </p>
          )}
          {!loading && !error && (
            <p className="text-sm text-blue-900" role="status">
              {readyInSelection} student-ready one-mark questions across the
              matching textbooks. All available questions mode uses the same
              publication checks.
            </p>
          )}
          {book && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  Chapter
                  <select
                    value={chapterId}
                    onChange={(e) => {
                      setChapterId(e.target.value);
                      resetQuestions();
                    }}
                  >
                    <option value="all">
                      All chapters · {selected?.published || 0} questions
                    </option>
                    {selected?.chapters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.number}. {c.title} · {c.published} questions
                        {c.published ? "" : " · Not published yet"}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Questions in this practice
                  <select
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                  >
                    {[5, 10, 20, 25, 50, 100].map((n) => (
                      <option key={n} value={String(n)}>
                        {n}
                      </option>
                    ))}
                    <option value="all">All available questions</option>
                  </select>
                </label>
              </div>
              <p role="status" className="text-sm text-slate-600">
                {available
                  ? `${sessionCount} available questions${questionSearch.trim() ? " match your search" : " in this selection"}. This attempt includes ${count === "all" ? sessionCount : Math.min(Number(count), sessionCount)} questions, worth one mark each.`
                  : "No published questions for this selection yet. Extraction and teacher review are incomplete; choose another chapter or textbook."}
              </p>
            </>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              className="btn-primary"
              disabled={
                loading ||
                !!error ||
                !selected ||
                !sessionCount ||
                (Boolean(questionSearch.trim()) &&
                  (questionLoading || !!questionError))
              }
              onClick={() => start()}
            >
              Start Practice Session <ArrowRight size={16} />
            </button>
            <Link href="/practice" className="btn-secondary">
              Practice Core Syllabus <ArrowRight size={16} />
            </Link>
          </div>
        </section>
        <p className="text-xs text-slate-500">
          {catalog.books.length} textbook records. Coverage is incomplete: PDF
          availability does not establish extracted or approved exercises.
          Practice uses web question cards.
        </p>
        {book && available > 0 && (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold">Find available questions</h2>
            <label className="block">
              Search question text or number
              <input
                type="search"
                maxLength={200}
                value={questionSearch}
                onChange={(e) => {
                  setQuestionSearch(e.target.value);
                  setMatched(null);
                  setQuestionLoading(true);
                  setPage(1);
                }}
                placeholder="Question wording, option text or printed number"
              />
            </label>
            {questionError && (
              <p role="alert">
                {questionError}{" "}
                <button
                  className="underline"
                  onClick={() => setRevision((n) => n + 1)}
                >
                  Try again
                </button>
              </p>
            )}
            {questionLoading ? (
              <p role="status">Finding questions…</p>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  {matched ?? available} questions. Answers appear after you
                  choose an option during practice.
                </p>
                <ol className="space-y-3">
                  {previews.map((q) => (
                    <li
                      key={q.id}
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <p className="text-xs text-slate-500">
                        {
                          selected?.chapters.find((c) => c.id === q.chapterId)
                            ?.title
                        }{" "}
                        · Question {q.sourceQuestionNumber ?? "—"} · PDF page{" "}
                        {q.sourcePage ?? "—"}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {q.questionText}
                      </p>
                    </li>
                  ))}
                </ol>
                {matched === 0 && (
                  <p role="status">
                    No published question matches this search.
                  </p>
                )}
              </>
            )}
            <div className="flex items-center gap-3">
              <button
                className="btn-secondary"
                disabled={page === 1 || questionLoading}
                onClick={() => setPage((n) => n - 1)}
              >
                Previous results
              </button>
              <span>Page {page}</span>
              <button
                className="btn-secondary"
                disabled={questionLoading || page * 20 >= (matched || 0)}
                onClick={() => setPage((n) => n + 1)}
              >
                Next results
              </button>
            </div>
          </section>
        )}
        {selected && (
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold">Chapter Practice Breakdown</h2>
            <label className="block">
              Find a chapter by name or number
              <input
                type="search"
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
                placeholder="Chapter name or number"
              />
            </label>
            <p className="text-sm text-slate-600">
              Detected chapters may still need source verification. Open
              chapters with published questions.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleChapters.map((c) => (
                <div
                  key={c.id}
                  className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <h3 className="text-sm font-semibold">
                    {c.number}. {c.title}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {c.published} published questions · {c.review} extraction
                    candidates requiring review
                  </p>
                  {c.published > 0 ? (
                    <button
                      className="btn-primary"
                      onClick={() => start(c.id, true)}
                    >
                      Start Practice ({c.published} MCQs)
                    </button>
                  ) : (
                    <p className="text-xs text-amber-800">
                      No published questions yet.
                      {c.review
                        ? " Teacher review is required."
                        : " The book-back section needs extraction or verification."}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {!visibleChapters.length && (
              <p role="status">
                No chapters match this search. Try a chapter number or another
                name.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
