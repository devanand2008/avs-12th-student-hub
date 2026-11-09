import { requireSupabase } from "@/lib/supabase/server";
import {
  MEDIA_BUCKET,
  MEDIA_PART_BYTES,
  mediaPartCount,
  mediaPartPath,
  validMediaHeader,
  type MediaUpload,
} from "./media-upload-policy";
export async function findMediaUpload(id: string) {
  const { data, error } = await requireSupabase()
    .from("learning_media_uploads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error)
    throw Error(
      "Upload records are unavailable. Check the media-upload migration.",
    );
  return data as MediaUpload | null;
}
export async function storedMediaParts(upload: MediaUpload) {
  const { data, error } = await requireSupabase()
    .storage.from(MEDIA_BUCKET)
    .list(upload.id, { limit: 1000 });
  if (error) throw Error("Private media storage is unavailable.");
  return new Map((data || []).map((p) => [p.name, Number(p.metadata?.size)]));
}
export async function completeMediaUpload(upload: MediaUpload) {
  if (upload.status === "complete") return;
  const parts = await storedMediaParts(upload);
  for (let i = 0; i < mediaPartCount(Number(upload.size_bytes)); i++) {
    const size = Math.min(
      MEDIA_PART_BYTES,
      Number(upload.size_bytes) - i * MEDIA_PART_BYTES,
    );
    if (parts.get(mediaPartPath(upload.id, i).split("/")[1]) !== size)
      throw Error(
        "Some file parts are missing. Select the same file again to resume.",
      );
  }
  const { data, error } = await requireSupabase()
    .storage.from(MEDIA_BUCKET)
    .download(mediaPartPath(upload.id, 0));
  if (
    error ||
    !data ||
    !validMediaHeader(
      upload.mime,
      new Uint8Array(await data.slice(0, 32).arrayBuffer()),
    )
  )
    throw Error("The uploaded file does not match its selected format.");
  const result = await requireSupabase()
    .from("learning_media_uploads")
    .update({ status: "complete", completed_at: new Date().toISOString() })
    .eq("id", upload.id)
    .eq("created_by", upload.created_by);
  if (result.error)
    throw Error(
      "Could not finalise the upload. Your file parts are preserved for retry.",
    );
}
