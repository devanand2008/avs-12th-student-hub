import { PGlite } from "@electric-sql/pglite";
import bcrypt from "bcryptjs";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { Student, User, QuizSession } from "../src/types";
import { backendMode, getSupabase } from "../src/lib/supabase/server";

test("Supabase backend configuration never silently falls back", () => {
  const keys = [
    "DB_DRIVER",
    "ENABLE_DEMO_DATA",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
  ];
  const original = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  try {
    keys.forEach((key) => delete process.env[key]);
    assert.equal(backendMode(), "unconfigured");
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    assert.throws(() => backendMode(), /incomplete/);
    process.env.SUPABASE_SECRET_KEY = "test-server-key";
    assert.equal(backendMode(), "supabase");
    assert.ok(getSupabase());
    process.env.DB_DRIVER = "memory";
    assert.throws(() => backendMode(), /explicit demo/);
    process.env.ENABLE_DEMO_DATA = "true";
    assert.equal(backendMode(), "demo");
  } finally {
    for (const [key, value] of Object.entries(original))
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  }
});

test("PostgreSQL migration, account lifecycle and durable learning records", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "avs-postgres-"));
  let db = new PGlite(directory);
  async function rpc<T>(name: string, args: unknown[]): Promise<T> {
    return (
      await db.query<{ result: T }>(
        `select public.${name}(${args.map((_, i) => "$" + (i + 1)).join(",")}) as result`,
        args.map((value) =>
          value && typeof value === "object" ? JSON.stringify(value) : value,
        ),
      )
    ).rows[0].result;
  }
  const admin: User = {
    id: "admin-test",
    role: "admin",
    email: "qa-admin@example.test",
    passwordHash: await bcrypt.hash("QA-admin-password", 10),
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  let student: Student;
  try {
    await t.test(
      "migration applies twice and private tables/RPCs reject browser roles",
      async () => {
        await db.exec(
          "create role anon;create role authenticated;create role service_role bypassrls;create table public.learning_resources(id text primary key,kind text,resource jsonb);",
        );
        const migration = await readFile(
          "supabase/migrations/20261006_student_backend.sql",
          "utf8",
        );
        await db.exec(migration);
        await db.exec(migration);
        const accountsMigration = await readFile(
          "supabase/migrations/20261007_account_directory.sql",
          "utf8",
        );
        await db.exec(accountsMigration);
        await db.exec(accountsMigration);
        const otpMigration = await readFile(
          "supabase/migrations/20261007_first_login_otp.sql",
          "utf8",
        );
        await db.exec(otpMigration);
        await db.exec(otpMigration);
        const permissions = await db.query<{
          table_access: boolean;
          rpc_access: boolean;
          otp_access: boolean;
        }>(
          "select has_table_privilege('anon','public.avs_users','select') as table_access,has_function_privilege('authenticated','public.avs_create_student(jsonb,text,text)','execute') as rpc_access,has_function_privilege('authenticated','public.avs_verify_student_phone(text,text,text,text)','execute') as otp_access",
        );
        assert.equal(permissions.rows[0].table_access, false);
        assert.equal(permissions.rows[0].rpc_access, false);
        assert.equal(permissions.rows[0].otp_access, false);
        const rls = await db.query<{ enabled: boolean }>(
          "select bool_and(relrowsecurity) as enabled from pg_class where relname like 'avs_%' and relkind='r'",
        );
        assert.equal(rls.rows[0].enabled, true);
      },
    );
    await t.test("admin bootstrap preserves an existing password", async () => {
      await rpc("avs_bootstrap_admin", [admin]);
      const repeat = await rpc<User>("avs_bootstrap_admin", [
        {
          ...admin,
          id: "new-id",
          passwordHash: "must-not-replace-existing-password",
        },
      ]);
      assert.equal(repeat.id, admin.id);
      assert.equal(repeat.passwordHash, admin.passwordHash);
    });
    await t.test(
      "self-registration is atomic, student-only and supports searchable profile columns",
      async () => {
        const hash = await bcrypt.hash("Registered-personal-password", 10);
        const profile = {
          studentName: "Registered Test Student",
          schoolName: "Registration School",
          stream: "Biology",
          studentId: "SELF-TEST-001",
          studentPhone: "+91 9988776655",
          studentEmail: "Registered@Example.test",
          standard: "12th Standard",
          medium: "Tamil",
          role: "admin",
          passwordHash: "injected-secret",
          activeStatus: false,
        };
        const registered = await rpc<{ student: Student; user: User }>(
          "avs_register_student",
          [profile, hash],
        );
        assert.equal(registered.user.role, "student");
        assert.equal(registered.user.passwordHash, hash);
        assert.equal(registered.student.mustChangePassword, false);
        assert.equal(registered.student.activeStatus, true);
        assert.equal(registered.student.studentPhone, "9988776655");
        assert.equal(
          registered.student.studentEmail,
          "registered@example.test",
        );
        const columns = (
          await db.query<{
            student_name: string;
            medium: string;
            standard: string;
          }>(
            "select student_name,medium,standard from public.avs_students where student_phone='9988776655'",
          )
        ).rows[0];
        assert.equal(columns.student_name, profile.studentName);
        assert.equal(columns.medium, "Tamil");
        assert.equal(columns.standard, "12th Standard");
        const before = (
          await db.query<{ count: number }>(
            "select count(*)::integer as count from public.avs_users",
          )
        ).rows[0].count;
        await assert.rejects(
          rpc("avs_register_student", [
            {
              ...profile,
              studentId: "OTHER-ID",
              studentEmail: "other@example.test",
            },
            hash,
          ]),
          /unique|duplicate/i,
        );
        assert.equal(
          (
            await db.query<{ count: number }>(
              "select count(*)::integer as count from public.avs_users",
            )
          ).rows[0].count,
          before,
        );
        await assert.rejects(
          rpc("avs_register_student", [{ ...profile, stream: null }, hash]),
          /Invalid stream/,
        );
        await assert.rejects(
          rpc("avs_register_student", [
            { ...profile, standard: "11th Standard" },
            hash,
          ]),
          /12th Standard/,
        );
        await assert.rejects(
          rpc("avs_admin_user_directory", [registered.user.id]),
          /Admin authorization/,
        );
        // Even an unexpected legacy field cannot enter the directory output.
        await db.query(
          'update public.avs_students set data=data||\'{"passwordHash":"legacy-secret"}\'::jsonb where id=$1',
          [registered.student.id],
        );
        const directory = await rpc<Array<{ id: string; student?: Student }>>(
          "avs_admin_user_directory",
          [admin.id],
        );
        assert.ok(directory.some((u) => u.id === registered.user.id));
        assert.equal(JSON.stringify(directory).includes("passwordHash"), false);
        assert.equal(
          JSON.stringify(directory).includes("legacy-secret"),
          false,
        );
        const grants = (
          await db.query<{ register_access: boolean; report_access: boolean }>(
            "select has_function_privilege('anon','public.avs_register_student(jsonb,text)','execute') as register_access,has_function_privilege('authenticated','public.avs_admin_user_directory(text)','execute') as report_access",
          )
        ).rows[0];
        assert.equal(grants.register_access, false);
        assert.equal(grants.report_access, false);
        await assert.rejects(
          db.query(
            "update public.avs_students set data=jsonb_set(data,'{userId}',to_jsonb($1::text)) where id=$2",
            [admin.id, registered.student.id],
          ),
          /foreign key/i,
        );
      },
    );
    await t.test(
      "new Student IDs are unique and duplicate registers roll back both rows",
      async () => {
        const hash = await bcrypt.hash("QA-student-password", 10);
        const profile = {
          studentName: "Backend Test Student",
          registerNumber: "TEST-001",
          schoolName: "Backend Test School",
          stream: "Computer Science",
          medium: "English",
          academicYear: "2026-2027",
        };
        student = await rpc<Student>("avs_create_student", [
          profile,
          hash,
          admin.id,
        ]);
        assert.equal(student.studentId, "AVSCS26-0001");
        assert.equal(student.mustChangePassword, true);
        const usersBefore = (
          await db.query<{ count: number }>(
            "select count(*)::integer as count from public.avs_users",
          )
        ).rows[0].count;
        await assert.rejects(
          rpc("avs_create_student", [
            { ...profile, registerNumber: "test-001" },
            hash,
            admin.id,
          ]),
          /unique|duplicate/i,
        );
        assert.equal(
          (
            await db.query<{ count: number }>(
              "select count(*)::integer as count from public.avs_users",
            )
          ).rows[0].count,
          usersBefore,
        );
        const newStudents = await Promise.all(
          [2, 3, 4].map((i) =>
            rpc<Student>("avs_create_student", [
              { ...profile, registerNumber: "TEST-00" + i },
              hash,
              admin.id,
            ]),
          ),
        );
        assert.equal(new Set(newStudents.map((s) => s.studentId)).size, 3);
        assert.equal(newStudents[0].studentId, "AVSCS26-0002");
        await assert.rejects(
          rpc("avs_create_student", [
            { ...profile, registerNumber: "DENIED" },
            hash,
            student.userId,
          ]),
          /Admin authorization/,
        );
      },
    );
    await t.test(
      "password changes and resets persist and reject a stale hash",
      async () => {
        const before = (
          await db.query<{ data: User }>(
            "select data from public.avs_users where id=$1",
            [student.userId],
          )
        ).rows[0].data;
        const newHash = await bcrypt.hash("QA-personal-password", 10);
        assert.equal(
          await rpc("avs_change_password", [
            student.userId,
            before.passwordHash,
            newHash,
            false,
          ]),
          true,
        );
        assert.equal(
          await rpc("avs_change_password", [
            student.userId,
            before.passwordHash,
            admin.passwordHash,
            false,
          ]),
          false,
        );
        let changed = (
          await db.query<{ data: Student }>(
            "select data from public.avs_students where id=$1",
            [student.id],
          )
        ).rows[0].data;
        assert.equal(changed.mustChangePassword, false);
        assert.equal(
          await rpc("avs_change_password", [
            student.userId,
            newHash,
            before.passwordHash,
            true,
          ]),
          true,
        );
        changed = (
          await db.query<{ data: Student }>(
            "select data from public.avs_students where id=$1",
            [student.id],
          )
        ).rows[0].data;
        assert.equal(changed.mustChangePassword, true);
        assert.equal(
          (await rpc<Student>("avs_toggle_student", [student.id])).activeStatus,
          false,
        );
        assert.equal(
          (await rpc<Student>("avs_toggle_student", [student.id])).activeStatus,
          true,
        );
      },
    );
    let session: QuizSession;
    await t.test(
      "answers use immutable question snapshots, ownership and atomic updates",
      async () => {
        for (const id of ["q-1", "q-2"])
          await db.query(
            "insert into public.avs_questions(id,data) values($1,$2)",
            [
              id,
              JSON.stringify({
                id,
                chapterId: "cs-ch-1",
                subjectId: "sub-cs",
                status: "Published",
                correctAnswer: "A",
              }),
            ],
          );
        session = await rpc<QuizSession>("avs_start_quiz", [
          {
            id: "session-1",
            studentId: student.studentId,
            subjectId: "sub-cs",
            chapterId: "cs-ch-1",
            mode: "timed",
            questionIds: ["q-1", "q-2"],
            answers: { "q-1": { isCorrect: true } },
          },
        ]);
        assert.deepEqual(session.answers, {});
        assert.equal(
          await rpc("avs_save_answer", [
            session.id,
            "other-student",
            "q-1",
            "A",
            0,
            false,
          ]),
          null,
        );
        assert.equal(
          await rpc("avs_save_answer", [
            session.id,
            student.studentId,
            "not-assigned",
            "A",
            0,
            false,
          ]),
          null,
        );
        await db.exec(
          "update public.avs_questions set data=jsonb_set(data,'{correctAnswer}','\"B\"')",
        );
        await Promise.all(
          ["q-1", "q-2"].map((id) =>
            rpc("avs_save_answer", [
              session.id,
              student.studentId,
              id,
              "A",
              1,
              false,
            ]),
          ),
        );
        const saved = (
          await db.query<{ data: QuizSession }>(
            "select data from public.avs_quiz_sessions where id=$1",
            [session.id],
          )
        ).rows[0].data;
        assert.equal(Object.keys(saved.answers).length, 2);
        assert.equal(saved.answers["q-1"].isCorrect, true);
        assert.equal(
          await rpc("avs_save_answers", [
            session.id,
            "other-student",
            { "q-1": "B" },
          ]),
          null,
        );
        assert.equal(
          await rpc("avs_save_answers", [
            session.id,
            student.studentId,
            { "q-1": "B", unassigned: "A" },
          ]),
          null,
        );
        const unchanged = (
          await db.query<{ data: QuizSession }>(
            "select data from public.avs_quiz_sessions where id=$1",
            [session.id],
          )
        ).rows[0].data;
        assert.equal(unchanged.answers["q-1"].selectedAnswer, "A");
        const batch = await rpc<QuizSession>("avs_save_answers", [
          session.id,
          student.studentId,
          { "q-1": "B", "q-2": null },
        ]);
        assert.equal(batch.answers["q-1"].isCorrect, false);
        assert.equal(batch.answers["q-2"].selectedAnswer, null);
        const restored = await rpc<QuizSession>("avs_save_answers", [
          session.id,
          student.studentId,
          { "q-1": "A", "q-2": "A" },
        ]);
        assert.equal(restored.answers["q-1"].isCorrect, true);
      },
    );
    await t.test(
      "submission is idempotent, scores server answers and rejects late edits",
      async () => {
        const finished = await rpc<QuizSession>("avs_submit_quiz", [
          session.id,
          student.studentId,
        ]);
        assert.equal(finished.score, 2);
        assert.equal(finished.unansweredCount, 0);
        const again = await rpc<QuizSession>("avs_submit_quiz", [
          session.id,
          student.studentId,
        ]);
        assert.equal(again.completedAt, finished.completedAt);
        assert.equal(
          await rpc("avs_save_answer", [
            session.id,
            student.studentId,
            "q-1",
            "B",
            0,
            false,
          ]),
          null,
        );
        assert.equal(
          (
            await db.query<{ data: { mcqsAttempted: number } }>(
              "select data from public.avs_progress where student_id=$1",
              [student.studentId],
            )
          ).rows[0].data.mcqsAttempted,
          2,
        );
        const late = await rpc<QuizSession>("avs_start_quiz", [
          {
            id: "session-late",
            studentId: student.studentId,
            subjectId: "sub-cs",
            mode: "timed",
            questionIds: ["q-1"],
          },
        ]);
        await db.query(
          "update public.avs_quiz_sessions set data=jsonb_set(data,'{expiresAt}',to_jsonb(clock_timestamp()-interval '1 second')) where id=$1",
          [late.id],
        );
        assert.equal(
          await rpc("avs_save_answer", [
            late.id,
            student.studentId,
            "q-1",
            "B",
            0,
            false,
          ]),
          null,
        );
      },
    );
    await t.test(
      "bookmarks, learning activity and rate limits survive new connections",
      async () => {
        await db.exec(
          "insert into public.learning_resources values('note-test','note','{}')",
        );
        await db.query(
          "insert into public.avs_activity(student_id,kind,resource_id,data) values($1,'note','note-test',$2)",
          [student.userId, JSON.stringify({ noteId: "note-test", page: 2 })],
        );
        const bookmark = {
          id: "bookmark-test",
          studentId: student.studentId,
          contentType: "note",
          contentId: "note-test",
          title: "Test note",
          url: "/notes/note-test",
          createdAt: new Date().toISOString(),
        };
        assert.equal(
          await rpc("avs_toggle_bookmark", [student.userId, bookmark]),
          true,
        );
        assert.equal(
          (
            await rpc<{ success: boolean }>("avs_check_rate_limit", [
              "rate-test",
              1,
              60,
            ])
          ).success,
          true,
        );
        assert.equal(
          (
            await rpc<{ success: boolean }>("avs_check_rate_limit", [
              "rate-test",
              1,
              60,
            ])
          ).success,
          false,
        );
        await db.exec(
          "insert into public.avs_revoked_sessions values('revoked-test',clock_timestamp()+interval '1 day')",
        );
        await db.close();
        db = new PGlite(directory);
        assert.equal(
          (
            await db.query<{ data: Student }>(
              "select data from public.avs_students where id=$1",
              [student.id],
            )
          ).rows[0].data.studentId,
          student.studentId,
        );
        assert.equal(
          (await db.query("select * from public.avs_bookmarks")).rows.length,
          1,
        );
        assert.equal(
          (await db.query("select * from public.avs_activity")).rows.length,
          1,
        );
        assert.equal(
          (await db.query("select * from public.avs_revoked_sessions")).rows
            .length,
          1,
        );
        assert.equal(
          (
            await rpc<{ success: boolean }>("avs_check_rate_limit", [
              "rate-test",
              1,
              60,
            ])
          ).success,
          false,
        );
        assert.equal(
          await rpc("avs_toggle_bookmark", [student.userId, bookmark]),
          false,
        );
        assert.equal(
          (
            await db.query<{ data: QuizSession }>(
              "select data from public.avs_quiz_sessions where id='session-1'",
            )
          ).rows[0].data.score,
          2,
        );
      },
    );
  } finally {
    await db.close();
    await rm(directory, { recursive: true, force: true });
  }
});
