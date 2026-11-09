import { getSession } from "@/lib/auth";
import { listResources } from "@/lib/content";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    const params = new URL(request.url).searchParams;
    const resources = await listResources("video", session.role === "admin");
    const id = params.get("id");
    if (id) {
      const resource = resources.find((item) => item.id === id);
      return resource
        ? NextResponse.json(
            { video: resource },
            {
              headers: {
                "Cache-Control":
                  "private, max-age=30, s-maxage=30, stale-while-revalidate=60",
              },
            },
          )
        : NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }
    return NextResponse.json(
      {
        videos: params.get("chapterId")
          ? resources.filter(
              (item) => item.chapterId === params.get("chapterId"),
            )
          : resources,
      },
      {
        headers: {
          "Cache-Control":
            "private, max-age=30, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        error: "Study resources are temporarily unavailable. Please try again.",
      },
      { status: 503 },
    );
  }
}
