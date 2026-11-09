import { Crown, Medal, Sparkles } from "lucide-react";
import { giftPotential, rankLabel } from "@/lib/score-potential";
import type { EngagementBoard } from "@/lib/engagement";
export default function ScorePodium({
  leaders,
}: {
  leaders: EngagementBoard["leaders"];
}) {
  const podium = leaders.filter((p) => p.points > 0 && p.rank <= 3).slice(0, 3);
  if (!podium.length)
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-cyan-50 p-6 text-center text-sm text-slate-600">
        The podium is ready for your first completed lesson or quiz.
      </div>
    );
  return (
    <div
      aria-label="Leading learners"
      className="grid gap-4 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-5 sm:grid-cols-3 sm:items-end sm:pt-10"
    >
      {podium.map((p, i) => {
        const first = p.rank === 1,
          tied = leaders.filter((q) => q.rank === p.rank).length > 1;
        return (
          <article
            key={`${p.name}:${i}`}
            className={`relative min-w-0 overflow-hidden rounded-3xl border p-5 text-white shadow-lg ${first ? "border-amber-300 bg-gradient-to-br from-amber-500 via-orange-600 to-rose-700 sm:-translate-y-3" : p.rank === 2 ? "border-slate-300 bg-gradient-to-br from-slate-600 via-slate-700 to-indigo-950" : "border-orange-300 bg-gradient-to-br from-orange-700 via-amber-900 to-stone-950"}`}
          >
            <div
              className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10"
              aria-hidden="true"
            />
            <span className="relative inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 text-sm font-black">
              {first ? (
                <Crown size={23} aria-hidden="true" />
              ) : (
                <Medal size={23} aria-hidden="true" />
              )}
              {tied ? "Joint " : ""}
              {rankLabel(p.rank)}
              {first ? " · Champion" : ""}
            </span>
            <div
              className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-black ring-1 ring-white/30"
              aria-hidden="true"
            >
              {Array.from(p.name)[0]?.toLocaleUpperCase()}
            </div>
            <h3 className="mt-3 truncate text-lg font-black" title={p.name}>
              {p.name}
            </h3>
            <p className="mt-1 text-3xl font-black">
              {p.points.toLocaleString()}{" "}
              <span className="text-sm font-semibold text-white/80">
                points
              </span>
            </p>
            <div className="mt-5 border-t border-white/20 pt-3">
              <p className="flex items-center gap-1 text-xs font-semibold">
                <Sparkles size={14} aria-hidden="true" />
                Gift potential · {giftPotential(p.points)}%
              </p>
              <progress
                aria-label={`Gift potential for ${p.name}`}
                max={100000}
                value={Math.min(p.points, 100000)}
                className="mt-2 h-2 w-full accent-amber-200"
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
