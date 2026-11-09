"use client";
import { useState } from "react";
export default function Unsubscribe() {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function stop() {
    setBusy(true);
    try {
      const token = new URLSearchParams(location.search).get("token");
      const r = await fetch("/api/reminders/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await r.json();
      setMessage(r.ok ? "Study reminders are turned off." : d.error);
    } catch {
      setMessage("Could not connect. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-xl space-y-5 px-5 py-16">
      <h1 className="text-3xl font-black">Study reminder preferences</h1>
      <p>
        Turn off inactivity reminder emails. Your account and learning progress
        will stay available.
      </p>
      <button
        disabled={busy}
        onClick={() => void stop()}
        className="rounded-xl bg-blue-700 px-5 py-3 text-white"
      >
        {busy ? "Updating…" : "Turn off study reminders"}
      </button>
      <p role="status">{message}</p>
    </main>
  );
}
