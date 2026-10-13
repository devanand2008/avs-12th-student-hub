import type { Textbook } from "./textbooks";

export const textbookRelease = {
  repository: "devanand2008/avs-12th-student-hub",
  tag: "textbooks-2026-10-13",
};

export function hostedTextbookUrl(book: Textbook): string | null {
  if (
    !/^[a-z0-9-]+$/.test(book.id) ||
    book.localPath !== `/textbooks/${book.id}.pdf` ||
    !book.sizeBytes ||
    !Number.isSafeInteger(book.sizeBytes) ||
    !book.sha256 ||
    !/^[a-f0-9]{64}$/.test(book.sha256)
  )
    return null;
  return `https://github.com/${textbookRelease.repository}/releases/download/${textbookRelease.tag}/${book.id}.pdf`;
}

function parseRange(value: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2])) return null;
  const first = match[1] ? Number(match[1]) : null;
  const last = match[2] ? Number(match[2]) : null;
  if (
    (first !== null && (!Number.isSafeInteger(first) || first < 0)) ||
    (last !== null && (!Number.isSafeInteger(last) || last < 0))
  )
    return null;
  if (first === null && (!last || last < 1)) return null;
  const start = first ?? Math.max(0, size - last!);
  const end = first === null ? size - 1 : Math.min(last ?? size - 1, size - 1);
  return start < size && end >= start ? { start, end } : null;
}

const redirectHosts = new Set([
  "github.com",
  "release-assets.githubusercontent.com",
  "objects.githubusercontent.com",
]);

// Streams the exact catalog asset; neither request query strings nor user input
// can select an arbitrary upstream. Authentication is enforced in the route.
export async function streamHostedTextbook(
  request: Request,
  book: Textbook,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  const source = hostedTextbookUrl(book);
  if (!source)
    return Response.json(
      { error: "This textbook has no verified hosted file." },
      { status: 404 },
    );
  const size = book.sizeBytes!;
  const rangeValue = request.headers.get("range");
  const range = rangeValue ? parseRange(rangeValue, size) : null;
  if (rangeValue && !range)
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${size}` },
    });
  const headers = new Headers({ Accept: "application/octet-stream" });
  if (range) headers.set("Range", `bytes=${range.start}-${range.end}`);
  try {
    let target = source;
    let upstream: Response | undefined;
    const signal = AbortSignal.any([
      request.signal,
      AbortSignal.timeout(60000),
    ]);
    for (let redirects = 0; redirects <= 3; redirects++) {
      upstream = await fetcher(target, {
        method: request.method === "HEAD" ? "HEAD" : "GET",
        headers,
        signal,
        redirect: "manual",
        cache: "no-store",
      });
      if (![301, 302, 303, 307, 308].includes(upstream.status)) break;
      const location = upstream.headers.get("location");
      await upstream.body?.cancel();
      if (!location || redirects === 3)
        throw new Error("Invalid asset redirect");
      const destination = new URL(location, target);
      if (
        destination.protocol !== "https:" ||
        !redirectHosts.has(destination.hostname) ||
        destination.port ||
        destination.username ||
        destination.password
      )
        throw new Error("Untrusted asset redirect");
      target = destination.href;
    }
    if (!upstream || ![200, 206].includes(upstream.status)) {
      await upstream?.body?.cancel();
      throw new Error("Hosted textbook is unavailable");
    }
    const expectedLength = range ? range.end - range.start + 1 : size;
    if (
      upstream.status !== (range ? 206 : 200) ||
      Number(upstream.headers.get("content-length")) !== expectedLength ||
      (range &&
        upstream.headers.get("content-range") !==
          `bytes ${range.start}-${range.end}/${size}`)
    ) {
      await upstream.body?.cancel();
      throw new Error(
        "Asset size or byte range does not match the verified catalog",
      );
    }
    const responseHeaders = new Headers({
      "Content-Type": "application/pdf",
      "Content-Length": String(expectedLength),
      "Accept-Ranges": "bytes",
      "Content-Disposition": `inline; filename="${book.id}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    if (range)
      responseHeaders.set(
        "Content-Range",
        `bytes ${range.start}-${range.end}/${size}`,
      );
    if (request.method === "HEAD") await upstream.body?.cancel();
    return new Response(request.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      {
        error:
          "The saved textbook is temporarily unavailable. Try again or open the official source PDF.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
