"use client";

import Sidebar from "@/components/layout/Sidebar";
import { BookOpen, ChevronRight, FileText, Search, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SearchResult {
  id: string;
  type: "chapter" | "note" | "video" | "question";
  title: string;
  subtitle: string;
  url: string;
  subject: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "All" | "chapter" | "note" | "video" | "question"
  >("All");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [allData, setAllData] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch chapters, notes, videos to construct client search index
    Promise.all([
      fetch("/api/subjects").then((r) => r.json()),
      fetch("/api/notes").then((r) => r.json()),
      fetch("/api/videos").then((r) => r.json()),
    ]).then(([subjRes, notesRes, vidsRes]) => {
      const items: SearchResult[] = [];

      // Index chapters
      subjRes.subjects?.forEach(
        (
          s: import("@/types").Subject & {
            chapters: import("@/types").Chapter[];
          },
        ) => {
          s.chapters?.forEach((ch: import("@/types").Chapter) => {
            items.push({
              id: ch.id,
              type: "chapter",
              title: `Chapter ${ch.chapterNumber}: ${ch.title}`,
              subtitle: ch.titleTamil || ch.description,
              url: `/practice?chapterId=${ch.id}`,
              subject: s.name,
            });
          });
        },
      );

      // Index notes
      notesRes.notes?.forEach((n: import("@/types").HandwrittenNote) => {
        items.push({
          id: n.id,
          type: "note",
          title: n.title,
          subtitle: `${n.badge} • ${n.pageCount} Pages`,
          url: `/notes/${n.id}`,
          subject: "Class 12 Notes",
        });
      });

      // Index videos
      vidsRes.videos?.forEach((v: import("@/types").VideoLesson) => {
        items.push({
          id: v.id,
          type: "video",
          title: v.title,
          subtitle: `NotebookLM Lesson • ${v.teacherName}`,
          url: "/videos",
          subject: "Class 12 Videos",
        });
      });

      setAllData(items);
      setResults(items);
      setLoading(false);
    });
  }, []);

  const handleSearch = (text: string) => {
    setQuery(text);
    const q = text.toLowerCase().trim();
    if (!q) {
      setResults(allData);
      return;
    }
    const filtered = allData.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q),
    );
    setResults(filtered);
  };

  const displayedResults =
    filterType === "All"
      ? results
      : results.filter((r) => r.type === filterType);

  if (loading)
    return (
      <div className="flex flex-1">
        <Sidebar />
        <main
          className="workspace"
          role="status"
          aria-label="Loading search index"
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
            <Search className="w-3.5 h-3.5" />
            <span>Class 12 Repository Search</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A3D]">
            Global Search
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Instantly discover chapters, handwritten notes, NotebookLM video
            lessons, and 1-mark questions.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-2 sm:p-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400 ml-2" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search keyword (e.g. 'Function', 'Tapetum', 'Menstrual', 'SQL')..."
              className="flex-1 py-2 px-1 text-sm bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(["All", "chapter", "note", "video"] as const).map((ft) => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all touch-target capitalize ${
                filterType === ft
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {ft === "All" ? "All Content" : `${ft}s`}
            </button>
          ))}
        </div>

        {/* Search Results */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Search Results ({displayedResults.length})
          </div>

          {displayedResults.length > 0 ? (
            <div className="space-y-2.5">
              {displayedResults.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.url}
                  className="block p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 shadow-xs blue-card-hover"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                        {item.type === "chapter" ? (
                          <BookOpen className="w-4 h-4" />
                        ) : item.type === "note" ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <Video className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-slate-100 text-slate-600">
                            {item.type}
                          </span>
                          <span className="text-xs text-slate-400">
                            {item.subject}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#071A3D] mt-0.5">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No matching content found for &quot;{query}&quot;. Try another
              search term.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
