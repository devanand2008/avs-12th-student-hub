import { loadEnvConfig } from "@next/env";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import catalogJson from "../src/lib/textbooks-catalog.json";
import { officialTextbookRewrite } from "../src/lib/textbook-delivery";
import { requireSupabase } from "../src/lib/supabase/server";
import type { TextbookCatalog } from "../src/lib/textbooks";
import type { AIKnowledgeChunk, StreamType } from "../src/types";

loadEnvConfig(process.cwd());
const dryRun = process.argv.includes("--dry-run");
const catalog = catalogJson as TextbookCatalog;
const selectedSubjects = new Set([
  "Computer Science",
  "Bio-Botany",
  "Bio-Zoology",
  "Mathematics",
  "Tamil",
]);

async function main() {
  await mkdir(".local", { recursive: true });
  const rows: { kind: "knowledge"; id: string; data: AIKnowledgeChunk }[] = [];
  const sources = [];
  for (const book of catalog.books.filter((entry) =>
    selectedSubjects.has(entry.subject),
  )) {
    if (!officialTextbookRewrite(book) || !book.localPath || !book.sha256)
      throw new Error(`The source metadata is incomplete for ${book.id}.`);
    const bytes = await readFile(
      path.join(process.cwd(), "public", book.localPath),
    );
    if (createHash("sha256").update(bytes).digest("hex") !== book.sha256)
      throw new Error(`The downloaded textbook changed: ${book.id}.`);
    const streams: StreamType[] =
      book.subject === "Computer Science"
        ? ["Computer Science"]
        : ["Bio-Botany", "Bio-Zoology"].includes(book.subject)
          ? ["Biology"]
          : ["Computer Science", "Biology"];
    const task = getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: true,
      verbosity: 0,
    });
    let excerpts = 0;
    let pages = 0;
    try {
      const document = await task.promise;
      pages = document.numPages;
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const text = content.items
          .filter((item) => "str" in item)
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/gu, " ")
          .trim();
        page.cleanup();
        if (
          text.length < 100 ||
          (text.match(/[\p{L}\p{M}]/gu)?.length || 0) < 50
        )
          continue;
        let offset = 0;
        let index = 0;
        while (offset < text.length) {
          let end = Math.min(offset + 2400, text.length);
          if (end < text.length) {
            const boundary = text.lastIndexOf(" ", end);
            if (boundary > offset + 1600) end = boundary;
          }
          const excerpt = text.slice(offset, end).trim();
          offset = end;
          index++;
          if (excerpt.length < 100) continue;
          excerpts++;
          for (const stream of streams) {
            const id = `textbook-${book.id}-${book.sha256.slice(0, 12)}-p${pageNumber}-c${index}-${stream === "Biology" ? "bio" : "cs"}`;
            const data: AIKnowledgeChunk = {
              id,
              stream,
              subjectName: book.subject,
              chapterTitle: `${book.title}${book.volume ? ` — Volume ${book.volume}` : ""}`,
              topicTitle: `${book.sourceMedium} medium — PDF page ${pageNumber}`,
              chunkText: excerpt,
              chunkTextTamil:
                book.sourceMedium === "Tamil" ? excerpt : undefined,
              sourceType: "Textbook",
            };
            rows.push({ kind: "knowledge", id, data });
          }
        }
      }
    } finally {
      await task.destroy();
    }
    if (!excerpts) throw new Error(`No readable text was found in ${book.id}.`);
    sources.push({
      id: book.id,
      pages,
      excerpts,
      streams,
      sha256: book.sha256,
    });
    console.log(
      `${book.subject} (${book.sourceMedium}): ${excerpts} verified excerpts from ${pages} pages.`,
    );
  }
  if (!dryRun) {
    const client = requireSupabase();
    for (let offset = 0; offset < rows.length; offset += 75) {
      const { error } = await client
        .from("avs_curriculum")
        .upsert(rows.slice(offset, offset + 75), { onConflict: "kind,id" });
      if (error)
        throw new Error("Could not save the verified textbook excerpts.");
    }
    const { count, error } = await client
      .from("avs_curriculum")
      .select("id", { count: "exact", head: true })
      .eq("kind", "knowledge")
      .like("id", "textbook-%");
    if (error || count !== rows.length)
      throw new Error(
        "The stored textbook excerpt count could not be verified.",
      );
  }
  const report = {
    dryRun,
    books: sources.length,
    excerpts: rows.length,
    sources,
    checkedAt: new Date().toISOString(),
  };
  await writeFile(
    ".local/textbook-knowledge-index.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    `${rows.length} source excerpts ${dryRun ? "validated without database changes" : "stored and verified in Supabase"}.`,
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Textbook indexing failed.",
  );
  process.exitCode = 1;
});
