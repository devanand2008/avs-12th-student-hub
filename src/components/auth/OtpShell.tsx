import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";
import type { ReactNode } from "react";

export default function OtpShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-b from-blue-100 via-blue-50 to-slate-50 px-4 py-12">
      <section
        className="w-full max-w-md rounded-3xl border border-blue-200 bg-white p-7 shadow-electric sm:p-9"
        aria-labelledby="otp-heading"
      >
        <div className="mb-6 flex items-center justify-between">
          <BrandLogo size={52} />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
            <ShieldCheck size={15} /> FIRST LOGIN
          </span>
        </div>
        <h1
          id="otp-heading"
          className="font-heading text-2xl font-black text-slate-900"
        >
          {title}
        </h1>
        <p className="mb-6 mt-2 text-sm leading-6 text-slate-500">
          {description}
        </p>
        {children}
        <div className="mt-7 border-t border-slate-100 pt-5">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
          >
            <ArrowLeft size={15} /> Back to password login
          </Link>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Verify your mobile once. Use your Student ID or mobile number and
            password for future logins.
          </p>
        </div>
      </section>
    </main>
  );
}
