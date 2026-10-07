import { getSession } from "@/lib/auth";
import { getAllUserData } from "@/lib/db";
import { backendMode } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { studentActivationMode } from "@/lib/auth/activation";

export async function GET() {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  }
  try {
    return NextResponse.json(
      {
        users: await getAllUserData(session.userId),
        storageMode: backendMode(),
        studentActivationMode: studentActivationMode(),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load user data.",
      },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
