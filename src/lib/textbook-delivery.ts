import type { Textbook } from "./textbooks";

export function officialTextbookRewrite(book: Textbook) {
  if (!book.localPath || !/^\/textbooks\/[a-z0-9-]+\.pdf$/.test(book.localPath))
    return null;
  try {
    const destination = new URL(book.sourceUrl);
    if (
      destination.protocol !== "https:" ||
      destination.hostname !== "d1e5r329t7a85t.cloudfront.net" ||
      destination.port ||
      destination.username ||
      destination.password ||
      destination.search ||
      destination.hash ||
      !destination.pathname.endsWith(".pdf")
    )
      return null;
    return { source: book.localPath, destination: destination.href };
  } catch {
    return null;
  }
}
