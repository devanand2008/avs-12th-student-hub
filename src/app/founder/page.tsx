import Image from "next/image";
import Link from "@/components/layout/IntentLink";
import { pageMetadata } from "@/lib/seo";
import {
  ExternalLink,
  GraduationCap,
  Award,
  BookOpen,
  Sparkles,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Video,
  FileText,
  Box,
} from "lucide-react";

export const metadata = pageMetadata("/founder");

const FOUNDER_PORTFOLIO_URL = "https://dr-d-r-joshua-skillup.vercel.app/";

export default function FounderPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#172033]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#142B63] via-[#1A387E] to-[#142B63] text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        {/* Decorative background grid and blurs */}
        <div
          className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Founder Photograph / Badge */}
            <div className="shrink-0 text-center">
              <div className="relative p-2 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl inline-block group">
                <a
                  href={FOUNDER_PORTFOLIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative rounded-2xl overflow-hidden focus:outline-hidden focus:ring-4 focus:ring-cyan-400"
                  title="Open Dr. D. R. Joshua's Portfolio (opens in new tab)"
                >
                  <Image
                    src="/images/joshua-introduction.png"
                    alt="Dr. D. R. Joshua – Founder of SkillUp, Vice Principal of AVS Engineering College"
                    width={240}
                    height={240}
                    priority
                    className="w-48 h-48 sm:w-56 sm:h-56 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                    <span className="text-[11px] font-bold text-white bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                      View Portfolio <ExternalLink size={12} />
                    </span>
                  </div>
                </a>
              </div>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-blue-200">
                <ShieldCheck size={14} className="text-cyan-400" />
                <span>Verified Leadership Profile</span>
              </div>
            </div>

            {/* Founder Biography & Credentials */}
            <div className="text-center md:text-left space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-cyan-300 text-xs font-bold tracking-wide uppercase">
                <GraduationCap size={14} />
                <span>Founder & Patron</span>
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-heading">
                  Dr. D. R. Joshua
                </h1>
                <p className="mt-2 text-lg sm:text-xl font-medium text-blue-200">
                  Founder of SkillUp · Vice Principal
                </p>
                <p className="text-sm text-blue-300 font-semibold">
                  AVS Engineering College, Salem, Tamil Nadu
                </p>
              </div>

              <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed max-w-xl">
                Dedicated academician, educational innovator, and institutional leader committed to democratizing high-quality Class 12 education for Tamil Nadu State Board students across both Tamil and English mediums.
              </p>

              {/* Call to Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <a
                  href={FOUNDER_PORTFOLIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-cyan-500/20 transition-all active:scale-95"
                >
                  <span>Visit Founder Portfolio</span>
                  <ExternalLink size={16} />
                </a>

                <a
                  href="tel:+917200008770"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-all active:scale-95"
                >
                  <Phone size={15} className="text-cyan-300" />
                  <span>+91 7200008770</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Founder's Vision */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs font-bold text-[#3B82F6] uppercase tracking-wider mb-3">
            <Sparkles size={16} />
            <span>The Founder&apos;s Vision</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Empowering Every Class 12 Student to Excel
          </h2>

          <div className="mt-4 space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            <p>
              Class 12 Higher Secondary education is the most pivotal milestone in a student&apos;s academic journey, determining pathways to engineering, medicine, sciences, and higher learning. Recognizing the disparities students often face in accessing quality learning aids, Dr. D. R. Joshua founded <strong>SkillUp</strong> as a comprehensive, free, and unified educational ecosystem.
            </p>
            <p>
              Under his patronship and visionary guidance at AVS Engineering College, SkillUp combines real teacher-verified handwritten notes, high-yield audio-video lessons, book-back textbook MCQ engines, interactive 3D science simulations, and 24/7 bilingual AI tutoring — tailored specifically for the Tamil Nadu State Board Class 12 syllabus in both Tamil and English mediums.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
              <p className="text-2xl font-extrabold text-[#142B63]">100% Free</p>
              <p className="text-xs text-slate-600 mt-1">
                Zero paywalls for student notes, practice questions, and full textbooks.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <p className="text-2xl font-extrabold text-emerald-800">Bilingual</p>
              <p className="text-xs text-slate-600 mt-1">
                Equal emphasis on Tamil Medium and English Medium Class 12 students.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
              <p className="text-2xl font-extrabold text-purple-800">Syllabus-Aligned</p>
              <p className="text-xs text-slate-600 mt-1">
                Strict adherence to Tamil Nadu State Board textbooks and blue-prints.
              </p>
            </div>
          </div>
        </section>

        {/* Core Pillars Initiated Under His Leadership */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#172033]">
              Key Learning Initiatives Guided by Dr. Joshua
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Integrated platforms developed to assist every Class 12 student in Tamil Nadu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 transition-all shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3">
                <FileText size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Handwritten Revision Notes</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                A4 portrait format, step-by-step derivations, clean scientific diagrams, and highlighted formulas preserved in their authentic teacher handwriting.
              </p>
              <Link
                href="/notes"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                Explore Handwritten Notes <ArrowRight size={13} />
              </Link>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 transition-all shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3">
                <Video size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Educational Video Library</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                260+ organized subject video lessons covering core Physics, Chemistry, Biology, and Computer Science units with instant byte-range streaming.
              </p>
              <Link
                href="/videos"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800"
              >
                Watch Video Guides <ArrowRight size={13} />
              </Link>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 transition-all shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
                <Box size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-base">3D Interactive Learning Lab</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                Hands-on Three.js 3D models of atomic structures, organic molecules, and physical apparatus for immersive conceptual understanding.
              </p>
              <Link
                href="/models"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-800"
              >
                Launch 3D Lab <ArrowRight size={13} />
              </Link>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 transition-all shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3">
                <Sparkles size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-base">SkillUp Bilingual AI Tutor</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                Round-the-clock student assistance answering doubts in English, pure Tamil, or conversational Tanglish grounded strictly in TN textbooks.
              </p>
              <Link
                href="/ai-helper"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-800"
              >
                Ask AI Tutor <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        {/* Portfolio Preview Card */}
        <section className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/40 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-full">
                <Award size={14} />
                <span>Official Digital Portfolio</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Explore Dr. D. R. Joshua&apos;s Full Portfolio
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg">
                View detailed academic qualifications, institutional achievements, research contributions, and leadership milestones at AVS Engineering College.
              </p>
              <p className="text-xs font-mono text-blue-600">
                https://dr-d-r-joshua-skillup.vercel.app/
              </p>
            </div>

            <a
              href={FOUNDER_PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#142B63] hover:bg-blue-900 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <span>View Full Portfolio</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </section>

        {/* Institution & Contact Details */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Institutional Affiliation & Leadership
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">AVS Engineering College</p>
                <p className="text-slate-500 mt-0.5">
                  Attur Main Road, Military Road, Ammapet, Salem, Tamil Nadu 636003
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <Phone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">Office & Inquiries</p>
                <p className="text-slate-500 mt-0.5">
                  Phone: <a href="tel:+917200008770" className="text-blue-600 font-mono font-semibold">+91 7200008770</a>
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">Higher Secondary Outreach Division</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
