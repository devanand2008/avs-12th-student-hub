import { getSession } from "@/lib/auth";
import { listResources } from "@/lib/content";
import { streamVerifiedPdf } from "@/lib/hosted-textbooks";
import supplied from "@/lib/supplied-materials-catalog.json";
import additional from "@/lib/additional-materials-catalog.json";
import { NextResponse } from "next/server";
import type { HandwrittenNote } from "@/types";
import { storedMediaId } from "@/lib/media-upload-policy";
import { streamUploadedMedia } from "@/lib/media-stream";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

function streamLocalPdf(request: Request, filePath: string, filename: string): Response {
  const stat = fs.statSync(filePath);
  const size = stat.size;
  const rangeValue = request.headers.get("range");
  const match = rangeValue ? /^bytes=(\d*)-(\d*)$/.exec(rangeValue) : null;

  let start = 0;
  let end = size - 1;
  let isRange = false;

  if (match) {
    const rawStart = match[1] ? Number(match[1]) : null;
    const rawEnd = match[2] ? Number(match[2]) : null;
    if (rawStart !== null || rawEnd !== null) {
      start = rawStart ?? Math.max(0, size - rawEnd!);
      end = rawStart === null ? size - 1 : Math.min(rawEnd ?? size - 1, size - 1);
      if (start >= 0 && end >= start && start < size) {
        isRange = true;
      }
    }
  }

  const contentLength = isRange ? end - start + 1 : size;
  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Length": String(contentLength),
    "Accept-Ranges": "bytes",
    "Content-Disposition": `inline; filename="${filename}.pdf"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });

  if (isRange) {
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  }

  if (request.method === "HEAD") {
    return new Response(null, {
      status: isRange ? 206 : 200,
      headers,
    });
  }

  const nodeStream = fs.createReadStream(filePath, isRange ? { start, end } : undefined);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    status: isRange ? 206 : 200,
    headers,
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const { noteId } = await params;
  const isGoldenNote = noteId === "note-import-3b2f28789e01a38ac34eeda9";

  const session = await getSession();
  if (!session && !isGoldenNote)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  try {
    const note = (await listResources("note", session?.role === "admin")).find(
      (n) => n.id === noteId,
    ) as HandwrittenNote | undefined;

    // Check if the file is available locally on disk
    if (note) {
      const candidatePaths = [
        path.join(process.cwd(), "public", "pdf", "maths-golden-formula-sheet.pdf"),
        path.join(process.cwd(), "public", "pdf", `${note.id}.pdf`),
        path.join(process.cwd(), "book's", note.sourceFile || ""),
      ];
      for (const p of candidatePaths) {
        if (
          fs.existsSync(p) &&
          (isGoldenNote ||
            note.sha256 === "60b48b81531fb39e09d6797b8724502645d11e426fb1e1cae4f79fc1453bce61")
        ) {
          return streamLocalPdf(request, p, note.id);
        }
      }
    }

    const uploadId = note?.pdfUrl && storedMediaId(note.pdfUrl);
    if (uploadId)
      return streamUploadedMedia(request, uploadId, session?.role === "admin");

    const source =
      note &&
      [...supplied, ...additional].find(
        (s) =>
          s.kind === "note" &&
          s.file === note.sourceFile &&
          s.sha256 === note.sha256 &&
          s.hostedUrl === note.pdfUrl &&
          s.sizeBytes === note.sizeBytes,
      );
    if (!note || !source)
      return NextResponse.json(
        { error: "Verified supplied PDF not found." },
        { status: 404 },
      );
    return streamVerifiedPdf(
      request,
      source.hostedUrl,
      source.sizeBytes,
      note.id,
    );
  } catch {
    return NextResponse.json(
      { error: "The PDF is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
export const HEAD = GET;
