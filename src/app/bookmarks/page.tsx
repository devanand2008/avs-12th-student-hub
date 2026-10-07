"use client";

import Sidebar from "@/components/layout/Sidebar";
import { Bookmark as BookmarkType } from "@/types";
import {
  ArrowRight,
  Bookmark,
  FileText,
  HelpCircle,
  Trash2,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookmarks")
      .then((res) => res.json())
      .then((data) => setBookmarks(data.bookmarks || []))
      .catch((err) => console.error("Failed to load bookmarks:", err))
      .finally(() => setLoading(false));
  }, []);

  const removeBookmark = async (bm: BookmarkType) => {
    await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType: bm.contentType,
        contentId: bm.contentId,
        title: bm.title,
        url: bm.url,
      }),
    });
    setBookmarks((prev) => prev.filter((b) => b.id !== bm.id));
  };

  if (loading)
    return (
      <div className="flex flex-1">
        <Sidebar />
        <main
          className="workspace"
          role="status"
          aria-label="Loading bookmarks"
        >
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
        </main>
      </div>
    );

  return (
    <div className="flex-1 flex bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-[#2563EB] mb-2 border border-blue-200">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Learning Materials</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A3D]">
            My Bookmarks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your pinned handwritten notes, video lessons, and revision
            questions in one place.
          </p>
        </div>

        {bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3 blue-card-hover"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                    {bm.contentType === "note" ? (
                      <FileText className="w-5 h-5" />
                    ) : bm.contentType === "video" ? (
                      <Video className="w-5 h-5" />
                    ) : (
                      <HelpCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {bm.contentType}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#071A3D] truncate">
                      {bm.title}
                    </h3>
                    {bm.subtitle && (
                      <p className="text-[11px] text-slate-500">
                        {bm.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={bm.url}
                    className="touch-target px-3 py-1.5 bg-[#2563EB] text-white rounded-xl text-xs font-semibold hover:bg-blue-700 flex items-center gap-1"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => removeBookmark(bm)}
                    className="touch-target p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Bookmark className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#071A3D]">
              No Bookmarks Saved Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You can bookmark handwritten note pages, video lessons, or
              challenging questions while studying.
            </p>
            <Link
              href="/notes"
              className="inline-block mt-2 px-5 py-2.5 bg-[#2563EB] text-white text-xs font-semibold rounded-xl"
            >
              Explore Handwritten Notes
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
