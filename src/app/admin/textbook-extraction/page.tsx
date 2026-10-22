"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Link from "next/link";

interface Report {
  progressAudit?: {
    checkedAt: string;
    checksumVerifiedPdfs: number;
    activeOccurrences: number;
    uniqueContentSignatures: number;
    duplicateOccurrencesBeyondFirst: number;
    answersUnknown: number;
    sourceBoundedPrintedKeyMatches: number;
    sourceBoundedTamilCorrection: number;
    sourceBoundedOptionRecovery: number;
    sourceBoundedDiagramVerification: number;
    decisions: {
      pending: number;
      reviewed: number;
      approved: number;
      rejected: number;
      needsCorrection: number;
    };
  };
  checkedAt: string;
  discoveredPdfs: number;
  processedReports: number;
  uniqueCandidateIds: number;
  duplicateCandidateIds: number;
  preservedCandidateRecords: number;
  quarantinedCandidateRecords: number;
  approvedNewCandidates: number;
  publishedNewCandidates: number;
  parserBookBackCandidates: number;
  textAndKeyEligibleCandidates: number;
  publicationSnapshot: { checkedAt: string } | null;
  failures: { bookId: string; error: string }[];
  books: {
    book: {
      id: string;
      subject: string;
      title: string;
      medium: string;
      volume: string | null;
    };
    pages: number;
    failedPages: { page: number; error: string }[];
    sparsePages: number[];
    chapters: {
      id: string;
      number: number;
      title: string;
      sectionCount: number;
      extractedCandidates: number;
      bookBackCandidates: number;
      textAndKeyEligible: number;
      damagedOrAmbiguous: number;
      published: number | null;
      authenticSourceQuestionTotal?: number | null;
      printedKeyMatchedSourceQuestions?: number | null;
      localReview?: { pending: number; approved: number; needs_correction: number; rejected: number } | null;
      warnings: string[];
    }[];
  }[];
}
export default function TextbookExtractionPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [medium, setMedium] = useState("all");
  const [bookId, setBookId] = useState("");
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [volume, setVolume] = useState("all");
  const [chapterSearch, setChapterSearch] = useState("");
  const [extraction, setExtraction] = useState("all");
  const [answerStatus, setAnswerStatus] = useState("all");
  const [reviewStatus, setReviewStatus] = useState("all");
  const [publication, setPublication] = useState("all");
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/textbook-extraction", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setReport(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, []);
  const books =
    report?.books.filter(
      (b) =>
        (medium === "all" || b.book.medium === medium) &&
        (!subject || b.book.subject === subject) &&
        (volume === "all" || (b.book.volume ?? "none") === volume) &&
        `${b.book.title} ${b.book.subject}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase()),
    ) || [];
  const selected = books.find((b) => b.book.id === bookId);
  const chapters = selected?.chapters.filter((c) =>
    `${c.number} ${c.title}`.toLocaleLowerCase().includes(chapterSearch.toLocaleLowerCase()) &&
    (extraction === "all" || (extraction === "bounded" ? c.authenticSourceQuestionTotal != null : c.authenticSourceQuestionTotal == null)) &&
    (answerStatus === "all" || (answerStatus === "key" ? (c.printedKeyMatchedSourceQuestions ?? 0) > 0 : (c.printedKeyMatchedSourceQuestions ?? 0) === 0)) &&
    (reviewStatus === "all" || (c.localReview?.[reviewStatus as keyof NonNullable<typeof c.localReview>] ?? 0) > 0) &&
    (publication === "all" || (publication === "available" ? (c.published ?? 0) > 0 : c.published === 0)),
  ) ?? [];
  return (
    <div className="flex flex-1">
      <Sidebar isAdmin />
      <main className="workspace min-w-0 flex-1 space-y-5">
        <h1 className="page-title">Textbook extraction coverage</h1>
        <p className="text-sm text-slate-600">
          Read-only extraction inventory. Parser eligibility and printed-key
          agreement do not approve a question. Local candidates stay held until
          individual teacher verification.
        </p>
        <p className="text-sm text-slate-600">
          These local extraction drafts are separate from the live moderation
          queue. CSV downloads are for teacher reference; they do not import,
          approve or publish records.
        </p>
        {error ? (
          <p role="alert">{error}</p>
        ) : !report ? (
          <p role="status">Loading extraction records…</p>
        ) : (
          <>
            <p>
              Recorded {new Date(report.checkedAt).toLocaleString()}.{" "}
              {report.processedReports}/{report.discoveredPdfs} PDF reports ·{" "}
              {report.uniqueCandidateIds} unique extraction candidates ·{" "}
              {report.parserBookBackCandidates} parser-classified book-back
              candidates · {report.textAndKeyEligibleCandidates}{" "}
              text/key-eligible candidates.
            </p>
            <p className="text-sm text-slate-600">
              {report.duplicateCandidateIds} duplicate active IDs ·{" "}
              {report.preservedCandidateRecords} preserved local records ·{" "}
              {report.quarantinedCandidateRecords} inactive artifacts excluded
              from active counts and reference exports. This extraction run
              approved {report.approvedNewCandidates} and published{" "}
              {report.publishedNewCandidates} new candidates.
            </p>
            <p className="text-sm text-slate-600">
              Publication counts are a dated snapshot{" "}
              {report.publicationSnapshot
                ? new Date(
                    report.publicationSnapshot.checkedAt,
                  ).toLocaleString()
                : "(not verified)"}
              . Source question totals and complete chapter coverage remain
              unverified.
            </p>
            <div className="flex flex-wrap gap-3">
              {report.progressAudit && (
                <a
                  href="/api/admin/textbook-extraction?format=manifest"
                  className="btn-secondary"
                >
                  Download processing manifest
                </a>
              )}
              <a
                href="/api/admin/textbook-extraction?format=csv"
                className="btn-secondary"
              >
                Download chapter coverage CSV
              </a>
              <Link href="/admin/textbook-questions" className="btn-primary">
                Open individual question review
              </Link>
            </div>
            {report.progressAudit && (
              <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 space-y-3">
                <h2 className="font-bold">
                  Source processing and local review
                </h2>
                <p className="text-sm">
                  Audit recorded{" "}
                  {new Date(report.progressAudit.checkedAt).toLocaleString()}.{" "}
                  {report.progressAudit.checksumVerifiedPdfs} source checksums
                  checked. These are local audit counts, not live publication
                  counts.
                </p>
                <dl className="grid gap-3 sm:grid-cols-3 text-sm">
                  {[
                    [
                      "Active question occurrences",
                      report.progressAudit.activeOccurrences,
                    ],
                    [
                      "Exact content signatures",
                      report.progressAudit.uniqueContentSignatures,
                    ],
                    [
                      "Duplicate occurrences beyond first",
                      report.progressAudit.duplicateOccurrencesBeyondFirst,
                    ],
                    [
                      "Unknown answers (active extraction)",
                      report.progressAudit.answersUnknown,
                    ],
                    [
                      "Bounded printed-key matches",
                      report.progressAudit.sourceBoundedPrintedKeyMatches,
                    ],
                    [
                      "Bounded Tamil corrections",
                      report.progressAudit.sourceBoundedTamilCorrection,
                    ],
                    [
                      "Bounded option recovery",
                      report.progressAudit.sourceBoundedOptionRecovery,
                    ],
                    [
                      "Bounded diagram verification",
                      report.progressAudit.sourceBoundedDiagramVerification,
                    ],
                    [
                      "Saved pending teacher decisions",
                      report.progressAudit.decisions.pending,
                    ],
                    [
                      "Individually reviewed",
                      report.progressAudit.decisions.reviewed,
                    ],
                    [
                      "Approved decisions",
                      report.progressAudit.decisions.approved,
                    ],
                    [
                      "Needs correction / rejected",
                      `${report.progressAudit.decisions.needsCorrection} / ${report.progressAudit.decisions.rejected}`,
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-white p-3">
                      <dt>{label}</dt>
                      <dd className="mt-1 font-bold text-blue-900">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-xs">
                  Signatures compare exact normalized text and option order, not
                  semantic duplicates. Printed-key matches are evidence only.
                  Saved decisions remain separate from held candidate records.
                </p>
              </section>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <label>
                Medium
                <select
                  value={medium}
                  onChange={(e) => {
                    setMedium(e.target.value);
                    setBookId("");
                  }}
                >
                  <option value="all">English and Tamil</option>
                  <option>English</option>
                  <option>Tamil</option>
                </select>
              </label>
              <label>
                Subject
                <select value={subject} onChange={(e) => { setSubject(e.target.value); setBookId(""); }}>
                  <option value="">All subjects</option>
                  {[...new Set(report.books.filter((b) => medium === "all" || b.book.medium === medium).map((b) => b.book.subject))].sort().map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label>
                Volume
                <select value={volume} onChange={(e) => { setVolume(e.target.value); setBookId(""); }}>
                  <option value="all">All volumes</option>
                  {[...new Set(report.books.map((b) => b.book.volume ?? "none"))].sort().map((v) => <option key={v} value={v}>{v === "none" ? "No volume label" : `Volume ${v}`}</option>)}
                </select>
              </label>
              <label>
                Find a book
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setBookId("");
                  }}
                />
              </label>
              <label>
                Textbook
                <select
                  value={bookId}
                  onChange={(e) => setBookId(e.target.value)}
                >
                  <option value="">Choose a textbook</option>
                  {books.map((b) => (
                    <option key={b.book.id} value={b.book.id}>
                      {b.book.title} · {b.book.medium}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {report.failures.map((f) => (
              <p role="alert" key={f.bookId}>
                {f.bookId}: {f.error}
              </p>
            ))}
            {selected && (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label>Chapter<input type="search" value={chapterSearch} onChange={(e) => setChapterSearch(e.target.value)} /></label>
                  <label>Extraction status<select value={extraction} onChange={(e) => setExtraction(e.target.value)}><option value="all">All source states</option><option value="bounded">Source-bounded section</option><option value="unchecked">Needs section inspection</option></select></label>
                  <label>Answer evidence<select value={answerStatus} onChange={(e) => setAnswerStatus(e.target.value)}><option value="all">All evidence states</option><option value="key">Has bounded printed-key matches</option><option value="unknown">No bounded printed-key match</option></select></label>
                  <label>Teacher review status<select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}><option value="all">All local review states</option><option value="pending">Pending</option><option value="approved">Approved locally</option><option value="needs_correction">Needs correction</option><option value="rejected">Rejected</option></select></label>
                  <label>Publication status<select value={publication} onChange={(e) => setPublication(e.target.value)}><option value="all">All publication states</option><option value="available">Has eligible publications</option><option value="none">Zero eligible publications</option></select></label>
                </div>
                <p role="status">{chapters.length} matching chapter entries. Evidence and individual local decisions are separate; local approval does not publish a question. Counts use the dated local audit.</p>
                <a
                  className="btn-secondary"
                  href={`/api/admin/textbook-extraction?format=review-csv&bookId=${encodeURIComponent(selected.book.id)}`}
                >
                  Download local candidate reference CSV
                </a>
                <p>
                  {selected.pages} text-extracted pages ·{" "}
                  {selected.failedPages.length} failed pages ·{" "}
                  {selected.sparsePages.length} sparse/unreadable pages. None of
                  these measures establishes complete question coverage.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        {[
                          "Chapter",
                          "Scoped sections",
                          "Extracted",
                          "Book-back",
                          "Source inventoried",
                          "Source key matches",
                          "Text/key eligible",
                          "Flagged",
                          "Published",
                          "Unresolved",
                        ].map((h) => (
                          <th key={h} className="p-2">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chapters.map((c) => (
                        <tr key={c.id} className="border-t border-slate-200">
                          <td className="p-2">
                            {c.number}. {c.title}
                          </td>
                          <td className="p-2">{c.sectionCount}</td>
                          <td className="p-2">{c.extractedCandidates}</td>
                          <td className="p-2">{c.bookBackCandidates}</td>
                          <td className="p-2">
                            {c.authenticSourceQuestionTotal ?? "Unchecked"}
                          </td>
                          <td className="p-2">
                            {c.printedKeyMatchedSourceQuestions ?? "Unchecked"}
                          </td>
                          <td className="p-2">{c.textAndKeyEligible}</td>
                          <td className="p-2">{c.damagedOrAmbiguous}</td>
                          <td className="p-2">{c.published ?? "Unchecked"}</td>
                          <td className="p-2">{c.warnings.join("; ")}{c.localReview && <p>Local decisions: {c.localReview.pending} pending · {c.localReview.approved} approved · {c.localReview.needs_correction} need correction · {c.localReview.rejected} rejected.</p>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
