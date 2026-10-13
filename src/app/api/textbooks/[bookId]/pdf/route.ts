import { getSession } from "@/lib/auth";
import { streamHostedTextbook } from "@/lib/hosted-textbooks";
import catalog from "@/lib/textbooks-catalog.json";
import type { Textbook } from "@/lib/textbooks";

export const runtime = "nodejs";

async function serve(
  request: Request,
  context: { params: Promise<{ bookId: string }> },
) {
  const session = await getSession();
  if (!session)
    return Response.json({ error: "Please sign in." }, { status: 401 });
  if (session.mustChangePassword)
    return Response.json(
      { error: "Please change your temporary password first." },
      { status: 403 },
    );
  const { bookId } = await context.params;
  const book = catalog.books.find((entry) => entry.id === bookId);
  if (process.env.TEXTBOOK_DELIVERY !== "github-release" || !book)
    return Response.json(
      { error: "Hosted textbook not found." },
      { status: 404 },
    );
  return streamHostedTextbook(request, book as Textbook);
}

export const GET = serve;
export const HEAD = serve;
