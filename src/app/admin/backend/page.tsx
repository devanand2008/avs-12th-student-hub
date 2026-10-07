"use client";
import Sidebar from "@/components/layout/Sidebar";
import {
  Database,
  RefreshCw,
  UserPlus,
  ArrowRight,
  Smartphone,
} from "lucide-react";
import type { PhoneOtpConfiguration } from "@/lib/auth/phone-configuration";
import type { StudentActivationMode } from "@/lib/auth/activation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
export default function BackendPage() {
  const [status, setStatus] = useState<{
    connected: boolean;
    message?: string;
    error?: string;
    studentCount?: number;
    projectRef?: string;
    phoneOtp?: PhoneOtpConfiguration;
    studentActivationMode?: StudentActivationMode;
  } | null>(null);
  const [busy, setBusy] = useState(true);
  const check = useCallback(() => {
    return fetch("/api/admin/backend")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() =>
        setStatus({
          connected: false,
          error: "Could not reach the backend. Try again.",
        }),
      )
      .finally(() => setBusy(false));
  }, []);
  useEffect(() => {
    void check();
  }, [check]);
  return (
    <div className="flex flex-1">
      <Sidebar isAdmin />
      <main className="workspace min-w-0 flex-1">
        <span className="eyebrow">ADMINISTRATION</span>
        <h1 className="page-title">Database connection</h1>
        <p className="page-description">
          Check your backend before adding students.
        </p>
        <section className="mt-7 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6">
          <Database className="mb-5 text-blue-600" size={32} />
          <h2 className="text-lg font-bold text-navy">
            {busy
              ? "Checking connection…"
              : status?.connected
                ? "Supabase connected"
                : "Setup required"}
          </h2>
          <p role="status" className="mt-3 text-sm leading-6 text-slate-600">
            {status?.message || status?.error || "Contacting the database."}
          </p>
          {status?.connected && (
            <p className="mt-4 text-sm font-semibold">
              {status.studentCount} student accounts
            </p>
          )}
          {status?.connected && status.projectRef && (
            <p className="mt-3 text-sm text-slate-600">
              Connected project:{" "}
              <a
                href={`https://supabase.com/dashboard/project/${encodeURIComponent(status.projectRef)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-semibold text-blue-700 underline underline-offset-4"
              >
                {status.projectRef}
              </a>
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setBusy(true);
                void check();
              }}
              disabled={busy}
              className="btn-secondary"
            >
              <RefreshCw size={16} />
              Check again
            </button>
            <Link href="/admin/students/create" className="btn-primary">
              <UserPlus size={16} />
              Create student login
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
        {status?.connected && status.phoneOtp && (
          <section
            className="mt-5 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6"
            aria-labelledby="phone-otp-heading"
          >
            <Smartphone className="mb-4 text-blue-600" size={28} />
            <h2 id="phone-otp-heading" className="text-lg font-bold text-navy">
              {status.phoneOtp.state === "enabled"
                ? "SMS verification: delivery needs testing"
                : status.phoneOtp.state === "disabled"
                  ? "SMS verification: setup required"
                  : "SMS verification: status unavailable"}
            </h2>
            <p role="status" className="mt-3 text-sm leading-6 text-slate-600">
              {status.phoneOtp.message}
            </p>
            {status.phoneOtp.provider && (
              <p className="mt-3 text-sm text-slate-600">
                Selected SMS provider:{" "}
                <span className="font-semibold">
                  {status.phoneOtp.provider.replaceAll("_", " ")}
                </span>
              </p>
            )}
            {status.projectRef && (
              <a
                href={`https://supabase.com/dashboard/project/${encodeURIComponent(status.projectRef)}/auth/providers`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-5"
              >
                Open phone verification settings <ArrowRight size={16} />
              </a>
            )}
          </section>
        )}
        {status?.studentActivationMode === "admin" && (
          <section className="mt-5 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-navy">
              Student activation: administrator approval
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review pending registrations in All users and approve each
              student. Approval generates a temporary password for you to share
              privately. Students choose their own password at first sign-in.
              Accounts you create here are approved automatically.
            </p>
            <Link href="/admin/students" className="btn-secondary mt-5">
              Review student registrations <ArrowRight size={16} />
            </Link>
          </section>
        )}
        <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-500">
          {status?.studentActivationMode === "admin" ? (
            "Share approved students' Student IDs and temporary passwords privately. Approval does not verify ownership of their phone numbers."
          ) : (
            <>
              After creating a student, share their Student ID privately.
              Students verify their registered mobile number and choose their
              own password before signing in. SMS delivery must be configured
              for new accounts.
            </>
          )}
        </p>
      </main>
    </div>
  );
}
