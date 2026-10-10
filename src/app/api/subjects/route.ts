import { listResources } from "@/lib/content";
import { getAllChapters, getSubjects, getQuestions } from "@/lib/db";
import { StreamType } from "@/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stream = searchParams.get("stream") as StreamType | null;

  const includeTextbooks = searchParams.get("library") === "all";
  const subjects = (await getSubjects(stream || undefined)).filter(
    (subject) => includeTextbooks || !subject.id.startsWith("tb-"),
  );
  const [notes, videos, allChapters, questions] = await Promise.all([
    listResources("note"),
    listResources("video"),
    getAllChapters(),
    getQuestions({ status: "Published" }),
  ]);
  const enrichedSubjects = subjects.map((subj) => {
      const chapters = allChapters.filter((chapter) => chapter.subjectId === subj.id)
        .sort((a, b) => a.chapterNumber - b.chapterNumber);
      return {
        ...subj,
        chapters: chapters.map((chapter) => ({
          ...chapter,
          totalNotes: notes.filter((note) => note.chapterId === chapter.id)
            .length,
          totalVideos: videos.filter((video) => video.chapterId === chapter.id)
            .length,
          totalMcqs: questions.filter(
            (question) => question.chapterId === chapter.id,
          ).length,
        })),
      };
    });

  return NextResponse.json({ subjects: enrichedSubjects });
}
