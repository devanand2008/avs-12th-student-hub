import { getSession } from "@/lib/auth";
import { getAllStudents } from "@/lib/db";
import { StreamType } from "@/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const stream = searchParams.get("stream") as StreamType | null;
  const search = searchParams.get("search")?.toLowerCase();

  let students = await getAllStudents();

  if (stream) {
    students = students.filter((s) => s.stream === stream);
  }

  if (search) {
    students = students.filter(
      (s) =>
        s.studentName.toLowerCase().includes(search) ||
        s.studentId.toLowerCase().includes(search) ||
        s.registerNumber.toLowerCase().includes(search) ||
        s.schoolName.toLowerCase().includes(search),
    );
  }

  return NextResponse.json({ students });
}
