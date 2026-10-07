import { loadEnvConfig } from "@next/env";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createStudentWithUser, getUserByLoginId } from "../src/lib/db";
import { backendMode } from "../src/lib/supabase/server";
import { studentInput } from "../src/lib/students";
loadEnvConfig(process.cwd());
async function main() {
  if (backendMode() !== "supabase")
    throw new Error(
      "Connect Supabase first. This command will not create a temporary memory account.",
    );
  if (!process.env.ADMIN_EMAIL)
    throw new Error("Configure ADMIN_EMAIL before creating a student.");
  const admin = await getUserByLoginId(process.env.ADMIN_EMAIL);
  if (admin?.user.role !== "admin")
    throw new Error("Run npm run db:setup to create your administrator first.");
  const arg = process.argv[2];
  if (!arg)
    throw new Error(
      "Use npm run student:create -- path/to/student.json, or --test for a clearly labelled test account.",
    );
  const input =
    arg === "--test"
      ? {
          studentName: "Backend Test Student",
          registerNumber: "TEST-" + randomUUID().slice(0, 8),
          schoolName: "Backend Test School",
          stream: "Computer Science",
          medium: "English",
          academicYear: "2026-2027",
        }
      : JSON.parse(await readFile(arg, "utf8"));
  const parsed = studentInput.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const result = await createStudentWithUser({
    ...parsed.data,
    actorId: admin.user.id,
  });
  await mkdir(".local", { recursive: true });
  const file = ".local/" + result.student.studentId + "-credentials.json";
  await writeFile(
    file,
    JSON.stringify(
      {
        studentName: result.student.studentName,
        studentId: result.student.studentId,
        temporaryPassword: result.temporaryPassword,
        loginPath: "/login?studentId=" + result.student.studentId,
        mustChangePassword: true,
      },
      null,
      2,
    ) + "\n",
    { flag: "wx", mode: 0o600 },
  );
  console.log("Created permanent student login: " + result.student.studentId);
  console.log(
    "Temporary credentials saved privately to " +
      file +
      ". Share with the student and remove this file afterward.",
  );
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Student creation failed.",
  );
  process.exitCode = 1;
});
