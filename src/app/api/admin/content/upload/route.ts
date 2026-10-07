import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { LEARNING_UPLOAD_LIMIT } from "@/lib/learning-materials";
import { requireSupabase } from "@/lib/supabase/server";

const uploadRequest = z.object({
  contentType: z.enum([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "video/mp4",
  ]),
  size: z.number().int().positive().max(LEARNING_UPLOAD_LIMIT),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "admin")
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  try {
    const parsed = uploadRequest.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: "Choose a PDF, JPG, PNG, or MP4 up to 50 MB." },
        { status: 400 },
      );
    const limit = await checkRateLimit(
      `content-upload_${session.userId}`,
      20,
      60,
    );
    if (!limit.success)
      return NextResponse.json(
        { error: "Please wait a minute before uploading more files." },
        { status: 429 },
      );
    const type = parsed.data.contentType;
    const extension = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
      "video/mp4": "mp4",
    }[type];
    const path = `${type === "video/mp4" ? "videos" : "notes"}/${randomUUID()}.${extension}`;
    const storage = requireSupabase().storage.from("learning-materials");
    const { data, error } = await storage.createSignedUploadUrl(path, {
      upsert: false,
    });
    if (error || !data) throw new Error("Could not prepare the file upload.");
    // The browser receives a capability for this single new file, never a server key.
    return NextResponse.json(
      {
        signedUrl: data.signedUrl,
        url: storage.getPublicUrl(path).data.publicUrl,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not prepare the upload. Please check Supabase Storage." },
      { status: 503 },
    );
  }
}
