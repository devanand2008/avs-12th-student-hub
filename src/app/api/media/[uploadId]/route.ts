import { getSession } from "@/lib/auth";
import { streamUploadedMedia } from "@/lib/media-stream";
import { z } from "zod";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ uploadId: string }> },
) {
  const user = await getSession();
  if (!user)
    return Response.json({ error: "Please sign in." }, { status: 401 });
  const { uploadId } = await params;
  if (!z.string().uuid().safeParse(uploadId).success)
    return Response.json({ error: "Media not found." }, { status: 404 });
  try {
    return await streamUploadedMedia(request, uploadId, user.role === "admin");
  } catch {
    return Response.json(
      { error: "Media is temporarily unavailable. Please retry." },
      { status: 503 },
    );
  }
}
export const HEAD = GET;
export const maxDuration = 300;
