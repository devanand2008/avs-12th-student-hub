import { authenticateUser, createSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { BackendUnavailableError } from "@/lib/supabase/server";
import { phoneLoginPath } from "@/lib/auth/phone";
import {
  requiresStudentActivation,
  studentActivationMode,
} from "@/lib/auth/activation";
import { loginMessages, safeLoginRedirect } from "@/lib/auth/login-form";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = request.headers
    .get("content-type")
    ?.startsWith("application/x-www-form-urlencoded");
  let redirect: string | undefined;
  const headers = { "Cache-Control": "no-store" };
  const go = (path: string) =>
    new NextResponse(null, {
      status: 303,
      headers: { ...headers, Location: path },
    });
  const fail = (
    reason: keyof typeof loginMessages,
    status: number,
    code?: string,
  ) => {
    if (!form)
      return NextResponse.json(
        { error: loginMessages[reason], ...(code ? { code } : {}) },
        { status, headers },
      );
    const params = new URLSearchParams({ error: reason });
    if (redirect) params.set("redirect", redirect);
    return go("/login?" + params);
  };

  try {
    const ip = request.headers.get("x-forwarded-for") || "local";
    const rl = await checkRateLimit(`login_${ip}`, 20, 60);
    if (!rl.success) return fail("limited", 429);

    const body = form
      ? Object.fromEntries(await request.formData())
      : await request.json();
    redirect = safeLoginRedirect(body.redirect);
    const loginId = typeof body.loginId === "string" ? body.loginId.trim() : "";
    const { password } = body;
    if (
      !loginId ||
      loginId.length > 254 ||
      typeof password !== "string" ||
      !password ||
      Buffer.byteLength(password, "utf8") > 72
    )
      return fail("required", 400);

    const authResult = await authenticateUser(loginId, password);
    if (!authResult.success || !authResult.user) {
      const reason =
        authResult.error === loginMessages.inactive
          ? "inactive"
          : authResult.error === loginMessages.profile
            ? "profile"
            : "invalid";
      return fail(reason, 401);
    }

    if (authResult.student && requiresStudentActivation(authResult.student)) {
      if (studentActivationMode() === "admin")
        return fail("approval", 403, "ADMIN_APPROVAL_REQUIRED");
      const redirectTo = phoneLoginPath(authResult.student.studentPhone);
      if (form) return go(redirectTo);
      return NextResponse.json(
        {
          error: "Verify your mobile number once before your first login.",
          code: "PHONE_VERIFICATION_REQUIRED",
          redirectTo,
        },
        { status: 403, headers },
      );
    }
    const session = await createSession(authResult.user, authResult.student);

    const destination = session.mustChangePassword
      ? "/change-password"
      : authResult.user.role === "admin"
        ? "/admin"
        : "/dashboard";
    if (form) {
      const target = session.mustChangePassword
        ? destination
        : redirect || destination;
      return browserSignInResponse(target);
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: authResult.user.id,
          role: authResult.user.role,
          email: authResult.user.email,
          studentId: authResult.student?.studentId,
          studentName: authResult.student?.studentName,
          stream: authResult.student?.stream,
          mustChangePassword: session.mustChangePassword,
        },
        redirectTo: destination,
      },
      { headers },
    );
  } catch (error) {
    return fail(
      "unavailable",
      error instanceof BackendUnavailableError ? 503 : 500,
    );
  }
}

// Commit the first-party cookie on a normal document response before
// navigating. This avoids relying on cookie handling inside a POST redirect.
function browserSignInResponse(destination: string) {
  const next = "/auth/continue?redirect=" + encodeURIComponent(destination);
  return new NextResponse(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <meta http-equiv="refresh" content="0; url=${next}">
  <title>Opening SkillUp</title>
  <style>
    body{margin:0;background:#eff5ff;color:#142b63;font:1rem system-ui,sans-serif}
    main{max-width:24rem;margin:12vh auto;padding:2rem;text-align:center}
    a{display:inline-block;padding:.75rem 1.25rem;border-radius:.75rem;background:#142b63;color:white}
  </style>
</head>
<body>
  <main>
    <h1>Opening SkillUp</h1>
    <a href="${next}">Continue to SkillUp</a>
  </main>
</body>
</html>`,
    {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}
