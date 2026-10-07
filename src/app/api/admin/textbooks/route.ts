import { getSession } from "@/lib/auth";
import { getTextbookCatalog } from "@/lib/textbooks-server";

export async function GET() {
  const session = await getSession();
  if (session?.role !== "admin")
    return Response.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  return Response.json(await getTextbookCatalog());
}
