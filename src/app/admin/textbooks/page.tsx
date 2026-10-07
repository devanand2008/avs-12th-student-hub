import { getSession } from "@/lib/auth";
import { getTextbookCatalog } from "@/lib/textbooks-server";
import TextbookLibrary from "@/app/textbooks/TextbookLibrary";
import { redirect } from "next/navigation";

export default async function AdminTextbooksPage() {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/login");
  return <TextbookLibrary catalog={await getTextbookCatalog()} isAdmin />;
}
