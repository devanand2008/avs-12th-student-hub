"use client";
import { useEffect, useState } from "react";
import Link from "@/components/layout/IntentLink";
import { ArrowUpRight, Crown, Sparkles, Trophy } from "lucide-react";
import type { EngagementBoard } from "@/lib/engagement";
import { giftPotential, rankLabel } from "@/lib/score-potential";
import styles from "./PointsCard.module.css";

export default function PointsCard() {
  const [me, setMe] = useState<EngagementBoard["me"]>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/engagement", { signal: c.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (c.signal.aborted) return;
        setMe(d?.me ?? null);
        setStatus(d?.me ? "ready" : "unavailable");
      })
      .catch(() => {
        if (!c.signal.aborted) setStatus("unavailable");
      });
    return () => c.abort();
  }, []);

  const points = me?.points ?? 0;
  const potential = giftPotential(points);
  const rank = me
    ? !me.leaderboard_visible
      ? "Private"
      : me.rank
        ? rankLabel(me.rank)
        : "Not ranked yet"
    : "—";

  return (
    <Link
      href="/leaderboard"
      aria-label="Open your learning scoreboard"
      className={styles.card}
    >
      <div className={styles.cyanGlow} aria-hidden="true" />
      <div className={styles.violetGlow} aria-hidden="true" />
      <div className={styles.panel}>
        <div className={styles.intro}>
          <span className={styles.badge}>
            <Sparkles size={14} aria-hidden="true" /> Skill Up scoreboard
          </span>
          <h2>Your learning points</h2>
          <p>Small steps. Real progress. Keep your learning streak going.</p>
          <span className={styles.rewardNote}>
            <Trophy size={15} aria-hidden="true" />
            Complete a quiz or full video to earn 10 points.
          </span>
        </div>

        <div className={styles.summary} aria-live="polite" aria-atomic="true">
          <div className={styles.stats}>
            <div>
              <span className={styles.label}>Total points</span>
              <span className={styles.points}>
                {status === "ready" ? points.toLocaleString("en-IN") : "—"}
              </span>
            </div>
            <div className={styles.rank}>
              <span className={styles.label}>
                <Crown size={14} aria-hidden="true" /> Your rank
              </span>
              <span className={styles.rankValue}>{rank}</span>
            </div>
          </div>
          {status === "ready" ? (
            <div className={styles.potential}>
              <div>
                <span>Gift potential</span>
                <strong>{potential}%</strong>
              </div>
              <progress
                aria-label="Progress towards the 100,000-point gift"
                value={Math.min(Math.max(points, 0), 100000)}
                max={100000}
              />
              <span className={styles.milestone}>Towards 1,00,000 points</span>
            </div>
          ) : (
            <p className={styles.status}>
              {status === "loading"
                ? "Loading your points…"
                : "Points are temporarily unavailable. Open the scoreboard to retry."}
            </p>
          )}
          <span className={styles.action}>
            View scoreboard <ArrowUpRight size={18} aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
