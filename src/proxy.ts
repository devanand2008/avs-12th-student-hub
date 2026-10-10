import { decodeSession } from "@/lib/auth/session";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const api = path.startsWith("/api/");
  if (api && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const expected = process.env.APP_ORIGIN || request.nextUrl.origin;
    if (
      (origin && origin !== expected) ||
      request.headers.get("sec-fetch-site") === "cross-site"
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
      return NextResponse.json(
        { error: "Please sign in to continue." },
        { status: 401 },
      );
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }
  if (
    (path === "/admin" ||
      path.startsWith("/admin/") ||
      path.startsWith("/api/admin/")) &&
    session.role !== "admin"
  ) {
    if (api)
      return NextResponse.json(
        { error: "Admin authorization required" },
        { status: 403 },
      );
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (
    session.mustChangePassword &&
    path !== "/change-password" &&
    !["/api/auth/change-password", "/api/auth/logout"].includes(path)
  ) {
    if (api)
      return NextResponse.json(
        { error: "Please change your temporary password first." },
        { status: 403 },
      );
    return NextResponse.redirect(new URL("/change-password", request.url));
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
