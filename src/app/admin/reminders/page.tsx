"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
export default function Reminders() {
  const [status, setStatus] = useState<{
      enabled: boolean;
      providerConfigured: boolean;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/admin/reminders")
      .then(async (r) => {
        if (!r.ok) throw Error("Could not load reminder configuration.");
        setStatus(await r.json());
      })
      .catch((e) => setError(e.message));
  }, []);
  return (
    <div className="flex flex-1">
      <Sidebar isAdmin />
      <main className="mx-auto max-w-3xl space-y-5 px-5 py-10">
        <h1 className="text-3xl font-black">Study reminder email</h1>
        <p role="status">
          {error ||
            (!status
              ? "Loading…"
              : status.enabled && status.providerConfigured
                ? "Email delivery enabled"
                : "Email delivery disabled — sender setup required")}
        </p>
        <p>
          Reminders are checked daily, after 3 inactive days, at most once every
          7 days. Students can opt out on the learning scoreboard or through the
          email link. No reminder is sent to inactive accounts or placeholder
          email addresses.
        </p>
        <p>
          To activate delivery, configure a Resend account with a verified
          sending domain, then set server-only RESEND_API_KEY,
          REMINDER_FROM_EMAIL and CRON_SECRET. Set REMINDERS_ENABLED=true only
          after sender verification. Do not paste secrets into this page or
          student-facing forms.
        </p>
        <p>
          Provider acceptance is recorded separately from actual inbox delivery.
          Failed or uncertain deliveries are held until the next weekly
          eligibility window.
        </p>
      </main>
    </div>
  );
}
