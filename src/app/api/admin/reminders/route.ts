import { getSession } from "@/lib/auth";
import { reminderConfiguration } from "@/lib/study-reminders";
import { NextResponse } from "next/server";
export async function GET() {
  const u = await getSession();
  if (u?.role !== "admin")
    return NextResponse.json(
      { error: "Administrator required." },
      { status: 403 },
    );
  return NextResponse.json(reminderConfiguration(), {
    headers: { "Cache-Control": "no-store" },
  });
}
