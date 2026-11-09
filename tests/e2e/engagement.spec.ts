import { test, expect } from "@playwright/test";
import { fixtureSubjectId, fixtureChapterId } from "../helpers/textbook-bank";
test("signed-out students can watch the bilingual app guide without an account", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "New to Skill Up? Start here" }),
  ).toBeVisible();
  await page
    .getByText("Watch app instructions · செயலி வழிகாட்டி", { exact: true })
    .click();
  const v = page.getByLabel("Skill Up student instruction video");
  await v.evaluate(async (v: HTMLVideoElement) => {
    v.muted = true;
    await v.play();
  });
  await expect
    .poll(() => v.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0);
  await v.evaluate((v: HTMLVideoElement) => v.pause());
  expect((await page.request.get("/api/engagement")).status()).toBe(401);
  expect((await page.request.get("/api/cron/reminders")).status()).toBe(401);
  expect(
    (
      await page.request.post("/api/reminders/unsubscribe", {
        data: { token: "forged" },
      })
    ).status(),
  ).toBe(400);
});
test("completed practice, assessments and supplied quizzes earn server-checked idempotent rewards", async ({
  page,
}, info) => {
  const loginId =
    info.project.name === "desktop" ? "AVSBIO26-0001" : "AVSCS26-0001";
  expect(
    (
      await page.request.post("/api/auth/login", {
        data: { loginId, password: "Student@2026" },
      })
    ).status(),
  ).toBe(200);
  for (const [mode, expected] of [
    ["quick", 10],
    ["timed", 10],
  ] as const) {
    const r = await page.request.post("/api/practice/start", {
      data: {
        subjectId: fixtureSubjectId,
        chapterId: fixtureChapterId,
        mode,
        limit: 2,
      },
    });
    expect(r.status()).toBe(200);
    const q = await r.json();
    expect(q.questions).toHaveLength(2);
    const answers = Object.fromEntries(
      q.questions.map((v: { id: string }) => [v.id, "B"]),
    );
    const response = await page.request.post("/api/practice/submit", {
      data: { sessionId: q.session.id, answers },
    });
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.points).toEqual({ earned: expected, saved: true });
    expect(result.session.correctCount).toBe(2);
    const again = await (
      await page.request.post("/api/practice/submit", {
        data: { sessionId: q.session.id },
      })
    ).json();
    expect(again.points).toEqual({ earned: 0, saved: true });
  }
  const cs = await (await page.request.get("/api/supplied-practice")).json(),
    c = cs.collections.find((c: { available: number }) => c.available > 0);
  const bank = await (
    await page.request.get(
      "/api/supplied-practice?questions=1&collection=" +
        encodeURIComponent(c.id),
    )
  ).json();
  const payload = {
    collectionId: c.id,
    answers: { [bank.questions[0].id]: 0 },
    token: (
      await (
        await page.request.post("/api/engagement/supplied/start", {
          data: { collectionId: c.id, questionIds: [bank.questions[0].id] },
        })
      ).json()
    ).token,
  };
  const a = await (
    await page.request.post("/api/engagement/supplied", { data: payload })
  ).json();
  expect(a.points).toEqual({ earned: 10, saved: true });
  const b = await (
    await page.request.post("/api/engagement/supplied", { data: payload })
  ).json();
  expect(b.points.earned).toBe(0);
  expect(
    (
      await page.request.post("/api/engagement/supplied", {
        data: { collectionId: c.id, answers: { "nonexistent-question": 0 } },
      })
    ).status(),
  ).toBe(400);
});
test("student rewards persist, repeat views do not inflate points and preferences work", async ({
  page,
}, info) => {
  const loginId =
    info.project.name === "desktop" ? "AVSBIO26-0001" : "AVSCS26-0001";
  expect(
    (
      await page.request.post("/api/auth/login", {
        data: { loginId, password: "Student@2026" },
      })
    ).status(),
  ).toBe(200);
  const initial = await (await page.request.get("/api/engagement")).json();
  const baseline = initial.me.points;
  const videos = (await (await page.request.get("/api/videos")).json()).videos;
  const body = { kind: "video", id: videos[0].id, seconds: 1, percent: 1 };
  const result = await (
    await page.request.post("/api/activity", { data: body })
  ).json();
  expect(result.points).toBeUndefined();
  const duplicate = await (
    await page.request.post("/api/activity", { data: body })
  ).json();
  expect(duplicate.points).toBeUndefined();
  const skipped = await (
    await page.request.post("/api/activity", {
      data: {
        ...body,
        seconds: videos[0].durationSeconds,
        percent: 100,
        phase: "ended",
      },
    })
  ).json();
  expect(skipped.points?.earned ?? 0).toBe(0);
  expect(
    (
      await page.request.patch("/api/engagement", { data: { points: 999999 } })
    ).status(),
  ).toBe(400);
  expect((await page.request.get("/api/admin/reminders")).status()).toBe(403);
  await page.goto("/leaderboard");
  await expect(
    page.getByRole("heading", { name: "Learning scoreboard", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Scoreboard display name")
    .fill(`Learner ${info.project.name}`);
  await page
    .getByLabel("Email me a study reminder", { exact: false })
    .uncheck();
  await page
    .getByRole("button", { name: "Save preferences", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Preferences saved.");
  await expect(
    page.getByText(`Learner ${info.project.name} (you)`, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Keep learning" }),
  ).toHaveAttribute("href", "/practice");
  await expect(
    page.getByRole("region", { name: "Gift milestone" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Request my gift" }),
  ).toBeDisabled();
  expect((await page.request.post("/api/engagement/gifts")).status()).toBe(409);
  expect((await page.request.get("/api/admin/gifts")).status()).toBe(403);
  await page.screenshot({
    path: `.local/student-scoreboard-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByLabel("Show me on the scoreboard").uncheck();
  await page
    .getByRole("button", { name: "Save preferences", exact: true })
    .click();
  await expect(
    page.getByText(`Learner ${info.project.name} (you)`, { exact: true }),
  ).toHaveCount(0);
  const last = await (await page.request.get("/api/engagement")).json();
  expect(last.me.points).toBe(baseline);
  expect(last.me.reminders_enabled).toBe(false);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.goto("/dashboard");
  await expect(
    page.getByText(`${baseline} points →`, { exact: true }),
  ).toBeVisible();
});
