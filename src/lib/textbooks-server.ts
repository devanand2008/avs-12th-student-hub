import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import savedCatalog from "./textbooks-catalog.json";
import type { TextbookCatalog } from "./textbooks";
import { officialTextbookRewrite } from "./textbook-delivery";

export async function getTextbookCatalog(): Promise<TextbookCatalog> {
  let catalog = savedCatalog as TextbookCatalog;
  if (process.env.TEXTBOOK_DELIVERY === "official") {
    return {
      ...catalog,
      books: catalog.books.map((book) =>
        officialTextbookRewrite(book)
          ? { ...book, downloadError: null }
          : {
              ...book,
              localPath: null,
              status: "unavailable" as const,
              downloadError: "Use the official source link for this textbook.",
            },
      ),
    };
  }
  try {
    catalog = JSON.parse(
      await readFile(
        path.join(process.cwd(), "public", "textbooks", "manifest.json"),
        "utf8",
      ),
    ) as TextbookCatalog;
  } catch {
    // The checked-in catalog still provides official source links on hosts
    // that do not have this computer's downloaded library.
  }
  const books = await Promise.all(
    catalog.books.map(async (book) => {
      if (book.status !== "downloaded" || !book.localPath) return book;
      if (!/^\/textbooks\/[a-z0-9-]+\.pdf$/.test(book.localPath)) {
        return {
          ...book,
          localPath: null,
          status: "unavailable" as const,
          downloadError: "The local PDF path is invalid.",
        };
      }
      try {
        const file = await stat(
          path.join(process.cwd(), "public", book.localPath),
        );
        if (!file.isFile() || file.size !== book.sizeBytes)
          throw new Error("File missing or changed.");
        return book;
      } catch {
        return {
          ...book,
          localPath: null,
          status: "unavailable" as const,
          downloadError:
            "This server does not have the downloaded PDF. Use the official source link.",
        };
      }
    }),
  );
  return { ...catalog, books };
}
