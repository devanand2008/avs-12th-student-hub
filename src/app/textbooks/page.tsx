import { getSession } from "@/lib/auth";
import { getTextbookCatalog } from "@/lib/textbooks-server";
import TextbookLibrary from "./TextbookLibrary";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/textbooks");

export default async function TextbooksPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string | string[] }>;
}) {
  const query = await searchParams;
  const initialSearch = typeof query.search === "string" ? query.search : "";
  const session = await getSession();
  return (
    <TextbookLibrary
      catalog={await getTextbookCatalog()}
      isAdmin={session?.role === "admin"}
      initialSearch={initialSearch}
    />
  );
}
