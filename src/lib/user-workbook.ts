import ExcelJS from "exceljs";
import { userDirectoryRows } from "@/components/admin/user-directory";
import type { AdminUserData } from "@/lib/db/user-data";

export async function createUserWorkbook(users: AdminUserData[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SkillUp";
  workbook.created = new Date();
  const { columns, rows } = userDirectoryRows(users);
  const directory = workbook.addWorksheet("Users", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  directory.columns = columns.map((header) => ({ header, width: 24 }));
  for (const row of rows) directory.addRow(row.map((value) => value ?? ""));
  directory.autoFilter = { from: "A1", to: { row: 1, column: columns.length } };

  // The second sheet uses the roster import's exact field names. Passwords and
  // password hashes are excluded from both sheets.
  const roster = workbook.addWorksheet("Students", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  roster.columns = [
    "student_name",
    "register_number",
    "school_name",
    "stream",
    "student_email",
    "student_phone",
    "medium",
    "academic_year",
  ].map((header) => ({ header, width: 26 }));
  for (const user of users) {
    const student = user.student;
    if (!student) continue;
    roster.addRow([
      student.studentName,
      student.registerNumber,
      student.schoolName,
      student.stream,
      student.studentEmail,
      student.studentPhone,
      student.medium,
      student.academicYear,
    ]);
  }
  for (const sheet of [directory, roster]) {
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1D4ED8" },
    };
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
