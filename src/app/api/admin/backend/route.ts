import { getSession } from "@/lib/auth";
import { getPhoneOtpConfiguration } from "@/lib/auth/phone-configuration";
import { studentActivationMode } from "@/lib/auth/activation";
import { initDatabase, getAllStudents } from "@/lib/db";
import { backendMode, requireSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function GET() {
  const session = await getSession();
  if (session?.role !== "admin")
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  try {
    const mode = backendMode();
    await initDatabase();
    if (mode !== "supabase")
      return NextResponse.json({
        mode,
        connected: false,
        message:
          "Demo storage is temporary. Configure Supabase before creating real student accounts.",
      });
    const { error } = await requireSupabase()
      .from("learning_resources")
      .select("id")
      .limit(1);
    if (error) throw new Error("Apply the learning-resources migration.");
    const projectUrl = new URL(
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!,
    );
    const projectRef = projectUrl.hostname.endsWith(".supabase.co")
      ? projectUrl.hostname.split(".")[0]
      : undefined;
    return NextResponse.json({
      mode,
      connected: true,
      projectUrl: projectUrl.origin,
      projectRef,
      studentActivationMode: studentActivationMode(),
      phoneOtp:
        studentActivationMode() === "sms"
          ? await getPhoneOtpConfiguration()
          : undefined,
      studentCount: (await getAllStudents()).length,
      message:
        "Supabase is connected. Accounts, passwords, attempts and learning records are stored permanently.",
    });
  } catch {
    return NextResponse.json(
      {
        connected: false,
        mode: "supabase",
        error:
          "The backend is not ready. Check the server environment and apply the account and first-login OTP migrations.",
      },
      { status: 503 },
    );
  }
}
