"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Sparkles, ArrowRight } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import type { EngagementBoard } from "@/lib/engagement";
import GiftProgress from "./GiftProgress";
import ScorePodium from "./ScorePodium";
import { giftPotential } from "@/lib/score-potential";
async function readBoard(
  endpoint: string,
  signal?: AbortSignal,
): Promise<EngagementBoard> {
  const r = await fetch(endpoint, { cache: "no-store", signal }),
    d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d;
}
export default function LearningScoreboard({
  isAdmin = false,
}: {
  isAdmin?: boolean;
}) {
  const endpoint = isAdmin ? "/api/admin/leaderboard" : "/api/engagement";
  const [data, setData] = useState<EngagementBoard | null>(null),
    [error, setError] = useState(""),
    [name, setName] = useState(""),
    [visible, setVisible] = useState(true),
    [reminders, setReminders] = useState(true),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const accept = useCallback((d: EngagementBoard) => {
    setError("");
    setData(d);
    if (d.me) {
      setName(d.me.display_name);
      setVisible(d.me.leaderboard_visible);
      setReminders(d.me.reminders_enabled);
    }
  }, []);
  async function load() {
    try {
      accept(await readBoard(endpoint));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load points.");
    }
  }
  useEffect(() => {
    const c = new AbortController();
    readBoard(endpoint, c.signal)
      .then((d) => {
        if (!c.signal.aborted) accept(d);
      })
      .catch((e) => {
        if (!c.signal.aborted)
          setError(e instanceof Error ? e.message : "Could not load points.");
      });
    return () => c.abort();
  }, [accept, endpoint]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const r = await fetch("/api/engagement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, visible, reminders }),
      });
      if (!r.ok) throw Error("Could not save preferences.");
      setNotice("Preferences saved.");
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-1 bg-slate-50">
      <Sidebar isAdmin={isAdmin} />
      <main className="mx-auto w-full min-w-0 max-w-5xl space-y-6 px-4 py-8 pb-28">
        <header className="rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-800 p-6 text-white shadow-lg sm:p-8">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-200">
            <Trophy size={20} aria-hidden="true" /> Skill Up · Learning rewards
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Learning scoreboard
          </h1>
          <p className="mt-3 max-w-xl text-blue-100">
            Every small step counts. Points are learning rewards, separate from
            exam marks.
          </p>
          {isAdmin && (
            <p className="mt-3 text-sm text-blue-100">
              Administrator view · Read-only rankings. Hidden profiles stay
              private.
            </p>
          )}
          <button
            onClick={() => void load()}
            className="mt-5 rounded-xl border border-white/40 px-4 py-2 text-sm font-bold hover:bg-white/10"
          >
            Refresh scoreboard
          </button>
        </header>
        {error ? (
          <div role="alert" className="rounded-xl bg-red-50 p-4">
            {error}
            <button onClick={() => void load()} className="ml-3 underline">
              Retry
            </button>
          </div>
        ) : !data ? (
          <p role="status">Loading points…</p>
        ) : (
          <>
            {!isAdmin && (
              <section className="relative overflow-hidden rounded-3xl border border-indigo-300 bg-gradient-to-br from-indigo-950 via-blue-800 to-teal-600 p-6 text-white shadow-xl sm:p-8">
                <Sparkles className="mb-2 text-amber-200" aria-hidden="true" />
                <p>Your points</p>
                <p className="mt-2 text-5xl font-black">
                  {(data.me?.points ?? 0).toLocaleString()}
                </p>
                <p>
                  {data.me?.rank
                    ? `Your rank: ${data.me.rank}`
                    : "Your profile is hidden from the scoreboard."}
                </p>
                <Link
                  href="/practice"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-blue-900 shadow-sm"
                >
                  Keep learning <ArrowRight size={18} />
                </Link>
                <div className="mt-6 max-w-lg rounded-2xl bg-black/15 p-4 ring-1 ring-white/20">
                  <p className="flex justify-between text-sm font-bold">
                    <span>Your gift potential</span>
                    <span>{giftPotential(data.me?.points ?? 0)}%</span>
                  </p>
                  <progress
                    aria-label="Your gift potential"
                    max={100000}
                    value={Math.min(data.me?.points ?? 0, 100000)}
                    className="mt-3 h-3 w-full accent-amber-300"
                  />
                  <p className="mt-2 text-xs text-blue-100">
                    Progress toward your 100,000-point gift. This measures
                    earned points, not future exam performance.
                  </p>
                </div>
              </section>
            )}
            {!isAdmin && <GiftProgress points={data.me?.points ?? 0} />}
            {isAdmin && (
              <Link
                href="/admin/gifts"
                className="block rounded-xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-900"
              >
                Manage 100,000-point gifts →
              </Link>
            )}
            <section className="overflow-hidden rounded-2xl border bg-white">
              <div className="border-b p-5">
                <h2 className="text-xl font-bold">Top learners</h2>
                <p className="mt-1 text-sm text-slate-500">
                  All-time points · Up to 50 visible learners · Equal scores
                  share a rank
                </p>
              </div>
              <ScorePodium leaders={data.leaders} />
              {data.leaders.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="p-3">Rank</th>
                        <th className="p-3">Learner</th>
                        <th className="p-3">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.leaders.map((p, i) => (
                        <tr
                          key={i}
                          className={
                            p.isMe
                              ? "border-l-4 border-l-blue-600 bg-blue-50 font-bold"
                              : "border-t border-slate-100 hover:bg-slate-50"
                          }
                        >
                          <td className="p-3">{p.rank}</td>
                          <td className="p-3 break-words">
                            {p.name}
                            {p.isMe ? " (you)" : ""}
                          </td>
                          <td className="p-3">{p.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="p-5">
                  No learners are visible yet. Start a lesson or quiz to build
                  your score.
                </p>
              )}
            </section>
            <section className="rounded-2xl border bg-white p-5">
              <h2 className="text-xl font-bold">How points work</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                <li>
                  Fully watch a video in our player: 10 points, once per video.
                  Skipping sections or marking a video watched earns no points.
                </li>
                <li>
                  Complete a one-mark practice or timed assessment: 10 points
                  per attempt. Answer every question. Resubmitting the same
                  attempt earns no extra points.
                </li>
                <li>
                  Complete a supplied collection attempt: 10 participation
                  points. Its unverified answers do not earn correctness
                  bonuses.
                </li>
                <li>
                  Reach 100,000 points to request one admin-arranged gift. Your
                  admin chooses the gift and delivery arrangements. Your points
                  are not deducted.
                </li>
                <li>
                  Notes still earn 1 point once per item. Existing balances and
                  exam marks are unchanged. Equal scores share a rank.
                </li>
              </ul>
            </section>
            {!isAdmin && (
              <form
                onSubmit={save}
                className="space-y-4 rounded-2xl border bg-white p-5"
              >
                <h2 className="text-xl font-bold">Your preferences</h2>
                <label className="block">
                  Scoreboard display name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={40}
                    className="mt-1 block w-full rounded-lg border p-3"
                  />
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => setVisible(e.target.checked)}
                  />
                  Show me on the scoreboard
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={reminders}
                    onChange={(e) => setReminders(e.target.checked)}
                  />
                  Email me a study reminder after 3 inactive days, at most once
                  a week
                </label>
                <p className="text-sm text-slate-500">
                  Reminder delivery is available only when the school configures
                  its email service. Your email and contact details never appear
                  on the scoreboard.
                </p>
                <button
                  disabled={busy}
                  className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save preferences"}
                </button>
                <p role="status">{notice}</p>
              </form>
            )}
            {!isAdmin && (
              <section className="rounded-2xl border bg-white p-5">
                <h2 className="text-xl font-bold">Recent rewards</h2>
                {data.recent.length ? (
                  <ul>
                    {data.recent.map((e, i) => (
                      <li
                        key={i}
                        className="flex justify-between border-b py-3"
                      >
                        <span>{e.kind}</span>
                        <strong>+{e.points}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    No rewards yet. Open a lesson or submit a quiz to begin.
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
