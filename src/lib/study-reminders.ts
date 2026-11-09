import { createHmac, timingSafeEqual } from "node:crypto";
import { engagementRpc } from "./engagement";
const origin = "https://avs-12th-student-hub.vercel.app";
export function reminderConfiguration() {
  return {
    enabled: process.env.REMINDERS_ENABLED === "true",
    providerConfigured: Boolean(
      process.env.RESEND_API_KEY &&
      process.env.REMINDER_FROM_EMAIL &&
      process.env.SESSION_SECRET &&
      process.env.CRON_SECRET,
    ),
    inactivityDays: 3,
    cooldownDays: 7,
  };
}
export function unsubscribeToken(userId: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw Error("Reminder signing unavailable.");
  const payload = Buffer.from(userId).toString("base64url");
  return (
    payload +
    "." +
    createHmac("sha256", secret)
      .update("study-reminder:" + payload)
      .digest("base64url")
  );
}
export function unsubscribeOwner(token: string) {
  if (token.length > 500 || !process.env.SESSION_SECRET) return null;
  const [p, s, extra] = token.split(".");
  if (!p || !s || extra) return null;
  const expected = unsubscribeToken(
    Buffer.from(p, "base64url").toString(),
  ).split(".")[1];
  const a = Buffer.from(expected),
    b = Buffer.from(s);
  return a.length === b.length && timingSafeEqual(a, b)
    ? Buffer.from(p, "base64url").toString()
    : null;
}
export function reminderMessage(name: string, url: string) {
  return {
    subject: "Your next small step with Skill Up | மீண்டும் படிக்கலாம்",
    text: `Hello ${name.slice(0, 80)},\n\nYour Skill Up lessons and practice are ready when you are. Try one short video or a few one-mark questions today.\n\nContinue learning: ${origin}/dashboard\n\nமீண்டும் கற்க வரவேற்கிறோம்! ஒரு காணொளி அல்லது சில ஒரு மதிப்பெண் வினாக்களுடன் தொடங்கலாம்.\n\nYou received this reminder because you have not opened Skill Up for at least 3 days. We send at most one reminder a week. You can turn reminders off in your scoreboard preferences.\n\nUnsubscribe: ${url}`,
  };
}
interface ReminderJob {
  id: string;
  userId: string;
  email: string;
  name: string;
}
export async function runStudyReminders() {
  const config = reminderConfiguration();
  if (!config.enabled || !config.providerConfigured)
    return { sent: 0, failed: 0, cancelled: 0, disabled: true };
  const jobs = await engagementRpc<ReminderJob[]>("avs_claim_reminders", {
    p_limit: 20,
  });
  let sent = 0,
    failed = 0,
    cancelled = 0;
  for (const job of jobs) {
    // Recheck opt-out and recent return after claiming, before any provider call.
    const board = await engagementRpc<{
      me: { reminders_enabled: boolean; last_seen: string } | null;
    }>("avs_engagement_board", { p_user_id: job.userId });
    if (
      !board.me?.reminders_enabled ||
      Date.now() - Date.parse(board.me.last_seen) < 3 * 86400000
    ) {
      await engagementRpc("avs_finish_reminder", {
        p_id: job.id,
        p_status: "cancelled",
      });
      cancelled++;
      continue;
    }
    const url = `${origin}/unsubscribe?token=${encodeURIComponent(unsubscribeToken(job.userId))}`;
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `study-reminder/${job.id}`,
        },
        body: JSON.stringify({
          from: process.env.REMINDER_FROM_EMAIL,
          to: [job.email],
          ...reminderMessage(job.name || "learner", url),
        }),
        signal: AbortSignal.timeout(12000),
      });
      if (!r.ok) throw Error("Provider rejected delivery");
      const d = await r.json();
      if (typeof d.id !== "string") throw Error("Missing delivery receipt");
      await engagementRpc("avs_finish_reminder", {
        p_id: job.id,
        p_status: "sent",
        p_provider_id: d.id,
      });
      sent++;
    } catch {
      await engagementRpc("avs_finish_reminder", {
        p_id: job.id,
        p_status: "failed",
      });
      failed++;
    }
  }
  return { sent, failed, cancelled, disabled: false };
}
