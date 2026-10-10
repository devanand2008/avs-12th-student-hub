import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { startPostgrestFixture } from "./helpers/postgrest";

test("chapter repair is narrowly guarded, preserves reviews and answers, and catalog counts match quiz selection", async () => {
  const fixture = await startPostgrestFixture();
  const bookId = "12-basic-electronics-engineering-english-983efd90";
  const chapter = (number: number) => `tb-${bookId}-ch-${number}`;
  const questionId = (suffix: string) => `textbook-q-${bookId}-${suffix}`;
  const migration = await readFile(
    "supabase/migrations/20261010_textbook_chapter_consistency.sql",
    "utf8",
  );
  try {
    await fixture.db.query(
      `insert into public.textbooks(id,title,subject,medium,source_medium,category,source_title,source_file,source_url,source_page)
      values($1,'Audit fixture','Electronics','English','English','Vocational','Audit fixture','fixture.pdf','https://example.test/fixture.pdf','https://example.test/books')`,
      [bookId],
    );
    for (const number of [2, 4, 9]) {
      await fixture.db.query(
        "insert into public.avs_curriculum(id,kind,data) values($1,'chapter',$2)",
        [
          chapter(number),
          JSON.stringify({ id: chapter(number), bookId, totalMcqs: 0 }),
        ],
      );
    }
    await fixture.db.query(
      "insert into public.textbook_mcq_imports(book_id,data) values($1,$2)",
      [
        bookId,
        JSON.stringify({
          bookId,
          chapters: [2, 4, 9].map((number) => ({
            id: chapter(number),
            number,
            page: number * 10,
          })),
        }),
      ],
    );
    const cases = [
      { suffix: "17f5a55810b75b89", page: 55, target: 2, repair: true },
      { suffix: "321e11ff280bf48c", page: 121, target: 4, repair: true },
      { suffix: "not-allowlisted", page: 121, target: 4, repair: false },
      { suffix: "3d3220a7bcaa1b71", page: 120, target: 4, repair: false },
      {
        suffix: "5af0907d440a8fb2",
        page: 121,
        target: 4,
        repair: false,
        status: "Teacher Review",
      },
    ];
    const before = new Map();
    const candidates = new Map();
    for (const item of cases) {
      const id = questionId(item.suffix);
      const question = {
        id,
        chapterId: chapter(9),
        subjectId: `tb-${bookId}`,
        questionText: "A controlled integration question?",
        optionA: "First",
        optionB: "Second",
        optionC: "Third",
        optionD: "Fourth",
        correctAnswer: "B",
        status: item.status || "Published",
        sourceTextbookId: bookId,
        sourcePage: item.page,
        sourceAnswerPage: item.page + 1,
        answerVerification: "Textbook Answer Key",
      };
      const candidate = {
        id,
        bookId,
        chapterId: chapter(item.target),
        page: item.page,
        options: ["First", "Second", "Third", "Fourth"],
        status: "Needs Review",
        qualityFlags: ["Keep original review flag"],
      };
      before.set(id, question);
      candidates.set(id, candidate);
      await fixture.db.query(
        "insert into public.avs_questions(id,data) values($1,$2)",
        [id, JSON.stringify(question)],
      );
      await fixture.db.query(
        "insert into public.textbook_mcq_candidates(id,book_id,data) values($1,$2,$3)",
        [id, bookId, JSON.stringify(candidate)],
      );
    }
    await fixture.db.exec(migration);
    for (const item of cases) {
      const id = questionId(item.suffix);
      const rows = await fixture.db.query<{ data: Record<string, unknown> }>(
        "select data from public.avs_questions where id=$1",
        [id],
      );
      assert.deepEqual(rows.rows[0].data, {
        ...before.get(id),
        chapterId: chapter(item.repair ? item.target : 9),
      });
      const held = await fixture.db.query<{ data: Record<string, unknown> }>(
        "select data from public.textbook_mcq_candidates where id=$1",
        [id],
      );
      assert.deepEqual(held.rows[0].data, candidates.get(id));
    }
    const catalog = await fixture.db.query<{
      result: {
        chapters: { id: string; published: number }[];
        published: number;
      }[];
    }>("select public.avs_textbook_mcq_catalog() as result");
    assert.equal(catalog.rows[0].result[0].published, 4);
    assert.deepEqual(
      catalog.rows[0].result[0].chapters.map((item) => item.published),
      [1, 1, 2],
    );
    await fixture.db.exec(migration);
    assert.deepEqual(
      (
        await fixture.db.query(
          "select public.avs_textbook_mcq_catalog() as result",
        )
      ).rows,
      catalog.rows,
    );
    for (const role of ["anon", "authenticated"]) {
      const grants = await fixture.db.query<{ allowed: boolean }>(
        "select has_function_privilege($1,'public.avs_textbook_mcq_catalog()','EXECUTE') as allowed",
        [role],
      );
      assert.equal(grants.rows[0].allowed, false);
    }
  } finally {
    await fixture.close();
  }
});
