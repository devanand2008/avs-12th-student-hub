import { decodeSession } from "@/lib/auth/session";
import { NextResponse, type NextRequest } from "next/server";

function privateSessionResponse(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.append("Vary", "Cookie");
  return response;
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const api = path.startsWith("/api/");
  if (api && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const expected = process.env.APP_ORIGIN || request.nextUrl.origin;
    const fetchSite = request.headers.get("sec-fetch-site");
    const isLoginForm =
      path === "/api/auth/login" &&
      request.headers
        .get("content-type")
        ?.startsWith("application/x-www-form-urlencoded");
    // Older browsers may send a Referer instead of an Origin on form submissions.
    const sameOriginForm =
      origin ||
      fetchSite === "same-origin" ||
      request.headers.get("referer")?.startsWith(expected + "/");
    if (
      (origin && origin !== expected) ||
      fetchSite === "cross-site" ||
      (isLoginForm && !sameOriginForm)
    ) {
      return NextResponse.json(
        { error: "This request must come from the learning hub." },
        { status: 403 },
      );
    }
  }
  const publicApi = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/config",
    "/api/auth/me",
    "/api/auth/otp/send",
    "/api/auth/otp/verify",
    "/api/auth/otp/status",
    "/api/subjects",
    "/api/cron/reminders",
    "/api/reminders/unsubscribe",
    "/api/pdf/golden-formula-sheet",
  ];
  const protectedPage = [
    "/admin",
    "/dashboard",
    "/subjects",
    "/notes",
    "/videos",
    "/practice",
    "/textbook-practice",
    "/performance",
    "/leaderboard",
    "/profile",
    "/bookmarks",
    "/ai-helper",
    "/search",
    "/change-password",
  ].some((prefix) => path === prefix || path.startsWith(prefix + "/"));
  if (!protectedPage && (!api || publicApi.includes(path)))
    return NextResponse.next();
  const token = request.cookies.get("avs_session")?.value;
  const session = token ? decodeSession(token) : null;
  if (!session) {
    if (api)
      return privateSessionResponse(
        NextResponse.json(
          { error: "Please sign in to continue." },
          { status: 401 },
        ),
      );
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", path + request.nextUrl.search);
    return privateSessionResponse(NextResponse.redirect(url));
  }
  if (
    (path === "/admin" ||
      path.startsWith("/admin/") ||
      path.startsWith("/api/admin/")) &&
    session.role !== "admin"
  ) {
    if (api)
      return privateSessionResponse(
        NextResponse.json(
          { error: "Admin authorization required" },
          { status: 403 },
        ),
      );
    return privateSessionResponse(
      NextResponse.redirect(new URL("/dashboard", request.url)),
    );
  }
  if (
    session.mustChangePassword &&
    path !== "/change-password" &&
    !["/api/auth/change-password", "/api/auth/logout"].includes(path)
  ) {
    if (api)
      return privateSessionResponse(
        NextResponse.json(
          { error: "Please change your temporary password first." },
          { status: 403 },
        ),
      );
    return privateSessionResponse(
      NextResponse.redirect(new URL("/change-password", request.url)),
    );
  }
  return privateSessionResponse(NextResponse.next());
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
