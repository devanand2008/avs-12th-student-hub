import { engagementRpc } from "@/lib/engagement";
import { unsubscribeOwner } from "@/lib/study-reminders";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  try {
    const body = await request.json(),
      owner =
        typeof body.token === "string" ? unsubscribeOwner(body.token) : null;
    if (!owner)
      return NextResponse.json(
        { error: "This unsubscribe link is invalid." },
        { status: 400 },
      );
    await engagementRpc("avs_unsubscribe_reminders", { p_user_id: owner });
    return NextResponse.json({ unsubscribed: true });
  } catch {
    return NextResponse.json(
      { error: "Could not update reminders. Please retry." },
      { status: 503 },
    );
  }
}
