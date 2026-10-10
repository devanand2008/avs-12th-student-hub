import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import catalog from "../../src/lib/textbooks-catalog.json";
import { fixtureChapterId } from "../helpers/textbook-bank";
import { authRequest } from "../helpers/otp-browser";
import type { Question, QuizSession } from "../../src/types";

const snapshotPath = ".local/independent-live-content.json";
test.skip(
  process.env.AVS_TEST_REAL_BOOKS !== "true" || !existsSync(snapshotPath),
  "Opt-in: requires a fresh read-only mcqs:coverage --live snapshot.",
);
test.skip(
  process.env.AVS_TEST_ACTIVATION_MODE !== "direct",
  "Uses isolated direct-account fixtures.",
);

test("actual extracted questions across three subjects: feedback, navigation, retry, history and empty chapters", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
  const client = createClient("http://127.0.0.1:3101", "qa-service-key", {
    auth: { persistSession: false },
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const project = info.project.name;
  const get = async (path: string) =>
    page.request.get(path, {
      headers: {
        Cookie: (await page.context().cookies())
          .map((cookie) => cookie.name + "=" + cookie.value)
          .join("; "),
      },
    });
  const email = `audit.${project}@example.test`,
    password = "Independent-fixture-password";
  const registered = await authRequest(page, "/api/auth/register", {
    studentName: `Independent ${project}`,
    email,
    password,
    phone: project === "desktop" ? "9880010011" : "9880010012",
    schoolName: "Isolated Audit School",
    registerNumber: `AUDIT-${project}`,
    medium: "English",
    stream: "Computer Science",
  });
  expect(registered.status()).toBe(200);
  const owner = (await registered.json()).user;
  expect(
    (
      await authRequest(page, "/api/auth/login", { loginId: email, password })
    ).status(),
  ).toBe(200);
  let completed = 0;
  for (const subject of ["Accountancy", "Commerce", "Chemistry"]) {
    const book = catalog.books.find(
      (book) => book.subject === subject && book.sourceMedium === "English",
    )!;
    const source = snapshot.tables.avs_questions
      .map((row: { data: Question }) => row.data)
      .filter(
        (question: Question) =>
          question.status === "Published" &&
          question.sourceTextbookId === book.id &&
          question.chapterId !== fixtureChapterId,
      ) as Question[];
    const chapterId = source.find(
      (question) =>
        source.filter((other) => other.chapterId === question.chapterId)
          .length >= 3,
    )!.chapterId;
    const questions = source
      .filter((question) => question.chapterId === chapterId)
      .slice(0, 3);
    expect(questions).toHaveLength(3);
    const imported = snapshot.tables.textbook_mcq_imports.find(
      (row: { book_id: string }) => row.book_id === book.id,
    ).data;
    const chapters = snapshot.tables.avs_curriculum.filter(
      (row: { kind: string; data: { subjectId: string } }) =>
        row.kind === "chapter" && row.data.subjectId === `tb-${book.id}`,
    );
    const subjectRow = snapshot.tables.avs_curriculum.find(
      (row: { kind: string; id: string }) =>
        row.kind === "subject" && row.id === `tb-${book.id}`,
    );
    for (const [table, rows, conflict] of [
      [
        "textbooks",
        [
          {
            id: book.id,
            title: book.title,
            subject: book.subject,
            medium: book.medium,
            source_medium: book.sourceMedium,
            category: book.category,
            source_title: book.sourceTitle,
            source_file: book.sourceFile,
            source_url: book.sourceUrl,
            source_page: book.sourcePage,
          },
        ],
        "id",
      ],
      [
        "avs_curriculum",
        [subjectRow, ...chapters].map((row) => ({
          kind: row.kind,
          id: row.id,
          data: row.data,
        })),
        "kind,id",
      ],
      [
        "textbook_mcq_imports",
        [{ book_id: book.id, data: imported }],
        "book_id",
      ],
      [
        "textbook_mcq_candidates",
        snapshot.tables.textbook_mcq_candidates
          .filter((row: { id: string }) =>
            questions.some((question) => question.id === row.id),
          )
          .map((row: { id: string; book_id: string; data: unknown }) => ({
            id: row.id,
            book_id: row.book_id,
            data: row.data,
          })),
        "id",
      ],
      [
        "avs_questions",
        questions.map((question) => ({ id: question.id, data: question })),
        "id",
      ],
    ] as const) {
      const result = await client
        .from(table)
        .upsert(rows, { onConflict: conflict });
      expect(result.error).toBeNull();
    }
    await page.goto("/textbook-practice");
    await page.getByLabel("Subject and textbook").selectOption(book.id);
    await page.getByLabel(/^Chapter/).selectOption(chapterId);
    const start = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/practice/start") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Start Practice Session" }).click();
    const quiz = (await (await start).json()) as {
      session: QuizSession;
      questions: Question[];
    };
    expect(quiz.questions).toHaveLength(3);
    expect(
      quiz.questions.every((question) =>
        questions.some((original) => original.id === question.id),
      ),
    ).toBe(true);
    await expect(page.getByTestId("question-text")).toHaveText(
      quiz.questions[0].questionText,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator(
          "main canvas, main iframe, main embed, main img, [data-testid=pdf-page]",
        )
        .count(),
    ).toBe(0);
    for (const [index, letter] of ["A", "B", "C", "D"].entries())
      expect(
        await page.getByTestId("option-text").nth(index).textContent(),
      ).toBe(quiz.questions[0][`option${letter}` as "optionA"]);
    const select = async (answer: string) =>
      page
        .getByTestId("option-text")
        .nth("ABCD".indexOf(answer))
        .locator("..")
        .click();
    const correct = quiz.questions[0].correctAnswer;
    await select(correct === "A" ? "B" : "A");
    await expect(
      page.getByText(`Incorrect. The correct answer is Option ${correct}.`),
    ).toBeVisible();
    await expect(page.getByText("Marks: 0 / 3")).toBeVisible();
    await expect(
      page
        .getByTestId("option-text")
        .nth("ABCD".indexOf(correct))
        .locator(".."),
    ).toHaveClass(/border-emerald-500/);
    await select(correct);
    await select(correct);
    await expect(page.getByText("Marks: 1 / 3")).toBeVisible();
    await page
      .getByRole("button", { name: "Next Question", exact: true })
      .click();
    const wrong = quiz.questions[1].correctAnswer === "A" ? "B" : "A";
    await select(wrong);
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await expect(
      page.getByRole("radio").nth("ABCD".indexOf(correct)),
    ).toBeChecked();
    await expect(page.getByText("Marks: 1 / 3")).toBeVisible();
    const finished = page.waitForResponse((response) =>
      response.url().endsWith("/api/practice/submit"),
    );
    await page
      .getByRole("button", { name: "Finish Practice", exact: true })
      .click();
    const result = await (await finished).json();
    expect([
      result.session.score,
      result.session.correctCount,
      result.session.wrongCount,
      result.session.unansweredCount,
      result.accuracy,
    ]).toEqual([1, 1, 1, 1, 33]);
    completed++;
    const again = await authRequest(page, "/api/practice/submit", {
      sessionId: quiz.session.id,
      answers: Object.fromEntries(
        quiz.questions.map((question) => [question.id, question.correctAnswer]),
      ),
    });
    expect((await again.json()).session.score).toBe(1);
    await expect(
      page.getByRole("heading", { name: "Practice Performance Summary" }),
    ).toBeVisible();
    expect(
      await page
        .locator("main canvas, main iframe, main embed, main img")
        .count(),
    ).toBe(0);
    const retry = page.waitForResponse((response) =>
      response.url().endsWith("/api/practice/start"),
    );
    await page
      .getByRole("button", { name: "Retry Practice", exact: true })
      .click();
    const retried = (await (await retry).json()) as {
      session: QuizSession;
      questions: Question[];
    };
    expect(retried.session.id).not.toBe(quiz.session.id);
    expect(retried.session.isCompleted).toBe(false);
    await expect(page.getByTestId("question-text")).toHaveText(
      retried.questions[0].questionText,
    );
    await expect(page.getByText("Marks: 0 / 3")).toBeVisible();
    for (let index = 0; index < retried.questions.length; index++) {
      await select(retried.questions[index].correctAnswer);
      if (index < retried.questions.length - 1)
        await page
          .getByRole("button", { name: "Next Question", exact: true })
          .click();
    }
    const resubmitted = page.waitForResponse((response) =>
      response.url().endsWith("/api/practice/submit"),
    );
    await page
      .getByRole("button", { name: "Finish Practice", exact: true })
      .click();
    expect((await (await resubmitted).json()).accuracy).toBe(100);
    completed++;
    const repeat = page.waitForResponse((response) =>
      response.url().endsWith("/api/practice/start"),
    );
    await page
      .getByRole("button", { name: "Practice Again", exact: true })
      .click();
    expect((await (await repeat).json()).session.id).not.toBe(
      retried.session.id,
    );
    await expect(page.getByTestId("question-text")).toBeVisible();
    const timed = await authRequest(page, "/api/practice/start", {
      subjectId: `tb-${book.id}`,
      chapterId,
      mode: "timed",
      limit: 3,
    });
    const exam = await timed.json();
    expect(
      exam.questions.every(
        (question: Question) =>
          !question.correctAnswer &&
          !question.sourceAnswerPage &&
          !question.explanation,
      ),
    ).toBe(true);
    const restored = await get(`/api/practice/session?id=${exam.session.id}`);
    expect(restored.status(), await restored.text()).toBe(200);
    expect(
      (await restored.json()).questions.every(
        (question: Question) =>
          !question.correctAnswer && !question.sourceAnswerPage,
      ),
    ).toBe(true);
    if (subject === "Accountancy") {
      const timedStart = page.waitForResponse((response) =>
        response.url().endsWith("/api/practice/start"),
      );
      await page.goto(
        `/practice/session?${new URLSearchParams({ subjectId: `tb-${book.id}`, chapterId, mode: "timed", sourceFilter: "Book-In", count: "3", attempt: "timed-audit" })}`,
      );
      const timedAttempt = await (await timedStart).json();
      await expect(page.getByTestId("question-text")).toBeVisible();
      await expect(page.getByText(/Marks:/)).toHaveCount(0);
      const timedFinish = page.waitForResponse((response) =>
        response.url().endsWith("/api/practice/submit"),
      );
      await page
        .getByRole("button", { name: "Finish Practice", exact: true })
        .click();
      expect((await (await timedFinish).json()).accuracy).toBe(0);
      completed++;
      const timedRetry = page.waitForResponse((response) =>
        response.url().endsWith("/api/practice/start"),
      );
      await page
        .getByRole("button", { name: "Retry Practice", exact: true })
        .click();
      const freshTimed = await (await timedRetry).json();
      expect(freshTimed.session.id).not.toBe(timedAttempt.session.id);
      expect(Date.parse(freshTimed.session.expiresAt)).toBeGreaterThan(
        Date.now(),
      );
      await expect(page.getByTestId("question-text")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Practice Performance Summary" }),
      ).toHaveCount(0);
    }
    await page.goto("/textbook-practice");
    await page.getByLabel("Subject and textbook").selectOption(book.id);
    const emptyChapter = chapters.find(
      (row: { id: string }) =>
        row.id !== chapterId && row.id !== fixtureChapterId,
    ).id;
    await page.getByLabel(/^Chapter/).selectOption(emptyChapter);
    await expect(
      page.getByRole("button", { name: "Start Practice Session" }),
    ).toBeDisabled();
    await expect(
      page.getByText(
        "The question text, choices or answers for this selection are awaiting review.",
      ),
    ).toBeVisible();
  }
  await page.goto("/practice");
  await expect(
    page.getByText(`Your Recent Practice Attempts (${completed})`),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText(`Your Recent Practice Attempts (${completed})`),
  ).toBeVisible();
  const history = await page.evaluate(
    (id) =>
      JSON.parse(
        localStorage.getItem(
          "skillup_practice_history:" + encodeURIComponent(id),
        ) || "[]",
      ),
    owner.id,
  );
  expect(new Set(history.map((entry: { id: string }) => entry.id)).size).toBe(
    completed,
  );
  expect(
    history.every(
      (entry: { sourceFilter: string }) => entry.sourceFilter === "Book-In",
    ),
  ).toBe(true);
  expect(
    await page
      .getByRole("link", { name: "Re-take" })
      .first()
      .getAttribute("href"),
  ).toContain("sourceFilter=Book-In");
  const retakeStart = page.waitForResponse((response) =>
    response.url().endsWith("/api/practice/start"),
  );
  const retakeLink = page.getByRole("link", { name: "Re-take" }).first();
  await retakeLink.evaluate((element) =>
    element.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await retakeLink.click();
  const retaken = await (await retakeStart).json();
  expect(retaken.session.id).not.toBe(history[0].id);
  expect(retaken.session.subjectId).toBe(history[0].subjectId);
  expect(retaken.session.chapterId).toBe(history[0].chapterId);
  expect(retaken.session.sourceFilter).toBe(history[0].sourceFilter);
  await expect(page.getByTestId("question-text")).toBeVisible();
  await page.evaluate(
    (entries) =>
      localStorage.setItem("skillup_practice_history", JSON.stringify(entries)),
    history,
  );
  await authRequest(page, "/api/auth/logout");
  const secondEmail = `audit.other.${project}@example.test`;
  expect(
    (
      await authRequest(page, "/api/auth/register", {
        studentName: "Other audit account",
        email: secondEmail,
        password,
        phone: project === "desktop" ? "9880010111" : "9880010112",
        schoolName: "Isolated Audit School",
        registerNumber: `OTHER-AUDIT-${project}`,
        medium: "English",
        stream: "Computer Science",
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await authRequest(page, "/api/auth/login", {
        loginId: secondEmail,
        password,
      })
    ).status(),
  ).toBe(200);
  await page.goto("/practice");
  await expect(
    page.getByRole("heading", { name: "Real-Time Practice & Timed Exams" }),
  ).toBeVisible();
  await expect(page.getByText(/Your Recent Practice Attempts/)).toHaveCount(0);
  expect(
    (await get("/api/practice/session?id=" + history[0].id)).status(),
  ).toBe(404);
  await authRequest(page, "/api/auth/logout");
  await authRequest(page, "/api/auth/login", { loginId: email, password });
  await page.goto("/practice");
  await expect(
    page.getByText(`Your Recent Practice Attempts (${completed})`),
  ).toBeVisible();
  const clearHistory = page.getByRole("button", { name: "Clear History" });
  await clearHistory.evaluate((element) =>
    element.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await clearHistory.click();
  await expect(page.getByText(/Your Recent Practice Attempts/)).toHaveCount(0);
  const sessions = await client
    .from("avs_quiz_sessions")
    .select("id")
    .eq("student_id", owner.studentId)
    .eq("completed", true);
  expect(sessions.data).toHaveLength(completed);
  await page.route("**/api/subjects", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Audit: backend unavailable" }),
    }),
  );
  await page.goto("/practice");
  await expect(page.locator("main").getByRole("alert")).toHaveText(
    "Audit: backend unavailable",
  );
  expect(errors).toEqual([]);
});
