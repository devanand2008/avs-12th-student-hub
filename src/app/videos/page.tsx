"use client";

import Sidebar from "@/components/layout/Sidebar";
import { youtubeEmbedUrl } from "@/lib/media";
import type { VideoLesson } from "@/types";
import {
  Bookmark,
  CheckCircle2,
  Clock,
  ExternalLink,
  Headphones,
  Play,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [active, setActive] = useState<VideoLesson | null>(null);
  const [watched, setWatched] = useState<Record<string, boolean>>({});
  const watchedRef = useRef<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookmarkState, setBookmarkState] = useState<{
    contentId: string;
    saved: boolean;
  } | null>(null);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [bookmarkError, setBookmarkError] = useState("");
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const videoRef = useRef<HTMLVideoElement>(null);
  const storageKey = useRef("avs_video_guest");
  const lastSave = useRef(0);
  const progressSaves = useRef<Promise<void>>(Promise.resolve());

  function rememberWatched(next: Record<string, boolean>) {
    watchedRef.current = next;
    setWatched(next);
  }

  function saveProgress(videoId: string, seconds: number, percent: number) {
    // Preserve event order when a playback update and completion overlap.
    progressSaves.current = progressSaves.current
      .then(async () => {
        await fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "video",
            id: videoId,
            seconds,
            percent,
          }),
        });
      })
      .catch(() => {});
  }

  useEffect(() => {
    const chapterId = new URLSearchParams(window.location.search).get(
      "chapterId",
    );
    Promise.all([
      fetch(
        "/api/videos" +
          (chapterId ? "?chapterId=" + encodeURIComponent(chapterId) : ""),
      ),
      fetch("/api/auth/me"),
      fetch("/api/activity"),
    ])
      .then(async ([response, authResponse, activityResponse]) => {
        const data = await response.json();
        const auth = await authResponse.json();
        const activity = await activityResponse.json();
        storageKey.current =
          "avs_video_" + (auth.user?.studentId || auth.user?.id || "guest");
        if (!response.ok) throw new Error(data.error);
        setVideos(data.videos || []);
        const requested = new URLSearchParams(window.location.search).get("id");
        setActive(
          data.videos?.find((v: VideoLesson) => v.id === requested) ||
            data.videos?.[0] ||
            null,
        );
        try {
          rememberWatched({
            ...JSON.parse(localStorage.getItem(storageKey.current) || "{}"),
            ...Object.fromEntries(
              (activity.videos || []).map(
                (visit: { videoId: string; percent: number }) => [
                  visit.videoId,
                  visit.percent >= 90,
                ],
              ),
            ),
          });
        } catch {}
      })
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, []);

  const activeId = active?.id;
  const bookmarkReady = Boolean(
    activeId && bookmarkState?.contentId === activeId,
  );
  const saved = bookmarkReady && bookmarkState?.saved === true;
  useEffect(() => {
    if (!activeId) return;
    const controller = new AbortController();
    fetch("/api/bookmarks", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load the saved bookmark.");
        return response.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setBookmarkState({
          contentId: activeId,
          saved: Boolean(
            data.bookmarks?.some(
              (item: { contentId: string }) => item.contentId === activeId,
            ),
          ),
        });
        setBookmarkError("");
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setBookmarkError(
            "Could not load the saved bookmark. Refresh to retry.",
          );
      });
    return () => controller.abort();
  }, [activeId]);

  function mark(id: string) {
    const next = { ...watchedRef.current, [id]: !watchedRef.current[id] };
    rememberWatched(next);
    saveProgress(id, 0, next[id] ? 100 : 0);
    try {
      localStorage.setItem(storageKey.current, JSON.stringify(next));
    } catch {}
  }

  async function bookmark() {
    if (!active || !bookmarkReady || bookmarkBusy) return;
    const contentId = active.id;
    setBookmarkBusy(true);
    setBookmarkError("");
    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          contentType: "video",
          title: active.title,
          url: `/videos?id=${contentId}`,
        }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.bookmarked !== "boolean")
        throw new Error("Could not save the bookmark. Please try again.");
      setBookmarkState((current) =>
        current?.contentId === contentId
          ? { contentId, saved: data.bookmarked }
          : current,
      );
    } catch {
      setBookmarkError("Could not save the bookmark. Please try again.");
    } finally {
      setBookmarkBusy(false);
    }
  }

  const filteredVideos = videos.filter(
    (video) =>
      (language === "all" || video.language === language) &&
      `${video.title} ${video.titleTamil} ${video.topic || ""} ${video.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const durationLabel = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-1 bg-[#eff5ff]">
      <Sidebar />
      <main className="workspace min-w-0 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-xs font-bold text-purple-700 mb-2 border border-purple-200 shadow-xs">
              <Headphones className="w-3.5 h-3.5" />
              <span>VIDEO LESSONS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
              Video Lessons & Visual Guides
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Watch Tamil language lessons and chapter video guides. Search in
              English or Tamil, save a lesson, and continue where you left off.
            </p>
          </div>
          <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-3.5 py-1.5 rounded-xl border border-purple-200 shadow-xs">
            {videos.length} learning modules
          </span>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-700"
          >
            {error}
          </p>
        ) : loading ? (
          <div className="h-96 animate-pulse rounded-3xl bg-slate-200/70" />
        ) : !active ? (
          <div className="glass-panel p-12 text-center rounded-3xl space-y-3 max-w-lg mx-auto">
            <Video size={40} className="mx-auto text-purple-400" />
            <h2 className="text-base font-extrabold text-slate-900">
              No video lessons published yet
            </h2>
            <p className="text-xs text-slate-500">
              Faculty are recording NotebookLM podcasts and video walkthroughs
              for your chapters.
            </p>
          </div>
        ) : (
          <>
            {/* Active Video Player Showcase */}
            <section className="overflow-hidden rounded-3xl border border-blue-100/90 bg-white shadow-md">
              <div className="aspect-video bg-[#071330] relative overflow-hidden">
                {active.embedType === "mp4" ? (
                  <video
                    key={active.id}
                    ref={videoRef}
                    src={active.videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full"
                    onLoadedMetadata={(event) => {
                      try {
                        const savedTime = Number(
                          localStorage.getItem(
                            storageKey.current + "_" + active.id,
                          ),
                        );
                        if (
                          savedTime > 0 &&
                          savedTime < event.currentTarget.duration
                        )
                          event.currentTarget.currentTime = savedTime;
                      } catch {}
                    }}
                    onTimeUpdate={(event) => {
                      const seconds = event.currentTarget.currentTime;
                      if (Date.now() - lastSave.current > 5000) {
                        lastSave.current = Date.now();
                        saveProgress(
                          active.id,
                          seconds,
                          watchedRef.current[active.id]
                            ? 100
                            : event.currentTarget.duration
                              ? (seconds / event.currentTarget.duration) * 100
                              : 0,
                        );
                      }
                      try {
                        localStorage.setItem(
                          storageKey.current + "_" + active.id,
                          String(event.currentTarget.currentTime),
                        );
                      } catch {}
                    }}
                    onEnded={() => {
                      saveProgress(active.id, active.durationSeconds, 100);
                      const next = { ...watchedRef.current, [active.id]: true };
                      rememberWatched(next);
                      try {
                        localStorage.setItem(
                          storageKey.current,
                          JSON.stringify(next),
                        );
                      } catch {}
                    }}
                  />
                ) : active.embedType === "youtube" ? (
                  <iframe
                    key={active.id}
                    src={youtubeEmbedUrl(active.videoUrl) || undefined}
                    title={active.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-4 p-5 text-center text-white">
                    <Video size={48} className="text-purple-400" />
                    <p className="text-sm text-blue-100 max-w-md">
                      Open this shared NotebookLM conversational audio guide at
                      its source.
                    </p>
                    <a
                      href={active.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition-all"
                    >
                      <span>Open NotebookLM Guide</span>
                      <ExternalLink size={15} />
                    </a>
                  </div>
                )}
              </div>

              <div className="p-6 sm:p-7">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {active.sourceLabel || "AVS Faculty Lesson"}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-bold text-slate-500">
                    {active.language || "Tamil + English"}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                  {active.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500">
                  {active.description}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Clock size={15} className="text-blue-600" />
                    <span>{durationLabel(active.durationSeconds)}</span>
                    <span>·</span>
                    <span>{active.teacherName}</span>
                  </span>

                  <div className="flex items-center gap-2.5">
                    <button
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                      aria-label={saved ? "Remove bookmark" : "Bookmark video"}
                      disabled={!bookmarkReady || bookmarkBusy}
                      aria-busy={!bookmarkReady || bookmarkBusy}
                      onClick={() => void bookmark()}
                    >
                      <Bookmark
                        size={17}
                        className={saved ? "fill-blue-600 text-blue-600" : ""}
                      />
                    </button>
                    <button
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        watched[active.id]
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                      }`}
                      onClick={() => mark(active.id)}
                    >
                      <CheckCircle2 size={15} />
                      <span>
                        {watched[active.id] ? "Completed" : "Mark as Watched"}
                      </span>
                    </button>
                  </div>
                </div>
                {bookmarkError && (
                  <p role="status" className="mt-3 text-xs text-rose-700">
                    {bookmarkError}
                  </p>
                )}
              </div>
            </section>

            {/* Video Playlist Grid with Colorful Cards */}
            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-black text-slate-900 font-heading flex items-center gap-2">
                <span>Browse Video Lessons</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {filteredVideos.length}
                </span>
              </h2>

              <div className="flex flex-wrap gap-3">
                <input
                  type="search"
                  aria-label="Search video lessons"
                  placeholder="Search in English or Tamil…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 w-full sm:w-80 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm"
                />
                <select
                  aria-label="Filter videos by language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">All languages</option>
                  <option>Tamil</option>
                  <option>English</option>
                </select>
                <Link
                  href="/videos"
                  className="self-center text-xs font-semibold text-blue-700"
                >
                  All videos
                </Link>
              </div>
              {!filteredVideos.length && (
                <p className="text-sm text-slate-500">
                  No lessons match these filters.
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredVideos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => {
                      setActive(video);
                    }}
                    aria-pressed={active.id === video.id}
                    className={`info-card-capsule group flex items-start gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer overflow-hidden ${
                      active.id === video.id
                        ? "border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-600/30"
                        : "border-slate-200 hover:border-blue-300 bg-white"
                    }`}
                  >
                    <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Play size={18} fill="currentColor" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {video.title}
                      </h3>
                      {video.titleTamil && (
                        <p lang="ta" className="mt-1 text-xs text-slate-600">
                          {video.titleTamil}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-500 font-medium truncate">
                        {video.teacherName} ·{" "}
                        {durationLabel(video.durationSeconds)}
                      </p>
                      {watched[video.id] && (
                        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 size={11} /> Completed
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
