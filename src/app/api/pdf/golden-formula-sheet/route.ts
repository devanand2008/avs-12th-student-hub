import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

export async function GET(request: Request) {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "pdf",
      "maths-golden-formula-sheet.pdf",
    );

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Golden formula sheet PDF not found on server." },
        { status: 404 },
      );
    }

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
      "Content-Disposition": 'inline; filename="maths-golden-formula-sheet.pdf"',
      "Cache-Control": "public, max-age=31536000, immutable",
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
  } catch (error) {
    console.error("Error streaming golden formula sheet:", error);
    return NextResponse.json(
      { error: "Failed to load formula sheet PDF." },
      { status: 500 },
    );
  }
}

export const HEAD = GET;
