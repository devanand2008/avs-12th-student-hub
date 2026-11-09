import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { engagementRpc } from "@/lib/engagement";
import type { StudentGift } from "@/lib/gifts";
async function gift(requestGift: boolean) {
  const user = await getSession();
  if (!user || user.role !== "student")
    return NextResponse.json(
      { error: "Student sign-in required." },
      { status: 401 },
    );
  try {
    const data = await engagementRpc<StudentGift>("avs_student_gift", {
      p_user_id: user.userId,
      p_request: requestGift,
    });
    return NextResponse.json(data, {
      status: requestGift && !data.eligible ? 409 : 200,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Gift information could not be saved or loaded. Please retry." },
      { status: 503 },
    );
  }
}
export async function GET() {
  return gift(false);
}
export async function POST() {
  return gift(true);
}
