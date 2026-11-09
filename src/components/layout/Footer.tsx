import { MapPin, ShieldCheck, GraduationCap, ExternalLink } from "lucide-react";
import Link from "@/components/layout/IntentLink";
import BrandLogo from "@/components/layout/BrandLogo";
import InstagramLink from "@/components/layout/InstagramLink";
import JoshuaIntroduction from "@/components/layout/JoshuaIntroduction";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/90 bg-white pb-24 pt-14 text-slate-500 md:pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-10 md:grid-cols-4">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <BrandLogo size={40} />
              <div>
                <p className="font-heading text-xl font-extrabold tracking-tight text-[#142B63]">
                  SkillUp Learning Hub
                </p>
                <p className="mt-0.5 text-[10px] font-bold text-blue-600 tracking-wider">
                  TAMIL NADU CLASS 12 LEARNING PLATFORM
                </p>
              </div>
            </div>
            <p className="max-w-lg text-sm leading-relaxed text-slate-600">
              A comprehensive learning space for Tamil Nadu 12th standard students, bringing
              together handwritten notes, one-mark practice, official textbooks,
              video revision guides, 3D interactive models, and bilingual AI study support.
            </p>
            <p className="flex items-start gap-2 text-xs font-semibold text-blue-700">
              <MapPin size={16} className="shrink-0 mt-0.5" />
              <span>AVS Engineering College, Attur Main Road, Military Road, Ammapet, Salem, Tamil Nadu 636003</span>
            </p>
            <div className="pt-1 space-y-3">
              <InstagramLink className="border border-pink-100 bg-pink-50/50 px-4 py-2" />
              <JoshuaIntroduction />
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-bold tracking-wider text-slate-900 uppercase">
              STUDY HUB
            </h2>
            <ul className="space-y-2.5 text-sm">
              {[
                ["Subjects & Syllabus", "/subjects"],
                ["Handwritten Notes", "/notes"],
                ["One-Mark Practice", "/practice"],
                ["Video Revision Guides", "/videos"],
                ["Official Textbooks", "/textbooks"],
                ["3D Learning Lab", "/models"],
                ["SkillUp AI Study Tutor", "/ai-helper"],
                ["Study Resources", "/resources"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-blue-600 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-bold tracking-wider text-slate-900 uppercase">
              LEADERSHIP & ACCESS
            </h2>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/founder"
                  className="font-semibold text-[#142B63] hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                >
                  <GraduationCap size={15} className="text-blue-600" />
                  Founder – Dr. D. R. Joshua
                </Link>
              </li>
              <li>
                <a
                  href="https://dr-d-r-joshua-skillup.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:text-blue-900 flex items-center gap-1 transition-colors"
                >
                  <span>Dr. Joshua Portfolio</span>
                  <ExternalLink size={12} />
                </a>
              </li>
              <li className="pt-2 border-t border-slate-100">
                <Link href="/login" className="hover:text-blue-600 transition-colors">
                  Student Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-blue-600 transition-colors">
                  Student Registration
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-800 font-medium transition-colors"
                >
                  <ShieldCheck size={14} />
                  Faculty / Admin Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-7 text-[11px] text-slate-500">
          <p>© 2026 SkillUp Class 12 Hub · AVS Engineering College, Salem</p>
          <div className="flex items-center gap-4">
            <Link href="/founder" className="hover:text-blue-600">
              About Founder
            </Link>
            <span>•</span>
            <span>Learn in Tamil & English Medium</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
