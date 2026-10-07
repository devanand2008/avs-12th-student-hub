import {
  Award,
  Phone,
  Building2,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function PatronCard() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-blue-900/30 bg-gradient-to-br from-[#1b3574] via-[#15295c] to-[#0c1836] p-6 sm:p-10 text-white shadow-2xl">
      {/* Background Decorative Rings */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid gap-8 lg:grid-cols-12 items-center">
        {/* Left Column: Institutional Badge & Patron Details */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-sky-300 text-xs font-semibold border border-blue-400/30 backdrop-blur-sm">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>AVS ENGINEERING COLLEGE · SALEM, TAMIL NADU</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight font-heading">
            Dedicated to Academic Excellence for Tamil Nadu Students
          </h2>

          <p className="text-sm sm:text-base text-blue-100/80 leading-relaxed max-w-2xl">
            Under the visionary academic guidance of{" "}
            <strong className="text-white font-semibold">Dr. Joshua</strong>,
            Vice Principal, this portal bridges classroom instruction with
            high-yield board exam practice. Built to give every Class 12 student
            in Computer Science and Biology equal access to handwritten faculty
            notes, structured video lessons, and syllabus-grounded MCQ mastery.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-blue-200">
            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/10">
              <GraduationCap className="w-4 h-4 text-sky-300" />
              <span>TN SCERT 2024-2025 Aligned</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Grounded Academic Sources</span>
            </div>
          </div>
        </div>

        {/* Right Column: Patron Contact Card */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md space-y-4 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white font-bold text-xl shadow-lg border border-white/30 shrink-0">
                DJ
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
                  Institutional Patron & Advisor
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Dr. Joshua
                </h3>
                <p className="text-xs text-blue-200">
                  Vice Principal, AVS Engineering College
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 space-y-2.5 text-xs text-blue-100">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <a
                  href="tel:+917200008770"
                  className="font-semibold text-white hover:text-sky-300 transition-colors"
                >
                  +91 7200008770
                </a>
                <span className="text-[10px] text-blue-300 ml-auto bg-blue-900/60 px-2 py-0.5 rounded">
                  Direct Line
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Mentorship & Board Exam Preparedness Cell</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <a
                href="tel:+917200008770"
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold text-center transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" /> Call Academic Desk
              </a>
              <Link
                href="/login"
                className="py-2.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold text-center transition-all border border-white/20 flex items-center justify-center gap-1"
              >
                <span>Student Login</span> <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
