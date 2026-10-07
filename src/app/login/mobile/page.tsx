"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Phone } from "lucide-react";
import Link from "next/link";
import OtpShell from "@/components/auth/OtpShell";
import { useStudentActivation } from "@/components/auth/useStudentActivation";

function MobileForm() {
  const activationMode = useStudentActivation();
  const router = useRouter();
  const params = useSearchParams();
  const [phone, setPhone] = useState(() =>
    /^\d{10}$/.test(params.get("phone") || "") ? params.get("phone")! : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const passwordLoginPath = /^[6-9]\d{9}$/.test(phone)
    ? "/login?studentId=" + encodeURIComponent(phone)
    : "/login";
  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      if (response.status === 409 && data.code === "PHONE_ALREADY_VERIFIED") {
        router.push(passwordLoginPath);
        router.refresh();
        return;
      }
      if (!response.ok)
        throw new Error(data.error || "Could not send OTP. Please try again.");
      router.push("/login/otp");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect. Please try again.",
      );
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
        description={
          activationMode === "admin"
            ? "Ask your administrator to approve your account and provide a temporary password. Then sign in with your Student ID and choose your own password."
            : "Please wait while we check how to activate your account."
        }
      >
        <Link href={passwordLoginPath} className="btn-primary">
          Sign in with password <ArrowRight size={16} />
        </Link>
      </OtpShell>
    );
  return (
    <OtpShell
      title="Verify your mobile number"
      description="Enter the mobile number on your student account. We will send a 6-digit SMS code to complete your first login."
    >
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          {error}
        </p>
      )}
      <form onSubmit={send} className="space-y-5">
        <div>
          <label
            htmlFor="otp-phone"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Mobile number
          </label>
          <div className="flex items-center rounded-xl border border-slate-300 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500">
            <span className="flex items-center gap-2 border-r border-slate-200 px-3 text-sm font-bold text-slate-600">
              <Phone size={16} /> +91
            </span>
            <input
              id="otp-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              pattern="[6-9][0-9]{9}"
              minLength={10}
              maxLength={10}
              required
              placeholder="10-digit mobile number"
              className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="btn-primary flex w-full justify-center"
        >
          {busy ? "Sending OTP..." : "Send OTP"}
          <ArrowRight size={16} />
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-500">
        Already verified?{" "}
        <Link href={passwordLoginPath} className="font-semibold text-blue-700">
          Sign in with your password
        </Link>
      </p>
      <p className="mt-5 text-sm text-slate-500">
        New student?{" "}
        <Link href="/register" className="font-semibold text-blue-700">
          Create your account
        </Link>
      </p>
    </OtpShell>
  );
}
export default function MobileLoginPage() {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-10 text-center">
          Preparing mobile login...
        </p>
      }
    >
      <MobileForm />
    </Suspense>
  );
}
