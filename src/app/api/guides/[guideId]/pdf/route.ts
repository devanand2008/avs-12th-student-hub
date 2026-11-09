import { getSession } from "@/lib/auth";
import { openPdfGuides } from "@/lib/open-pdf-guides";
import { streamVerifiedPdf } from "@/lib/hosted-textbooks";
async function serve(
  request: Request,
  { params }: { params: Promise<{ guideId: string }> },
) {
  const user = await getSession();
  if (!user)
    return Response.json({ error: "Please sign in." }, { status: 401 });
  if (user.mustChangePassword)
    return Response.json(
      { error: "Please change your temporary password first." },
      { status: 403 },
    );
  const { guideId } = await params,
    g = openPdfGuides.find((g) => g.id === guideId);
  if (!g)
    return Response.json({ error: "Reference not found." }, { status: 404 });
  const response = await streamVerifiedPdf(
    request,
    g.hostedUrl,
    g.sizeBytes,
    `open-reference-${g.id}`,
  );
  if (new URL(request.url).searchParams.get("download") === "1" && response.ok)
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${g.id}.pdf"`,
    );
  return response;
}
export const GET = serve;
export const HEAD = serve;
export const maxDuration = 300;
