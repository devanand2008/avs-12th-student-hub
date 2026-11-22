export const loginMessages = {
  invalid: "Email or password is incorrect.",
  required: "Please enter your email address and password.",
  inactive: "This account is inactive. Please contact your administrator.",
  profile: "Please contact your administrator to restore your student profile.",
  approval:
    "Your account is waiting for administrator approval. Ask your administrator to approve it and give you a temporary password.",
  limited: "Too many login attempts. Please wait 1 minute before trying again.",
  session:
    "Your browser could not keep you signed in. Allow cookies for SkillUp and try again. If you opened this page from another app, open SkillUp directly in Chrome or Safari.",
  invalidSession:
    "Your sign-in session could not be verified. Please try signing in again.",
  unavailable: "Sign-in is temporarily unavailable. Please try again shortly.",
} as const;

export function safeLoginRedirect(value: unknown): string | undefined {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\x00-\x20\x7f]/.test(value) ||
    value.length > 2048
  )
    return;
  const url = new URL(value, "https://skillup.invalid");
  if (
    url.origin !== "https://skillup.invalid" ||
    /^\/(login|register|api|auth\/continue)(\/|$)/i.test(url.pathname) ||
    /^\/\//.test(url.pathname)
  )
    return;
  return url.pathname + url.search + url.hash;
}
