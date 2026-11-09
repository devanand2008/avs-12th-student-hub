import { getSession } from "@/lib/auth";
import { openPdfGuides } from "@/lib/open-pdf-guides";
export async function GET(
  request: Request,
  context: { params: Promise<{ guideId: string }> },
) {
  const user = await getSession();
  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", new URL(request.url).pathname);
    return Response.redirect(login, 303);
  }
  if (user.mustChangePassword)
    return Response.redirect(new URL("/change-password", request.url), 303);
  const { guideId } = await context.params;
  const guide = openPdfGuides.find((g) => g.id === guideId);
  if (!guide)
    return Response.json({ error: "Reference not found." }, { status: 404 });
  // Complete book downloads go to the immutable public asset, avoiding a
  // serverless proxy timeout on slow student connections. In-site reading
  // continues through the authenticated range reader.
  return new Response(null, {
    status: 303,
    headers: {
      Location: guide.hostedUrl,
      "Cache-Control": "private, no-store",
    },
  });
}
export const maxDuration = 300;
