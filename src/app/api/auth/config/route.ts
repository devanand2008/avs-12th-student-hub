import { studentActivationMode } from "@/lib/auth/activation";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { studentActivationMode: studentActivationMode() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
