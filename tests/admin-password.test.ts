import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { validateReplacementPassword } from "../src/lib/auth/reset-password-policy";
import * as memory from "../src/lib/db/memory";

test("replacement passwords preserve exact characters and enforce bcrypt byte limits", () => {
  assert.equal(validateReplacementPassword(undefined), undefined);
  assert.equal(
    validateReplacementPassword("  Example-pass  "),
    "  Example-pass  ",
  );
  for (const v of [null, 123, "short", "a".repeat(73), "அ".repeat(25)])
    assert.throws(() => validateReplacementPassword(v), /at least 10/);
  assert.equal(validateReplacementPassword("a".repeat(72)), "a".repeat(72));
});

test("memory reset hashes a chosen secret, requires an admin and excludes it from audit/directory", async () => {
  process.env.ADMIN_EMAIL = "password-qa@example.test";
  process.env.ADMIN_INITIAL_PASSWORD = "Fixture-admin-password";
  const admin = await memory.getUserByLoginId("password-qa@example.test");
  const student = await memory.getUserByLoginId("AVSCS26-0001");
  assert.ok(admin && student?.student);
  const chosen = "Teacher-chosen-test-password";
  await assert.rejects(
    memory.resetStudentPassword(student.student.id, student.user.id, chosen),
    /Admin authorization/,
  );
  await assert.rejects(
    memory.resetStudentPassword(student.student.id, undefined, chosen),
    /Admin authorization/,
  );
  assert.equal(
    await memory.resetStudentPassword(
      student.student.id,
      admin.user.id,
      chosen,
    ),
    chosen,
  );
  const updated = await memory.getUserByLoginId("AVSCS26-0001");
  assert.ok(await bcrypt.compare(chosen, updated!.user.passwordHash));
  assert.equal(updated!.student!.mustChangePassword, true);
  assert.ok(!JSON.stringify(memory.getAuditLogs()).includes(chosen));
  assert.ok(
    !JSON.stringify(await memory.getAllUserData(admin.user.id)).includes(
      chosen,
    ),
  );
});
