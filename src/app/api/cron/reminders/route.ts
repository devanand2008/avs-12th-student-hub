import { timingSafeEqual } from "node:crypto";
import { runStudyReminders } from "@/lib/study-reminders";
import { NextResponse } from "next/server";
export const maxDuration = 300;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET,
    header = request.headers.get("authorization") || "";
  const expected = Buffer.from(`Bearer ${secret || ""}`),
    actual = Buffer.from(header);
  if (
    !secret ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await runStudyReminders(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Reminder run could not be completed." },
      { status: 503 },
    );
  }
}
