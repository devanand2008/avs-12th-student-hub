import { MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import BrandLogo from "@/components/layout/BrandLogo";

export default function Footer() {
  return (
    <footer className="border-t border-blue-100 bg-white pb-24 pt-14 text-slate-500 md:pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-10 md:grid-cols-4">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <BrandLogo />
              <div>
                <p className="font-heading text-xl font-extrabold tracking-tight text-slate-900">
                  AVS 12th Learning Hub
                </p>
                <p className="mt-1 text-[10px] font-bold text-blue-600">
                  AVS ENGINEERING COLLEGE (AUTONOMOUS), SALEM
                </p>
              </div>
            </div>
            <p className="max-w-lg text-sm leading-relaxed">
              A learning space for Tamil Nadu 12th standard students, bringing
              together handwritten notes, one-mark practice, official textbooks,
              video lessons, and local AI study support.
            </p>
            <p className="flex items-start gap-2 text-xs font-semibold text-blue-600">
              <MapPin size={16} className="shrink-0" />
              Attur Main Road, Military Road, Ammapet, Salem, Tamil Nadu 636003
            </p>
          </div>
          <div>
            <h2 className="mb-4 text-xs font-bold tracking-wider text-slate-900">
              STUDY HUB
            </h2>
            <ul className="space-y-2.5 text-sm">
              {[
                ["Subjects & Syllabus", "/subjects"],
                ["Handwritten Notes", "/notes"],
                ["One-Mark Practice", "/practice"],
                ["Video Revision Guides", "/videos"],
                ["Official Textbooks", "/textbooks"],
                ["AVS AI Study Tutor", "/ai-helper"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-blue-600">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-xs font-bold tracking-wider text-slate-900">
              INSTITUTION & ACCESS
            </h2>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/login" className="hover:text-blue-600">
                  Student Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-blue-600">
                  Student Registration
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-700"
                >
                  <ShieldCheck size={14} />
                  Faculty / Admin Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-7 text-[11px]">
          <p>© 2026 AVS 12th Learning Hub · Salem, Tamil Nadu</p>
          <span>Learn in Tamil & English</span>
        </div>
      </div>
    </footer>
  );
}
