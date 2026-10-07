import { getTextbookCatalog } from "@/lib/textbooks-server";
import { filterTextbooks } from "@/lib/textbooks";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const catalog = await getTextbookCatalog();
  return Response.json({
    ...catalog,
    books: filterTextbooks(catalog.books, {
      medium: search.get("medium") || "all",
      category: search.get("category") || "all",
      search: search.get("q") || "",
    }),
  });
}
