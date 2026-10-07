import { createHash } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const libraryDirectory = path.join(root, "public", "textbooks");
const catalogPath = path.join(root, "src", "lib", "textbooks-catalog.json");
const sourcePage = "https://scert.tnschools.gov.in/textbook";
const officialHome = "https://scert.tnschools.gov.in/";
const catalogEndpoint =
  "https://24iv009qs1.execute-api.ap-south-1.amazonaws.com/emis-prod/e-learn/textbook";
const publicCdn = "https://d1e5r329t7a85t.cloudfront.net/";
const options = new Set(process.argv.slice(2));
const onlyVerify = options.has("--verify");
const refresh = options.has("--refresh");
const syncDatabase = options.has("--sync-db");
const timestamp = new Date().toISOString();
// SCERT's public catalog has this misspelling in one object key. The corrected
// object was independently fetched from the same official CDN and verified.
const sourceFileCorrections = {
  "12th_Std_Basic_Electronics_Enginering_EM_optimised.pdf":
    "12th_Std_Basic_Electronics_Engineering_EM_optimised.pdf",
};

const subjects = {
  Accountacny: "Accountancy",
  "Advance Tamil": "Advanced Tamil",
  "Bio-Chemistry": "Biochemistry",
  "Biology-Botany": "Bio-Botany",
  "Biology-Zoology": "Bio-Zoology",
  "Basic Civil Engieering": "Basic Civil Engineering",
  "Basic Electronics Enginering": "Basic Electronics Engineering",
  "Basic Electrtical Enginering": "Basic Electrical Engineering",
  "General Tamil": "Tamil",
  "General English": "English",
  "OSS & Typography Computer Apps":
    "Office Management, Secretaryship & Typography",
  "Textiles & Dress Designing": "Textiles and Dress Designing",
  "Nursing General": "General Nursing",
};

function subjectOf(sourceTitle) {
  const title = sourceTitle
    .replace(/^12th Std\s+/i, "")
    .replace(/\s*(Tamil|English) Medium(?:_New)?/i, "")
    .replace(/\s*\b(TM|EM)\b/g, "")
    .replace(/\s*Vol[- ]?\d+/i, "")
    .replace(/\.pdf$/i, "")
    .trim();
  return subjects[title] || title;
}

function categoryOf(subject) {
  if (
    ["Tamil", "Advanced Tamil", "English", "Communicative English"].includes(
      subject,
    )
  )
    return "Languages";
  if (
    [
      "Accountancy",
      "Auditing",
      "Commerce",
      "Economics",
      "Business Mathematics & Statistics",
    ].includes(subject)
  )
    return "Commerce";
  if (
    [
      "History",
      "Geography",
      "Political Science",
      "Ethics and Indian Culture",
    ].includes(subject)
  )
    return "Arts";
  if (
    subject.startsWith("Basic ") ||
    [
      "Agricultural Science",
      "Computer Technology",
      "Food Service Management",
      "Nursing Vocational",
      "Office Management, Secretaryship & Typography",
      "Textile Technology",
      "Textiles and Dress Designing",
    ].includes(subject)
  )
    return "Vocational";
  return "Science";
}

function localTarget(id) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error("Invalid textbook identifier.");
  const target = path.resolve(libraryDirectory, `${id}.pdf`);
  if (path.dirname(target) !== libraryDirectory)
    throw new Error("Unsafe textbook file path.");
  return target;
}

