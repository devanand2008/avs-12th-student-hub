"use client";
import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import {
  nextGiftStatuses,
  type AdminGiftClaim,
  type GiftStatus,
} from "@/lib/gifts";
async function readClaims(signal?: AbortSignal): Promise<AdminGiftClaim[]> {
  const r = await fetch("/api/admin/gifts", { cache: "no-store", signal });
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d.claims;
}
function ClaimEditor({
  claim,
  refresh,
}: {
  claim: AdminGiftClaim;
  refresh: () => Promise<void>;
}) {
  const [status, setStatus] = useState<GiftStatus>(claim.status),
    [gift, setGift] = useState(claim.gift),
    [delivery, setDelivery] = useState(claim.delivery_note),
    [notes, setNotes] = useState(claim.admin_notes),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (
      status === "delivered" &&
      !window.confirm(
        "Confirm this student has actually received the gift. This delivery stage is final.",
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/admin/gifts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: claim.id,
            version: claim.version,
            status,
            gift,
            deliveryNote: delivery,
            adminNotes: notes,
          }),
        }),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="min-w-0 rounded-2xl border bg-white p-5">
      <h2 className="text-lg font-bold">{claim.studentName}</h2>
      <p className="break-words text-sm text-slate-600">
        {claim.studentId || claim.user_id} · {claim.email} ·{" "}
        {claim.points.toLocaleString()} points
      </p>
      <p className="mt-2 font-bold capitalize">
        Current status: {claim.status}
      </p>
      {claim.status !== "delivered" && (
        <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold">
            Gift stage
            <select
              aria-label={`Gift stage for ${claim.studentName}`}
              className="mt-1 min-h-11 w-full rounded-xl border p-3"
              value={status}
              onChange={(e) => setStatus(e.target.value as GiftStatus)}
            >
              {nextGiftStatuses(claim.status).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Gift chosen
            <input
              className="mt-1 min-h-11 w-full rounded-xl border p-3"
              maxLength={200}
              value={gift}
              onChange={(e) => setGift(e.target.value)}
              required={["approved", "dispatched", "delivered"].includes(
                status,
              )}
            />
          </label>
          <label className="text-sm font-bold">
            Delivery update / rejection reason (student sees this)
            <textarea
              className="mt-1 w-full rounded-xl border p-3"
              maxLength={1000}
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
              required={["dispatched", "delivered", "rejected"].includes(
                status,
              )}
            />
          </label>
          <label className="text-sm font-bold">
            Private admin notes
            <textarea
              className="mt-1 w-full rounded-xl border p-3"
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button
            disabled={busy}
            className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save gift update"}
          </button>
          <p role="status">{message}</p>
        </form>
      )}
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-bold">
          Gift audit trail ({claim.history.length})
        </summary>
        <ol className="space-y-3 pt-3">
          {claim.history.map((h, i) => (
            <li key={i} className="border-l-2 pl-3">
              <p className="capitalize">
                {h.status} · {new Date(h.created_at).toLocaleString()}
              </p>
              <p>By {h.actor_id}</p>
              <p>
                {h.gift} {h.delivery_note}
              </p>
              {h.admin_notes && <p>Private: {h.admin_notes}</p>}
            </li>
          ))}
        </ol>
      </details>
    </article>
  );
}
export default function AdminGiftsPage() {
  const [claims, setClaims] = useState<AdminGiftClaim[] | null>(null),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/gifts", { cache: "no-store" }),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      setClaims(d.claims);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please retry.");
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    readClaims(controller.signal)
      .then((d) => {
        if (!controller.signal.aborted) setClaims(d);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Please retry.");
      });
    return () => controller.abort();
  }, []);
  return (
    <div className="flex flex-1 bg-slate-50">
      <Sidebar isAdmin />
      <main className="mx-auto min-w-0 w-full max-w-5xl space-y-5 px-4 py-8 pb-28">
        <header className="rounded-2xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-black">Milestone gifts</h1>
          <p className="mt-2 text-sm text-slate-200">
            Students request a gift at 100,000 points. Choose each gift, contact
            the student through the student directory, and record actual
            delivery. One gift per student; no points are deducted.
          </p>
          <button
            className="mt-4 min-h-11 rounded-xl bg-white px-4 py-2 text-slate-900"
            onClick={() => void load()}
          >
            Refresh gift requests
          </button>
        </header>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-4">
            {error}
          </p>
        )}
        {!claims ? (
          <p role="status">Loading requests…</p>
        ) : !claims.length ? (
          <p className="rounded-xl border bg-white p-5">
            No gift requests yet. Eligible students can request their gift on
            the learning scoreboard.
          </p>
        ) : (
          claims.map((c) => (
            <ClaimEditor
              key={`${c.id}:${c.version}`}
              claim={c}
              refresh={load}
            />
          ))
        )}
      </main>
    </div>
  );
}
