"use client";

import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [canSetInitialPassword, setCanSetInitialPassword] = useState(false);
  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) =>
        setCanSetInitialPassword(Boolean(data.user?.canSetInitialPassword)),
      )
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 10) {
      setError("New password must be at least 10 characters long.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Password change failed.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.assign(data.redirectTo || "/dashboard");
      }, 1500);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-b from-[#e3eeff] via-[#eff5ff] to-[#f8fbff]">
      {/* Floating Ambient Glow Orbs */}
      <div className="orb-animate absolute -top-16 -right-16 w-80 h-80 bg-blue-400/25 rounded-full blur-3xl pointer-events-none" />
      <div className="orb-animate-2 absolute -bottom-20 -left-20 w-96 h-96 bg-cyan-400/25 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-xl p-8 rounded-3xl border border-blue-200/80 shadow-electric space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto mb-3.5 shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            Update Temporary Password
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            For institutional security, please set a personal password before
            accessing your Class 12 dashboard.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
        {canSetInitialPassword && (
          <p className="text-xs text-slate-500">
            Mobile verified. Choose your password below.{" "}
            <Link href="/login/mobile" className="font-semibold text-blue-700">
              Verify again if this session expires
            </Link>
          </p>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>
              Password updated successfully! Redirecting to dashboard...
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!canSetInitialPassword && (
            <div>
              <label
                htmlFor="current-password"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Current Temporary Password
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="e.g. AVS@26XXXX"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="new-password"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              minLength={10}
              maxLength={72}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 10 characters"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full touch-target py-3.5 text-white rounded-xl font-bold text-xs sm:text-sm shadow-electric hover:shadow-glow-blue transition-all disabled:opacity-60 active:scale-95 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #1d4ed8, #2563eb, #0ea5e9)",
            }}
          >
            {loading ? "Saving..." : "Set New Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
