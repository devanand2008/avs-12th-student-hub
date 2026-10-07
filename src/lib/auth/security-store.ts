import {
  backendMode,
  requireSupabase,
  databaseError,
} from "@/lib/supabase/server";
declare global {
  var __AVS_REVOKED_SESSIONS__: Map<string, number> | undefined;
}
const local = (global.__AVS_REVOKED_SESSIONS__ ??= new Map<string, number>());
export async function isSessionRevoked(id: string) {
  if (backendMode() !== "supabase") return local.has(id);
  const { data, error } = await requireSupabase()
    .from("avs_revoked_sessions")
    .select("id")
    .eq("id", id)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw databaseError(error);
  return Boolean(data);
}
export async function revokeSession(id: string, expiresAt: number) {
  if (backendMode() !== "supabase") {
    local.set(id, expiresAt);
    for (const [key, expiry] of local)
      if (expiry < Date.now()) local.delete(key);
    return;
  }
  const { error } = await requireSupabase()
    .from("avs_revoked_sessions")
    .upsert({ id, expires_at: new Date(expiresAt).toISOString() });
  if (error) throw databaseError(error);
}
