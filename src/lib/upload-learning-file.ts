import { MEDIA_MAX_BYTES, MEDIA_MIMES } from "./media-upload-policy";
import pdfjsPackage from "pdfjs-dist/package.json";
const pausedMessage =
  "Upload paused. Select the same file again to resume. Check your connection and available storage quota.";
function deadline(signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(90000);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}
export async function inspectPdfFile(
  file: File,
  signal?: AbortSignal,
): Promise<number> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdfjs/${pdfjsPackage.version}/pdf.worker.min.mjs`;
  const task = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  });
  const cancel = () => {
    void task.destroy();
  };
  signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) cancel();
  try {
    const doc = await task.promise;
    return doc.numPages;
  } finally {
    signal?.removeEventListener("abort", cancel);
    await task.destroy();
  }
}
export async function uploadLearningMedia(
  file: File,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
) {
  if (
    !file.size ||
    file.size > MEDIA_MAX_BYTES ||
    !MEDIA_MIMES.includes(file.type as (typeof MEDIA_MIMES)[number])
  )
    throw Error("Choose an MP4, PDF, JPG, PNG or WebP up to 512 MB.");
  // Bind resumes to metadata plus the first/last MiB. This is a resume identity,
  // not a claim that the entire file has been cryptographically verified.
  const sample = new Blob([
    `${file.name}:${file.size}:${file.lastModified}:${file.type}`,
    file.slice(0, 1048576),
    file.slice(Math.max(0, file.size - 1048576)),
  ]);
  const fingerprint = Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", await sample.arrayBuffer()),
      ),
      (b) => b.toString(16).padStart(2, "0"),
    ).join(""),
    key = "skillup-media-upload:" + fingerprint;
  let resumeId: string | undefined;
  try {
    resumeId = localStorage.getItem(key) || undefined;
  } catch {}
  const start = await fetch("/api/admin/content/uploads", {
      signal: deadline(signal),
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        fingerprint,
        mime: file.type,
        size: file.size,
        resumeId,
      }),
    }),
    plan = await start.json();
  if (!start.ok) throw Error(plan.error || "Could not start upload.");
  try {
    localStorage.setItem(key, plan.id);
  } catch {}
  let sent = plan.parts
    .filter((p: { uploaded: boolean }) => p.uploaded)
    .reduce(
      (n: number, p: { start: number; end: number }) => n + p.end - p.start,
      0,
    );
  onProgress(Math.round((sent / file.size) * 100));
  for (const part of plan.parts) {
    if (part.uploaded) continue;
    let okay = false;
    for (let attempt = 0; attempt < 3 && !okay; attempt++)
      try {
        const response = await fetch(part.signedUrl, {
          signal: deadline(signal),
          method: "PUT",
          credentials: "omit",
          headers: {
            "Content-Type": "application/octet-stream",
            "x-upsert": "false",
          },
          body: file.slice(part.start, part.end),
        });
        if (!response.ok) throw Error();
        okay = true;
      } catch (error) {
        if (signal?.aborted)
          throw Error(
            "Upload cancelled. Select the same file again to resume.",
          );
        if (error instanceof DOMException && error.name === "TimeoutError")
          throw Error(pausedMessage);
        if (attempt === 2) throw Error(pausedMessage);
      }
    sent += part.end - part.start;
    onProgress(Math.round((sent / file.size) * 100));
  }
  const complete = await fetch(
      `/api/admin/content/uploads/${plan.id}/complete`,
      { method: "POST", signal: deadline(signal) },
    ),
    data = await complete.json();
  if (!complete.ok)
    throw Error(
      data.error || "Could not finish upload. Select the same file to retry.",
    );
  try {
    localStorage.removeItem(key);
  } catch {}
  return {
    url: data.url as string,
    size: Number(data.size),
    mime: data.mime as string,
  };
}
export async function inspectVideoFile(
  file: File,
  signal?: AbortSignal,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video"),
      url = URL.createObjectURL(file);
    video.preload = "metadata";
    let done = false;
    const timer = setTimeout(
      () =>
        finish(
          new Error(
            "Could not read video duration. Check that the file is a playable MP4.",
          ),
        ),
      30000,
    );
    function finish(error?: Error) {
      if (done) return;
      done = true;
      const duration = Math.ceil(video.duration);
      clearTimeout(timer);
      video.onloadedmetadata = null;
      video.onerror = null;
      signal?.removeEventListener("abort", cancel);
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      if (error) reject(error);
      else resolve(duration);
    }
    video.onloadedmetadata = () =>
      Number.isFinite(video.duration) && video.duration > 0
        ? finish()
        : finish(new Error("Invalid video duration."));
    video.onerror = () =>
      finish(new Error("This video cannot be read by your browser."));
    const cancel = () =>
      finish(
        new Error("Upload cancelled. Select the same file again to resume."),
      );
    signal?.addEventListener("abort", cancel, { once: true });
    if (signal?.aborted) cancel();
    else video.src = url;
  });
}
