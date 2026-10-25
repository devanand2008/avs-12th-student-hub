import { getSession } from "@/lib/auth";
import { listResources } from "@/lib/content";
import { streamVerifiedPdf } from "@/lib/hosted-textbooks";
import supplied from "@/lib/supplied-materials-catalog.json";
import { NextResponse } from "next/server";
import type { HandwrittenNote } from "@/types";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { noteId } = await params;
  try {
    const note = (await listResources("note", session.role === "admin")).find(
      (n) => n.id === noteId,
    ) as HandwrittenNote | undefined;
    const source =
      note &&
      supplied.find(
        (s) =>
          s.kind === "note" &&
          s.file === note.sourceFile &&
          s.sha256 === note.sha256 &&
          s.hostedUrl === note.pdfUrl &&
          s.sizeBytes === note.sizeBytes,
      );
    if (!note || !source)
      return NextResponse.json(
        { error: "Verified supplied PDF not found." },
        { status: 404 },
      );
    return streamVerifiedPdf(
      request,
      source.hostedUrl,
      source.sizeBytes,
      note.id,
    );
  } catch {
    return NextResponse.json(
      { error: "The PDF is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
export const HEAD = GET;
