import { getSession } from "@/lib/auth";
import { engagementRpc, type EngagementBoard } from "@/lib/engagement";
import { NextResponse } from "next/server";
import { z } from "zod";
const prefs = z.object({
  name: z.string().trim().min(1).max(40),
  visible: z.boolean(),
  reminders: z.boolean(),
});
export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "student")
    return NextResponse.json(
      { error: "Student sign-in required." },
      { status: 401 },
    );
  try {
    await engagementRpc("avs_touch_engagement", { p_user_id: user.userId });
    const board = await engagementRpc<EngagementBoard>("avs_engagement_board", {
      p_user_id: user.userId,
    });
    return NextResponse.json(board, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Points could not be loaded. Please retry." },
      { status: 503 },
    );
  }
}
export async function PATCH(request: Request) {
  const user = await getSession();
  if (!user || user.role !== "student")
    return NextResponse.json(
      { error: "Student sign-in required." },
      { status: 401 },
    );
  try {
    const p = prefs.safeParse(await request.json());
    if (!p.success)
      return NextResponse.json(
        { error: "Check your display name and preferences." },
        { status: 400 },
      );
    await engagementRpc("avs_touch_engagement", { p_user_id: user.userId });
    await engagementRpc("avs_engagement_preferences", {
      p_user_id: user.userId,
      p_name: p.data.name,
      p_visible: p.data.visible,
      p_reminders: p.data.reminders,
    });
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json(
      { error: "Preferences could not be saved." },
      { status: 503 },
    );
  }
}
