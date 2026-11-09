import { getSession } from "@/lib/auth";
import { engagementRpc, type EngagementBoard } from "@/lib/engagement";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getSession();
  if (user?.role !== "admin")
    return NextResponse.json(
      { error: "Administrator required." },
      { status: 403 },
    );
  try {
    // Read only: do not create an engagement profile or reveal hidden learners.
    const board = await engagementRpc<EngagementBoard>("avs_engagement_board", {
      p_user_id: user.userId,
    });
    return NextResponse.json(
      { me: null, leaders: board.leaders, recent: [] },
      {
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Scoreboard could not be loaded. Please retry." },
      { status: 503 },
    );
  }
}
