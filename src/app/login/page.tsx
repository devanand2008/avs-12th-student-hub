"use client";

import {
  ArrowRight,
  Code2,
  Dna,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  Mail,
  Lock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import BrandLogo from "@/components/layout/BrandLogo";
import { useStudentActivation } from "@/components/auth/useStudentActivation";

function LoginForm() {
  const activationMode = useStudentActivation();
  const params = useSearchParams();
  const streamParam = params.get("stream") || params.get("demo");
  const showDemo = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";
  const requestedEmail = params.get("email") || "";
  const requestedId = params.get("studentId") || requestedEmail || "";
  const isRegistered = Boolean(params.get("registered"));

  const [id, setId] = useState(() =>
    requestedId
      ? requestedId
      : showDemo && streamParam === "cs"
        ? "AVSCS26-0001"
        : showDemo && streamParam === "bio"
          ? "AVSBIO26-0001"
          : "",
  );
  const [password, setPassword] = useState(() =>
    showDemo && ["cs", "bio"].includes(streamParam || "") ? "Student@2026" : "",
  );
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: id.trim(), password }),
      });
      const data = await response.json();
      if (data.code === "PHONE_VERIFICATION_REQUIRED") {
        window.location.assign(data.redirectTo);
        return;
      }
      if (!response.ok)
        throw new Error(data.error || "Gmail or password is incorrect.");
      const redirect = params.get("redirect");
      const safeRedirect =
        redirect?.startsWith("/") &&
        !redirect.startsWith("//") &&
        !redirect.includes("\\")
          ? redirect
          : null;
      // Start a fresh request with the new session cookie.
      window.location.assign(
        data.user?.mustChangePassword
          ? "/change-password"
          : safeRedirect || data.redirectTo || "/dashboard",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect. Please try again.",
      );
      setBusy(false);
    }
  }

  function fillDemo(demoId: string) {
    setId(demoId);
    setPassword("Student@2026");
    setError("");
  }

  return (
    <main className="relative overflow-hidden flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16 sm:py-24 bg-gradient-to-b from-[#e3eeff] via-[#eff5ff] to-[#f8fbff]">
      {/* Floating Ambient Glow Orbs */}
      <div className="orb-animate absolute -top-16 -right-16 w-80 h-80 bg-blue-400/25 rounded-full blur-3xl pointer-events-none" />
      <div className="orb-animate-2 absolute -bottom-20 -left-20 w-96 h-96 bg-cyan-400/25 rounded-full blur-3xl pointer-events-none" />

      <section
        className="relative z-10 w-full max-w-md rounded-3xl border border-blue-200/80 bg-white/95 p-7 shadow-electric sm:p-10 backdrop-blur-xl"
        aria-labelledby="login-heading"
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700 shadow-xs">
            <GraduationCap size={14} />
            SkillUp
          </span>
          <ShieldCheck
            size={18}
            className="text-blue-600"
            aria-label="Protected sign in"
          />
        </div>
        <div className="mb-7 flex flex-col items-center text-center">
          <BrandLogo size={64} />
          <span className="mt-2 rounded-full bg-blue-600 px-3 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
            LEARNING HUB
          </span>
          <h1
            id="login-heading"
            className="mt-3 font-heading text-2xl font-black tracking-tight text-slate-900"
          >
            Sign In with Gmail
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            SkillUp • Tamil Nadu Class 12 Higher Secondary Portal
          </p>
        </div>

        {isRegistered && (
          <div
            role="status"
            className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2.5"
          >
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <div>
              <p>Account created successfully!</p>
              <p className="font-normal text-emerald-700 mt-0.5">
                Enter your password below to sign in to SkillUp.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800"
          >
            {error}
          </div>
        )}

        {activationMode === "admin" && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
          >
            {params.get("approval") === "pending"
              ? "Registration received. Your account is waiting for administrator approval."
              : "New students need administrator approval. Sign in with your Student ID and the temporary password your administrator provides, then choose your own password."}
          </p>
        )}

        <form onSubmit={signIn} className="space-y-4">
          <div>
            <label
              htmlFor="login-id"
              className="mb-1.5 block text-xs font-bold text-slate-700"
            >
              Gmail / Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                autoComplete="username"
                type="text"
                placeholder="e.g. yourname@gmail.com"
                required
                maxLength={200}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Sign in with your Gmail (Student ID or phone also accepted)
            </p>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-xs font-bold text-slate-700"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                maxLength={200}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-12 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
              />
              <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible(!visible)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-blue-600 cursor-pointer"
              >
                {visible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5 text-xs sm:text-sm font-bold text-white shadow-electric hover:shadow-glow-blue transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            style={{
              background: "linear-gradient(135deg, #1d4ed8, #2563eb, #0ea5e9)",
            }}
          >
            <span>{busy ? "Signing in…" : "Sign In to SkillUp"}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {showDemo && (
          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="mb-2.5 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">
              LOCAL DEMO ACCOUNTS
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo("AVSCS26-0001")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 px-3 py-2 text-xs font-bold text-indigo-700 transition-colors"
              >
                <Code2 size={14} />
                CS Student Demo
              </button>
              <button
                type="button"
                onClick={() => fillDemo("AVSBIO26-0001")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors"
              >
                <Dna size={14} />
                Biology Demo
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-500">
              Demo password:{" "}
              <span className="font-mono font-bold text-slate-700">
                Student@2026
              </span>
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/register"
            className="font-bold text-blue-600 hover:text-blue-800 underline"
          >
            Create Free Account →
          </Link>
        </p>

        <div className="mt-5 text-center">
          <Link
            href="/"
            className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            ← Back to Homepage
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-slate-500" role="status">
          Preparing sign in…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
