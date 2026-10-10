import type { PGlite } from "@electric-sql/pglite";
import catalog from "../../src/lib/textbooks-catalog.json";
export const fixtureBook = catalog.books.find(
  (book) => book.subject === "Accountancy" && book.sourceMedium === "English",
)!;
export const fixtureSubjectId = `tb-${fixtureBook.id}`;
export const fixtureChapterId = `${fixtureSubjectId}-ch-1`;
export async function seedTextbookBank(db: PGlite) {
  const book = fixtureBook;
  await db.query(
    "insert into public.textbooks(id,title,subject,medium,source_medium,category,source_title,source_file,source_url,source_page) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict do nothing",
    [
      book.id,
      book.title,
      book.subject,
      book.medium,
      book.sourceMedium,
      book.category,
      book.sourceTitle,
      book.sourceFile,
      book.sourceUrl,
      book.sourcePage,
    ],
  );
  const subject = {
    id: fixtureSubjectId,
    name: "Accountancy (English)",
    streamId: "Common",
    orderIndex: 100,
    totalChapters: 1,
  };
  const chapter = {
    id: fixtureChapterId,
    subjectId: subject.id,
    bookId: book.id,
    chapterNumber: 1,
    title: "Fixture accounts",
    isActive: true,
    orderIndex: 1,
  };
  for (const [kind, data] of [
    ["subject", subject],
    ["chapter", chapter],
  ] as const)
    await db.query(
      "insert into public.avs_curriculum(kind,id,data) values($1,$2,$3) on conflict(kind,id) do update set data=excluded.data",
      [kind, data.id, JSON.stringify(data)],
    );
  for (let i = 1; i <= 3; i++) {
    const candidate = {
      id: `fixture-textbook-q-${i}`,
      bookId: book.id,
      subjectId: subject.id,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      number: i,
      page: 12,
      section: "Book-back",
      questionText: `Fixture account question number ${i}: choose the correct value.`,
      options: ["First value", "Second value", "Third value", "Fourth value"],
      correctAnswer: i === 3 ? null : "B",
      status: i === 3 ? "Needs Review" : "Published",
      qualityFlags: [],
      sourceSha256: book.sha256,
    };
    await db.query(
      "insert into public.textbook_mcq_candidates(id,book_id,data) values($1,$2,$3) on conflict do nothing",
      [candidate.id, book.id, JSON.stringify(candidate)],
    );
    if (candidate.correctAnswer)
      await db.query(
        "insert into public.avs_questions(id,data) values($1,$2) on conflict do nothing",
        [
          candidate.id,
          JSON.stringify({
            ...candidate,
            sourceTextbookId: book.id,
            sourcePage: 12,
            sourceQuestionNumber: i,
            optionA: candidate.options[0],
            optionB: candidate.options[1],
            optionC: candidate.options[2],
            optionD: candidate.options[3],
            sourceType: "Book-In",
            stream: "Common",
            explanation: "Isolated fixture answer",
            difficulty: "Easy",
            createdAt: new Date().toISOString(),
          }),
        ],
      );
  }
  const coverage = {
    bookId: book.id,
    subjectId: subject.id,
    total: 3,
    published: 2,
    review: 1,
    pages: book.pages,
    chapters: [
      {
        id: chapter.id,
        title: chapter.title,
        number: 1,
        page: 9,
        published: 2,
        review: 1,
      },
    ],
    notes: [],
  };
  await db.query(
    "insert into public.textbook_mcq_imports(book_id,data) values($1,$2) on conflict do nothing",
    [book.id, JSON.stringify(coverage)],
  );
}
