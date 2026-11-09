import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
const schema = z.object({
  id: z.string().uuid(),
  user: z.string(),
  collection: z.string(),
  ids: z.array(z.string()).min(1).max(500),
  expires: z.number(),
});
function signature(body: string) {
  if (!process.env.SESSION_SECRET) throw Error("Reward signing unavailable.");
  return createHmac("sha256", process.env.SESSION_SECRET)
    .update("supplied-completion-v2:" + body)
    .digest("base64url");
}
export function issueCompletionToken(
  user: string,
  collection: string,
  ids: string[],
) {
  const body = Buffer.from(
    JSON.stringify({
      id: randomUUID(),
      user,
      collection,
      ids,
      expires: Date.now() + 24 * 60 * 60 * 1000,
    }),
  ).toString("base64url");
  return body + "." + signature(body);
}
export function readCompletionToken(
  token: string,
  user: string,
  collection: string,
) {
  try {
    if (token.length > 150000) return null;
    const [body, sig, extra] = token.split(".");
    if (!body || !sig || extra) return null;
    const expected = Buffer.from(signature(body)),
      received = Buffer.from(sig);
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    )
      return null;
    const parsed = schema.safeParse(
      JSON.parse(Buffer.from(body, "base64url").toString()),
    );
    if (
      !parsed.success ||
      parsed.data.user !== user ||
      parsed.data.collection !== collection ||
      parsed.data.expires < Date.now()
    )
      return null;
    return parsed.data;
  } catch {
    return null;
  }
}
