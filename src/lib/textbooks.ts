export type TextbookMedium = "Tamil" | "English" | "Common";
export type TextbookCategory =
  "Languages" | "Science" | "Commerce" | "Arts" | "Vocational";

export interface Textbook {
  id: string;
  title: string;
  subject: string;
  medium: TextbookMedium;
  sourceMedium: "Tamil" | "English";
  category: TextbookCategory;
  class: number;
  volume: string | null;
  sourceTitle: string;
  sourceFile: string;
  sourceUrl: string;
  sourcePage: string;
  localPath: string | null;
  status: "downloaded" | "unavailable";
  sizeBytes: number | null;
  sha256: string | null;
  pages: number | null;
  edition: string | null;
  downloadedAt: string | null;
  downloadError: string | null;
}

export interface TextbookCatalog {
  source: string;
  sourcePage: string;
  cataloguedAt: string | null;
  verifiedAt: string | null;
  editionNote: string;
  books: Textbook[];
}

export function filterTextbooks(
  books: Textbook[],
  filters: { medium?: string; category?: string; search?: string },
) {
  const query = filters.search?.trim().toLocaleLowerCase() || "";
  return books.filter((book) => {
    const mediumMatches =
      !filters.medium ||
      filters.medium === "all" ||
      book.medium === filters.medium ||
      book.medium === "Common";
    const categoryMatches =
      !filters.category ||
      filters.category === "all" ||
      book.category === filters.category;
    const searchMatches =
      !query ||
      [book.title, book.subject, book.category, book.sourceTitle].some(
        (value) => value.toLocaleLowerCase().includes(query),
      );
    return mediumMatches && categoryMatches && searchMatches;
  });
}

export function textbookFileSize(sizeBytes: number | null) {
  return sizeBytes
    ? `${(sizeBytes / 1048576).toFixed(1)} MB`
    : "Not downloaded";
}
