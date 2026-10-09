import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { completeFirstOtp, readTestOtp } from "../helpers/otp-browser";

type ApiOptions = NonNullable<Parameters<APIRequestContext["post"]>[1]>;
async function api(
  page: Page,
  method: "get" | "post",
  url: string,
  options: ApiOptions = {},
) {
  // The test server uses HTTP. Preserve production Secure cookies and send them
  // explicitly for API tests; the browser itself treats loopback as trustworthy.
  const cookies = await page.context().cookies();
  return page.request[method](url, {
    ...options,
    headers: {
      Cookie: cookies
        .map((cookie) => cookie.name + "=" + cookie.value)
        .join("; "),
      "x-forwarded-for":
        "qa-" + test.info().project.name + "-" + test.info().title,
      ...options.headers,
    },
  });
}
async function student(page: Page, biology = false) {
  const response = await api(page, "post", "/api/auth/login", {
    data: {
      loginId: biology ? "AVSBIO26-0001" : "AVSCS26-0001",
      password: "Student@2026",
    },
  });
  expect(response.status()).toBe(200);
}
async function admin(page: Page) {
  let response = await api(page, "post", "/api/auth/login", {
    data: {
      loginId: "qa-admin@example.test",
      password: "QA-only-changed-password",
    },
  });
  if (response.status() !== 200)
    response = await api(page, "post", "/api/auth/login", {
      data: {
        loginId: "qa-admin@example.test",
        password: "QA-only-bootstrap-password",
      },
    });
  expect(response.status()).toBe(200);
  const data = await response.json();
  if (data.user.mustChangePassword) {
    const change = await api(page, "post", "/api/auth/change-password", {
      data: {
        currentPassword: "QA-only-bootstrap-password",
        newPassword: "QA-only-changed-password",
      },
    });
    expect(change.status()).toBe(200);
  }
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("students find common-subject notes, Tamil lessons and video bookmarks", async ({
  page,
}, info) => {
  await admin(page);
  const title = `Material library ${info.project.name}`;
  const noteResult = await api(page, "post", "/api/admin/content", {
    data: {
      kind: "note",
      title: title + " maths",
      chapterId: "maths-ch-4",
      topic: "Inverse Trigonometric Functions",
      language: "English",
      url: "https://fixtures.example.test/material.pdf",
      pageCount: 20,
      isPublished: true,
    },
  });
  expect(noteResult.status()).toBe(201);
  const { resource: note } = await noteResult.json();
  const videoResult = await api(page, "post", "/api/admin/content", {
    data: {
      kind: "video",
      title: title + " Tamil",
      titleTamil: "இளந்தமிழே!",
      chapterId: "tamil-ch-1",
      language: "Tamil",
      url: "https://fixtures.example.test/material.mp4",
      embedType: "mp4",
      durationSeconds: 293,
      isPublished: true,
    },
  });
  expect(videoResult.status()).toBe(201);
  const { resource: video } = await videoResult.json();
  await page.route("https://fixtures.example.test/material.mp4", (route) =>
    route.fulfill({ status: 204 }),
  );
  await student(page, true);
  await page.goto("/notes");
  await page
    .getByRole("combobox", { name: "Filter notes by subject" })
    .selectOption("Mathematics");
  await page.getByRole("searchbox", { name: "Search notes" }).fill(title);
  await expect(
    page.getByRole("link").filter({ hasText: note.title }),
  ).toBeVisible();
  await noOverflow(page);
  await page.goto("/subjects");
  await expect(page.locator("#maths-ch-4")).toContainText(
    "Inverse Trigonometric Functions",
  );
  await expect(
    page
      .locator("#maths-ch-4")
      .getByRole("link", { name: "Notes", exact: true }),
  ).toHaveAttribute("href", "/notes?chapterId=maths-ch-4");
  await page.goto("/notes?chapterId=maths-ch-5");
  await expect(
    page.getByRole("link").filter({ hasText: note.title }),
  ).toHaveCount(0);
  let releaseBookmarkRead!: () => void;
  const bookmarkReadGate = new Promise<void>((resolve) => {
    releaseBookmarkRead = resolve;
  });
  let delayedBookmarkRead = false;
  await page.route("**/api/bookmarks", async (route) => {
    if (route.request().method() === "GET" && !delayedBookmarkRead) {
      delayedBookmarkRead = true;
      await bookmarkReadGate;
    }
    await route.continue();
  });
  await page.goto(`/videos?id=${video.id}&chapterId=tamil-ch-1`);
  await page
    .getByRole("searchbox", { name: "Search video lessons" })
    .fill("இளந்தமிழே");
  await expect(
    page.getByRole("heading", { name: video.title, exact: true }),
  ).toHaveCount(2);
  await expect(page.getByText("4:53", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Bookmark video", exact: true }),
  ).toBeDisabled();
  releaseBookmarkRead();
  await page
    .getByRole("button", { name: "Bookmark video", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remove bookmark", exact: true }),
  ).toBeVisible();
  const bookmarks = await (await api(page, "get", "/api/bookmarks")).json();
  expect(
    bookmarks.bookmarks.some(
      (item: { contentId: string }) => item.contentId === video.id,
    ),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Remove bookmark", exact: true }),
  ).toBeVisible();
  await noOverflow(page);
  await admin(page);
  for (const resource of [note, video]) {
    await api(page, "post", "/api/admin/content", {
      data: {
        kind: resource.id === note.id ? "note" : "video",
        id: resource.id,
        action: "archive",
      },
    });
  }
});

test("homepage, navigation and all 3D models render without runtime errors", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Prepare Smarter/ }),
  ).toBeVisible();
  await noOverflow(page);
  for (const name of [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Computer Science",
    "Bio-Botany",
    "Bio-Zoology",
    "பொதுத்தமிழ்",
    "General English",
  ]) {
    const photo = page.getByRole("img", { name, exact: true });
    await photo.scrollIntoViewIfNeeded();
    await expect(photo).toBeVisible();
    await expect
      .poll(
        () =>
          photo.evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
        { message: `${name} subject image loads successfully` },
      )
      .toBe(true);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/home-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: /Open 3D Lab/i }).click();
  await expect(
    page.getByRole("heading", { name: /Your 3D learning lab/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Explore in 3D" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page
    .getByRole("button", { name: "Adenine–thymine pair", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Adenine–thymine pair", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause rotation" }).click();
  await page.getByRole("button", { name: "Reset view" }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/dna-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: /Inside a plant cell/ }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "Nucleus", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nucleus", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Binary search tree/ }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/tree-${info.project.name}.png`,
    fullPage: true,
  });
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test("admin user directory exposes safe profiles, filters, CSV and account actions", async ({
  page,
}, info) => {
  await admin(page);
  const name = `QA directory student ${info.project.name}`;
  const registerNumber = `DIRECTORY-${info.project.name}-${Date.now()}`;
  const created = await api(page, "post", "/api/admin/students/create", {
    data: {
      studentName: name,
      registerNumber,
      schoolName: 'QA "Directory", School',
      studentEmail: `directory-${info.project.name}@example.test`,
      studentPhone:
        info.project.name === "mobile" ? "9876543291" : "9876543290",
      stream: "Computer Science",
      medium: "Tamil",
      academicYear: "2026-2027",
    },
  });
  expect(created.status()).toBe(200);
  const { student: record } = await created.json();
  const report = await api(page, "get", "/api/admin/users");
  expect(report.status()).toBe(200);
  const reportData = await report.json();
  expect(reportData.storageMode).toBe("supabase");
  expect(
    reportData.users.some((user: { role: string }) => user.role === "admin"),
  ).toBe(true);
  expect(JSON.stringify(reportData)).not.toMatch(
    /passwordHash|temporaryPassword/,
  );
  await page.goto("/admin/students");
  await expect(
    page.getByRole("heading", { name: "All users", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search users").fill(registerNumber);
  await page
    .getByRole("combobox", { name: "Role", exact: true })
    .selectOption("student");
  await page
    .getByRole("combobox", { name: "Medium", exact: true })
    .selectOption("Tamil");
  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row).toContainText(record.studentId);
  await expect(row).toContainText("Tamil");
  await expect(row).toContainText("Required");
  await noOverflow(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^AVS_Users_.*\.csv$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const csv = Buffer.concat(chunks).toString("utf8");
  expect(csv).toContain(record.studentId);
  expect(csv).toContain('"QA ""Directory"", School"');
  expect(csv).not.toContain("passwordHash");
  await row.getByRole("button", { name: `View ${name}`, exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Account ID");
  await expect(page.getByRole("dialog")).toContainText(record.userId);
  await expect(page.getByRole("dialog")).toContainText("12th Standard");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await row
    .getByRole("button", { name: `Deactivate ${name}`, exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  await expect(row).toContainText("Inactive");
  await row
    .getByRole("button", { name: `Reset password for ${name}`, exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  await expect(
    page.getByText(`New temporary password for ${record.studentId}`, {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("code")).not.toBeEmpty();
  await row
    .getByRole("button", { name: `Reactivate ${name}`, exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  await expect(row).toContainText("Active");
  await page.screenshot({
    path: `test-results/admin-users-${info.project.name}.png`,
    fullPage: true,
  });
});

test("admin sign-in reaches the panel after a guest prefetch redirect", async ({
  page,
}) => {
  await admin(page);
  expect((await api(page, "post", "/api/auth/logout")).status()).toBe(200);

  const guestPrefetch = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/admin" &&
      response.request().headers()["next-router-prefetch"] === "1",
  );
  await page.goto("/login?redirect=/admin");
  await page
    .getByRole("link", { name: "Faculty / Admin Portal", exact: true })
    .scrollIntoViewIfNeeded();
  expect((await guestPrefetch).status()).toBe(307);

  await page
    .getByLabel("Gmail / Email Address")
    .fill("qa-admin@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("QA-only-changed-password");
  await page
    .getByRole("button", { name: "Sign In to SkillUp", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: "Admin Control Center", exact: true }),
  ).toBeVisible();
  expect(
    (await (await api(page, "get", "/api/auth/me")).json()).user.role,
  ).toBe("admin");
});

test("login rejects bad credentials and opens an honest student dashboard", async ({
  page,
}) => {
  await page.goto("/login");
  await page
    .getByLabel("Gmail / Email Address")
    .fill("AVSCS26-0001");
  await page.getByLabel("Password", { exact: true }).fill("incorrect-password");
  await page
    .getByRole("button", { name: "Sign In to SkillUp", exact: true })
    .click();
  await expect(
    page.getByText("Student ID or password is incorrect.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill("Student@2026");
  await page
    .getByRole("button", { name: "Sign In to SkillUp", exact: true })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(
    page.getByRole("heading", { name: /Good (morning|afternoon|evening)/ }),
  ).toBeVisible();
  await noOverflow(page);
});

test("authentication, authorization, CSRF and logout are enforced", async ({
  page,
}) => {
  expect((await api(page, "get", "/api/performance")).status()).toBe(401);
  await page.goto("/admin");
  await expect(page).toHaveURL(/login/);
  await student(page);
  expect((await api(page, "get", "/api/admin/analytics")).status()).toBe(403);
  expect(
    (
      await api(page, "post", "/api/practice/start", {
        headers: { Origin: "https://untrusted.example.test" },
        data: { subjectId: "sub-cs" },
      })
    ).status(),
  ).toBe(403);
  const cookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "avs_session",
  )!;
  expect(cookie.httpOnly).toBe(true);
  await api(page, "post", "/api/auth/logout");
  expect(
    (
      await api(page, "get", "/api/performance", {
        headers: { Cookie: `avs_session=${cookie.value}` },
      })
    ).status(),
  ).toBe(401);
});

test("practice restores answers after refresh and scores consistently", async ({
  page,
}) => {
  await student(page);
  await page.goto(
    "/practice/session?subjectId=sub-cs&chapterId=cs-ch-1&mode=quick&count=2",
  );
  await expect(page.getByRole("radio").first()).toBeVisible();
  await page.getByRole("radio").first().press("Space");
  await expect(page.getByText(/All answers saved/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("radio").first()).toBeChecked();
  await page.getByRole("button", { name: "Next Question" }).click();
  await page.getByRole("radio").nth(1).press("Space");
  await page.getByRole("button", { name: "Submit Practice Test" }).click();
  await expect(
    page.getByRole("heading", { name: "Practice Performance Summary" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Detailed Answer Review" }),
  ).toBeVisible();
  await noOverflow(page);
});

test("timed-test autosave hides correctness and cross-student access is blocked", async ({
  page,
  browser,
}) => {
  await student(page);
  const start = await api(page, "post", "/api/practice/start", {
    data: { subjectId: "sub-cs", mode: "timed", limit: 2 },
  });
  expect(start.status()).toBe(200);
  const data = await start.json();
  expect(data.questions[0].correctAnswer).toBeUndefined();
  const saved = await api(page, "post", "/api/practice/answer", {
    data: {
      sessionId: data.session.id,
      questionId: data.questions[0].id,
      selectedAnswer: "A",
    },
  });
  expect(saved.status()).toBe(200);
  expect((await saved.json()).savedAnswer.isCorrect).toBeUndefined();
  const restored = await api(
    page,
    "get",
    `/api/practice/session?id=${data.session.id}`,
  );
  expect((await restored.json()).questions[0].correctAnswer).toBeUndefined();
  expect(
    (
      await api(page, "post", "/api/practice/answer", {
        data: {
          sessionId: data.session.id,
          questionId: "not-assigned",
          selectedAnswer: "A",
        },
      })
    ).status(),
  ).toBe(400);
  const other = await browser.newContext({ baseURL: "http://127.0.0.1:3100" });
  const otherPage = await other.newPage();
  await student(otherPage, true);
  expect(
    (
      await api(otherPage, "post", "/api/practice/submit", {
        data: { sessionId: data.session.id },
      })
    ).status(),
  ).toBe(404);
  await other.close();
});

test("notes retain the latest page after a delayed initial save and reload", async ({
  page,
}, info) => {
  await admin(page);
  const created = await api(page, "post", "/api/admin/content", {
    data: {
      kind: "note",
      title: "Reader save order " + info.project.name,
      chapterId: "cs-ch-1",
      url: "https://fixtures.example.test/reader-save-order.pdf",
      pageCount: 3,
      isPublished: true,
    },
  });
  expect(created.status()).toBe(201);
  const { resource } = await created.json();
  await page.route(resource.pdfUrl, (route) => route.fulfill({ status: 204 }));
  await student(page);

  let releaseInitialSave!: () => void;
  let initialSaveStarted!: () => void;
  const initialGate = new Promise<void>((resolve) => {
    releaseInitialSave = resolve;
  });
  const initialRequest = new Promise<void>((resolve) => {
    initialSaveStarted = resolve;
  });
  let delayed = false;
  await page.route("**/api/activity", async (route) => {
    if (route.request().method() === "POST") {
      const data = route.request().postDataJSON();
      if (
        data.kind === "note" &&
        data.id === resource.id &&
        data.page === 1 &&
        !delayed
      ) {
        delayed = true;
        initialSaveStarted();
        await initialGate;
      }
    }
    await route.continue();
  });
  const savedPage = (pageNumber: number) =>
    page.waitForResponse((response) => {
      if (
        new URL(response.url()).pathname !== "/api/activity" ||
        response.request().method() !== "POST"
      )
        return false;
      const data = response.request().postDataJSON();
      return data.id === resource.id && data.page === pageNumber;
    });
  const firstSaved = savedPage(1);
  await page.goto(`/notes/${resource.id}?page=1`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("iframe")).toHaveAttribute("src", /#page=1/);
  await initialRequest;
  const secondSaved = savedPage(2);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /#page=2/);
  // Let a later request overtake the blocked initial write if writes are unordered.
  await Promise.race([
    secondSaved,
    new Promise((resolve) => setTimeout(resolve, 1000)),
  ]);
  releaseInitialSave();
  expect((await firstSaved).status()).toBe(200);
  expect((await secondSaved).status()).toBe(200);
  const activity = await (await api(page, "get", "/api/activity")).json();
  expect(
    activity.notes.find(
      (visit: { noteId: string }) => visit.noteId === resource.id,
    ).page,
  ).toBe(2);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/notes/${resource.id}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("iframe")).toHaveAttribute("src", /#page=2/);
  await admin(page);
  expect(
    (
      await api(page, "post", "/api/admin/content", {
        data: { kind: "note", id: resource.id, action: "archive" },
      })
    ).status(),
  ).toBe(200);
});

test("admin can save draft content, publish it, open the reader and archive it", async ({
  page,
  browser,
}, info) => {
  await admin(page);
  await page.goto("/admin/notes");
  await page.getByRole("button", { name: "Add notes", exact: true }).click();
  const title = `QA demo note ${info.project.name}`;
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page
    .getByRole("combobox", { name: "Chapter", exact: true })
    .selectOption("cs-ch-1");
  await page
    .getByLabel("File URL (or use upload above)")
    .fill("https://fixtures.example.test/note.pdf");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Draft saved" }),
  ).toContainText("Draft saved");
  const other = await browser.newContext({ baseURL: "http://127.0.0.1:3100" });
  const learner = await other.newPage();
  await student(learner);
  const unpublished = await (await api(learner, "get", "/api/notes")).json();
  expect(
    unpublished.notes.some((note: { title: string }) => note.title === title),
  ).toBe(false);
  await other.close();
  await page.route("https://fixtures.example.test/note.pdf", async (route) => {
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Resources << >> >>",
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(Buffer.byteLength(pdf));
      pdf += index + 1 + " 0 obj\n" + object + "\nendobj\n";
    });
    const start = Buffer.byteLength(pdf);
    pdf +=
      "xref\n0 4\n0000000000 65535 f \n" +
      offsets
        .slice(1)
        .map((offset) => String(offset).padStart(10, "0") + " 00000 n \n")
        .join("") +
      "trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n" +
      start +
      "\n%%EOF";
    await route.fulfill({
      contentType: "application/pdf",
      body: Buffer.from(pdf),
    });
  });
  const resource = page.getByRole("article").filter({ hasText: title });
  await resource.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(resource).toContainText("Published");
  await page.goto("/notes");
  await page.getByRole("link").filter({ hasText: title }).click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    /fixtures.*note.pdf#page=1/,
  );
  await noOverflow(page);
  await expect
    .poll(
      async () =>
        (await (await api(page, "get", "/api/activity")).json()).notes.length,
    )
    .toBeGreaterThan(0);
  // The PDF plugin can delay the old frame's load event during navigation.
  await page.goto("/admin/notes", { waitUntil: "domcontentloaded" });
  await page
    .getByRole("article")
    .filter({ hasText: title })
    .getByRole("button", { name: "Archive", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Archived" }),
  ).toContainText("Archived");
});

test("native video playback saves progress and invalid uploads are rejected", async ({
  page,
}, info) => {
  await admin(page);
  await page.goto("/admin/videos");
  const invalidFile = await api(page, "post", "/api/admin/content", {
    multipart: {
      file: {
        name: "bad.html",
        mimeType: "text/html",
        buffer: Buffer.from("invalid"),
      },
    },
  });
  expect(invalidFile.status()).toBe(400);
  const uploadedNote = await api(page, "post", "/api/admin/content", {
    multipart: {
      file: {
        name: "note.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4"),
      },
    },
  });
  expect(uploadedNote.status()).toBe(200);
  expect((await uploadedNote.json()).url).toMatch(
    /learning-materials\/notes\/.*\.pdf$/,
  );
  const invalidVideo = await api(page, "post", "/api/admin/content", {
    multipart: {
      file: {
        name: "video.webm",
        mimeType: "video/webm",
        buffer: Buffer.from("invalid"),
      },
    },
  });
  expect(invalidVideo.status()).toBe(400);
  const uploadedVideo = await api(page, "post", "/api/admin/content", {
    multipart: {
      file: {
        name: "lesson.mp4",
        mimeType: "video/mp4",
        buffer: Buffer.from("fixture-only"),
      },
    },
  });
  expect(uploadedVideo.status()).toBe(200);
  expect((await uploadedVideo.json()).url).toMatch(
    /learning-materials\/videos\/.*\.mp4$/,
  );
  // Exercise Next.js proxy buffering above its default 10 MiB limit.
  const largeUpload = await api(page, "post", "/api/admin/content", {
    multipart: {
      file: {
        name: "large-lesson.mp4",
        mimeType: "video/mp4",
        buffer: Buffer.alloc(16 * 1024 * 1024, 1),
      },
    },
  });
  expect(largeUpload.status()).toBe(200);
  const unsafe = await api(page, "post", "/api/admin/content", {
    data: {
      kind: "note",
      title: "Unsafe note",
      chapterId: "cs-ch-1",
      url: "javascript:alert(1)",
    },
  });
  expect(unsafe.status()).toBe(400);
  // A locally recorded silent clip exercises the native player without outside media.
  const clip = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext("2d")!;
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8",
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => chunks.push(event.data);
    const done = new Promise<string>((resolve) => {
      recorder.onstop = () => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.readAsDataURL(new Blob(chunks, { type: "video/webm" }));
      };
    });
    recorder.start();
    const interval = setInterval(() => {
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(0, 0, 160, 90);
      ctx.fillStyle = "white";
      ctx.fillText("AVS test lesson", 15, 45);
    }, 50);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    recorder.stop();
    clearInterval(interval);
    stream.getTracks().forEach((track) => track.stop());
    return done;
  });
  const url = "https://fixtures.example.test/lesson.webm";
  await page.route(url, (route) =>
    route.fulfill({
      contentType: "video/webm",
      body: Buffer.from(clip, "base64"),
    }),
  );
  const created = await api(page, "post", "/api/admin/content", {
    data: {
      kind: "video",
      title: "QA playback " + info.project.name,
      chapterId: "cs-ch-1",
      url,
      embedType: "mp4",
      durationSeconds: 2,
      isPublished: true,
    },
  });
  expect(created.status()).toBe(201);
  const { resource } = await created.json();
  await page.goto("/videos?id=" + resource.id);
  const video = page.locator("video");
  await expect(video).toBeVisible();
  await video.evaluate(async (element: HTMLVideoElement) => {
    element.muted = true;
    await element.play();
  });
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.ended))
    .toBe(true);
  await expect(
    page.getByRole("button", { name: "Completed", exact: true }),
  ).toBeVisible();
  await expect
    .poll(
      async () =>
        (await (await api(page, "get", "/api/activity")).json()).videos.find(
          (visit: { videoId: string }) => visit.videoId === resource.id,
        )?.percent,
    )
    .toBe(100);
  // A fresh page must retain completion when the learner revisits the clip.
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Completed", exact: true }),
  ).toBeVisible();
  const replaySaved = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/activity" &&
      response.request().method() === "POST",
  );
  await video.evaluate((element: HTMLVideoElement) => {
    element.pause();
    element.currentTime = 0.2;
    element.dispatchEvent(new Event("timeupdate"));
  });
  expect((await replaySaved).status()).toBe(200);
  const replayActivity = await (await api(page, "get", "/api/activity")).json();
  expect(
    replayActivity.videos.find(
      (visit: { videoId: string }) => visit.videoId === resource.id,
    ).percent,
  ).toBe(100);
  expect(
    (await (await api(page, "get", "/api/performance")).json()).progress
      .videosWatched,
  ).toBeGreaterThan(0);

  const resetSaved = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/activity" &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  expect((await resetSaved).status()).toBe(200);
  const resetActivity = await (await api(page, "get", "/api/activity")).json();
  expect(
    resetActivity.videos.find(
      (visit: { videoId: string }) => visit.videoId === resource.id,
    ).percent,
  ).toBe(0);
  await noOverflow(page);
  await api(page, "post", "/api/admin/content", {
    data: { kind: "video", id: resource.id, action: "archive" },
  });
});

test("student import handles duplicates, invalid streams and forced password changes", async ({
  page,
}, info) => {
  await admin(page);
  const suffix = `${info.project.name}-${Date.now()}`;
  const row = {
    student_name: "QA Demo Student",
    register_number: `QA-${suffix}`,
    school_name: "QA Test School",
    stream: "Computer Science",
    student_phone: info.project.name === "mobile" ? "9890000012" : "9890000011",
  };
  const response = await api(page, "post", "/api/admin/students/import", {
    data: {
      rows: [
        row,
        row,
        { ...row, register_number: "invalid-" + suffix, stream: "Unknown" },
      ],
    },
  });
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.importedCount).toBe(1);
  expect(data.skippedCount).toBe(2);
  const credentials = data.importedStudents[0];
  const login = await api(page, "post", "/api/auth/login", {
    data: {
      loginId: credentials.studentId,
      password: credentials.temporaryPassword,
    },
  });
  expect(login.status()).toBe(403);
  expect((await login.json()).code).toBe("PHONE_VERIFICATION_REQUIRED");
  await api(page, "post", "/api/auth/logout");
  await completeFirstOtp(page, row.student_phone);
  expect((await api(page, "get", "/api/performance")).status()).toBe(403);
  const changed = await api(page, "post", "/api/auth/change-password", {
    data: {
      currentPassword: credentials.temporaryPassword,
      newPassword: "QA-student-personal-password",
    },
  });
  expect(changed.status()).toBe(200);
  expect((await api(page, "get", "/api/performance")).status()).toBe(200);
});

test("AI answers include sources and unsupported questions are refused", async ({
  page,
}) => {
  await student(page);
  const response = await api(page, "post", "/api/ai/chat", {
    data: { message: "pure function specification", language: "English" },
  });
  expect(response.status()).toBe(200);
  const answer = await response.json();
  expect(answer.foundInKnowledgeBase).toBe(true);
  expect(answer.citations.length).toBeGreaterThan(0);
  const unknown = await api(page, "post", "/api/ai/chat", {
    data: { message: "quantum gravity xyz12345", language: "English" },
  });
  expect((await unknown.json()).foundInKnowledgeBase).toBe(false);
});

test("manifest icons exist and the offline shell does not cache account pages", async ({
  page,
}) => {
  const manifestResponse = await api(page, "get", "/manifest.json");
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe("SkillUp Learning Hub");
  for (const icon of manifest.icons)
    expect((await api(page, "get", icon.src)).status()).toBe(200);
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.context().setOffline(true);
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: /A little pause/ }),
  ).toBeVisible();
  await page.context().setOffline(false);
  const paths = await page.evaluate(async () =>
    (
      await Promise.all(
        (await caches.keys()).map(async (key) =>
          (await (await caches.open(key)).keys()).map(
            (request) => new URL(request.url).pathname,
          ),
        ),
      )
    ).flat(),
  );
  expect(paths).not.toContain("/dashboard");
  expect(paths.some((path) => path.startsWith("/api/"))).toBe(false);
});

test("admin creates a permanent student login and student changes their first password", async ({
  page,
}, info) => {
  await admin(page);
  await page.goto("/admin/backend");
  await expect(
    page.getByRole("heading", { name: "Supabase connected", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Create student login/ }).click();
  await page
    .getByLabel("Full Student Name *", { exact: true })
    .fill("New Backend Test Student");
  await page
    .getByLabel("Register Number *", { exact: true })
    .fill("UI-" + info.project.name + "-" + Date.now());
  await page
    .getByLabel("School / Institution *", { exact: true })
    .fill("Backend Test School");
  const phone = info.project.name === "mobile" ? "9890000022" : "9890000021";
  await page.getByLabel("Mobile Number *", { exact: true }).fill(phone);
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin/students/create") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Create Student Account", exact: true })
    .click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const credentials = await response.json();
  await expect(
    page.getByText("Student Account Successfully Created!", { exact: true }),
  ).toBeVisible();
  await api(page, "post", "/api/auth/logout");
  await page.goto("/login?studentId=" + credentials.student.studentId);
  await expect(page.getByLabel("Gmail / Email Address")).toHaveValue(
    credentials.student.studentId,
  );
  await page
    .getByLabel("Password", { exact: true })
    .fill(credentials.temporaryPassword);
  await page
    .getByRole("button", { name: "Sign In to SkillUp", exact: true })
    .click();
  await expect(page).toHaveURL(/login\/mobile/);
  await expect(page.getByLabel("Mobile number", { exact: true })).toHaveValue(
    phone,
  );
  await page.getByRole("button", { name: "Send OTP", exact: true }).click();
  await expect(page).toHaveURL(/login\/otp/);
  await page.getByLabel("6-digit OTP", { exact: true }).fill("000000");
  await page
    .getByRole("button", { name: "Verify OTP and log in", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Incorrect or expired" }),
  ).toBeVisible();
  await page
    .getByLabel("6-digit OTP", { exact: true })
    .fill(await readTestOtp(page, phone));
  await page
    .getByRole("button", { name: "Verify OTP and log in", exact: true })
    .click();
  await expect(page).toHaveURL(/change-password/);
  await expect(
    page.getByLabel("Current Temporary Password", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("New Password", { exact: true })
    .fill("QA-new-student-password");
  await page
    .getByLabel("Confirm New Password", { exact: true })
    .fill("QA-new-student-password");
  await page
    .getByRole("button", {
      name: /Set New Password.*Continue/i,
    })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  expect((await api(page, "get", "/api/performance")).status()).toBe(200);
  await api(page, "post", "/api/auth/logout");
  const login = await api(page, "post", "/api/auth/login", {
    data: {
      loginId: credentials.student.studentId,
      password: "QA-new-student-password",
    },
  });
  expect(login.status()).toBe(200);
  expect((await login.json()).user.mustChangePassword).toBe(false);
});
