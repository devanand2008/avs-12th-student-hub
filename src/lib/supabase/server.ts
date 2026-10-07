import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class BackendUnavailableError extends Error {
  constructor(
    message = "Connect Supabase and apply the database migrations before using the backend.",
  ) {
    super(message);
    this.name = "BackendUnavailableError";
  }
}

export function backendMode(): "supabase" | "demo" | "unconfigured" {
  const url = (
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  )?.trim();
  const key = (
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim();
  if (process.env.DB_DRIVER === "memory") {
    if (process.env.ENABLE_DEMO_DATA !== "true")
      throw new BackendUnavailableError(
        "Memory storage requires explicit demo mode.",
      );
    return "demo";
  }
  if (url || key) {
    if (!url || !key)
      throw new BackendUnavailableError(
        "Supabase configuration is incomplete. Set the project URL and server secret key.",
      );
    return "supabase";
  }
  return process.env.ENABLE_DEMO_DATA === "true" ? "demo" : "unconfigured";
}

export function getSupabase(): SupabaseClient | null {
  if (typeof window !== "undefined")
    throw new Error("The Supabase server client cannot run in a browser.");
  if (backendMode() !== "supabase") return null;
  const url = (process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL)!.trim();
  const key = (process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY)!.trim();
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function requireSupabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) throw new BackendUnavailableError();
  return client;
}

export function databaseError(error: {
  code?: string;
  message: string;
}): Error {
  if (error.code === "23505")
    return new Error(
      "An account with this student ID, register number, email or phone number already exists.",
    );
  if (["42P01", "42883", "PGRST202", "PGRST205"].includes(error.code || ""))
    return new BackendUnavailableError(
      "Supabase schema is missing. Apply the AVS database migrations in order.",
    );
  return new BackendUnavailableError(
    "The database request failed. Check the connection and Supabase server logs.",
  );
}
