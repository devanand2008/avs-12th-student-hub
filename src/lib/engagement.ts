import { getSupabase } from "@/lib/supabase/server";
import type { QuizSession } from "@/types";
export type PointEvent = { key: string; kind: string; points: number };
export function quizPointEvents(quiz: QuizSession): PointEvent[] {
  if (!quiz.isCompleted) return [];
  const answered = quiz.questionIds.filter(
    (id) => quiz.answers[id]?.selectedAnswer,
  );
  if (!answered.length || answered.length !== quiz.questionIds.length)
    return [];
  return [
    {
      key: `practice-complete:v2:${quiz.id}`,
      kind:
        quiz.mode === "timed" ? "Assessment completed" : "Practice completed",
      points: 10,
    },
  ];
}
export async function engagementRpc<T>(
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  const client = getSupabase();
  if (!client) throw Error("Points require persistent storage.");
  const { data, error } = await client.rpc(name, args);
  if (error) throw Error("Learning points are temporarily unavailable.");
  return data as T;
}
export async function awardPoints(userId: string, events: PointEvent[]) {
  return engagementRpc<number>("avs_award_points", {
    p_user_id: userId,
    p_events: events,
  });
}
// Learning and saved quiz results must remain usable during a rewards outage.
export async function tryAwardPoints(userId: string, events: PointEvent[]) {
  try {
    return { earned: await awardPoints(userId, events), saved: true };
  } catch {
    return { earned: 0, saved: false };
  }
}
export interface EngagementBoard {
  me: {
    points: number;
    display_name: string;
    leaderboard_visible: boolean;
    reminders_enabled: boolean;
    rank: number | null;
  } | null;
  leaders: { name: string; points: number; rank: number; isMe: boolean }[];
  recent: { kind: string; points: number; created_at: string }[];
}
