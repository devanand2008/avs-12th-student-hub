import assert from "node:assert/strict";
import test from "node:test";
import catalog from "../src/lib/textbooks-catalog.json";
import { officialTextbookRewrite } from "../src/lib/textbook-delivery";
import { getTextbookCatalog } from "../src/lib/textbooks-server";
import type { Textbook } from "../src/lib/textbooks";

const sample = catalog.books[0] as Textbook;

test("cloud textbook routes cover the verified library without arbitrary upstreams", () => {
  assert.equal(catalog.books.length, 82);
  for (const book of catalog.books as Textbook[]) {
    const rewrite = officialTextbookRewrite(book);
    assert.ok(rewrite, book.id);
    assert.equal(rewrite.source, book.localPath);
    assert.equal(rewrite.destination, book.sourceUrl);
  }
  for (const sourceUrl of [
    "http://d1e5r329t7a85t.cloudfront.net/book.pdf",
    "https://127.0.0.1/private.pdf",
    "https://d1e5r329t7a85t.cloudfront.net.attacker.example/book.pdf",
    "https://password@d1e5r329t7a85t.cloudfront.net/book.pdf",
    `${sample.sourceUrl}?target=private`,
  ])
    assert.equal(officialTextbookRewrite({ ...sample, sourceUrl }), null);
  assert.equal(
    officialTextbookRewrite({
      ...sample,
      localPath: "/textbooks/../private.pdf",
    }),
    null,
  );
});

test("official delivery preserves the in-site reader without depending on local PDF files", async () => {
  const previous = process.env.TEXTBOOK_DELIVERY;
  process.env.TEXTBOOK_DELIVERY = "official";
  try {
    const result = await getTextbookCatalog();
    assert.equal(result.books.length, 82);
    assert.ok(
      result.books.every(
        (book) =>
          book.localPath && book.status === "downloaded" && !book.downloadError,
      ),
    );
  } finally {
    if (previous === undefined) delete process.env.TEXTBOOK_DELIVERY;
    else process.env.TEXTBOOK_DELIVERY = previous;
  }
});
