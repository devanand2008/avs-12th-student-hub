import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { findMediaUpload, completeMediaUpload } from "@/lib/media-uploads";
import { z } from "zod";
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ uploadId: string }> },
) {
  const user = await getSession();
  if (user?.role !== "admin")
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  const { uploadId } = await params;
  if (!z.string().uuid().safeParse(uploadId).success)
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  try {
    const upload = await findMediaUpload(uploadId);
    if (!upload || upload.created_by !== user.userId)
      return NextResponse.json({ error: "Upload not found." }, { status: 404 });
    await completeMediaUpload(upload);
    return NextResponse.json(
      {
        url: `/api/media/${upload.id}`,
        size: upload.size_bytes,
        mime: upload.mime,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not complete upload." },
      { status: 400 },
    );
  }
}
export const maxDuration = 300;
