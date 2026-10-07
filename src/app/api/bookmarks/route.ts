import { getSession } from "@/lib/auth";
import { getStudentBookmarks, toggleBookmark } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const studentId = session.studentId || session.userId;
  const bookmarks = await getStudentBookmarks(studentId);
  return NextResponse.json({ bookmarks });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    const studentId = session.studentId || session.userId;

    const body = await request.json();
    const { contentType, contentId, title, subtitle, url } = body;

    if (!contentType || !contentId || !title || !url) {
      return NextResponse.json(
        { error: "Missing required bookmark fields" },
        { status: 400 },
      );
    }

    const result = await toggleBookmark({
      studentId,
      contentType,
      contentId,
      title,
      subtitle,
      url,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : undefined) ||
          "Failed to update bookmark",
      },
      { status: 500 },
    );
  }
}
