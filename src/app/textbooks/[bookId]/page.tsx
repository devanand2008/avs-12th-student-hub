import { getSession } from "@/lib/auth";
import { getTextbookCatalog } from "@/lib/textbooks-server";
import { notFound } from "next/navigation";
import TextbookReader from "../TextbookReader";

export default async function TextbookReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { bookId } = await params;
  if (!/^[a-z0-9-]+$/.test(bookId)) notFound();
  const catalog = await getTextbookCatalog();
  const book = catalog.books.find((entry) => entry.id === bookId);
  if (!book) notFound();
  const query = await searchParams;
  const initialPage = Math.min(
    book.pages || 2000,
    Math.max(1, Math.trunc(Number(query.page) || 1)),
  );
  const session = await getSession();
  return (
    <TextbookReader
      key={book.id}
      book={book}
      isAdmin={session?.role === "admin"}
      initialPage={initialPage}
    />
  );
}