async function fetchOfficial(url, extra = {}) {
  const response = await fetch(url, {
    ...extra,
    headers: { "User-Agent": "AVS12Hub-TextbookLibrary/1.0", ...extra.headers },
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Official source returned HTTP ${response.status}.`);
  }
  return response;
}

async function discoverCatalog() {
  // This anonymous public catalog is the same request made by the SCERT
  // textbook page. Read its public client configuration afresh; no login,
  // student records, private APIs, or stored credentials are involved.
  const html = await (await fetchOfficial(officialHome)).text();
  const mainScript = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)]
    .map((match) => match[1])
    .find((source) => /^main\.[a-z0-9]+\.js$/i.test(source));
  if (!mainScript)
    throw new Error(
      "SCERT changed its public textbook page. Existing files remain available.",
    );
  const script = await (
    await fetchOfficial(new URL(mainScript, officialHome))
  ).text();
  const publicClientKey = script.match(/this\.authorization1="([^"]+)"/)?.[1];
  if (!publicClientKey)
    throw new Error("SCERT public catalog configuration is unavailable.");
  const records = [];
  for (const medium of ["Tamil", "English"]) {
    const endpoint = new URL(catalogEndpoint);
    endpoint.search = new URLSearchParams({
      status1: "1",
      filetype: "PDF",
      std: "12",
      medium,
    }).toString();
    const response = await fetchOfficial(endpoint, {
      headers: {
        "x-api-key": publicClientKey,
        Origin: new URL(officialHome).origin,
      },
    });
    const result = await response.json();
    if (!Array.isArray(result))
      throw new Error("Unexpected SCERT textbook catalog response.");
    for (const record of result) {
      if (
        record.class !== 12 ||
        record.medium !== medium ||
        record.file_type !== "PDF" ||
        typeof record.content_name !== "string" ||
        typeof record.content_name_s3 !== "string"
      )
        continue;
      const subject = subjectOf(record.content_name);
      const slug = subject
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const volume = record.content_name.match(/Vol[- ]?(\d+)/i)?.[1] || null;
      const suffix = createHash("sha256")
        .update(record.content_name_s3)
        .digest("hex")
        .slice(0, 8);
      const id = `12-${slug}-${medium.toLowerCase()}${volume ? `-v${volume}` : ""}-${suffix}`;
      records.push({
        id,
        title: `${subject}${volume ? ` — Volume ${volume}` : ""}`,
        subject,
        medium: [
          "Tamil",
          "Advanced Tamil",
          "English",
          "Communicative English",
        ].includes(subject)
          ? "Common"
          : medium,
        sourceMedium: medium,
        category: categoryOf(subject),
        class: 12,
        volume,
        sourceTitle: record.content_name,
        sourceFile: record.content_name_s3,
        sourceUrl: new URL(
          encodeURIComponent(
            sourceFileCorrections[record.content_name_s3] ||
              record.content_name_s3,
          ),
          publicCdn,
        ).href,
        sourcePage,
        localPath: null,
        status: "unavailable",
        sizeBytes: null,
        sha256: null,
        pages: null,
        edition: null,
        downloadedAt: null,
        downloadError: null,
      });
    }
  }
  // Exact source duplicates are not separate books.
  return [...new Map(records.map((book) => [book.id, book])).values()];
}

function verifyPdf(buffer) {
  if (
    buffer.length < 10_000 ||
    buffer.subarray(0, 5).toString("ascii") !== "%PDF-"
  )
    throw new Error("The source did not return a valid textbook PDF.");
  if (!buffer.subarray(-2048).toString("latin1").includes("%%EOF"))
    throw new Error("The PDF download is incomplete.");
  const firstObjects = buffer.subarray(0, 4096).toString("latin1");
  const pages = /\/Linearized\s+[\d.]+[\s\S]*?\/N\s+(\d+)/.exec(
    firstObjects,
  )?.[1];
  return {
    sizeBytes: buffer.length,
    sha256: createHash("sha256").update(buffer).digest("hex"),
    pages: pages ? Number(pages) : null,
  };
}

async function loadExisting() {
  try {
    return JSON.parse(await readFile(catalogPath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return { books: [], cataloguedAt: null };
  }
}

await mkdir(libraryDirectory, { recursive: true });
const existing = await loadExisting();
const existingBooks = new Map(existing.books.map((book) => [book.id, book]));
let books;
try {
  books = onlyVerify ? existing.books : await discoverCatalog();
} catch (error) {
  if (!existing.books.length) throw error;
  console.warn(`${error.message} Using the saved official catalog.`);
  books = existing.books;
}
if (!books.length)
  throw new Error(
    "No catalog is available. Run the importer online once before verifying.",
  );
let next = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (next < books.length) {
      const book = books[next++];
      const target = localTarget(book.id);
      try {
        let verification;
        const saved = existingBooks.get(book.id);
        try {
          verification = verifyPdf(await readFile(target));
          if (saved?.sha256 && saved.sha256 !== verification.sha256)
            throw new Error("Saved PDF checksum does not match the manifest.");
          if (refresh && !onlyVerify) verification = null;
        } catch (error) {
          if (onlyVerify) throw error;
          verification = null;
        }
        if (!verification) {
          let lastError;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const response = await fetchOfficial(book.sourceUrl);
              const buffer = Buffer.from(await response.arrayBuffer());
              verification = verifyPdf(buffer);
              await writeFile(`${target}.part`, buffer);
              await rename(`${target}.part`, target);
              break;
            } catch (error) {
              lastError = error;
            }
          }
          if (!verification) throw lastError;
        }
        Object.assign(book, verification, {
          localPath: `/textbooks/${book.id}.pdf`,
          status: "downloaded",
          downloadedAt: saved?.downloadedAt || timestamp,
          downloadError: null,
        });
        console.log(
          `Ready: ${book.title} (${book.sourceMedium}, ${(verification.sizeBytes / 1048576).toFixed(1)} MB)`,
        );
      } catch (error) {
        Object.assign(book, {
          localPath: null,
          status: "unavailable",
          sizeBytes: null,
          sha256: null,
          pages: null,
          downloadedAt: null,
          downloadError: error.message,
        });
        console.warn(
          `Unavailable: ${book.title} (${book.sourceMedium}) — ${error.message}`,
        );
        await unlink(`${target}.part`).catch(() => {});
      }
    }
  }),
);
books.sort(
  (a, b) =>
    a.subject.localeCompare(b.subject) ||
    a.medium.localeCompare(b.medium) ||
    a.title.localeCompare(b.title) ||
    a.id.localeCompare(b.id),
);
const manifest = {
  source: "SCERT Tamil Nadu public textbook catalog",
  sourcePage,
  cataloguedAt: onlyVerify ? existing.cataloguedAt : timestamp,
  verifiedAt: timestamp,
  editionNote:
    "The public source does not supply an edition year. Confirm the edition with your school.",
  books,
};
await writeFile(
  `${catalogPath}.part`,
  JSON.stringify(manifest, null, 2) + "\n",
);
await rename(`${catalogPath}.part`, catalogPath);
await writeFile(
  path.join(libraryDirectory, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);

if (syncDatabase) {
  try {
    process.loadEnvFile?.(path.join(root, ".env.local"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error(
      "Local PDFs are ready. Supabase sync requires a project URL and server secret key in .env.local.",
    );
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const rows = books.map((book) => ({
    id: book.id,
    title: book.title,
    subject: book.subject,
    medium: book.medium,
    source_medium: book.sourceMedium,
    category: book.category,
    class: book.class,
    volume: book.volume,
    source_title: book.sourceTitle,
    source_file: book.sourceFile,
    source_url: book.sourceUrl,
    source_page: book.sourcePage,
    local_path: book.localPath,
    status: book.status,
    size_bytes: book.sizeBytes,
    sha256: book.sha256,
    pages: book.pages,
    edition: book.edition,
    downloaded_at: book.downloadedAt,
    download_error: book.downloadError,
    verified_at: timestamp,
  }));
  const { error } = await client
    .from("textbooks")
    .upsert(rows, { onConflict: "id" });
  if (error)
    throw new Error(
      `Local PDFs are ready. Supabase textbook sync failed (${error.code || "database error"}); apply the textbook library migration and check the server configuration.`,
    );
  console.log(
    `Synced ${rows.length} textbook metadata rows to Supabase. PDF files remain local.`,
  );
}

const available = books.filter((book) => book.status === "downloaded");
const total = available.reduce((sum, book) => sum + book.sizeBytes, 0);
console.log(
  `${available.length}/${books.length} official catalog records ready; ${(total / 1048576).toFixed(1)} MB stored locally. Manifest: public/textbooks/manifest.json`,
);
if (available.length !== books.length) process.exitCode = 1;
