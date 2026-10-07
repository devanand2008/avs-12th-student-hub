"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, RotateCw } from "lucide-react";
import OtpShell from "@/components/auth/OtpShell";
import { useStudentActivation } from "@/components/auth/useStudentActivation";
type Status = { maskedPhone: string; expiresAt: number; resendAt: number };

export default function OtpLoginPage() {
  const activationMode = useStudentActivation();
  const [status, setStatus] = useState<Status | null>(null);
  const [token, setToken] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/otp/status", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        if (!cancelled) setStatus(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error
              ? err.message
              : "Request a new OTP to continue.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);
  const remaining = Math.max(
    0,
    Math.ceil(((status?.expiresAt || 0) - now) / 1000),
  );
  const resendIn = Math.max(
    0,
    Math.ceil(((status?.resendAt || 0) - now) / 1000),
  );
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Could not verify OTP.");
      window.location.assign(data.redirectTo);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect. Please try again.",
      );
      setBusy(false);
    }
  }
  async function resend() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Could not resend OTP.");
      setStatus(data);
      setToken("");
      setNow(Date.now());
      setMessage("A new code was sent. Use the latest SMS.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend OTP.");
    } finally {
      setBusy(false);
    }
  }
  if (activationMode !== "sms")
    return (
      <OtpShell
        title={
          activationMode === "admin"
            ? "Administrator approval required"
            : "Checking account activation"
        }
        description="Ask your administrator for approval and a temporary password, then sign in with your Student ID."
      >
        <Link href="/login" className="btn-primary">
          Sign in with password
        </Link>
      </OtpShell>
    );
  return (
    <OtpShell
      title="Enter your OTP"
      description={
        status
          ? `We sent a code to ${status.maskedPhone}. Enter it below to verify your first login.`
          : "Enter the 6-digit code from your SMS."
      }
    >
      {loading ? (
        <p role="status">Checking your OTP session...</p>
      ) : (
        <>
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
            >
              {error}
            </p>
          )}
          {message && (
            <p
              role="status"
              className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
            >
              {message}
            </p>
          )}
          {status && (
            <form onSubmit={verify} className="space-y-5">
              <div>
                <label
                  htmlFor="sms-otp"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  6-digit OTP
                </label>
                <input
                  id="sms-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  minLength={6}
                  maxLength={6}
                  required
                  value={token}
                  onChange={(e) =>
                    setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-4 text-center font-mono text-2xl tracking-[0.35em] outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-2 text-xs text-slate-500">
                  {remaining > 0
                    ? `Code expires in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
                    : "This code expired. Request a new OTP."}
                </p>
              </div>
              <button
                disabled={busy || remaining === 0}
                type="submit"
                className="btn-primary flex w-full justify-center"
              >
                <CheckCircle2 size={17} />
                {busy ? "Please wait..." : "Verify OTP and log in"}
              </button>
            </form>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link href="/login/mobile" className="font-semibold text-blue-700">
              Change mobile number
            </Link>
            {status && (
              <button
                onClick={resend}
                disabled={busy || resendIn > 0 || remaining === 0}
                className="inline-flex items-center gap-1.5 font-semibold text-blue-700 disabled:text-slate-400"
              >
                <RotateCw size={14} />
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
              </button>
            )}
          </div>
        </>
      )}
      <p className="mt-5 text-sm text-slate-500">
        Already verified?{" "}
        <Link href="/login" className="font-semibold text-blue-700">
          Sign in with your password
        </Link>
      </p>
    </OtpShell>
  );
}
