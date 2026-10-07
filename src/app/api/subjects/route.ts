import { listResources } from "@/lib/content";
import { getChaptersBySubject, getSubjects, getQuestions } from "@/lib/db";
import { StreamType } from "@/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stream = searchParams.get("stream") as StreamType | null;

  const subjects = await getSubjects(stream || undefined);
  const [notes, videos] = await Promise.all([
    listResources("note"),
    listResources("video"),
  ]);
  const questions = await getQuestions({ status: "Published" });
  const enrichedSubjects = await Promise.all(
    subjects.map(async (subj) => {
      const chapters = await getChaptersBySubject(subj.id);
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
    }),
  );

  return NextResponse.json({ subjects: enrichedSubjects });
}
