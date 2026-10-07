"use client";

import { BookOpen, CheckCircle2, Home, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  // Keep the full-page reader clear of fixed navigation overlays.
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/textbooks/") ||
    pathname === "/change-password"
  ) {
    return null;
  }

  const navItems = [
    {
      label: "Home",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard",
    },
    {
      label: "Learn",
      href: "/subjects",
      icon: BookOpen,
      isActive:
        pathname.startsWith("/subjects") ||
        pathname.startsWith("/notes") ||
        pathname.startsWith("/videos"),
    },
    {
      label: "Practice",
      href: "/practice",
      icon: CheckCircle2,
      isActive: pathname.startsWith("/practice"),
    },
    {
      label: "AI",
      href: "/ai-helper",
      icon: Sparkles,
      isActive: pathname.startsWith("/ai-helper"),
    },
    {
      label: "Profile",
      href: "/profile",
      icon: User,
      isActive:
        pathname.startsWith("/profile") || pathname.startsWith("/performance"),
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] safe-area-bottom"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center touch-target py-1 transition-all ${
                item.isActive
                  ? "text-[#2563EB]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-transform ${
                  item.isActive ? "bg-blue-50 scale-110" : ""
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${item.isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`}
                />
              </div>
              <span
                className={`text-[11px] font-medium tracking-tight mt-0.5 ${
                  item.isActive ? "font-bold text-[#2563EB]" : "text-slate-600"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
