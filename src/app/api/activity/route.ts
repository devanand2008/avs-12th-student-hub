import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  getLearningActivity,
  recordNoteVisit,
  recordVideoVisit,
} from "@/lib/db";
import { listResources } from "@/lib/content";
import type { HandwrittenNote } from "@/types";
const input = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("note"),
    id: z.string(),
    page: z.number().int().min(1).max(2000),
  }),
  z.object({
    kind: z.literal("video"),
    id: z.string(),
    seconds: z.number().min(0).max(86400),
    percent: z.number().min(0).max(100),
  }),
]);
export async function GET() {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  return NextResponse.json(
    await getLearningActivity(user.studentId || user.userId),
  );
}
export async function POST(request: Request) {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    const parsed = input.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid learning activity." },
        { status: 400 },
      );
    const data = parsed.data;
    const resource = (
      await listResources(data.kind, user.role === "admin")
    ).find((item) => item.id === data.id);
    if (!resource)
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 },
      );
    const studentId = user.studentId || user.userId;
    if (data.kind === "note") {
      if (data.page > (resource as HandwrittenNote).pageCount)
        return NextResponse.json(
          { error: "Invalid page number." },
          { status: 400 },
        );
      await recordNoteVisit(studentId, data.id, data.page);
    } else
      await recordVideoVisit(studentId, data.id, data.seconds, data.percent);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Could not save learning activity." },
      { status: 400 },
    );
  }
}
