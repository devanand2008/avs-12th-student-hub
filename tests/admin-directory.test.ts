import ExcelJS from "exceljs";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import test from "node:test";
import {
  filterUserDirectory,
  userDirectoryCsv,
} from "../src/components/admin/user-directory";
import type { AdminUserData } from "../src/lib/db";

const student: AdminUserData = {
  id: "user-student",
  role: "student",
  email: "login@example.test",
  mustChangePassword: false,
  createdAt: "2026-10-06T00:00:00Z",
  updatedAt: "2026-10-06T01:00:00Z",
  student: {
    id: "student-record",
    userId: "user-student",
    studentId: "AVSCS26-0001",
    studentName: 'தமிழ், "Student"\nSecond line',
    registerNumber: "REG-1",
    schoolName: '=HYPERLINK("https://example.test")',
    studentEmail: "contact@example.test",
    studentPhone: "9876543210",
    stream: "Computer Science",
    medium: "Tamil",
    standard: "12th Standard",
    academicYear: "2026-2027",
    activeStatus: false,
    mustChangePassword: true,
    createdAt: "2026-10-06T00:00:00Z",
  },
  learning: {
    quizAttempts: 0,
    mcqsAttempted: 0,
    averageScore: 0,
    notesViewed: 2,
    videosWatched: 1,
    bookmarksCount: 0,
  },
};
const admin: AdminUserData = {
  id: "user-admin",
  role: "admin",
  email: "admin@example.test",
  createdAt: "2026-10-06T00:00:00Z",
  updatedAt: "2026-10-06T00:00:00Z",
};
const filters = {
  search: "",
  role: "all",
  status: "all",
  stream: "all",
  medium: "all",
};

test("user directory finds phone/contact details and combines role, status, stream, medium filters", () => {
  const users = [student, admin];
  assert.deepEqual(
    filterUserDirectory(users, { ...filters, search: "9876543210" }),
    [student],
  );
  assert.deepEqual(
    filterUserDirectory(users, { ...filters, search: "CONTACT@EXAMPLE.TEST" }),
    [student],
  );
  assert.deepEqual(
    filterUserDirectory(users, { ...filters, role: "admin", status: "active" }),
    [admin],
  );
  assert.deepEqual(
    filterUserDirectory(users, {
      ...filters,
      role: "student",
      status: "inactive",
      stream: "Computer Science",
      medium: "Tamil",
    }),
    [student],
  );
  assert.deepEqual(
    filterUserDirectory(users, { ...filters, medium: "English" }),
    [],
  );
});

test("user export survives a real CSV reader with Tamil, commas, quotes, newlines and spreadsheet formulas", async () => {
  const csv = userDirectoryCsv([student, admin]);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  const workbook = new ExcelJS.Workbook();
  const sheet = await workbook.csv.read(Readable.from([Buffer.from(csv)]));
  const headers = sheet.getRow(1).values as string[];
  const value = (row: number, name: string) =>
    sheet.getRow(row).getCell(headers.indexOf(name)).value;
  assert.equal(sheet.rowCount, 3);
  assert.equal(value(2, "Name"), student.student!.studentName);
  assert.equal(value(2, "School"), "'" + student.student!.schoolName);
  assert.equal(value(2, "Quiz Attempts"), 0);
  assert.equal(value(2, "Password Change Required"), "Yes");
  assert.equal(value(2, "Status"), "Inactive");
  assert.equal(value(3, "Status"), "Active");
  assert.equal(value(3, "Role"), "admin");
});

test("directory export only includes explicit safe fields even if a caller adds credentials", () => {
  const unsafe = {
    ...student,
    passwordHash: "private-hash",
    temporaryPassword: "private-password",
  };
  const csv = userDirectoryCsv([unsafe]);
  assert.ok(!csv.includes("private-hash"));
  assert.ok(!csv.includes("private-password"));
  assert.ok(csv.includes("Password Change Required"));
});
