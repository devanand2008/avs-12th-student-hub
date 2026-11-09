export class ResetPasswordError extends Error {}

export function validateReplacementPassword(
  value: unknown,
): string | undefined {
  if (value === undefined) return undefined;
  if (
    typeof value !== "string" ||
    value.length < 10 ||
    Buffer.byteLength(value, "utf8") > 72
  )
    throw new ResetPasswordError(
      "Use at least 10 characters and no more than 72 UTF-8 bytes for the replacement password.",
    );
  return value;
}
