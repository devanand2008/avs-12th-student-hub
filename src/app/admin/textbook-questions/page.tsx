"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import catalog from "@/lib/textbooks-catalog.json";
import type {
  TextbookMcqCandidate,
  TextbookMcqCoverage,
  McqAnswer,
  TextbookReviewBatch,
} from "@/lib/textbook-question-types";
import { BookOpen, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ReviewTextbook } from "@/lib/textbook-review-queue";
import { reviewIssues } from "@/lib/textbook-review-queue";

export default function TextbookQuestionsPage() {
  const [coverage, setCoverage] = useState<TextbookMcqCoverage[]>([]);
  const [bookId, setBookId] = useState(catalog.books[0]?.id || "");
  const [chapterId, setChapterId] = useState("all");
  const [status, setStatus] = useState("review");
  const [search, setSearch] = useState("");
  const [medium, setMedium] = useState("all");
  const [bookMetadata, setBookMetadata] = useState<ReviewTextbook[]>([]);
  const [exporting, setExporting] = useState(false);
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
  const [batches, setBatches] = useState<TextbookReviewBatch[]>([]);
  const [batchId, setBatchId] = useState("all");
  const [humanConfirmed, setHumanConfirmed] = useState(false);
  const [reason, setReason] = useState("");
  const [batchRevision, setBatchRevision] = useState(0);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/textbook-questions?books=true", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!controller.signal.aborted) setBookMetadata(data.books || []);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!selected) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), a[href], textarea, select, input:not(:disabled)",
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
          ...(batchId !== "all" ? { batchId } : {}),
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
    [bookId, chapterId, page, status, batchId],
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      `/api/admin/textbook-questions?bookId=${encodeURIComponent(bookId)}&batches=true`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!controller.signal.aborted) setBatches(data.batches || []);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => controller.abort();
  }, [bookId, batchRevision]);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => refreshQuestions(controller.signal));
    return () => controller.abort();
  }, [refreshQuestions]);
  const bank = coverage.find((item) => item.bookId === bookId);
  const selectedBook = bookMetadata.find(
    (book) => book.id === selected?.bookId,
  );
  const books = bookMetadata.filter(
    (book) =>
      (medium === "all" || book.source_medium === medium) &&
      (book.id === bookId ||
        `${book.title} ${book.source_medium}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase())),
  );
  async function exportQueue(allTamil: boolean) {
    setExporting(true);
    setError("");
    try {
      const params = new URLSearchParams(
        allTamil
          ? { medium: "Tamil" }
          : {
              bookId,
              ...(chapterId !== "all" ? { chapterId } : {}),
              ...(batchId !== "all" ? { batchId } : {}),
            },
      );
      const response = await fetch(
        "/api/admin/textbook-questions/export?" + params,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error((await response.json()).error);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `teacher-review-${allTamil ? "Tamil" : bookId}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(
        "Prepared review queue exported for reference. Record decisions individually in this page.",
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not export the queue.",
      );
    } finally {
      setExporting(false);
    }
  }
  function edit(question: TextbookMcqCandidate) {
    setSelected(question);
    setQuestionText(question.questionText);
    setOptions([...question.options]);
    setAnswer(question.correctAnswer || "");
    setHumanConfirmed(false);
    setReason("");
    setError("");
    setMessage("");
  }
  async function publish(event: React.FormEvent) {
    event.preventDefault();
    if (!answer || !humanConfirmed) return;
    await moderate("approve");
  }
  async function moderate(action: "approve" | "edit" | "reject") {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/textbook-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          action,
          expectedUpdatedAt: selected.updatedAt,
          humanConfirmed,
          reason,
          questionText,
          options,
          correctAnswer: answer || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSelected(null);
      setBatchRevision((value) => value + 1);
      setMessage(
        action === "approve"
          ? "Reviewed question published. Students can practise it now."
          : action === "reject"
            ? "Question rejected with your reason. It is unavailable for new practice."
            : "Review edits saved. The question awaits explicit approval.",
      );
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
            Check the original question, printed choices and answer evidence. A
            printed key alone does not approve a held question. Save edits,
            reject with a reason, or explicitly approve each reviewed MCQ.
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
        <section className="content-form min-w-0 rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <label className="block">
            Textbook medium
            <select
              value={medium}
              disabled={saving || !bookMetadata.length}
              onChange={(event) => {
                const value = event.target.value;
                setMedium(value);
                setSearch("");
                const first = bookMetadata.find(
                  (book) => value === "all" || book.source_medium === value,
                );
                if (first) setBookId(first.id);
                setChapterId("all");
                setBatchId("all");
                setPage(1);
              }}
            >
              <option value="all">All media</option>
              <option value="Tamil">Tamil medium</option>
              <option value="English">English medium</option>
            </select>
          </label>
          <p className="text-sm text-slate-600">
            Medium comes from the database textbook metadata. Prepared packets
            are a subset of the review queue.
          </p>
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
                disabled={saving}
                onChange={(event) => {
                  setBookId(event.target.value);
                  setChapterId("all");
                  setBatchId("all");
                  setPage(1);
                }}
              >
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} · {book.source_medium}
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
                disabled={saving}
                onChange={(event) => {
                  setChapterId(event.target.value);
                  setBatchId("all");
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
                disabled={saving}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="review">Needs review</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
                <option value="all">All questions</option>
              </select>
            </label>
          </div>
          <label className="block">
            Teacher review batch
            <select
              value={batchId}
              disabled={saving}
              onChange={(event) => {
                setBatchId(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All batches</option>
              {batches
                .filter(
                  (batch) =>
                    chapterId === "all" || batch.chapterId === chapterId,
                )
                .map((batch) => (
                  <option key={batch.batchId} value={batch.batchId}>
                    {batch.batchId.split("-ch-")[1]}: {batch.pending} pending,{" "}
                    {batch.keyMatched} key matches, {batch.uncertain} uncertain,{" "}
                    {batch.approved} approved, {batch.rejected} rejected
                  </option>
                ))}
            </select>
          </label>
          <p className="text-sm text-slate-600">
            Prepared batches: {batches.length}. Pending:{" "}
            {batches.reduce((sum, b) => sum + b.pending, 0)}. Rejected:{" "}
            {batches.reduce((sum, b) => sum + b.rejected, 0)}. Approved:{" "}
            {batches.reduce((sum, b) => sum + b.approved, 0)}. Key match counts
            are automated evidence checks, not teacher approvals.
          </p>
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
            <button
              type="button"
              className="btn-secondary text-sm"
              disabled={exporting || !bookMetadata.length}
              onClick={() => void exportQueue(false)}
            >
              {exporting
                ? "Exporting…"
                : "Export selected prepared queue (CSV)"}
            </button>
            <button
              type="button"
              className="btn-secondary text-sm"
              disabled={exporting || !bookMetadata.length}
              onClick={() => void exportQueue(true)}
            >
              Export all Tamil prepared batches (CSV)
            </button>
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
        <div
          aria-busy={loading}
          className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"
        >
          {loading && !!questions.length && (
            <p role="status" className="p-4 text-sm text-slate-600">
              Refreshing the selected queue…
            </p>
          )}
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
                <tr
                  key={question.id}
                  data-candidate-id={question.id}
                  className="border-t border-slate-100"
                >
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
                  <td className="p-4">
                    {question.practicePublished ? "Published · " : "Held · "}
                    {question.reviewStatus || question.status}
                  </td>
                  <td className="p-4">
                    <button
                      className="btn-secondary text-xs"
                      disabled={loading || saving}
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
          <div className="fixed inset-0 z-[80] overflow-y-auto overflow-x-hidden bg-black/50 p-4">
            <section
              role="dialog"
              aria-modal="true"
              ref={dialogRef}
              aria-labelledby="mcq-review-heading"
              className="mx-auto my-8 w-full min-w-0 max-w-2xl break-words rounded-2xl bg-white p-6 space-y-4"
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
              <section
                className="rounded-xl bg-slate-50 p-4 space-y-3"
                aria-label="Original extraction and source evidence"
              >
                <p className="text-sm">
                  Textbook:{" "}
                  {selectedBook?.title ||
                    selected.reviewPreparation?.title ||
                    selected.bookId}
                  {" · Candidate ID: "}
                  {selected.id}
                  {" · Batch: "}
                  {selected.reviewPreparation?.batchId || "No prepared packet"}
                </p>
                <p className="text-sm">
                  {selectedBook?.subject || selected.reviewPreparation?.subject}
                  {" · "}
                  {selectedBook?.source_medium ||
                    selected.reviewPreparation?.medium}
                  {(selectedBook?.volume ||
                    selected.reviewPreparation?.volume) &&
                    ` · Volume ${selectedBook?.volume || selected.reviewPreparation?.volume}`}
                  {" · "}
                  {selected.chapterTitle}
                  {" · Question "}
                  {selected.number}
                  {" · PDF page "}
                  {selected.page}
                  {" · Printed page "}
                  {selected.reviewPreparation?.printedPage ?? "unknown"}
                </p>
                <p className="text-xs">
                  {selected.reviewPreparation?.printedPageEvidence}
                </p>
                {selected.publicationChapterId &&
                  selected.publicationChapterId !== selected.chapterId && (
                    <p className="text-sm text-amber-800">
                      Published chapter:{" "}
                      {selected.publicationChapterId.split("-ch-")[1]}. The
                      original parser chapter differs; the published mapping is
                      retained during review.
                    </p>
                  )}
                <h3 className="font-semibold">
                  Original extracted question and choices
                </h3>
                <p className="whitespace-pre-wrap">
                  {selected.originalExtraction?.questionText ||
                    selected.reviewPreparation?.sourceQuestionText ||
                    selected.questionText}
                </p>
                {(
                  selected.originalExtraction?.options ||
                  selected.reviewPreparation?.sourceOptions ||
                  selected.options
                ).map((option, index) => (
                  <p key={index} className="whitespace-pre-wrap">
                    {"ABCD"[index]}.{" "}
                    {option || "[No readable option extracted]"}
                  </p>
                ))}
                {selected.reviewPreparation?.englishText && (
                  <p className="whitespace-pre-wrap text-sm">
                    English source: {selected.reviewPreparation.englishText}
                  </p>
                )}
                {selected.reviewPreparation?.tamilText && (
                  <p lang="ta" className="whitespace-pre-wrap text-sm">
                    Tamil source: {selected.reviewPreparation.tamilText}
                  </p>
                )}
                <p className="text-sm">
                  Proposed answer: {selected.correctAnswer || "unknown"}. Source
                  check:{" "}
                  {selected.reviewPreparation?.sourceCheck || "not prepared"}.
                  Printed key check:{" "}
                  {selected.reviewPreparation?.keyCheck || "not prepared"}.
                </p>
                <p className="text-sm text-amber-800">
                  {reviewIssues(selected).join(" · ")}
                </p>
                {!!selected.reviewPreparation?.duplicateIds.length && (
                  <p className="text-sm text-amber-800">
                    Potential duplicate/overlap IDs:{" "}
                    {selected.reviewPreparation.duplicateIds.join(", ")}
                  </p>
                )}
                {selected.reviewPreparation && (
                  <>
                    <details>
                      <summary>
                        Original page text (PDF {selected.page})
                      </summary>
                      <pre className="whitespace-pre-wrap break-words text-xs mt-2">
                        {selected.reviewPreparation.sourcePageText}
                      </pre>
                    </details>
                    <details>
                      <summary>
                        Printed answer-key evidence (PDF {selected.keyPage})
                      </summary>
                      <p className="text-sm">
                        Page-wide parsed answer:{" "}
                        {selected.reviewPreparation.parsedAnswer || "ambiguous"}
                        . Confirm chapter and exercise scope.
                      </p>
                      <pre className="whitespace-pre-wrap break-words text-xs mt-2">
                        {selected.reviewPreparation.keyPageText}
                      </pre>
                    </details>
                  </>
                )}
                {!!selected.reviewHistory?.length && (
                  <details>
                    <summary>Review history</summary>
                    {selected.reviewHistory.map((entry, index) => (
                      <div key={index} className="border-t py-2 text-xs">
                        <p>
                          {entry.action} · {entry.actorId} · {entry.at} ·{" "}
                          {entry.reason}
                        </p>
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(
                            { before: entry.before, after: entry.after },
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    ))}
                  </details>
                )}
              </section>
              <form
                onSubmit={publish}
                className="content-form min-w-0 space-y-4 [&_textarea]:text-base [&_select]:text-base"
              >
                <label className="block">
                  Question
                  <textarea
                    required
                    minLength={8}
                    maxLength={2500}
                    rows={4}
                    value={questionText}
                    onChange={(event) => {
                      setQuestionText(event.target.value);
                      setHumanConfirmed(false);
                    }}
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
                      onChange={(event) => {
                        setHumanConfirmed(false);
                        setOptions((values) =>
                          values.map((value, position) =>
                            position === index ? event.target.value : value,
                          ),
                        );
                      }}
                    />
                  </label>
                ))}
                {options.length < 4 && (
                  <button
                    type="button"
                    className="btn-secondary w-full whitespace-normal"
                    onClick={() => {
                      setOptions((values) => [...values, ""]);
                      setHumanConfirmed(false);
                    }}
                  >
                    Add a missing printed option
                  </button>
                )}
                {options.length > 2 && (
                  <button
                    type="button"
                    className="btn-secondary w-full whitespace-normal"
                    onClick={() => {
                      setOptions((values) => values.slice(0, -1));
                      setAnswer("");
                      setHumanConfirmed(false);
                    }}
                  >
                    Remove last option after checking source
                  </button>
                )}
                <label className="block">
                  Verified correct answer
                  <select
                    required
                    value={answer}
                    onChange={(event) => {
                      setAnswer(event.target.value as McqAnswer);
                      setHumanConfirmed(false);
                    }}
                  >
                    <option value="">Choose the correct answer</option>
                    {options.map((_, index) => (
                      <option key={index} value={"ABCD"[index]}>
                        Option {"ABCD"[index]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  Review note / rejection reason
                  <textarea
                    maxLength={1000}
                    rows={2}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={humanConfirmed}
                    onChange={(event) =>
                      setHumanConfirmed(event.target.checked)
                    }
                  />
                  I checked the original question, printed options and correct
                  answer, and approve this question for students.
                </label>
                {error && (
                  <p role="alert" className="text-rose-700">
                    {error}
                  </p>
                )}
                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  <button
                    className="btn-primary w-full whitespace-normal"
                    disabled={saving || !answer || !humanConfirmed}
                  >
                    {saving ? "Publishing…" : "Publish reviewed MCQ"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary w-full whitespace-normal"
                    disabled={saving}
                    onClick={() => moderate("edit")}
                  >
                    Save edits for review
                  </button>
                  <button
                    type="button"
                    className="btn-secondary w-full whitespace-normal"
                    disabled={saving || reason.trim().length < 3}
                    onClick={() => moderate("reject")}
                  >
                    Reject question
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
