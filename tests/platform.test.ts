import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";
import assert from "node:assert/strict";
import test from "node:test";
import { decodeSession, encodeSession } from "../src/lib/auth/session";
import {
  deleteResource,
  listResources,
  saveResource,
} from "../src/lib/content";
import { csvCell, parseRosterCsv } from "../src/lib/csv";
import {
  createQuestion,
  createStudentWithUser,
  getAllStudents,
  getAllUserData,
  getAuditLogs,
  getChaptersBySubject,
  getStudentProgress,
  getUserByLoginId,
  initDatabase,
  resetStudentPassword,
  registerStudent,
  retrieveGroundedKnowledge,
  saveQuizAnswer,
  startQuizSession,
  submitQuizSession,
} from "../src/lib/db";
import { safeMediaUrl, youtubeEmbedUrl } from "../src/lib/media";
import { learningModels } from "../src/lib/models";
process.env.DB_DRIVER = "memory";
process.env.ADMIN_EMAIL = "unit-admin@example.test";
process.env.ADMIN_INITIAL_PASSWORD = "unit-only-bootstrap-password";
process.env.ENABLE_DEMO_DATA = "true";
process.env.SESSION_SECRET =
  "unit-test-only-signing-secret-at-least-32-characters";
test("platform security and learning behaviour", async (t) => {
  await t.test(
    "concurrent bootstrap creates one admin with a hashed password",
    async () => {
      await Promise.all([initDatabase(), initDatabase(), initDatabase()]);
      const match = await getUserByLoginId(process.env.ADMIN_EMAIL!);
      assert.ok(match);
      assert.equal(match.user.role, "admin");
      assert.equal(match.user.mustChangePassword, true);
      assert.ok(
        await bcrypt.compare(
          process.env.ADMIN_INITIAL_PASSWORD!,
          match.user.passwordHash,
        ),
      );
      assert.notEqual(
        match.user.passwordHash,
        process.env.ADMIN_INITIAL_PASSWORD,
      );
    },
  );
  await t.test(
    "signed sessions reject forged, altered, malformed and expired tokens",
    () => {
      const payload = {
        userId: "unit",
        role: "student" as const,
        email: "unit@example.test",
        expiresAt: Date.now() + 60000,
      };
      const token = encodeSession(payload);
      assert.equal(decodeSession(token)?.userId, "unit");
      assert.equal(
        decodeSession(
          Buffer.from(JSON.stringify({ ...payload, role: "admin" })).toString(
            "base64url",
          ),
        ),
        null,
      );
      const [data, signature] = token.split(".");
      assert.equal(
        decodeSession(data.replace(/.$/, "Z") + "." + signature),
        null,
      );
      assert.equal(
        decodeSession(encodeSession({ ...payload, expiresAt: Date.now() - 1 })),
        null,
      );
      assert.equal(
        decodeSession(encodeSession({ ...payload, expiresAt: NaN })),
        null,
      );
    },
  );
  await t.test(
    "phone login resolves the same student as Student ID login",
    async () => {
      const student = (await getAllStudents()).find(
        (record) => record.studentPhone,
      );
      assert.ok(student);
      const byId = await getUserByLoginId(student.studentId);
      const byPhone = await getUserByLoginId(
        student.studentPhone.replace(/\D/g, ""),
      );
      assert.equal(byPhone?.user.id, byId?.user.id);
      assert.equal(byPhone?.student?.id, student.id);
      assert.equal(await getUserByLoginId("999999999999999"), null);
    },
  );
  await t.test(
    "demo registration prevents concurrent duplicates and its admin directory excludes secrets",
    async () => {
      const input = {
        studentName: "Registration Student",
        schoolName: "Registration School",
        phone: "+91 9876000011",
        stream: "Biology" as const,
        medium: "Tamil" as const,
        studentId: "UNIT-SELF-001",
        email: "unit-self@example.test",
        password: "Personal-registration-password",
      };
      const results = await Promise.allSettled([
        registerStudent(input),
        registerStudent(input),
      ]);
      assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
      const result = results.find(
        (r) => r.status === "fulfilled",
      )! as PromiseFulfilledResult<Awaited<ReturnType<typeof registerStudent>>>;
      const registered = result.value;
      assert.equal(registered.student.mustChangePassword, false);
      assert.equal(registered.student.medium, "Tamil");
      assert.ok(
        await bcrypt.compare(input.password, registered.user.passwordHash),
      );
      for (const loginId of [input.studentId, input.email, input.phone])
        assert.equal(
          (await getUserByLoginId(loginId))?.user.id,
          registered.user.id,
        );
      const admin = (await getUserByLoginId(process.env.ADMIN_EMAIL!))!;
      const directory = await getAllUserData(admin.user.id);
      assert.ok(directory.find((u) => u.id === registered.user.id)?.student);
      assert.equal(JSON.stringify(directory).includes("passwordHash"), false);
      await assert.rejects(
        getAllUserData(registered.user.id),
        /Admin authorization/,
      );
    },
  );
  await t.test(
    "curriculum remains separate across all three subjects",
    async () => {
      for (const [id, count] of [
        ["sub-cs", 16],
        ["sub-botany", 10],
        ["sub-zoology", 12],
      ] as const)
        assert.equal((await getChaptersBySubject(id)).length, count);
    },
  );
  await t.test(
    "concurrent student creation assigns distinct sequential IDs",
    async () => {
      const create = (registerNumber: string) =>
        createStudentWithUser({
          studentName: "Demo Test Student",
          registerNumber,
          schoolName: "Test School",
          stream: "Computer Science",
        });
      const results = await Promise.all([
        create("UNIT-001"),
        create("UNIT-002"),
      ]);
      assert.equal(new Set(results.map((r) => r.student.studentId)).size, 2);
      assert.equal(results[0].student.mustChangePassword, true);
      assert.ok(results[0].temporaryPassword.length >= 16);
      const match = await getUserByLoginId(results[0].student.studentId);
      assert.ok(
        await bcrypt.compare(
          results[0].temporaryPassword,
          match!.user.passwordHash,
        ),
      );
    },
  );
  await t.test(
    "duplicate detection actually rejects a second insertion",
    async () => {
      const before = (await getAllStudents()).length;
      await assert.rejects(
        createStudentWithUser({
          studentName: "Duplicate Demo",
          registerNumber: "unit-001",
          schoolName: "Test School",
          stream: "Biology",
        }),
        /Duplicate/,
      );
      assert.equal((await getAllStudents()).length, before);
    },
  );
  await t.test(
    "password resets store hashes and require a password change",
    async () => {
      const student = (await getAllStudents()).find(
        (s) => s.registerNumber === "UNIT-001",
      )!;
      const password = await resetStudentPassword(student.id);
      const match = await getUserByLoginId(student.studentId);
      assert.ok(password);
      assert.ok(await bcrypt.compare(password, match!.user.passwordHash));
      assert.equal(match!.student!.mustChangePassword, true);
    },
  );
  await t.test(
    "an unused student has zero progress and no invented weaknesses",
    async () => {
      const p = await getStudentProgress("UNIT-UNUSED");
      assert.equal(p.overallProgress, 0);
      assert.equal(p.averageScore, 0);
      assert.equal(p.mcqsAttempted, 0);
      assert.equal(p.currentStreak, 0);
      assert.deepEqual(p.weakChapters, []);
    },
  );
  await t.test(
    "quiz scoring only accepts assigned questions and is idempotent",
    async () => {
      const { session, questions } = await startQuizSession({
        studentId: "AVSCS26-0001",
        subjectId: "sub-cs",
        chapterId: "cs-ch-1",
        mode: "chapter",
        limit: 2,
      });
      assert.equal(
        await saveQuizAnswer(session.id, "q-not-assigned", "A"),
        null,
      );
      await saveQuizAnswer(
        session.id,
        questions[0].id,
        questions[0].correctAnswer,
      );
      const result = await submitQuizSession(session.id);
      assert.equal(result!.score, 1);
      assert.equal(
        result!.correctCount + result!.wrongCount + result!.unansweredCount,
        result!.totalQuestions,
      );
      assert.ok(result!.timeTakenSeconds < 10);
      const completedAt = result!.completedAt;
      assert.equal(
        (await submitQuizSession(session.id))!.completedAt,
        completedAt,
      );
      assert.equal(
        await saveQuizAnswer(session.id, questions[0].id, "B"),
        null,
      );
    },
  );
  await t.test("server deadline rejects late timed-test answers", async () => {
    const { session, questions } = await startQuizSession({
      studentId: "AVSCS26-0001",
      subjectId: "sub-cs",
      mode: "timed",
      limit: 1,
    });
    session.expiresAt = new Date(Date.now() - 1000).toISOString();
    assert.equal(await saveQuizAnswer(session.id, questions[0].id, "A"), null);
    assert.equal((await submitQuizSession(session.id))!.score, 0);
  });
  await t.test("draft questions cannot appear in practice", async () => {
    const q = await createQuestion({
      chapterId: "cs-ch-1",
      questionText: "UNIT DRAFT",
      questionTextTamil: "",
      optionA: "a",
      optionB: "b",
      optionC: "c",
      optionD: "d",
      correctAnswer: "A",
      explanation: "",
      explanationTamil: "",
      difficulty: "Easy",
      sourceType: "Book-Out",
      status: "Draft",
      stream: "Computer Science",
      subjectId: "sub-cs",
    });
    const { questions } = await startQuizSession({
      studentId: "unit",
      subjectId: "sub-cs",
      mode: "quick",
      limit: 100,
    });
    assert.ok(!questions.some((item) => item.id === q.id));
  });
  await t.test("notes and videos start empty; drafts stay hidden", async () => {
    assert.deepEqual(await listResources("note"), []);
    assert.deepEqual(await listResources("video"), []);
    const note = {
      id: "unit-note",
      chapterId: "cs-ch-1",
      title: "Unit demo note",
      titleTamil: "",
      description: "",
      badge: "HANDWRITTEN" as const,
      pageCount: 1,
      downloadAllowed: false,
      isPublished: false,
      viewsCount: 0,
      pages: [],
      pdfUrl: "https://example.test/unit.pdf",
      updatedAt: new Date().toISOString(),
    };
    await saveResource("note", note);
    assert.equal((await listResources("note")).length, 0);
    assert.equal((await listResources("note", true)).length, 1);
    await saveResource("note", { ...note, isPublished: true });
    assert.equal((await listResources("note")).length, 1);
    await deleteResource("note", note.id);
  });
  await t.test("source retrieval refuses unsupported topics", async () => {
    assert.ok(
      (await retrieveGroundedKnowledge("pure function specification")).length >
        0,
    );
    assert.equal(
      (await retrieveGroundedKnowledge("quantum gravity xyz12345")).length,
      0,
    );
  });
  await t.test(
    "CSV supports quoted commas, escaped quotes and duplicate header rejection",
    () => {
      const rows = parseRosterCsv(
        'student_name,register_number,school_name,stream\n"Demo, Student",REG-1,"School ""A""",Biology',
      );
      assert.equal(rows[0].student_name, "Demo, Student");
      assert.equal(rows[0].school_name, 'School "A"');
      assert.throws(
        () => parseRosterCsv("student_name,student_name\na,b"),
        /unique/,
      );
      assert.throws(
        () =>
          parseRosterCsv(
            'student_name,register_number,school_name,stream\n"open,REG,School,Biology',
          ),
        /closed/,
      );
      assert.ok(csvCell("=1+1").startsWith("\"'=1+1"));
    },
  );
  await t.test(
    "media URLs reject javascript and convert actual YouTube URLs",
    () => {
      assert.equal(safeMediaUrl("javascript:alert(1)"), false);
      assert.equal(safeMediaUrl("http://example.test/video.mp4"), false);
      assert.equal(
        youtubeEmbedUrl("https://youtu.be/abcdefghijk"),
        "https://www.youtube-nocookie.com/embed/abcdefghijk",
      );
      assert.equal(
        youtubeEmbedUrl("https://youtube.com.evil.test/watch?v=abcdefghijk"),
        null,
      );
    },
  );
  await t.test("all models map to existing curriculum chapters", async () => {
    assert.equal(learningModels.length, 3);
    for (const model of learningModels) {
      const subject =
        model.subject === "Computer Science"
          ? "sub-cs"
          : model.subject === "Bio-Botany"
            ? "sub-botany"
            : "sub-zoology";
      assert.ok(
        (await getChaptersBySubject(subject)).some(
          (ch) => ch.id === model.chapterId,
        ),
      );
      assert.ok(model.parts.length >= 3);
    }
  });
  await t.test(
    "production requires signing secrets and durable content configuration",
    async () => {
      const keys = [
        "NODE_ENV",
        "DB_DRIVER",
        "ENABLE_DEMO_DATA",
        "SESSION_SECRET",
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
      ];
      const previous = Object.fromEntries(
        keys.map((key) => [key, process.env[key]]),
      );
      try {
        Object.assign(process.env, {
          NODE_ENV: "production",
          ENABLE_DEMO_DATA: "false",
        });
        delete process.env.DB_DRIVER;
        delete process.env.SESSION_SECRET;
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        delete process.env.SUPABASE_URL;
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;
        assert.throws(
          () =>
            encodeSession({
              userId: "unit",
              role: "admin",
              email: "unit@example.test",
              expiresAt: Date.now() + 1000,
            }),
          /SESSION_SECRET/,
        );
        await assert.rejects(
          saveResource("note", {
            id: "production-should-not-save",
            chapterId: "cs-ch-1",
            title: "Test note",
            titleTamil: "",
            description: "",
            badge: "HANDWRITTEN",
            pageCount: 1,
            downloadAllowed: false,
            isPublished: false,
            viewsCount: 0,
            pages: [],
            updatedAt: new Date().toISOString(),
          }),
          /Connect Supabase/,
        );
      } finally {
        for (const [key, value] of Object.entries(previous)) {
          if (value === undefined) delete process.env[key];
          else process.env[key] = value;
        }
      }
    },
  );
  await t.test(
    "spreadsheet parser preserves quoted names and register numbers",
    async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Students");
      sheet.addRow([
        "student_name",
        "register_number",
        "school_name",
        "stream",
      ]);
      sheet.addRow(['QA, "Student"', "00123", "QA School", "Computer Science"]);
      const bytes = await workbook.xlsx.writeBuffer();
      const restored = new ExcelJS.Workbook();
      await restored.xlsx.load(bytes);
      assert.equal(restored.worksheets[0].getCell("A2").value, 'QA, "Student"');
      assert.equal(restored.worksheets[0].getCell("B2").value, "00123");
    },
  );
  await t.test("administrative mutations are audited", async () => {
    assert.ok(
      (await getAuditLogs()).some(
        (log) => log.action === "RESET_STUDENT_PASSWORD",
      ),
    );
  });
});
