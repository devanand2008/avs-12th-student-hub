import { expect, test } from "@playwright/test";
import { testFixtureOrigin } from "../helpers/e2e-urls";
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
  test.setTimeout(240000);
  const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
  const client = createClient(testFixtureOrigin, "qa-service-key", {
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
  await page.goto("/");
  expect((await authRequest(page, "/api/practice/answer", { sessionId: "unknown", questionId: "unknown", answer: "A" })).status()).toBe(401);
  await expect(
    page
      .getByRole("region", { name: "Student-ready book-back practice" })
      .getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("4,500+");
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
    // A status-only publication without a human review must not inflate the
    // chapter count or enter browsing/practice. This row exists only in PGlite.
    const unreviewedId = `audit-unreviewed-${project}-${book.id}`;
    const unreviewed = await client.from("avs_questions").upsert({
      id: unreviewedId,
      data: {
        ...questions[0],
        id: unreviewedId,
        reviewStatus: undefined,
        reviewedBy: undefined,
        reviewedAt: undefined,
      },
    });
    expect(unreviewed.error).toBeNull();
    const coverageResponse = await get("/api/textbook-practice");
    expect(coverageResponse.status()).toBe(200);
    const allCoverage = (await coverageResponse.json()).coverage;
    const currentCoverage = allCoverage.find(
      (entry: { bookId: string }) => entry.bookId === book.id,
    );
    expect(
      currentCoverage.chapters.find(
        (chapter: { id: string }) => chapter.id === chapterId,
      ).published,
    ).toBe(3);
    const readyTotal = allCoverage
      .filter((entry: { bookId: string }) =>
        catalog.books.some((book) => book.id === entry.bookId),
      )
      .reduce(
        (n: number, entry: { published: number }) => n + entry.published,
        0,
      );
    for (const path of ["/", "/dashboard"]) {
      await page.goto(path);
      const summary = page.getByRole("region", {
        name: "Student-ready book-back practice",
      });
      await expect(summary.getByRole("status")).toContainText(
        `${readyTotal} student-ready book-back questions.`,
      );
      await expect(summary).toContainText(`${subject} · English`);
      await expect(
        summary.getByRole("link", {
          name: "Choose medium, subject and chapter",
        }),
      ).toHaveAttribute("href", "/textbook-practice");
      await expect(page.locator("body")).not.toContainText("500+ MCQs");
    }
    if (subject === "Accountancy") {
      await page.route("**/api/textbook-practice", (route) =>
        route.fulfill({
          status: 503,
          json: { error: "Isolated availability outage" },
        }),
      );
      await page.goto("/");
      const summary = page.getByRole("region", {
        name: "Student-ready book-back practice",
      });
      await expect(summary.getByRole("alert")).toContainText(
        "Question availability could not be loaded.",
      );
      await page.unroute("**/api/textbook-practice");
      await summary.getByRole("button", { name: "Try again" }).click();
      await expect(summary.getByRole("status")).toContainText(
        `${readyTotal} student-ready book-back questions.`,
      );
    }
    await page.goto("/textbook-practice");
    await page
      .getByRole("combobox", { name: "Textbook medium", exact: true })
      .selectOption("English");
    await page
      .getByRole("combobox", { name: "Subject", exact: true })
      .selectOption(subject);
    const choices = await page
      .getByLabel("Subject and textbook")
      .locator("option")
      .evaluateAll((options) =>
        options.map((o) => (o as HTMLOptionElement).value).filter(Boolean),
      );
    expect(
      choices.every((id) =>
        catalog.books.some(
          (b) =>
            b.id === id &&
            b.subject === subject &&
            b.sourceMedium === "English",
        ),
      ),
    ).toBe(true);
    await page.getByLabel("Subject and textbook").selectOption(book.id);
    await page
      .getByLabel("Find a chapter by name or number")
      .fill("no-such-chapter-for-audit");
    await expect(
      page.getByText(
        "No chapters match this search. Try a chapter number or another name.",
      ),
    ).toBeVisible();
    await page.getByLabel("Find a chapter by name or number").fill("");
    await page.getByLabel(/^Chapter/).selectOption(chapterId);
    await page.getByLabel("Questions in this practice").selectOption("all");
    const browse = await get(
      `/api/textbook-practice/questions?${new URLSearchParams({ bookId: book.id, chapterId })}`,
    );
    expect(browse.status()).toBe(200);
    const browserQuestions = await browse.json();
    expect(browserQuestions.total).toBe(3);
    expect(
      browserQuestions.questions.every(
        (q: Record<string, unknown>) => !q.correctAnswer && !q.explanation,
      ),
    ).toBe(true);
    const searchText = questions[0].questionText
      .slice(0, 60)
      .replace(/\s+/gu, " ")
      .trim();
    await page.getByLabel("Search question text or number").fill(searchText);
    await expect(
      page.getByText(questions[0].questionText, { exact: true }),
    ).toBeVisible();
    await page.getByLabel("Search question text or number").fill("");
    await expect(
      page.getByRole("button", { name: "Start Practice Session" }),
    ).toBeEnabled();
    await expect(
      page.getByRole("complementary", { name: "Install mobile app prompt" }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
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
    expect(quiz.questions.every((q) => !q.correctAnswer && !q.explanation)).toBe(true);
    const correctFor = (question: Question) => questions.find((q) => q.id === question.id)!.correctAnswer;
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
    const select = async (answer: string, submit = true) => {
      await page
        .getByTestId("option-text")
        .nth("ABCD".indexOf(answer))
        .locator("..")
        .click();
      const button = page.getByRole("button", { name: "Submit Answer", exact: true });
      if (submit && await button.isEnabled()) await button.click();
    };
    const correct = correctFor(quiz.questions[0]);
    await select(correct === "A" ? "B" : "A", false);
    await page.getByRole("button", { name: "Clear answer", exact: true }).click();
    await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
    await select(correct === "A" ? "B" : "A", false);
    await expect(page.getByText(`Incorrect. The correct answer is Option ${correct}.`)).not.toBeVisible();
    await expect(page.getByText("Marks: 0 / 3")).toBeVisible();
    const unanswered = await (await get(`/api/practice/session?id=${quiz.session.id}`)).json();
    expect(unanswered.questions.every((q: Question) => !q.correctAnswer && !q.explanation)).toBe(true);
    await page.route("**/api/practice/answer", (route) => route.fulfill({ status: 503, json: { error: "Isolated feedback outage" } }));
    await page.getByRole("button", { name: "Submit Answer", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Isolated feedback outage" })).toBeVisible();
    await expect(page.getByText("Marks: 0 / 3")).toBeVisible();
    await expect(page.getByText(`Incorrect. The correct answer is Option ${correct}.`)).not.toBeVisible();
    await page.unroute("**/api/practice/answer");
    await page.getByRole("button", { name: "Submit Answer", exact: true }).click();
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
    await expect(page.getByRole("radio").nth("ABCD".indexOf(correct))).toBeDisabled();
    await expect(page.getByRole("button", { name: "Submit Answer", exact: true })).toBeDisabled();
    const resubmission = await authRequest(page, "/api/practice/answer", { sessionId: quiz.session.id, questionId: quiz.questions[0].id, answer: correct });
    expect((await resubmission.json()).savedAnswer.isCorrect).toBe(false);
    await expect(page.getByText("Marks: 0 / 3")).toBeVisible();
    await page
      .getByRole("button", { name: "Next Question", exact: true })
      .click();
    const wrong = correctFor(quiz.questions[1]) === "A" ? "B" : "A";
    const savedAnswer = page.waitForResponse((response) => response.url().endsWith("/api/practice/save") && response.request().method() === "PUT");
    await select(wrong);
    expect((await savedAnswer).status()).toBe(200);
    await page.reload();
    await expect(page.getByTestId("question-text")).toHaveText(quiz.questions[1].questionText);
    await expect(page.getByRole("radio").nth("ABCD".indexOf(wrong))).toBeChecked();
    await expect(page.getByText("Marks: 0 / 3")).toBeVisible();
    const restoredAnswers = await (await get(`/api/practice/session?id=${quiz.session.id}`)).json();
    expect(restoredAnswers.questions.find((q: Question) => q.id === quiz.questions[2].id).correctAnswer).toBeUndefined();
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await expect(
      page.getByRole("radio").nth("ABCD".indexOf(correct === "A" ? "B" : "A")),
    ).toBeChecked();
    await expect(page.getByText("Marks: 0 / 3")).toBeVisible();
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
    ]).toEqual([0, 0, 2, 1, 0]);
    completed++;
    const again = await authRequest(page, "/api/practice/submit", {
      sessionId: quiz.session.id,
      answers: Object.fromEntries(
        quiz.questions.map((question) => [question.id, correctFor(question)]),
      ),
    });
    expect((await again.json()).session.score).toBe(0);
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
      await select(correctFor(retried.questions[index]));
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
    const timedCopy = await timed.json();
    expect((await authRequest(page, "/api/practice/answer", { sessionId: timedCopy.session.id, questionId: timedCopy.questions[0].id, answer: "A" })).status()).toBe(409);
    const legacySave = await authRequest(page, "/api/practice/answer", { sessionId: timedCopy.session.id, questionId: timedCopy.questions[0].id, selectedAnswer: "A", timeSpentSeconds: 2, markedForReview: true });
    expect(legacySave.status()).toBe(200);
    const legacySaved = await legacySave.json();
    expect(legacySaved.savedAnswer).toEqual({ questionId: timedCopy.questions[0].id, selectedAnswer: "A", markedForReview: true });
    expect(legacySaved.correctAnswer).toBeUndefined();
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
        "No published questions for this selection yet. Extraction and teacher review are incomplete; choose another chapter or textbook.",
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
  expect((await authRequest(page, "/api/practice/answer", { sessionId: history[0].id, questionId: "unknown", answer: "A" })).status()).toBe(404);
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
