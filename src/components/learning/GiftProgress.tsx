"use client";
import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { GIFT_MILESTONE, type StudentGift } from "@/lib/gifts";
export default function GiftProgress({ points }: { points: number }) {
  const [data, setData] = useState<StudentGift | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/engagement/gifts", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (!controller.signal.aborted) setData(d);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [points]);
  async function requestGift() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/engagement/gifts", { method: "POST" }),
        d = await r.json();
      if (!r.ok)
        throw Error(
          d.error || "Reach 100,000 points before requesting a gift.",
        );
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please retry.");
    } finally {
      setBusy(false);
    }
  }
  const score = data?.points ?? points;
  return (
    <section
      aria-label="Gift milestone"
      className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 sm:p-6"
    >
      <Gift className="mb-2 text-amber-600" aria-hidden="true" />
      <h2 className="text-xl font-black">Your 100,000-point gift</h2>
      <p className="mt-2 text-sm text-slate-600">
        Reach 100,000 Skill Up points to request one milestone gift. Your admin
        chooses the gift and arranges delivery with you. Points stay in your
        balance.
      </p>
      <p className="mt-4 font-bold">
        {score.toLocaleString()} / 100,000 points
      </p>
      <progress
        aria-label="Gift progress"
        className="mt-2 h-3 w-full accent-amber-500"
        value={Math.min(score, GIFT_MILESTONE)}
        max={GIFT_MILESTONE}
      />
      <p className="mt-2 text-sm">
        {score >= GIFT_MILESTONE
          ? "Milestone reached!"
          : `${(GIFT_MILESTONE - score).toLocaleString()} points to go`}
      </p>
      {data?.claim ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4">
          <p className="font-bold capitalize">
            Gift status: {data.claim.status}
          </p>
          {data.claim.gift && <p className="mt-1">Gift: {data.claim.gift}</p>}
          <p className="mt-2 text-sm">
            {data.claim.delivery_note ||
              "Your admin will choose the gift and contact you to arrange delivery. No shipment has been confirmed yet."}
          </p>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-bold">
              Request history
            </summary>
            <ol className="space-y-2 pt-2">
              {data.history.map((h, i) => (
                <li key={i}>
                  <span className="capitalize">{h.status}</span> ·{" "}
                  {new Date(h.created_at).toLocaleString()}
                  {h.delivery_note && <p>{h.delivery_note}</p>}
                </li>
              ))}
            </ol>
          </details>
        </div>
      ) : (
        <button
          disabled={busy || !data?.eligible}
          onClick={() => void requestGift()}
          className="mt-4 min-h-11 rounded-xl bg-amber-700 px-5 py-3 font-bold text-white disabled:bg-slate-200 disabled:text-slate-500"
        >
          {busy ? "Saving request…" : "Request my gift"}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}{" "}
          <button
            className="underline"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </p>
      )}
    </section>
  );
}
