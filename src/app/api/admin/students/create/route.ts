import { getSession } from "@/lib/auth";
import { createStudentWithUser, getAllStudents } from "@/lib/db";
import { studentInput } from "@/lib/students";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  }

  try {
    const parsed = studentInput.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    const body = parsed.data;
    const {
      studentName,
      registerNumber,
      schoolName,
      studentEmail,
      studentPhone,
      stream,
      medium = "English",
      academicYear = "2026-2027",
    } = body;

    if (!studentName || !registerNumber || !schoolName || !stream) {
      return NextResponse.json(
        {
          error: "Name, Register Number, School Name, and Stream are required.",
        },
        { status: 400 },
      );
    }

    if (stream !== "Computer Science" && stream !== "Biology") {
      return NextResponse.json(
        { error: "Stream must be either 'Computer Science' or 'Biology'." },
        { status: 400 },
      );
    }

    // Check duplicate register number
    const existing = await getAllStudents();
    const isDuplicate = existing.some(
      (s) =>
        s.registerNumber.toLowerCase() === registerNumber.trim().toLowerCase(),
    );
    if (isDuplicate) {
      return NextResponse.json(
        {
          error: `A student with register number '${registerNumber}' already exists.`,
        },
        { status: 409 },
      );
    }

    const result = await createStudentWithUser({
      studentName: studentName.trim(),
      registerNumber: registerNumber.trim(),
      schoolName: schoolName.trim(),
      studentEmail: studentEmail?.trim(),
      studentPhone: studentPhone?.trim(),
      stream,
      actorId: session.userId,
      medium,
      academicYear,
    });

    return NextResponse.json({
      success: true,
      student: result.student,
      temporaryPassword: result.temporaryPassword,
      message: `Student account created! Student ID: ${result.student.studentId}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : undefined) ||
          "Failed to create student.",
      },
      {
        status:
          error instanceof Error &&
          /already exists|Duplicate/.test(error.message)
            ? 409
            : 500,
      },
    );
  }
}
