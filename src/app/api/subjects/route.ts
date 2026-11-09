import { listResources } from "@/lib/content";
import { getAllChapters, getSubjects, getQuestions } from "@/lib/db";
import type { Chapter, StreamType } from "@/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stream = searchParams.get("stream") as StreamType | null;
  const includeTextbooks = searchParams.get("library") === "all";
  // These reads are independent; do not wait for the subject catalogue first.
  const [allSubjects, notes, videos, allChapters, questions] =
    await Promise.all([
      getSubjects(stream || undefined),
      listResources("note"),
      listResources("video"),
      getAllChapters(),
      getQuestions({ status: "Published" }),
    ]);
  const bySubject = new Map<string, Chapter[]>();
  for (const chapter of allChapters) {
    const group = bySubject.get(chapter.subjectId) ?? [];
    group.push(chapter);
    bySubject.set(chapter.subjectId, group);
  }
  function countByChapter(rows: { chapterId: string }[]) {
    const counts = new Map<string, number>();
    for (const row of rows)
      counts.set(row.chapterId, (counts.get(row.chapterId) ?? 0) + 1);
    return counts;
  }
  const noteCounts = countByChapter(notes);
  const videoCounts = countByChapter(videos);
  const questionCounts = countByChapter(questions);
  const subjects = allSubjects
    .filter((subject) => includeTextbooks || !subject.id.startsWith("tb-"))
    .map((subject) => ({
      ...subject,
      chapters: (bySubject.get(subject.id) ?? [])
        .sort((a, b) => a.chapterNumber - b.chapterNumber)
        .map((chapter) => ({
          ...chapter,
          totalNotes: noteCounts.get(chapter.id) ?? 0,
          totalVideos: videoCounts.get(chapter.id) ?? 0,
          totalMcqs: questionCounts.get(chapter.id) ?? 0,
        })),
    }));
  return NextResponse.json({ subjects });
}
