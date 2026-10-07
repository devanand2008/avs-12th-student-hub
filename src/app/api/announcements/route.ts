import { getSession } from "@/lib/auth";
import { createAnnouncement, getActiveAnnouncements } from "@/lib/db";
import { StreamType } from "@/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stream = searchParams.get("stream") as StreamType | null;

  const announcements = await getActiveAnnouncements(stream || undefined);
  return NextResponse.json({ announcements });
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
    const {
      title,
      description,
      priority = "Normal",
      targetStream = "All",
      publishDate,
      expiryDate,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 },
      );
    }

    const ann = await createAnnouncement({
      title,
      description,
      priority,
      targetStream,
      publishDate: publishDate || new Date().toISOString().split("T")[0],
      expiryDate,
      isActive: true,
    });

    return NextResponse.json({ success: true, announcement: ann });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : undefined) ||
          "Failed to create announcement",
      },
      { status: 500 },
    );
  }
}
