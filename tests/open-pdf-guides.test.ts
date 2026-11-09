import test from "node:test";
import assert from "node:assert/strict";
import {
  openPdfGuides,
  guideSubjects,
  guidesForSubject,
} from "../src/lib/open-pdf-guides";
import { streamVerifiedPdf } from "../src/lib/hosted-textbooks";
test("open references have unique licensed files, real subjects and honest supplementary scope", () => {
  assert.equal(
    new Set(openPdfGuides.map((g) => g.id)).size,
    openPdfGuides.length,
  );
  for (const g of openPdfGuides) {
    assert.ok(g.subjects.every((s) => guideSubjects.includes(s)));
    assert.ok(g.pages >= g.licencePdfPage);
    assert.match(g.licence, /^CC BY(?:-SA)? 4\.0$/);
    assert.ok(!g.licence.includes("NC"));
    assert.match(g.limitations, /not|differ|beyond/);
    assert.match(g.hostedUrl, /open-reference-/);
  }
  assert.ok(
    guidesForSubject("Mathematics").some((g) => g.id === "calculus-workbook"),
  );
  assert.deepEqual(guidesForSubject("Tamil"), []);
});
test("open-reference range and download delivery validate catalogue bytes and reject arbitrary URLs", async () => {
  const g = openPdfGuides[0],
    req = new Request("http://localhost/api/guides/" + g.id + "/pdf", {
      headers: { Range: "bytes=0-4" },
    });
  const fetcher = async () =>
    new Response("%PDF-", {
      status: 206,
      headers: {
        "Content-Length": "5",
        "Content-Range": `bytes 0-4/${g.sizeBytes}`,
      },
    });
  const r = await streamVerifiedPdf(
    req,
    g.hostedUrl,
    g.sizeBytes,
    `open-reference-${g.id}`,
    fetcher,
  );
  assert.equal(r.status, 206);
  assert.equal(await r.text(), "%PDF-");
  assert.equal(
    (
      await streamVerifiedPdf(
        req,
        "https://example.test/other.pdf",
        g.sizeBytes,
        g.id,
        fetcher,
      )
    ).status,
    404,
  );
});
