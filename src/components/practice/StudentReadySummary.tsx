"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import catalog from "@/lib/textbooks-catalog.json";
import type { TextbookMcqCoverage } from "@/lib/textbook-question-types";

const books = new Map(catalog.books.map((book) => [book.id, book]));

type State =
  | { kind: "loading" | "signin" | "error" }
  | { kind: "ready"; coverage: TextbookMcqCoverage[] };

export default function StudentReadySummary() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/textbook-practice", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (controller.signal.aborted) return;
        if (response.status === 401) {
          setState({ kind: "signin" });
          return;
        }
        if (!response.ok) throw new Error("Coverage unavailable");
        const data = await response.json();
        if (!Array.isArray(data.coverage)) throw new Error("Invalid coverage");
        if (!controller.signal.aborted)
          setState({ kind: "ready", coverage: data.coverage });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ kind: "error" });
      });
    return () => controller.abort();
  }, [revision]);

  const subjects = new Map<
    string,
    { subject: string; medium: string; published: number; chapters: number }
  >();
  if (state.kind === "ready") {
    for (const row of state.coverage) {
      const book = books.get(row.bookId);
      if (!book || !row.published) continue;
      const key = `${book.subject}:${book.sourceMedium}`;
      const group = subjects.get(key) ?? {
        subject: book.subject,
        medium: book.sourceMedium,
        published: 0,
        chapters: 0,
      };
      group.published += row.published;
      group.chapters += row.chapters.filter(
        (chapter) => chapter.published > 0,
      ).length;
      subjects.set(key, group);
    }
  }
  const available = [...subjects.values()].sort((a, b) =>
    `${a.subject}:${a.medium}`.localeCompare(`${b.subject}:${b.medium}`),
  );

  return (
    <section
      aria-label="Student-ready book-back practice"
      className="rounded-3xl border border-blue-200 bg-white p-5 sm:p-7 space-y-4 text-left"
    >
      <h2 className="text-xl font-bold text-slate-900">
        Class 12 one-mark practice
      </h2>
      {state.kind === "loading" && (
        <p role="status">Loading available questions…</p>
      )}
      {state.kind === "signin" && (
        <p>
          <Link href="/login" className="font-semibold text-blue-700 underline">
            Sign in
          </Link>{" "}
          to see current English and Tamil question counts and choose a subject,
          textbook and chapter.
        </p>
      )}
      {state.kind === "error" && (
        <p role="alert">
          Question availability could not be loaded.{" "}
          <button
            className="text-blue-700 underline"
            onClick={() => {
              setState({ kind: "loading" });
              setRevision((value) => value + 1);
            }}
          >
            Try again
          </button>
        </p>
      )}
      {state.kind === "ready" && (
        <>
          <p role="status">
            {available.reduce((total, subject) => total + subject.published, 0)}{" "}
            student-ready book-back questions. English:{" "}
            {available
              .filter((s) => s.medium === "English")
              .reduce((n, s) => n + s.published, 0)}
            {" · "}Tamil:{" "}
            {available
              .filter((s) => s.medium === "Tamil")
              .reduce((n, s) => n + s.published, 0)}
            . Counts include eligible publications only.
          </p>
          {available.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {available.map((subject) => (
                <li
                  key={`${subject.subject}:${subject.medium}`}
                  className="rounded-xl border border-blue-100 bg-blue-50 p-3"
                >
                  <p className="font-semibold">
                    {subject.subject} · {subject.medium}
                  </p>
                  <p className="text-sm text-slate-600">
                    {subject.published} questions · {subject.chapters} chapters
                    with questions
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No published book-back questions are currently available.</p>
          )}
          <p className="text-sm text-slate-600">
            Unavailable chapters and questions awaiting review are not included.
            Each attempt uses selectable web questions with feedback and marks.
          </p>
        </>
      )}
      <Link href="/textbook-practice" className="btn-primary inline-flex">
        Choose medium, subject and chapter
      </Link>
    </section>
  );
}
