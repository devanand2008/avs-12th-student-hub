import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcryptjs";
import { startPostgrestFixture } from "./helpers/postgrest";
import * as db from "../src/lib/db";
import { requireSupabase } from "../src/lib/supabase/server";
import { isPhoneVerified } from "../src/lib/auth/phone";
import {
  isStudentActivated,
  requiresStudentActivation,
} from "../src/lib/auth/activation";
import { sendFirstLoginOtp } from "../src/lib/auth/otp";

test("only an administrator can approve students, atomically replace credentials and permit password login", async (t) => {
  const fixture = await startPostgrestFixture();
  const config = {
    SUPABASE_URL: fixture.url,
    NEXT_PUBLIC_SUPABASE_URL: fixture.url,
    SUPABASE_SECRET_KEY: "",
    SUPABASE_SERVICE_ROLE_KEY: "qa-service-key",
    DB_DRIVER: "",
    ENABLE_DEMO_DATA: "false",
    ADMIN_EMAIL: "approval-admin@example.test",
    ADMIN_INITIAL_PASSWORD: "Approval-admin-password",
    STUDENT_ACTIVATION_MODE: "admin",
  };
  const previous = Object.fromEntries(
    Object.keys(config).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, config);
  t.after(async () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await fixture.close();
  });
  await db.initDatabase();
  const admin = (await db.getUserByLoginId(config.ADMIN_EMAIL))!;
  const pending = await db.registerStudent({
    studentName: "Approval Test Student",
    phone: "9880010001",
    schoolName: "Approval Test School",
    stream: "Biology",
    password: "Pending-registration-password",
  });
  assert.equal(requiresStudentActivation(pending.student), true);
  assert.equal(isStudentActivated(pending.student), false);
  await assert.rejects(
    db.approveStudent(pending.student.id, pending.user.id),
    /Admin authorization required/,
  );
  const denied = await requireSupabase().rpc("avs_approve_student", {
    p_id: pending.student.id,
    p_actor_id: pending.user.id,
    p_password_hash: pending.user.passwordHash,
  });
  assert.match(denied.error?.message || "", /Admin authorization required/);
  const permissions = await fixture.db.query<{
    anon: boolean;
    authenticated: boolean;
  }>(
    "select has_function_privilege('anon','public.avs_approve_student(text,text,text)','EXECUTE') as anon, has_function_privilege('authenticated','public.avs_approve_student(text,text,text)','EXECUTE') as authenticated",
  );
  assert.deepEqual(permissions.rows[0], { anon: false, authenticated: false });
  const forged = await requireSupabase().rpc("avs_register_student", {
    p_profile: {
      studentName: "Forged Approval Student",
      schoolName: "Approval Test School",
      stream: "Biology",
      studentPhone: "9880010002",
      adminApprovedAt: new Date().toISOString(),
      adminApprovedBy: admin.user.id,
      approveOnCreate: true,
      role: "admin",
    },
    p_password_hash: pending.user.passwordHash,
  });
  assert.equal(forged.error, null);
  assert.equal(forged.data.user.role, "student");
  assert.equal(forged.data.student.adminApprovedAt, undefined);
  assert.equal(isStudentActivated(forged.data.student), false);
  const approvals = await Promise.all([
    db.approveStudent(pending.student.id, admin.user.id),
    db.approveStudent(pending.student.id, admin.user.id),
  ]);
  assert.equal(approvals.filter(Boolean).length, 1);
  const approved = approvals.find(Boolean)!;
  assert.equal(approved.student.adminApprovedBy, admin.user.id);
  assert.equal(isPhoneVerified(approved.student), false);
  assert.equal(isStudentActivated(approved.student), true);
  assert.equal(requiresStudentActivation(approved.student), false);
  const user = (await db.getUserById(pending.user.id))!;
  assert.equal(user.mustChangePassword, true);
  assert.equal(
    await bcrypt.compare("Pending-registration-password", user.passwordHash),
    false,
  );
  assert.equal(
    await bcrypt.compare(approved.temporaryPassword, user.passwordHash),
    true,
  );
  await assert.rejects(
    sendFirstLoginOtp(pending.student.studentPhone),
    /administrator approval/,
  );
  const directory = await db.getAllUserData(admin.user.id);
  const row = directory.find((item) => item.id === pending.user.id)!;
  assert.equal(row.student?.adminApprovedBy, admin.user.id);
  assert.equal(JSON.stringify(directory).includes("passwordHash"), false);
  assert.equal(
    JSON.stringify(directory).includes(approved.temporaryPassword),
    false,
  );
  assert.equal(
    await db.updateUserPassword(
      user.id,
      await bcrypt.hash("Personal-approved-password", 10),
      user.passwordHash,
    ),
    true,
  );
  const completed = (await db.getStudentById(pending.student.id))!;
  assert.equal(completed.mustChangePassword, false);
  assert.ok(completed.initialPasswordSetAt);
  const created = await db.createStudentWithUser({
    studentName: "Admin Created Approval Student",
    schoolName: "Approval Test School",
    registerNumber: "ADMIN-APPROVAL-TEST",
    stream: "Computer Science",
    actorId: admin.user.id,
  });
  assert.equal(isStudentActivated(created.student), true);
  assert.equal(created.student.adminApprovedBy, admin.user.id);
  assert.equal(isPhoneVerified(created.student), false);
});
