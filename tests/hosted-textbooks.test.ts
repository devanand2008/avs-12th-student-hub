import assert from "node:assert/strict";
import test from "node:test";
import catalog from "../src/lib/textbooks-catalog.json";
import {
  hostedTextbookUrl,
  streamHostedTextbook,
} from "../src/lib/hosted-textbooks";
import { getTextbookCatalog } from "../src/lib/textbooks-server";
import type { Textbook } from "../src/lib/textbooks";

const book = catalog.books[0] as Textbook;

test("hosted delivery preserves all original evidence and only selects verified catalog assets", async () => {
  const previous = process.env.TEXTBOOK_DELIVERY;
  process.env.TEXTBOOK_DELIVERY = "github-release";
  try {
    const hosted = await getTextbookCatalog();
    assert.equal(hosted.books.length, catalog.books.length);
    for (const entry of hosted.books) {
      const original = catalog.books.find((row) => row.id === entry.id)!;
      assert.equal(entry.sourceUrl, original.sourceUrl);
      assert.equal(entry.sha256, original.sha256);
      assert.equal(entry.sizeBytes, original.sizeBytes);
      assert.equal(entry.localPath, `/api/textbooks/${entry.id}/pdf`);
      assert.match(
        hostedTextbookUrl(original as Textbook)!,
        /^https:\/\/github.com\/devanand2008\/avs-12th-student-hub\/releases\/download\//,
      );
    }
    assert.equal(hostedTextbookUrl({ ...book, id: "../private" }), null);
    assert.equal(
      hostedTextbookUrl({ ...book, localPath: "/textbooks/other.pdf" }),
      null,
    );
    assert.equal(hostedTextbookUrl({ ...book, sha256: null }), null);
  } finally {
    if (previous === undefined) delete process.env.TEXTBOOK_DELIVERY;
    else process.env.TEXTBOOK_DELIVERY = previous;
  }
});

test("PDF streaming forwards byte ranges through approved redirects without cookies or server secrets", async () => {
  const calls: { url: string; headers: Headers }[] = [];
  const fetcher: typeof fetch = async (input, options) => {
    calls.push({ url: String(input), headers: new Headers(options?.headers) });
    if (calls.length === 1)
      return new Response(null, {
        status: 302,
        headers: {
          location:
            "https://release-assets.githubusercontent.com/example.pdf?signed=public",
        },
      });
    return new Response("%PDF-", {
      status: 206,
      headers: {
        "Content-Length": "5",
        "Content-Range": `bytes 0-4/${book.sizeBytes}`,
      },
    });
  };
  const response = await streamHostedTextbook(
    new Request(
      "https://app.test/api/textbooks/book/pdf?url=https://127.0.0.1",
      {
        headers: {
          Range: "bytes=0-4",
          Cookie: "private-session",
          Authorization: "private-key",
        },
      },
    ),
    book,
    fetcher,
  );
  assert.equal(response.status, 206);
  assert.equal(await response.text(), "%PDF-");
  assert.equal(response.headers.get("Content-Type"), "application/pdf");
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  for (const call of calls) {
    assert.equal(call.headers.get("Range"), "bytes=0-4");
    assert.equal(call.headers.get("Cookie"), null);
    assert.equal(call.headers.get("Authorization"), null);
    assert.ok(!call.url.includes("127.0.0.1"));
  }
});

test("invalid or multiple PDF ranges are rejected before contacting the asset server", async () => {
  for (const range of [
    "bytes=-0",
    "bytes=-",
    "bytes=8-2",
    "bytes=0-1,4-5",
    `bytes=${book.sizeBytes}-`,
    "bytes=999999999999999999999-",
  ]) {
    const response = await streamHostedTextbook(
      new Request("https://app.test", { headers: { Range: range } }),
      book,
      async () => {
        throw new Error("Must not fetch invalid ranges");
      },
    );
    assert.equal(response.status, 416, range);
    assert.equal(
      response.headers.get("Content-Range"),
      `bytes */${book.sizeBytes}`,
    );
  }
});

test("asset errors, unexpected redirects and incorrect ranges cannot masquerade as valid PDF pages", async () => {
  for (const upstream of [
    new Response("error", { status: 404 }),
    new Response(null, {
      status: 302,
      headers: { location: "http://127.0.0.1/private" },
    }),
    new Response(null, {
      status: 302,
      headers: { location: "https://github.com.attacker.test/private" },
    }),
    new Response("%PDF-", { status: 200, headers: { "Content-Length": "5" } }),
    new Response("%PDF-", {
      status: 206,
      headers: { "Content-Length": "5", "Content-Range": "bytes 5-9/100" },
    }),
  ]) {
    let calls = 0;
    const response = await streamHostedTextbook(
      new Request("https://app.test", { headers: { Range: "bytes=0-4" } }),
      book,
      async () => {
        calls++;
        return upstream;
      },
    );
    assert.equal(response.status, 503);
    assert.equal(calls, 1);
    assert.match((await response.json()).error, /temporarily unavailable/);
  }
});

test("suffix ranges and HEAD requests preserve exact catalog sizes without returning a body", async () => {
  const size = book.sizeBytes!;
  const response = await streamHostedTextbook(
    new Request("https://app.test", { headers: { Range: "bytes=-5" } }),
    book,
    async (_url, options) => {
      assert.equal(
        new Headers(options?.headers).get("Range"),
        `bytes=${size - 5}-${size - 1}`,
      );
      return new Response("%%EOF", {
        status: 206,
        headers: {
          "Content-Length": "5",
          "Content-Range": `bytes ${size - 5}-${size - 1}/${size}`,
        },
      });
    },
  );
  assert.equal(await response.text(), "%%EOF");
  const head = await streamHostedTextbook(
    new Request("https://app.test", { method: "HEAD" }),
    book,
    async (_url, options) => {
      assert.equal(options?.method, "HEAD");
      return new Response(null, {
        headers: { "Content-Length": String(size) },
      });
    },
  );
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("Content-Length"), String(size));
  assert.equal(await head.text(), "");
});
