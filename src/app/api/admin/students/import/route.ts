import { getSession } from "@/lib/auth";
import { createStudentWithUser, getAllStudents } from "@/lib/db";
import { studentInput } from "@/lib/students";
import { StreamType } from "@/types";
import { NextResponse } from "next/server";

interface ImportRow {
  student_name: string;
  register_number: string;
  school_name: string;
  student_email?: string;
  student_phone?: string;
  stream: string;
  medium?: string;
  academic_year?: string;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { rows }: { rows: ImportRow[] } = body;

    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500) {
      return NextResponse.json(
        { error: "No student records provided for import." },
        { status: 400 },
      );
    }

    const existingStudents = await getAllStudents();
    const existingRegNos = new Set(
      existingStudents.map((s) => s.registerNumber.toLowerCase()),
    );

    const importedResults: Array<{
      studentId: string;
      studentName: string;
      registerNumber: string;
      stream: string;
      temporaryPassword: string;
      schoolName: string;
    }> = [];

    const skippedRows: Array<{
      registerNumber: string;
      studentName: string;
      reason: string;
    }> = [];

    const seenInBatch = new Set<string>();

    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const regNo = (row.register_number || "").toString().trim();
      const name = (row.student_name || "").toString().trim();
      const school = (row.school_name || "").toString().trim();
      const rawStream = (row.stream || "").toString().trim();

      if (!regNo || !name || !school) {
        skippedRows.push({
          registerNumber: regNo || "N/A",
          studentName: name || "N/A",
          reason: "Missing student name, register number, or school",
        });
        continue;
      }

      const normalizedReg = regNo.toLowerCase();
      if (existingRegNos.has(normalizedReg) || seenInBatch.has(normalizedReg)) {
        skippedRows.push({
          registerNumber: regNo,
          studentName: name,
          reason: "Duplicate register number",
        });
        continue;
      }

      // Normalize stream
      if (
        ![
          "computer science",
          "cs",
          "biology",
          "bio",
          "bio-botany",
          "bio-zoology",
        ].includes(rawStream.toLowerCase())
      ) {
        skippedRows.push({
          registerNumber: regNo,
          studentName: name,
          reason: "Invalid stream. Use Computer Science or Biology.",
        });
        continue;
      }
      let stream: StreamType = "Computer Science";
      if (
        rawStream.toLowerCase().includes("bio") ||
        rawStream.toLowerCase().includes("botany") ||
        rawStream.toLowerCase().includes("zoology")
      ) {
        stream = "Biology";
      }

      seenInBatch.add(normalizedReg);
      existingRegNos.add(normalizedReg);

      const parsed = studentInput.safeParse({
        studentName: name,
        registerNumber: regNo,
        schoolName: school,
        studentEmail: row.student_email?.toString().trim(),
        studentPhone: row.student_phone?.toString().trim(),
        stream,
        medium:
          row.medium?.toString().trim().toLowerCase() === "tamil"
            ? "Tamil"
            : "English",
        academicYear: row.academic_year?.toString().trim() || "2026-2027",
      });
      if (!parsed.success) {
        skippedRows.push({
          registerNumber: regNo,
          studentName: name,
          reason: parsed.error.issues[0].message,
        });
        continue;
      }
      let created;
      try {
        created = await createStudentWithUser({
          ...parsed.data,
          actorId: session.userId,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          /already exists|Duplicate/.test(error.message)
        ) {
          skippedRows.push({
            registerNumber: regNo,
            studentName: name,
            reason: "Duplicate register number or email",
          });
          continue;
        }
        throw error;
      }

      importedResults.push({
        studentId: created.student.studentId,
        studentName: created.student.studentName,
        registerNumber: created.student.registerNumber,
        stream: created.student.stream,
        temporaryPassword: created.temporaryPassword,
        schoolName: created.student.schoolName,
      });
    }

    return NextResponse.json({
      success: true,
      totalProcessed: rows.length,
      importedCount: importedResults.length,
      skippedCount: skippedRows.length,
      importedStudents: importedResults,
      skippedDetails: skippedRows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : undefined) ||
          "Failed to process bulk student import.",
      },
      { status: 500 },
    );
  }
}
