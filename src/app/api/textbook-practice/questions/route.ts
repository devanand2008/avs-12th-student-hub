import { getSession } from "@/lib/auth";
import { getQuestions } from "@/lib/db";
import catalog from "@/lib/textbooks-catalog.json";
import { selectPracticeQuestions } from "@/lib/textbook-practice-selection";

export async function GET(request: Request) {
  if (!(await getSession()))
    return Response.json({ error: "Please sign in." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const book = catalog.books.find((book) => book.id === params.get("bookId"));
  const search = params.get("search") || "";
  const page = Number(params.get("page") || 1);
  const chapterId = params.get("chapterId") || undefined;
  if (
    !book ||
    search.length > 200 ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    (chapterId && !chapterId.startsWith(`tb-${book.id}-ch-`))
  )
    return Response.json(
      { error: "Choose a valid textbook, chapter and search." },
      { status: 400 },
    );
  try {
    const questions = selectPracticeQuestions(
      await getQuestions({
        subjectId: `tb-${book.id}`,
        chapterId,
        status: "Published",
        sourceType: "Book-In",
      }),
      { bookId: book.id, search },
    ).sort(
      (a, b) =>
        a.chapterId.localeCompare(b.chapterId, undefined, { numeric: true }) ||
        (a.sourceQuestionNumber || 0) - (b.sourceQuestionNumber || 0) ||
        a.id.localeCompare(b.id),
    );
    const pageSize = 20;
    // Browse text and source labels only. Answers are supplied by the existing practice flow.
    return Response.json(
      {
        total: questions.length,
        page,
        pageSize,
        questions: questions
          .slice((page - 1) * pageSize, page * pageSize)
          .map((q) => ({
            id: q.id,
            questionText: q.questionText,
            chapterId: q.chapterId,
            sourceQuestionNumber: q.sourceQuestionNumber,
            sourcePage: q.sourcePage,
          })),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Questions could not be loaded. Please try again." },
      { status: 503 },
    );
  }
}
