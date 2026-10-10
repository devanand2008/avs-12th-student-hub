"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  LoaderCircle,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  OnProgressParameters,
  RenderTask,
  TextLayer,
} from "pdfjs-dist";
import pdfjsPackage from "pdfjs-dist/package.json";
import Sidebar from "@/components/layout/Sidebar";
import { textbookFileSize, type Textbook } from "@/lib/textbooks";
import styles from "./TextbookReader.module.css";

const assetBase = `/pdfjs/${pdfjsPackage.version}/`;

function PdfPages({
  url,
  title,
  initialPage = 1,
}: {
  url: string;
  title: string;
  initialPage?: number;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [renderedPage, setRenderedPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const totalPages = pdf?.numPages || 0;

  useEffect(() => {
    let active = true;
    let task: PDFDocumentLoadingTask | undefined;
    async function load() {
      try {
        const pdfjs = await import("pdfjs-dist");
        if (!active) return;
        setLoadError(null);
        setProgress(0);
        pdfjs.GlobalWorkerOptions.workerSrc = `${assetBase}pdf.worker.min.mjs`;
        task = pdfjs.getDocument({
          url,
          cMapUrl: `${assetBase}cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `${assetBase}standard_fonts/`,
          wasmUrl: `${assetBase}wasm/`,
          iccUrl: `${assetBase}iccs/`,
          // Fetch pages as needed instead of preloading a 100 MB textbook.
          disableAutoFetch: true,
          disableStream: true,
          rangeChunkSize: 262144,
        });
        task.onProgress = ({ loaded, total }: OnProgressParameters) => {
          if (active && total)
            setProgress(Math.min(100, Math.round((loaded / total) * 100)));
        };
        const loaded = await task.promise;
        if (active) {
          const page = Math.min(initialPage, loaded.numPages);
          setPageNumber(page);
          setPageInput(String(page));
          setPdf(loaded);
        }
      } catch {
        if (active)
          setLoadError(
            "This book could not be loaded in the reader. Try again or open the original PDF below.",
          );
      }
    }
    void load();
    return () => {
      active = false;
      void task?.destroy().catch(() => {});
    };
  }, [url, retry, initialPage]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(180, entry.contentRect.width - 32)),
    );
    observer.observe(viewer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdf || !width) return;
    let active = true;
    let renderTask: RenderTask | undefined;
    let textLayer: TextLayer | undefined;
    async function renderPage() {
      try {
        const page = await pdf!.getPage(pageNumber);
        if (!active || !canvasRef.current || !textRef.current) return;
        setPageError(null);
        const natural = page.getViewport({ scale: 1 });
        const scale = Math.min(width / natural.width, 1.6) * zoom;
        const viewport = page.getViewport({ scale });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = canvasRef.current;
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        canvas.parentElement!.style.width = `${viewport.width}px`;
        canvas.parentElement!.style.height = `${viewport.height}px`;
        textRef.current.replaceChildren();
        canvas.parentElement!.style.setProperty(
          "--total-scale-factor",
          String(scale),
        );
        renderTask = page.render({
          canvas,
          viewport,
          transform:
            pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        await renderTask.promise;
        if (!active) return;
        const pdfjs = await import("pdfjs-dist");
        if (!active || !textRef.current) return;
        textLayer = new pdfjs.TextLayer({
          textContentSource: page.streamTextContent(),
          container: textRef.current,
          viewport,
        });
        await textLayer.render();
        if (active) setRenderedPage(pageNumber);
      } catch (error) {
        if (
          active &&
          !(
            error instanceof Error &&
            error.name === "RenderingCancelledException"
          )
        ) {
          setPageError(
            "This page could not be displayed. Try another page or open the original PDF.",
          );
        }
      }
    }
    void renderPage();
    return () => {
      active = false;
      renderTask?.cancel();
      textLayer?.cancel();
    };
  }, [pdf, pageNumber, width, zoom]);

  function goToPage(number: number) {
    const next = Math.min(totalPages, Math.max(1, number));
    setPageNumber(next);
    setPageInput(String(next));
    viewerRef.current?.scrollTo({ top: 0, left: 0 });
  }

  function jumpToPage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const number = Number(pageInput);
    if (Number.isInteger(number)) goToPage(number);
    else setPageInput(String(pageNumber));
  }

  return (
    <section
      aria-label="Full textbook reader"
      className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <button
            aria-label="Previous page"
            title="Previous page"
            disabled={!pdf || pageNumber <= 1}
            onClick={() => goToPage(pageNumber - 1)}
            className={styles.control}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <form
            onSubmit={jumpToPage}
            className="flex items-center gap-2 text-sm"
          >
            <label htmlFor="book-page" className="text-slate-600">
              Page
            </label>
            <input
              id="book-page"
              aria-label="Page number"
              type="number"
              inputMode="numeric"
              min="1"
              max={totalPages || 1}
              value={pageInput}
              disabled={!pdf}
              onChange={(event) => setPageInput(event.target.value)}
              className="w-16 rounded-lg border border-slate-300 px-2 py-2 text-center text-sm"
            />
            <span className="whitespace-nowrap text-slate-500">
              of {totalPages || "…"}
            </span>
            <button
              disabled={!pdf}
              className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-800 disabled:opacity-40"
            >
              Go
            </button>
          </form>
          <button
            aria-label="Next page"
            title="Next page"
            disabled={!pdf || pageNumber >= totalPages}
            onClick={() => goToPage(pageNumber + 1)}
            className={styles.control}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Zoom out"
            title="Zoom out"
            disabled={!pdf || zoom <= 0.5}
            onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
            className={styles.control}
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span
            aria-label="Zoom level"
            className="w-11 text-center text-xs font-semibold text-slate-700"
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            aria-label="Zoom in"
            title="Zoom in"
            disabled={!pdf || zoom >= 3}
            onClick={() => setZoom((value) => Math.min(3, value + 0.25))}
            className={styles.control}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            aria-label="Fit page width"
            title="Fit page width"
            disabled={!pdf}
            onClick={() => setZoom(1)}
            className={`${styles.control} gap-1 px-3 text-xs font-semibold`}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Fit
          </button>
        </div>
      </div>
      <div
        aria-live="polite"
        role="status"
        className="flex min-h-9 items-center gap-2 bg-blue-50/50 px-4 py-2 text-xs text-slate-600"
      >
        {loadError ? (
          "Book loading failed"
        ) : !pdf ? (
          <>
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Loading your
            textbook{progress ? ` (${progress}%)` : "…"}
          </>
        ) : pageError ? (
          "Page display failed"
        ) : renderedPage !== pageNumber ? (
          <>
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Loading page{" "}
            {pageNumber}…
          </>
        ) : (
          `Page ${pageNumber} of ${totalPages} · Full textbook`
        )}
      </div>
      <div
        ref={viewerRef}
        data-testid="pdf-viewer"
        className="max-h-[75vh] min-h-[420px] overflow-auto bg-slate-200/70 p-4 sm:min-h-[580px]"
      >
        {loadError ? (
          <div
            role="alert"
            className="mx-auto mt-10 max-w-md rounded-xl border border-amber-200 bg-white p-6 text-center text-sm leading-relaxed text-slate-700"
          >
            <p>{loadError}</p>
            <button
              onClick={() => setRetry((value) => value + 1)}
              className="mt-4 rounded-lg bg-[#1b3574] px-4 py-2 font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {pageError && (
              <p
                role="alert"
                className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800"
              >
                {pageError}
              </p>
            )}
            <div className={styles.page}>
              <canvas
                ref={canvasRef}
                aria-label={`${title}, page ${pageNumber}`}
                data-testid="pdf-page"
                data-rendered-page={renderedPage}
                className="block"
              />
              <div
                ref={textRef}
                data-testid="pdf-text"
                className={styles.textLayer}
              />
            </div>
          </>
        )}
      </div>
      <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
        Read every page here. Use Go to jump to a page, or zoom in and scroll to
        read small text. The page number counts PDF pages, including the cover.
      </p>
    </section>
  );
}

export default function TextbookReader({
  book,
  isAdmin = false,
  initialPage = 1,
}: {
  book: Textbook;
  isAdmin?: boolean;
  initialPage?: number;
}) {
  return (
    <div className="flex min-w-0 flex-1">
      <Sidebar isAdmin={isAdmin} />
      <main className="mx-auto min-w-0 max-w-7xl flex-1 space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={`/textbooks?search=${encodeURIComponent(book.subject)}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to textbook library
        </Link>
        <div className="rounded-2xl bg-gradient-to-r from-[#1b3574] to-[#102653] p-5 text-white sm:p-7">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-100">
            <BookOpen className="h-4 w-4" /> CLASS 12 ·{" "}
            {book.medium === "Common"
              ? "Common language book"
              : `${book.medium} medium`}
          </span>
          <h1 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">
            {book.title}
          </h1>
          <p className="mt-2 text-xs text-blue-100">
            SCERT Tamil Nadu · {textbookFileSize(book.sizeBytes)} · Full book
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={book.localPath || book.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/25"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open original PDF
            </a>
            {book.localPath && (
              <a
                href={book.localPath}
                download={`${book.title}-${book.sourceMedium}.pdf`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-blue-900 hover:bg-blue-50"
              >
                <Download className="h-3.5 w-3.5" /> Download full book
              </a>
            )}
          </div>
        </div>
        {book.localPath ? (
          <PdfPages
            url={book.localPath}
            title={book.title}
            initialPage={initialPage}
          />
        ) : (
          <div
            role="alert"
            className="rounded-2xl border border-amber-200 bg-white p-6 text-sm text-slate-700"
          >
            <p>
              This server does not have the saved textbook. Open the original
              PDF using the link above, or import the local library on this
              server.
            </p>
          </div>
        )}
        <p className="text-xs leading-relaxed text-slate-500">
          Source:{" "}
          <a
            href={book.sourcePage}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline"
          >
            SCERT Tamil Nadu
          </a>
          . {book.sourceTitle} Textbooks belong to their original publisher.
          Confirm the edition with your school.
        </p>
      </main>
    </div>
  );
}
