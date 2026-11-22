import { getSession, hasSessionCookie } from "@/lib/auth";
import { safeLoginRedirect } from "@/lib/auth/login-form";

export async function GET(request: Request) {
  const redirect = safeLoginRedirect(
    new URL(request.url).searchParams.get("redirect"),
  );
  let destination: string;

  try {
    const session = await getSession();
    if (session) {
      destination = session.mustChangePassword
        ? "/change-password"
        : redirect || (session.role === "admin" ? "/admin" : "/dashboard");
    } else {
      destination = retryLocation(
        (await hasSessionCookie()) ? "invalidSession" : "session",
        redirect,
      );
    }
  } catch {
    destination = retryLocation("unavailable", redirect);
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: destination,
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
    },
  });
}

function retryLocation(error: string, redirect?: string) {
  const params = new URLSearchParams({ error });
  if (redirect) params.set("redirect", redirect);
  return "/login?" + params;
}
