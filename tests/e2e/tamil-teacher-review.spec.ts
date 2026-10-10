import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import catalog from "../../src/lib/textbooks-catalog.json";
import { authRequest } from "../helpers/otp-browser";

async function authenticatedGet(page: Page, path: string) {
  // Production secure cookies need an explicit header on fixture HTTP API calls.
  return page.request.get(path, {
    headers: {
      Cookie: (await page.context().cookies())
        .map((c) => c.name + "=" + c.value)
        .join("; "),
    },
  });
}

test("Tamil medium selection, protected CSV and individual decisions retain evidence and audit history", async ({
  page,
  browser,
}, info) => {
  // This client is deliberately pinned to the isolated test fixture, never Supabase production.
  const client = createClient("http://127.0.0.1:3101", "qa-service-key", {
    auth: { persistSession: false },
  });
  const book = catalog.books.find(
    (b) => b.subject === "Accountancy" && b.sourceMedium === "Tamil",
  )!;
  const subjectId = `tb-${book.id}`,
    chapterId = `${subjectId}-ch-1`;
  const id = `fixture-tamil-review-${info.project.name}`;
  const batchId = `${chapterId}-review-fixture`;
  const source = "சோதனை வினா: சரியான விடையைத் தேர்ந்தெடுக்கவும்.";
  const choices = ["முதல்", "இரண்டாம்", "மூன்றாம்", "நான்காம்"];
  const candidate = {
    id,
    bookId: book.id,
    subjectId,
    chapterId,
    chapterTitle: "சோதனை அத்தியாயம்",
    number: 1,
    page: 12,
    keyPage: 18,
    section: "Book-back",
    sourceSha256: book.sha256,
    status: "Needs Review",
    reviewStatus: "needs_teacher_review",
    questionText: source,
    options: choices,
    correctAnswer: null,
    qualityFlags: ["QA fixture: chapter-specific key needs confirmation"],
    originalExtraction: {
      questionText: source,
      options: choices,
      correctAnswer: null,
    },
    reviewPreparation: {
      batchId,
      preparedAt: new Date().toISOString(),
      medium: "Tamil",
      volume: book.volume,
      subject: book.subject,
      title: book.title,
      sourceSha256: book.sha256,
      printedPage: null,
      printedPageEvidence: "QA fixture: printed page unknown",
      sourceCheck: "matched",
      keyCheck: "uncertain",
      sourceQuestionText: source,
      sourceOptions: choices,
      tamilText: source,
      englishText: null,
      sourcePageText: source + "\n" + choices.join("\n"),
      keyPageText: "QA fixture: two keys use question number 1",
      parsedAnswer: null,
      warnings: [
        "Two exercise keys share question number 1; verify chapter scope.",
      ],
      duplicateIds: [],
    },
  };
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
          local_path: book.localPath,
          sha256: book.sha256,
          volume: book.volume,
        },
      ],
      "id",
    ],
    [
      "avs_curriculum",
      [
        {
          kind: "subject",
          id: subjectId,
          data: {
            id: subjectId,
            name: "Accountancy (Tamil)",
            streamId: "Common",
          },
        },
        {
          kind: "chapter",
          id: chapterId,
          data: {
            id: chapterId,
            subjectId,
            chapterNumber: 1,
            title: candidate.chapterTitle,
            isActive: true,
          },
        },
      ],
      "kind,id",
    ],
    [
      "textbook_mcq_candidates",
      [{ id, book_id: book.id, data: candidate }],
      "id",
    ],
    [
      "textbook_mcq_imports",
      [
        {
          book_id: book.id,
          data: {
            bookId: book.id,
            subjectId,
            total: 1,
            published: 0,
            review: 1,
            notes: [],
            chapters: [
              {
                id: chapterId,
                number: 1,
                title: candidate.chapterTitle,
                total: 1,
                published: 0,
                review: 1,
              },
            ],
          },
        },
      ],
      "book_id",
    ],
  ] as const) {
    const { error } = await client
      .from(table)
      .upsert(rows, { onConflict: conflict });
    expect(error).toBeNull();
  }
  const anonymous = await browser.newContext();
  expect(
    (
      await anonymous.request.get(
        "http://127.0.0.1:3100/api/admin/textbook-questions/export?medium=Tamil",
      )
    ).status(),
  ).toBe(401);
  await anonymous.close();
  const student = await browser.newContext({
    baseURL: "http://127.0.0.1:3100",
  });
  const studentPage = await student.newPage();
  expect(
    (
      await authRequest(studentPage, "/api/auth/login", {
        loginId: "AVSCS26-0001",
        password: "Student@2026",
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await authenticatedGet(
        studentPage,
        "/api/admin/textbook-questions/export?medium=Tamil",
      )
    ).status(),
  ).toBe(403);
  expect(
    (
      await authenticatedGet(
        studentPage,
        "/api/admin/textbook-questions?books=true",
      )
    ).status(),
  ).toBe(403);
  expect(
    (
      await authRequest(studentPage, "/api/admin/textbook-questions", {
        id,
        action: "reject",
        reason: "Unauthorised attempt",
        expectedUpdatedAt: "2026-01-01",
      })
    ).status(),
  ).toBe(403);
  await student.close();
  let response = await authRequest(page, "/api/auth/login", {
    loginId: "qa-admin@example.test",
    password: "QA-only-changed-password",
  });
  if (response.status() !== 200)
    response = await authRequest(page, "/api/auth/login", {
      loginId: "qa-admin@example.test",
      password: "QA-only-bootstrap-password",
    });
  expect(response.status()).toBe(200);
  if ((await response.json()).user.mustChangePassword)
    expect(
      (
        await authRequest(page, "/api/auth/change-password", {
          currentPassword: "QA-only-bootstrap-password",
          newPassword: "QA-only-changed-password",
        })
      ).status(),
    ).toBe(200);
  await page.goto("/admin/textbook-questions");
  await expect(
    page.getByRole("combobox", { name: "Textbook medium", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("combobox", { name: "Textbook medium", exact: true })
    .selectOption("Tamil");
  await expect(
    page.getByRole("combobox", { name: "Textbook", exact: true }),
  ).toHaveValue(book.id);
  await page.getByLabel("Teacher review batch").selectOption(batchId);
  const row = page.locator(`tr[data-candidate-id="${id}"]`);
  await expect(row).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Export selected prepared queue (CSV)",
      exact: true,
    })
    .click();
  const download = await downloadPromise;
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv).toContain(id);
  expect(csv).toContain(batchId);
  expect(csv).toContain(source);
  expect(csv).toContain(`/textbooks/${book.id}?page=18`);
  expect(csv).toContain("needs_teacher_review");
  await row.getByRole("button", { name: "Review MCQ" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("region", {
      name: "Original extraction and source evidence",
    }),
  ).toContainText("Tamil");
  await expect(dialog).toContainText(
    "Two exercise keys share question number 1",
  );
  await expect(
    dialog.getByRole("link", { name: "Answer key page 18" }),
  ).toHaveAttribute("href", `/textbooks/${book.id}?page=18`);
  await expect(
    dialog.getByRole("button", { name: "Publish reviewed MCQ" }),
  ).toBeDisabled();
  await dialog.getByLabel("Verified correct answer").selectOption("B");
  await dialog
    .getByLabel("Review note / rejection reason")
    .fill("QA fixture teacher confirmed exercise scope; answer B.");
  await dialog.getByRole("button", { name: "Save edits for review" }).click();
  await expect(dialog).toHaveCount(0);
  // Inspect real PostgreSQL fixture state through the same SDK used by the app.
  expect(
    (await client.from("avs_questions").select("id").eq("id", id)).data,
  ).toEqual([]);
  await page.reload();
  await page
    .getByRole("combobox", { name: "Textbook medium", exact: true })
    .selectOption("Tamil");
  await page.getByLabel("Teacher review batch").selectOption(batchId);
  await row.getByRole("button", { name: "Review MCQ" }).click();
  await expect(dialog.getByLabel("Verified correct answer")).toHaveValue("B");
  await dialog
    .getByRole("checkbox", { name: /I checked the original question/ })
    .check();
  await dialog
    .getByLabel("Review note / rejection reason")
    .fill("QA fixture: source and chapter key checked individually.");
  await dialog.getByRole("button", { name: "Publish reviewed MCQ" }).click();
  await expect(dialog).toHaveCount(0);
  const published = await client
    .from("avs_questions")
    .select("data")
    .eq("id", id);
  expect(published.data?.[0].data).toMatchObject({
    status: "Published",
    language: "Tamil",
    questionTextTamil: source,
    correctAnswer: "B",
    reviewedBy: "qa-admin",
  });
  await page.getByLabel("Question status").selectOption("published");
  await row.getByRole("button", { name: "Review MCQ" }).click();
  await dialog
    .getByLabel("Review note / rejection reason")
    .fill("QA fixture: returned to manual verification.");
  await dialog.getByRole("button", { name: "Reject question" }).click();
  await expect(dialog).toHaveCount(0);
  expect(
    (await client.from("avs_questions").select("data").eq("id", id)).data?.[0]
      .data.status,
  ).toBe("Teacher Review");
  const saved = (
    await client.from("textbook_mcq_candidates").select("data").eq("id", id)
  ).data?.[0].data;
  expect(saved.reviewStatus).toBe("rejected");
  expect(saved.originalExtraction).toEqual(candidate.originalExtraction);
  expect(saved.reviewPreparation).toEqual(candidate.reviewPreparation);
  expect(saved.reviewHistory.map((e: { action: string }) => e.action)).toEqual([
    "edit",
    "approve",
    "reject",
  ]);
  const audits = (
    await client.from("avs_audit_logs").select("data").eq("data->>entityId", id)
  ).data;
  expect(
    audits?.filter((a) => a.data.action === "MODERATE_TEXTBOOK_MCQ"),
  ).toHaveLength(3);
  expect(
    audits?.every(
      (a) => a.data.userId === "qa-admin" && a.data.before && a.data.after,
    ),
  ).toBe(true);
  const rejectedCsv = await authenticatedGet(
    page,
    `/api/admin/textbook-questions/export?bookId=${book.id}&batchId=${batchId}`,
  );
  expect(await rejectedCsv.text()).toContain("rejected");
  expect(rejectedCsv.headers()["cache-control"]).toBe("private, no-store");
  expect(
    (
      await authenticatedGet(
        page,
        "/api/admin/textbook-questions/export?medium=Invalid",
      )
    ).status(),
  ).toBe(400);
});
