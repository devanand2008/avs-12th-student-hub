"use client";
import {
  BarChart3,
  Bookmark,
  BookOpen,
  Box,
  Download,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePwa } from "@/components/pwa/PwaContext";

export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const { isInstalled, isStandalone, promptInstall } = usePwa();
  const links = isAdmin
    ? [
        { label: "Overview", href: "/admin", icon: LayoutDashboard },
        {
          label: "Database connection",
          href: "/admin/backend",
          icon: ShieldCheck,
        },
        { label: "All users", href: "/admin/students", icon: Users },
        {
          label: "Import students",
          href: "/admin/students/import",
          icon: Upload,
        },
        { label: "Handwritten notes", href: "/admin/notes", icon: FileText },
        { label: "Video lessons", href: "/admin/videos", icon: Video },
        {
          label: "Official textbooks",
          href: "/admin/textbooks",
          icon: BookOpen,
        },
        { label: "Question bank", href: "/admin/questions", icon: Target },
      ]
    : [
        { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { label: "My subjects", href: "/subjects", icon: BookOpen },
        { label: "Handwritten notes", href: "/notes", icon: FileText },
        { label: "Official textbooks", href: "/textbooks", icon: BookOpen },
        { label: "Video lessons", href: "/videos", icon: Video },
        { label: "3D learning lab", href: "/models", icon: Box },
        { label: "One-mark practice", href: "/practice", icon: Target },
        { label: "AI study helper", href: "/ai-helper", icon: Sparkles },
        { label: "My performance", href: "/performance", icon: BarChart3 },
        { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
      ];
  return (
    <aside className="workspace-sidebar">
      <div className="mb-8 flex items-center gap-2 px-3 text-xs font-bold uppercase tracking-widest text-slate-400">
        {isAdmin ? <ShieldCheck size={14} /> : <GraduationCap size={15} />}
        {isAdmin ? "Administration" : "Your learning space"}
      </div>
      <nav
        aria-label={isAdmin ? "Admin navigation" : "Learning navigation"}
        className="space-y-1"
      >
        {links.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/admin" && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                "sidebar-link " + (active ? "sidebar-link-active" : "")
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {href === "/models" && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-tip">
        <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-white text-blue-600">
          <Sparkles size={18} />
        </div>
        <strong className="text-sm text-navy">
          {isAdmin ? "Your content, their progress." : "Progress starts small."}
        </strong>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {isAdmin
            ? "Add a lesson or a page of notes. Save a draft, then publish it for your students."
            : "One chapter. A few questions. A little more confidence every day."}
        </p>
        <Link
          href={isAdmin ? "/admin/notes" : "/practice"}
          className="mt-4 block text-xs font-bold text-blue-600"
        >
          {isAdmin ? "Add handwritten notes →" : "Make time to practise →"}
        </Link>
      </div>

      {!isInstalled && !isStandalone && (
        <button
          onClick={promptInstall}
          className="mx-1 mt-4 flex items-center justify-between rounded-xl bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200/90 px-3 py-2 text-xs font-bold text-blue-700 transition-all active:scale-98 text-left cursor-pointer"
          title="Install AVS 12th Hub on this device"
        >
          <div className="flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Install App</span>
          </div>
          <span className="text-[10px] font-semibold text-blue-500 uppercase bg-blue-100/60 px-1.5 py-0.5 rounded">
            PWA
          </span>
        </button>
      )}

      <div className="mt-auto px-3 pt-6 text-[11px] leading-5 text-slate-400">

        AVS Engineering College (Autonomous)
        <br />
        Salem, Tamil Nadu · Class 12
      </div>
    </aside>
  );
}
