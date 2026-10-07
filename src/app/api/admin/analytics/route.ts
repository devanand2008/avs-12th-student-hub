import { getSession } from "@/lib/auth";
import {
  getAllNotes,
  getAllStudents,
  getAllTests,
  getAllVideos,
  getChapterById,
  getCompletedQuizSessions,
  getQuestions,
  getSubjectById,
} from "@/lib/db";
import { NextResponse } from "next/server";
import { backendMode } from "@/lib/supabase/server";
export async function GET() {
  const user = await getSession();
  if (user?.role !== "admin")
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  try {
    const [students, notes, videos, questions, tests, sessions] =
      await Promise.all([
        getAllStudents(),
        getAllNotes(),
        getAllVideos(),
        getQuestions(),
        getAllTests(),
        getCompletedQuizSessions(),
      ]);
    const chapterResults = new Map<
      string,
      { correct: number; total: number; attempts: number }
    >();
    const questionResults = new Map<
      string,
      { correct: number; total: number }
    >();
    for (const session of sessions) {
      for (const answer of Object.values(session.answers)) {
        const question = questions.find((q) => q.id === answer.questionId);
        if (!question || !answer.selectedAnswer) continue;
        const q = questionResults.get(question.id) || { correct: 0, total: 0 };
        q.total++;
        q.correct += Number(answer.isCorrect);
        questionResults.set(question.id, q);
        const c = chapterResults.get(question.chapterId) || {
          correct: 0,
          total: 0,
          attempts: 0,
        };
        c.total++;
        c.correct += Number(answer.isCorrect);
        c.attempts++;
        chapterResults.set(question.chapterId, c);
      }
    }
    const weakChapters = [];
    for (const [id, result] of chapterResults) {
      const accuracy = Math.round((result.correct / result.total) * 100);
      if (accuracy >= 70) continue;
      const chapter = await getChapterById(id);
      const subject = chapter ? await getSubjectById(chapter.subjectId) : null;
      weakChapters.push({
        chapterTitle: chapter?.title || id,
        subject: subject?.name || "",
        avgAccuracy: accuracy,
        attempts: result.attempts,
      });
    }
    const hardestQuestions = Array.from(questionResults)
      .map(([id, result]) => ({
        id,
        text: questions.find((q) => q.id === id)?.questionText || id,
        accuracy: Math.round((result.correct / result.total) * 100),
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);
    const total = sessions.reduce((n, s) => n + s.totalQuestions, 0);
    const correct = sessions.reduce((n, s) => n + s.correctCount, 0);
    return NextResponse.json({
      storageMode: backendMode(),
      metrics: {
        totalStudents: students.length,
        activeStudents: students.filter((s) => s.activeStatus).length,
        csStudentsCount: students.filter((s) => s.stream === "Computer Science")
          .length,
        bioStudentsCount: students.filter((s) => s.stream === "Biology").length,
        totalNotes: notes.length,
        totalVideos: videos.length,
        totalQuestions: questions.length,
        quizAttempts: sessions.length,
        averageScore: total ? Math.round((correct / total) * 100) : 0,
        totalTests: tests.length,
      },
      weakChapters,
      hardestQuestions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load admin analytics.",
      },
      { status: 503 },
    );
  }
}
