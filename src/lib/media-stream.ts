import { requireSupabase } from "@/lib/supabase/server";
import { listResources } from "@/lib/content";
import { findMediaUpload } from "./media-uploads";
import {
  MEDIA_BUCKET,
  MEDIA_PART_BYTES,
  mediaPartPath,
  mediaRange,
} from "./media-upload-policy";
export async function streamUploadedMedia(
  request: Request,
  id: string,
  admin: boolean,
) {
  const upload = await findMediaUpload(id);
  if (!upload || upload.status !== "complete")
    return Response.json({ error: "Media not found." }, { status: 404 });
  if (!admin) {
    const kind = upload.mime === "video/mp4" ? "video" : "note";
    const available = (await listResources(kind)).some(
      (r) =>
        ("videoUrl" in r ? r.videoUrl : r.pdfUrl) === `/api/media/${id}` ||
        ("pages" in r &&
          r.pages.some((p) => p.imageUrl === `/api/media/${id}`)),
    );
    if (!available)
      return Response.json(
        { error: "Media is not published." },
        { status: 404 },
      );
  }
  const size = Number(upload.size_bytes),
    range = mediaRange(request.headers.get("range"), size);
  if (!range)
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${size}` },
    });
  const headers: Record<string, string> = {
    "Content-Type": upload.mime,
    "Accept-Ranges": "bytes",
    "Content-Length": String(range.end - range.start + 1),
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    Vary: "Cookie",
    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(upload.name)}`,
  };
  if (range.partial)
    headers["Content-Range"] = `bytes ${range.start}-${range.end}/${size}`;
  if (request.method === "HEAD")
    return new Response(null, { status: range.partial ? 206 : 200, headers });
  const first = Math.floor(range.start / MEDIA_PART_BYTES),
    last = Math.floor(range.end / MEDIA_PART_BYTES),
    storage = requireSupabase().storage.from(MEDIA_BUCKET);
  const abort = new AbortController();
  const onAbort = () => abort.abort();
  request.signal.addEventListener("abort", onAbort, { once: true });
  if (request.signal.aborted) abort.abort();
  async function* chunks() {
    try {
      for (let i = first; i <= last; i++) {
        const a = i === first ? range!.start - i * MEDIA_PART_BYTES : 0;
        const partSize = Math.min(
          MEDIA_PART_BYTES,
          size - i * MEDIA_PART_BYTES,
        );
        const b = i === last ? range!.end - i * MEDIA_PART_BYTES : partSize - 1;
        const { data, error } = await storage.createSignedUrl(
          mediaPartPath(id, i),
          60,
        );
        if (error || !data) throw Error("Media storage unavailable.");
        const response = await fetch(data.signedUrl, {
          headers: { Range: `bytes=${a}-${b}` },
          signal: abort.signal,
          cache: "no-store",
        });
        if (!response.ok || !response.body)
          throw Error("A media part could not be loaded.");
        if (response.status === 206) {
          if (
            response.headers.get("content-range") !==
            `bytes ${a}-${b}/${partSize}`
          ) {
            await response.body.cancel();
            throw Error("Invalid stored media range.");
          }
          const reader = response.body.getReader();
          let length = 0;
          try {
            while (true) {
              const next = await reader.read();
              if (next.done) break;
              length += next.value.byteLength;
              if (length > b - a + 1) throw Error("Invalid media part length.");
              yield next.value;
            }
            if (length !== b - a + 1) throw Error("Incomplete media part.");
          } finally {
            await reader.cancel().catch(() => {});
            reader.releaseLock();
          }
        } else {
          // Bound fallback buffering to one 4 MiB storage part.
          const bytes = new Uint8Array(await response.arrayBuffer());
          if (bytes.length !== partSize) throw Error("Incomplete media part.");
          yield bytes.slice(a, b + 1);
        }
      }
    } finally {
      request.signal.removeEventListener("abort", onAbort);
    }
  }
  const iterator = chunks();
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await iterator.next();
        if (cancelled) return;
        if (next.done) controller.close();
        else controller.enqueue(next.value);
      } catch (error) {
        if (!cancelled) controller.error(error);
      }
    },
    async cancel() {
      cancelled = true;
      abort.abort();
      request.signal.removeEventListener("abort", onAbort);
      await iterator.return(undefined);
    },
  });
  return new Response(body, { status: range.partial ? 206 : 200, headers });
}
