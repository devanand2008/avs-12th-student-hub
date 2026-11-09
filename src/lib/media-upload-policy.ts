export const MEDIA_PART_BYTES = 4 * 1024 * 1024;
export const MEDIA_MAX_BYTES = 512 * 1024 * 1024;
export const MEDIA_BUCKET = "learning-upload-parts";
export const MEDIA_MIMES = [
  "video/mp4",
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export interface MediaUpload {
  id: string;
  created_by: string;
  name: string;
  fingerprint: string;
  mime: (typeof MEDIA_MIMES)[number];
  size_bytes: number;
  part_bytes: number;
  status: "uploading" | "complete";
  created_at: string;
  completed_at: string | null;
}
export function storedMediaId(url: string) {
  return /^\/api\/media\/([a-f0-9-]{36})$/.exec(url)?.[1] ?? null;
}
export function mediaPartPath(id: string, index: number) {
  return `${id}/${String(index).padStart(4, "0")}.part`;
}
export function mediaPartCount(size: number) {
  return Math.ceil(size / MEDIA_PART_BYTES);
}
export function validMediaHeader(mime: string, b: Uint8Array) {
  const s = new TextDecoder("ascii").decode(b);
  if (mime === "video/mp4") return s.slice(4, 8) === "ftyp";
  if (mime === "application/pdf") return s.startsWith("%PDF-");
  if (mime === "image/png") return b[0] === 137 && s.slice(1, 4) === "PNG";
  if (mime === "image/webp")
    return s.slice(0, 4) === "RIFF" && s.slice(8, 12) === "WEBP";
  return b[0] === 255 && b[1] === 216 && b[2] === 255;
}
export function mediaRange(header: string | null, size: number) {
  if (!header) return { start: 0, end: size - 1, partial: false };
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return null;
  let start: number, end: number;
  if (!match[1]) {
    const tail = Number(match[2]);
    if (!Number.isSafeInteger(tail) || tail <= 0) return null;
    start = Math.max(0, size - tail);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
  }
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    start >= size ||
    end < start
  )
    return null;
  // Bounded range responses also work on hosts with small buffered body limits.
  end = Math.min(end, size - 1, start + MEDIA_PART_BYTES - 1);
  return { start, end, partial: true };
}
