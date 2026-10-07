import {
  backendMode,
  requireSupabase,
  databaseError,
  BackendUnavailableError,
} from "@/lib/supabase/server";
// Simple memory-based rate limiter for API protection
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export async function checkRateLimit(
  key: string,
  maxRequests = 30,
  windowSeconds = 60,
): Promise<{ success: boolean; remaining: number }> {
  const mode = backendMode();
  if (mode === "unconfigured") throw new BackendUnavailableError();
  if (mode === "supabase") {
    const { data, error } = await requireSupabase().rpc(
      "avs_check_rate_limit",
      { p_key: key, p_max: maxRequests, p_window_seconds: windowSeconds },
    );
    if (error) throw databaseError(error);
    return data;
  }
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return { success: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  record.count += 1;
  return { success: true, remaining: maxRequests - record.count };
}
