import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, appendFile } from "node:fs/promises";

// This manually invoked operation only fills the existing draft PDF release.
// It cannot publish the release, deploy the app, or access student records.
const repository = "devanand2008/avs-12th-student-hub";
const releaseId = 411223329;
const tag = "textbooks-2026-10-13";
const sourceHost = "d1e5r329t7a85t.cloudfront.net";
const { books } = JSON.parse(
  await readFile(
    new URL("../src/lib/textbooks-catalog.json", import.meta.url),
    "utf8",
  ),
);
assert.equal(books.length, 82);
assert.equal(new Set(books.map((book) => book.id)).size, books.length);
for (const book of books) {
  assert.match(book.id, /^[a-z0-9-]+$/);
  assert.equal(book.localPath, `/textbooks/${book.id}.pdf`);
  assert.match(book.sha256, /^[a-f0-9]{64}$/);
  assert.ok(Number.isSafeInteger(book.sizeBytes) && book.sizeBytes > 0);
  const source = new URL(book.sourceUrl);
  assert.equal(source.protocol, "https:");
  assert.equal(source.hostname, sourceHost);
  assert.ok(!source.port && !source.username && !source.password);
}

const probe = process.argv.includes("--probe");
const upload = process.argv.includes("--upload");
assert.ok(probe !== upload, "Specify exactly one of --probe or --upload");
if (probe) {
  const book = books.find(
    (book) => book.subject === "Physics" && book.sourceMedium === "Tamil",
  );
  const response = await fetch(book.sourceUrl, {
    headers: { Range: "bytes=0-4" },
    redirect: "error",
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(
    response.status,
    206,
    "Runner must be able to access the original PDF",
  );
  assert.equal(
    response.headers.get("content-range"),
    `bytes 0-4/${book.sizeBytes}`,
  );
  assert.equal(await response.text(), "%PDF-");
  console.log(
    JSON.stringify({
      sourceProbePassed: true,
      bookId: book.id,
      catalogBooks: books.length,
    }),
  );
} else {
  assert.equal(
    process.env.GITHUB_REPOSITORY,
    repository,
    "Wrong repository context",
  );
  const token = process.env.GH_TOKEN;
  assert.ok(token, "GitHub token required for explicit asset upload");
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "SkillUp-verified-textbook-mirror",
  };
  async function api(endpoint, method = "GET") {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/${endpoint}`,
      {
        method,
        headers,
        redirect: "error",
        signal: AbortSignal.timeout(30000),
      },
    );
    assert.ok(
      response.ok,
      `GitHub ${method} request failed: HTTP ${response.status}`,
    );
    return response.status === 204 ? null : response.json();
  }
  const release = await api(`releases/${releaseId}`);
  assert.equal(release.tag_name, tag);
  assert.equal(
    release.draft,
    true,
    "Preserve published releases; this operation requires a draft",
  );
  const matches = (asset, book) =>
    asset?.state === "uploaded" &&
    asset.name === `${book.id}.pdf` &&
    asset.size === book.sizeBytes &&
    asset.digest === `sha256:${book.sha256}`;
  const assets = await api(`releases/${releaseId}/assets?per_page=100`);
  const pending = books.filter(
    (book) =>
      !matches(
        assets.find((asset) => asset.name === `${book.id}.pdf`),
        book,
      ),
  );
  let cursor = 0;
  let completed = books.length - pending.length;
  const failures = [];
  console.log(
    JSON.stringify({ alreadyVerified: completed, pending: pending.length }),
  );
  await Promise.all(
    Array.from({ length: 2 }, async () => {
      while (cursor < pending.length) {
        const book = pending[cursor++];
        try {
          const response = await fetch(book.sourceUrl, {
            redirect: "error",
            signal: AbortSignal.timeout(180000),
          });
          assert.equal(response.status, 200, `Source HTTP ${response.status}`);
          assert.equal(
            Number(response.headers.get("content-length")),
            book.sizeBytes,
            "Source size changed",
          );
          const bytes = Buffer.from(await response.arrayBuffer());
          assert.equal(bytes.length, book.sizeBytes);
          assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
          assert.equal(
            createHash("sha256").update(bytes).digest("hex"),
            book.sha256,
            "Source SHA-256 changed",
          );
          // Re-read before a mutation so reruns preserve every completed asset.
          const current = (
            await api(`releases/${releaseId}/assets?per_page=100`)
          ).find((asset) => asset.name === `${book.id}.pdf`);
          if (!matches(current, book)) {
            if (current) {
              assert.equal(
                current.state,
                "starter",
                "Never replace a completed asset",
              );
              assert.ok(
                !current.digest,
                "Never remove an asset with a content digest",
              );
              await api(`releases/assets/${current.id}`, "DELETE");
            }
            const uploaded = await fetch(
              `https://uploads.github.com/repos/${repository}/releases/${releaseId}/assets?name=${encodeURIComponent(book.id + ".pdf")}`,
              {
                method: "POST",
                headers: {
                  ...headers,
                  "Content-Type": "application/pdf",
                  "Content-Length": String(bytes.length),
                },
                body: bytes,
                redirect: "error",
                signal: AbortSignal.timeout(180000),
              },
            );
            assert.equal(
              uploaded.status,
              201,
              `Upload HTTP ${uploaded.status}`,
            );
            assert.ok(
              matches(await uploaded.json(), book),
              "Remote digest must match the original catalog",
            );
          }
          completed++;
          console.log(
            JSON.stringify({
              verified: book.id,
              completed,
              total: books.length,
            }),
          );
        } catch (error) {
          failures.push({ bookId: book.id, error: error.message });
          console.error(JSON.stringify(failures.at(-1)));
        }
      }
    }),
  );
  const finalAssets = await api(`releases/${releaseId}/assets?per_page=100`);
  const verified = books.filter((book) =>
    matches(
      finalAssets.find((asset) => asset.name === `${book.id}.pdf`),
      book,
    ),
  );
  const report = {
    checkedAt: new Date().toISOString(),
    repository,
    releaseId,
    tag,
    draft: true,
    verifiedBooks: verified.length,
    totalBooks: books.length,
    failures,
  };
  await mkdir(".local", { recursive: true });
  await writeFile(
    ".local/textbook-runner-upload-report.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report));
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      `Verified **${verified.length}/${books.length}** original PDFs against catalog sizes and SHA-256 hashes. The release remains a draft. No deployment, database change or question approval occurred.\n`,
    );
  }
  assert.equal(
    verified.length,
    books.length,
    "Some textbooks remain unmirrored; keep hosted delivery disabled",
  );
}
