import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { Textbook } from "../../src/lib/textbooks";
import type { ExtractedBook } from "./textbook-question-parser";

export function completedTextPages(
  saved: ExtractedBook | undefined,
  book: Pick<Textbook, "id" | "sha256">,
  pageCount: number,
) {
  if (!saved || saved.id !== book.id || saved.sha256 !== book.sha256)
    return new Map<number, string>();
  const pages = new Map<number, string>();
  for (const entry of saved.pages) {
    if (
      !Number.isInteger(entry.page) ||
      entry.page < 1 ||
      entry.page > pageCount ||
      typeof entry.text !== "string" ||
      pages.has(entry.page)
    )
      throw new Error(
        "Invalid or duplicate cached PDF page; preserve and reconcile the cache.",
      );
    pages.set(entry.page, entry.text);
  }
  return pages;
}
async function atomicJson(file: string, data: unknown) {
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(data));
  await rename(temporary, file);
}
/** Reuses existing PDF.js caches; records every failed page and resumes only missing pages. */
export async function extractText(
  book: Textbook,
  root = process.cwd(),
): Promise<ExtractedBook> {
  if (!book.localPath || !book.sha256)
    throw new Error(`Download and verify ${book.id} first.`);
  const directory = path.join(root, ".local/textbook-text");
  await mkdir(directory, { recursive: true });
  const cache = path.join(directory, `${book.id}.json`);
  const progressFile = path.join(directory, `${book.id}.progress.json`);
  let saved: (ExtractedBook & { outlineResolved?: boolean }) | undefined;
  try {
    saved = JSON.parse(await readFile(cache, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT")
      throw new Error(`Unreadable existing text cache: ${book.id}`);
  }
  const bytes = await readFile(path.join(root, "public", book.localPath));
  if (createHash("sha256").update(bytes).digest("hex") !== book.sha256)
    throw new Error(`Source checksum mismatch: ${book.id}`);
  const task = getDocument({
    data: new Uint8Array(bytes),
    verbosity: 0,
    useSystemFonts: true,
  });
  try {
    const document = await task.promise;
    const pages = completedTextPages(saved, book, document.numPages);
    const reusedCompleteCache =
      pages.size === document.numPages && saved?.outlineResolved === true;
    const failedPages: { page: number; error: string }[] = [];
    async function resolve(
      items: Awaited<ReturnType<typeof document.getOutline>>,
    ): Promise<ExtractedBook["outline"]> {
      return Promise.all(
        (items || []).map(async (item) => {
          const dest =
            typeof item.dest === "string"
              ? await document.getDestination(item.dest)
              : item.dest;
          let page: number | undefined;
          try {
            if (dest)
              page =
                typeof dest[0] === "number"
                  ? dest[0] + 1
                  : (await document.getPageIndex(dest[0])) + 1;
          } catch {
            /* Unresolved outline destinations stay explicit. */
          }
          return {
            title: item.title,
            page,
            items: (await resolve(item.items)) || [],
          };
        }),
      );
    }
    let outline =
      saved?.sha256 === book.sha256 && saved.outlineResolved
        ? saved.outline
        : null;
    const checkpoint = async (complete = false) => {
      const ordered = [...pages]
        .sort(([a], [b]) => a - b)
        .map(([page, text]) => ({ page, text }));
      if (!reusedCompleteCache)
        await atomicJson(cache, {
          id: book.id,
          sha256: book.sha256,
          pages: ordered,
          outline,
          outlineResolved: complete,
        });
      await atomicJson(progressFile, {
        checkedAt: new Date().toISOString(),
        sourceSha256: book.sha256,
        totalPages: document.numPages,
        completedPages: ordered.map((p) => p.page),
        failedPages,
        unreadableOrSparsePages: ordered
          .filter((p) => p.text.replace(/\s/gu, "").length < 30)
          .map((p) => p.page),
        complete,
      });
    };
    for (let number = 1; number <= document.numPages; number++) {
      if (pages.has(number)) continue;
      let page;
      try {
        page = await document.getPage(number);
        const content = await page.getTextContent();
        const text = content.items
          .filter((item) => "str" in item)
          .map((item) =>
            "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "",
          )
          .join("")
          .toWellFormed()
          .replaceAll("\u0000", " ")
          .replace(/[^\S\n]+/g, " ")
          .replace(/ *\n */g, "\n")
          .trim();
        pages.set(number, text);
      } catch (error) {
        failedPages.push({
          page: number,
          error:
            error instanceof Error ? error.message : "Text extraction failed",
        });
      } finally {
        page?.cleanup();
      }
      if (number % 25 === 0 || failedPages.length) await checkpoint();
    }
    outline = await resolve(await document.getOutline());
    await checkpoint(
      failedPages.length === 0 && pages.size === document.numPages,
    );
    if (failedPages.length)
      throw new Error(
        `${book.id}: pages ${failedPages.map((p) => p.page).join(", ")} failed; recorded for a resumed run.`,
      );
    return {
      id: book.id,
      sha256: book.sha256,
      pages: [...pages]
        .sort(([a], [b]) => a - b)
        .map(([page, text]) => ({ page, text })),
      outline,
    };
  } finally {
    await task.destroy();
  }
}
