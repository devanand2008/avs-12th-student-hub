import { getSession } from "@/lib/auth";
import { getTextbookCatalog } from "@/lib/textbooks-server";
import { notFound } from "next/navigation";
import TextbookReader from "../TextbookReader";

export default async function TextbookReaderPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  if (!/^[a-z0-9-]+$/.test(bookId)) notFound();
  const catalog = await getTextbookCatalog();
  const book = catalog.books.find((entry) => entry.id === bookId);
  if (!book) notFound();
  const session = await getSession();
  return (
    <TextbookReader
      key={book.id}
      book={book}
      isAdmin={session?.role === "admin"}
    />
  );
}
