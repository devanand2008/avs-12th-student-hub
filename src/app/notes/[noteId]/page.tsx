"use client";

import { HandwrittenNote, NotePage } from "@/types";
import {
  ArrowLeft,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Moon,
  Share2,
  Sun,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useState, useRef } from "react";

interface PageProps {
  params: Promise<{ noteId: string }>;
}

export default function NoteViewerPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const noteId = resolvedParams.noteId;
  const readingKey = useRef("");
  const readingSaves = useRef<Promise<void>>(Promise.resolve());
  const savePage = useCallback((id: string, page: number) => {
    // Keep the latest navigation last even when earlier requests are slow.
    readingSaves.current = readingSaves.current
      .then(async () => {
        await fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "note", id, page }),
        });
      })
      .catch(() => {});
  }, []);

  const [note, setNote] = useState<HandwrittenNote | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/notes?id=" + noteId).then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/activity").then((r) => r.json()),
      fetch("/api/bookmarks").then((r) => r.json()),
    ])
      .then(([data, auth, activity, bookmarks]) => {
        if (!data.note) return;
        setNote(data.note);
        readingKey.current = "avs_note_" + auth.user.id + "_" + noteId;
        let page =
          activity.notes?.find(
            (visit: { noteId: string; page: number }) =>
              visit.noteId === noteId,
          )?.page || 1;
        try {
          page =
            Number(new URLSearchParams(window.location.search).get("page")) ||
            Number(localStorage.getItem(readingKey.current)) ||
            page;
        } catch {}
        page = Math.max(1, Math.min(data.note.pageCount, page));
        setCurrentPage(page);
        setBookmarked(
          bookmarks.bookmarks?.some(
            (bookmark: { contentId: string }) => bookmark.contentId === noteId,
          ) || false,
        );
        savePage(noteId, page);
      })
      .catch((error) => console.error("Could not load notes", error))
      .finally(() => setLoading(false));
  }, [noteId, savePage]);

  const handlePageChange = (newPage: number) => {
    if (
      !note ||
      newPage < 1 ||
      newPage > (note.pages?.length || note.pageCount)
    )
      return;
    setCurrentPage(newPage);
    try {
      localStorage.setItem(readingKey.current, newPage.toString());
    } catch {}
    savePage(noteId, newPage);
  };

  const handleBookmarkToggle = async () => {
    if (!note) return;
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType: "note",
        contentId: note.id,
        title: note.title,
        subtitle: `Page ${currentPage} • ${note.badge}`,
        url: `/notes/${note.id}?page=${currentPage}`,
      }),
    });
    const data = await res.json();
    setBookmarked(data.bookmarked);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">
            Loading handwritten faculty notes...
          </p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-[#071A3D]">Note Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          This handwritten material could not be located.
        </p>
        <Link
          href="/notes"
          className="mt-4 px-4 py-2 bg-[#2563EB] text-white text-xs rounded-xl font-semibold"
        >
          Return to Notes
        </Link>
      </div>
    );
  }

  const totalPages = note.pages?.length || note.pageCount || 1;
  const activePageData: NotePage | undefined = note.pages?.[currentPage - 1];

  return (
    <div
      className={`min-h-[calc(100vh-4rem)] flex flex-col transition-colors ${
        isDarkMode
          ? "bg-slate-950 text-slate-100"
          : "bg-[#F8FAFC] text-slate-900"
      }`}
    >
      {/* Top Toolbar */}
      <div
        className={`sticky top-16 z-30 border-b px-4 py-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md ${
          isDarkMode
            ? "bg-slate-900/90 border-slate-800 text-slate-200"
            : "bg-white/90 border-slate-200 text-slate-800"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/notes"
            className="touch-target p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-[#2563EB] dark:text-blue-300">
                {note.badge}
              </span>
              <span className="text-xs font-semibold truncate">
                {note.title}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Page {currentPage} of {totalPages} • Last updated {note.updatedAt}
            </p>
          </div>
        </div>

        {/* Reader Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg touch-target"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-bold text-[11px]">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg touch-target"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Dark Reading Mode toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 touch-target transition-colors"
            title="Toggle Dark Reading Mode"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Bookmark */}
          <button
            onClick={handleBookmarkToggle}
            className={`p-2 rounded-xl touch-target transition-colors ${
              bookmarked
                ? "text-[#2563EB] bg-blue-50 dark:bg-blue-950"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            title="Bookmark Page"
          >
            <Bookmark
              className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`}
            />
          </button>

          {note.downloadAllowed && note.pdfUrl && (
            <a
              href={note.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="model-control"
              aria-label="Download PDF"
            >
              <Download size={17} />
            </a>
          )}
          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 touch-target hidden sm:flex items-center justify-center"
            title="Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 touch-target"
            title="Share Note Link"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Share2 className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Main Reader Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 sm:p-6 gap-6 items-start">
        {/* Left / Center: Interactive Page Canvas */}
        <div className="flex-1 w-full flex flex-col items-center">
          <div
            className="w-full flex items-center justify-center overflow-auto p-2 sm:p-4 rounded-2xl border transition-all"
            style={{
              borderColor: isDarkMode ? "#1e293b" : "#e2e8f0",
              backgroundColor: isDarkMode ? "#020617" : "#f1f5f9",
            }}
          >
            <div
              className="relative shadow-2xl rounded-xl overflow-hidden transition-transform duration-200"
              style={{
                transform: note.pdfUrl ? "none" : `scale(${zoomLevel / 100})`,
                transformOrigin: "top center",
                maxWidth: "100%",
                width: note.pdfUrl ? "100%" : undefined,
              }}
            >
              {note.pdfUrl ? (
                <div className="w-full">
                  <iframe
                    key={currentPage}
                    src={`${note.pdfUrl}#page=${currentPage}&zoom=${zoomLevel}`}
                    title={note.title}
                    className="h-[65vh] min-h-[420px] w-full border-0 bg-white"
                  />
                  <p className="p-3 text-center text-xs text-slate-500">
                    If your browser cannot display this PDF,{" "}
                    <a
                      href={note.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 underline"
                    >
                      open the document
                    </a>
                    .
                  </p>
                </div>
              ) : activePageData?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activePageData.imageUrl}
                  alt={`Handwritten note page ${currentPage}`}
                  className="w-full max-w-2xl h-auto rounded-xl object-contain pointer-events-none select-none"
                />
              ) : (
                <div className="w-80 h-96 flex items-center justify-center bg-white p-6 text-center text-slate-500">
                  Page content preview loading...
                </div>
              )}
            </div>
          </div>

          {/* Page Bottom Floating Navigation Bar */}
          <div className="mt-4 flex items-center justify-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-md">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="touch-target px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>
            <span className="text-xs font-mono font-bold px-3">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="touch-target px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {activePageData?.caption && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center max-w-xl">
              {activePageData.caption}
            </p>
          )}
        </div>

        {/* Right / Sidebar: Page Thumbnails & Chapter Navigation */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Page Thumbnails
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2">
              {note.pages?.map((p) => (
                <button
                  key={p.pageNumber}
                  onClick={() => handlePageChange(p.pageNumber)}
                  className={`p-1 rounded-xl border text-center transition-all touch-target flex flex-col items-center justify-center ${
                    currentPage === p.pageNumber
                      ? "border-[#2563EB] bg-blue-50 dark:bg-blue-950/60 font-bold text-[#2563EB]"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="text-xs">Page</span>
                  <span className="text-sm font-mono font-bold">
                    {p.pageNumber}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Practice Link */}
          <div className="bg-blue-50 dark:bg-slate-900/90 border border-blue-200 dark:border-blue-900/60 p-4 rounded-2xl space-y-2">
            <div className="text-xs font-bold text-[#2563EB] dark:text-blue-400">
              Reinforce with MCQs
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Test your recall immediately using Book-In & Book-Out one-mark
              questions for this chapter.
            </p>
            <Link
              href={`/practice?chapterId=${note.chapterId}`}
              className="mt-2 block w-full py-2 bg-[#2563EB] text-center text-white text-xs font-semibold rounded-xl shadow-xs"
            >
              Start Chapter 1-Mark Drill
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
