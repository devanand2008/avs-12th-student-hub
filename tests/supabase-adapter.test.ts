import assert from "node:assert/strict";
import test from "node:test";
import { startPostgrestFixture } from "./helpers/postgrest";
import * as db from "../src/lib/db";
import {
  revokeSession,
  isSessionRevoked,
} from "../src/lib/auth/security-store";
import { checkRateLimit } from "../src/lib/rate-limit";
import { saveResource, uploadLearningFile } from "../src/lib/content";
import bcrypt from "bcryptjs";
import { requireSupabase } from "../src/lib/supabase/server";
import {
  OtpError,
  sendFirstLoginOtp,
  verifyFirstLoginOtp,
} from "../src/lib/auth/otp";
import { encodeOtpChallenge } from "../src/lib/auth/otp-challenge";
import { isPhoneVerified } from "../src/lib/auth/phone";
import { setInitialStudentPassword } from "../src/lib/auth";

test("Supabase SDK connects the full repository to PostgreSQL over HTTP", async () => {
  const fixture = await startPostgrestFixture(0, false, {
    requirePhoneNameMetadata: true,
  });
  const keys = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "DB_DRIVER",
    "ENABLE_DEMO_DATA",
    "ADMIN_EMAIL",
    "ADMIN_INITIAL_PASSWORD",
    "STUDENT_ACTIVATION_MODE",
  ];
  const original = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  try {
    delete process.env.DB_DRIVER;
    delete process.env.SUPABASE_SECRET_KEY;
    Object.assign(process.env, {
      SUPABASE_URL: fixture.url,
      NEXT_PUBLIC_SUPABASE_URL: fixture.url,
      SUPABASE_SERVICE_ROLE_KEY: "qa-service-key",
      ENABLE_DEMO_DATA: "false",
      ADMIN_EMAIL: "adapter-admin@example.test",
      ADMIN_INITIAL_PASSWORD: "Adapter-admin-password",
      STUDENT_ACTIVATION_MODE: "sms",
    });
    await db.initDatabase();
    const bucket =
      await requireSupabase().storage.getBucket("learning-materials");
    assert.equal(bucket.error, null);
    assert.ok(bucket.data?.allowed_mime_types?.includes("video/mp4"));
    for (const [mime, folder, extension, bytes] of [
      [
        "image/png",
        "notes",
        "png",
        new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      ],
      [
        "video/mp4",
        "videos",
        "mp4",
        new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112, 109, 112, 52, 50]),
      ],
    ] as const) {
      const url = await uploadLearningFile(
        new File([bytes], `upload.${extension}`, { type: mime }),
      );
      assert.ok(
        url.includes(`/storage/v1/object/public/learning-materials/${folder}/`),
      );
      assert.ok(url.endsWith("." + extension));
      const saved = await fetch(url);
      assert.equal(saved.status, 200);
      assert.equal(saved.headers.get("content-type"), mime);
      assert.deepEqual(new Uint8Array(await saved.arrayBuffer()), bytes);
    }
    const admin = await db.getUserByLoginId(process.env.ADMIN_EMAIL!);
    assert.equal(admin?.user.role, "admin");
    const registered = await db.registerStudent({
      studentName: "Self Registered Student",
      schoolName: "Registration Test School",
      phone: "+91 9876543210",
      email: "Self-Registered@Example.test",
      studentId: "SELF-REG-001",
      standard: "12th Standard",
      medium: "Tamil",
      stream: "Biology",
      password: "Personal-student-password",
    });
    assert.equal(registered.student.studentId, "SELF-REG-001");
    assert.equal(registered.student.standard, "12th Standard");
    assert.equal(registered.student.medium, "Tamil");
    assert.equal(registered.student.mustChangePassword, false);
    assert.equal(registered.user.mustChangePassword, false);
    assert.ok(
      await bcrypt.compare(
        "Personal-student-password",
        registered.user.passwordHash,
      ),
    );
    for (const loginId of [
      "self-reg-001",
      "self-registered@example.test",
      "9876543210",
      "+91 (98765) 43210",
    ])
      assert.equal(
        (await db.getUserByLoginId(loginId))?.user.id,
        registered.user.id,
      );
    await assert.rejects(
      db.registerStudent({
        studentName: "Duplicate Student",
        schoolName: "Registration Test School",
        phone: "9876543210",
        stream: "Biology",
        password: "Another-personal-password",
      }),
      /already exists/,
    );
    await assert.rejects(
      db.getAllUserData(registered.user.id),
      /Admin authorization/,
    );
    for (const [providerCode, providerStatus, expectedStatus, appCode] of [
      ["phone_provider_disabled", 422, 503, "PHONE_OTP_UNAVAILABLE"],
      ["otp_disabled", 422, 503, "PHONE_OTP_UNAVAILABLE"],
      ["sms_send_failed", 500, 503, "SMS_DELIVERY_FAILED"],
      ["over_sms_send_rate_limit", 429, 429, undefined],
    ] as const) {
      fixture.setOtpFailure({ code: providerCode, status: providerStatus });
      await assert.rejects(
        sendFirstLoginOtp("9876543210"),
        (error: unknown) => {
          assert.ok(error instanceof OtpError);
          assert.equal(error.status, expectedStatus);
          assert.equal(error.code, appCode);
          assert.equal(error.message.includes("Fixture"), false);
          return true;
        },
      );
      assert.equal(
        isPhoneVerified((await db.getStudentByUserId(registered.user.id))!),
        false,
      );
      assert.equal(
        (await db.getUserById(registered.user.id))!.passwordHash,
        registered.user.passwordHash,
      );
    }
    fixture.setOtpFailure();
    const firstOtp = encodeOtpChallenge(await sendFirstLoginOtp("9876543210"));
    const smsResponse = await fetch(
      fixture.url + "/_qa/otp?phone=%2B919876543210",
      { headers: { apikey: "qa-service-key" } },
    );
    const sms = await smsResponse.json();
    await assert.rejects(
      verifyFirstLoginOtp(firstOtp.challenge, "000000"),
      /Incorrect or expired/,
    );
    assert.equal(
      isPhoneVerified((await db.getStudentByUserId(registered.user.id))!),
      false,
    );
    const verifiedPhone = await verifyFirstLoginOtp(
      firstOtp.challenge,
      sms.code,
    );
    assert.equal(isPhoneVerified(verifiedPhone.student), true);
    assert.equal(verifiedPhone.student.mustChangePassword, true);
    assert.equal(
      await bcrypt.compare(
        "Personal-student-password",
        verifiedPhone.user.passwordHash,
      ),
      false,
    );
    await assert.rejects(
      verifyFirstLoginOtp(firstOtp.challenge, sms.code),
      /account changed/i,
    );
    const retry = encodeOtpChallenge(await sendFirstLoginOtp("9876543210"));
    const retriedSms = await (
      await fetch(fixture.url + "/_qa/otp?phone=%2B919876543210", {
        headers: { apikey: "qa-service-key" },
      })
    ).json();
    await verifyFirstLoginOtp(retry.challenge, retriedSms.code);
    assert.equal(
      (
        await setInitialStudentPassword(
          registered.user.id,
          "New-verified-personal-password",
        )
      ).success,
      true,
    );
    assert.equal(
      (
        await setInitialStudentPassword(
          registered.user.id,
          "Repeated-personal-password",
        )
      ).success,
      false,
    );
    await assert.rejects(sendFirstLoginOtp("9876543210"), (error: unknown) => {
      assert.ok(error instanceof OtpError);
      assert.equal(error.status, 409);
      assert.equal(error.code, "PHONE_ALREADY_VERIFIED");
      assert.equal(error.redirectTo, "/login?studentId=9876543210");
      return true;
    });
    assert.ok(
      (await db.getStudentByUserId(registered.user.id))!.initialPasswordSetAt,
    );
    await db.resetStudentPassword(registered.student.id);
    await assert.rejects(sendFirstLoginOtp("9876543210"), /already verified/);
    const safeUsers = await db.getAllUserData(admin!.user.id);
    assert.ok(safeUsers.some((u) => u.role === "admin"));
    assert.equal(
      safeUsers.find((u) => u.id === registered.user.id)?.student?.medium,
      "Tamil",
    );
    assert.equal(JSON.stringify(safeUsers).includes("passwordHash"), false);
    assert.equal(
      JSON.stringify(safeUsers).includes(registered.user.passwordHash),
      false,
    );
    const created = await db.createStudentWithUser({
      studentName: "Adapter Test Student",
      registerNumber: "ADAPTER-001",
      schoolName: "Adapter Test School",
      stream: "Computer Science",
      actorId: admin!.user.id,
    });
    const login = await db.getUserByLoginId(created.student.studentId);
    assert.ok(login);
    assert.ok(
      await bcrypt.compare(created.temporaryPassword, login.user.passwordHash),
    );
    assert.equal(login.student?.mustChangePassword, true);
    assert.equal(
      await db.updateUserPassword(
        login.user.id,
        await bcrypt.hash("Adapter-personal-password", 10),
      ),
      true,
    );
    assert.equal(
      (await db.getUserByLoginId(created.student.studentId))!.student!
        .mustChangePassword,
      false,
    );
    assert.deepEqual(
      (await db.getSubjects("Computer Science"))
        .map((subject) => subject.id)
        .sort(),
      ["sub-cs", "sub-maths", "sub-tamil"],
    );
    assert.deepEqual(
      (await db.getSubjects("Biology")).map((subject) => subject.id).sort(),
      ["sub-botany", "sub-maths", "sub-tamil", "sub-zoology"],
    );
    assert.equal(bucket.data?.file_size_limit, 50 * 1024 * 1024);
    assert.equal((await db.getChaptersBySubject("sub-cs")).length, 16);
    const question = await db.createQuestion({
      chapterId: "cs-ch-1",
      subjectId: "sub-cs",
      stream: "Computer Science",
      questionText: "Test question",
      questionTextTamil: "",
      optionA: "Yes",
      optionB: "No",
      optionC: "Other",
      optionD: "Neither",
      correctAnswer: "A",
      explanation: "Test explanation",
      explanationTamil: "",
      difficulty: "Easy",
      sourceType: "Book-In",
      status: "Published",
    });
    const started = await db.startQuizSession({
      studentId: created.student.studentId,
      subjectId: "sub-cs",
      chapterId: "cs-ch-1",
      mode: "quick",
      limit: 1,
    });
    await db.saveQuizAnswer(started.session.id, question.id, "A");
    assert.deepEqual(
      (await db.getQuizQuestions(started.session.id)).map((q) => q.id),
      started.session.questionIds,
    );
    assert.equal(
      (await db.saveQuizAnswers(started.session.id, { [question.id]: "B" }))!
        .answers[question.id].isCorrect,
      false,
    );
    assert.equal(
      (await db.saveQuizAnswers(started.session.id, { [question.id]: "A" }))!
        .answers[question.id].isCorrect,
      true,
    );
    assert.equal((await db.submitQuizSession(started.session.id))!.score, 1);
    assert.equal(
      (await db.getStudentQuizHistory(created.student.studentId)).length,
      1,
    );
    await saveResource("note", {
      id: "adapter-note",
      chapterId: "cs-ch-1",
      title: "Adapter note",
      titleTamil: "",
      description: "",
      badge: "HANDWRITTEN",
      pageCount: 1,
      downloadAllowed: false,
      isPublished: true,
      viewsCount: 0,
      pages: [],
      updatedAt: new Date().toISOString(),
    });
    await db.recordNoteVisit(created.student.studentId, "adapter-note", 1);
    await db.toggleBookmark({
      studentId: created.student.studentId,
      contentId: "adapter-note",
      contentType: "note",
      title: "Adapter note",
      url: "/notes/adapter-note",
    });
    assert.equal(
      (await db.getStudentBookmarks(created.student.studentId)).length,
      1,
    );
    const progress = await db.getStudentProgress(created.student.studentId);
    assert.equal(progress.notesViewed, 1);
    assert.equal(progress.mcqsAttempted, 1);
    assert.equal(progress.averageScore, 100);
    const report = (await db.getAllUserData(admin!.user.id)).find(
      (u) => u.id === created.student.userId,
    );
    assert.deepEqual(
      { ...report!.learning, lastActiveAt: undefined },
      {
        quizAttempts: 1,
        mcqsAttempted: 1,
        averageScore: 100,
        notesViewed: 1,
        videosWatched: 0,
        bookmarksCount: 1,
        lastActiveAt: undefined,
      },
    );
    await revokeSession("adapter-session", Date.now() + 60000);
    assert.equal(await isSessionRevoked("adapter-session"), true);
    assert.equal(await isSessionRevoked("unknown-session"), false);
    assert.equal((await checkRateLimit("adapter-limit", 1, 60)).success, true);
    assert.equal((await checkRateLimit("adapter-limit", 1, 60)).success, false);
    await db.logAudit(admin!.user.id, "CHECK", "backend");
    assert.ok((await db.getAuditLogs()).some((log) => log.action === "CHECK"));
    const reset = await db.resetStudentPassword(created.student.id);
    assert.ok(reset);
    assert.equal(
      (await db.getUserByLoginId(created.student.studentId))!.student!
        .mustChangePassword,
      true,
    );
  } finally {
    for (const [key, value] of Object.entries(original))
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    await fixture.close();
  }
});
