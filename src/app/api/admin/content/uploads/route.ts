import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireSupabase } from "@/lib/supabase/server";
import { findMediaUpload, storedMediaParts } from "@/lib/media-uploads";
import {
  MEDIA_BUCKET,
  MEDIA_MAX_BYTES,
  MEDIA_PART_BYTES,
  MEDIA_MIMES,
  mediaPartCount,
  mediaPartPath,
} from "@/lib/media-upload-policy";
const input = z.object({
  name: z.string().min(1).max(200),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  mime: z.enum(MEDIA_MIMES),
  size: z.number().int().positive().max(MEDIA_MAX_BYTES),
  resumeId: z.string().uuid().optional(),
});
export async function POST(request: Request) {
  const user = await getSession();
  if (user?.role !== "admin")
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  try {
    const p = input.safeParse(await request.json());
    if (!p.success)
      return NextResponse.json(
        { error: "Choose an MP4, PDF, JPG, PNG or WebP up to 512 MB." },
        { status: 400 },
      );
    if (!(await checkRateLimit(`media-upload:${user.userId}`, 40, 60)).success)
      return NextResponse.json(
        { error: "Please wait a minute before preparing another upload." },
        { status: 429 },
      );
    const d = p.data,
      client = requireSupabase();
    let upload = d.resumeId ? await findMediaUpload(d.resumeId) : null;
    if (
      upload &&
      (upload.created_by !== user.userId ||
        upload.name !== d.name ||
        upload.fingerprint !== d.fingerprint ||
        Number(upload.size_bytes) !== d.size ||
        upload.mime !== d.mime)
    )
      return NextResponse.json(
        { error: "This upload belongs to a different file or administrator." },
        { status: 403 },
      );
    if (!upload) {
      upload = {
        id: randomUUID(),
        created_by: user.userId,
        name: d.name,
        fingerprint: d.fingerprint,
        mime: d.mime,
        size_bytes: d.size,
        part_bytes: MEDIA_PART_BYTES,
        status: "uploading",
        created_at: new Date().toISOString(),
        completed_at: null,
      };
      const { error } = await client
        .from("learning_media_uploads")
        .insert(upload);
      if (error)
        throw Error(
          "Could not save the upload record. Check the media-upload migration.",
        );
    }
    const uploaded = await storedMediaParts(upload),
      parts = [];
    for (let i = 0; i < mediaPartCount(d.size); i++) {
      const path = mediaPartPath(upload.id, i),
        size = Math.min(MEDIA_PART_BYTES, d.size - i * MEDIA_PART_BYTES),
        exists = uploaded.get(path.split("/")[1]) === size;
      let signedUrl: string | null = null;
      if (!exists) {
        const { data, error } = await client.storage
          .from(MEDIA_BUCKET)
          .createSignedUploadUrl(path, { upsert: false });
        if (error || !data)
          throw Error(
            "Could not prepare private storage. Check the bucket and available storage quota.",
          );
        signedUrl = data.signedUrl;
      }
      parts.push({
        index: i,
        start: i * MEDIA_PART_BYTES,
        end: i * MEDIA_PART_BYTES + size,
        uploaded: exists,
        signedUrl,
      });
    }
    return NextResponse.json(
      { id: upload.id, url: `/api/media/${upload.id}`, parts },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not prepare upload." },
      { status: 503 },
    );
  }
}
export const maxDuration = 300;
