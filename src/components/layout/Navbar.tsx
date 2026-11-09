"use client";

import {
  fetchCurrentSession,
  clearCurrentSessionRequest,
} from "@/lib/current-session-client";

import Link from "@/components/layout/IntentLink";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  BookOpen,
  FileText,
  Video,
  CheckSquare,
  Sparkles,
  Search,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Box,
  TrendingUp,
  Home,
  GraduationCap,
  Layers,
  ChevronRight,
} from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";
import InstallButton from "@/components/pwa/InstallButton";
import InstagramLink from "@/components/layout/InstagramLink";

interface UserProfile {
  id: string;
  role: string;
  email?: string;
  studentId?: string;
  studentName?: string;
  stream?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authRequest = useRef<AbortController | null>(null);

  // Horizontal scroll states for mobile navbar
  const navScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const checkScroll = useCallback(() => {
    const el = navScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < maxScroll - 4);
    if (maxScroll > 0) {
      setScrollProgress(Math.min(1, Math.max(0, scrollLeft / maxScroll)));
    } else {
      setScrollProgress(0);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    authRequest.current = controller;
    fetchCurrentSession(controller.signal)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!controller.signal.aborted)
          setUser(data?.authenticated ? data.user : null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setUser(null);
      });
    return () => controller.abort();
  }, [pathname]);

  // Handle mobile navbar scrolling and centering active item
  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  useEffect(() => {
    checkScroll();
    if (navScrollRef.current) {
      const activeEl = navScrollRef.current.querySelector<HTMLElement>(
        '[data-active="true"]',
      );
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [pathname, checkScroll]);

  const handleLogout = async () => {
    authRequest.current?.abort();
    clearCurrentSessionRequest();
    await fetch("/api/auth/logout", { method: "POST" });
    clearCurrentSessionRequest();
    setUser(null);
    router.push("/login");
  };

  // Mobile horizontal nav items
  const mobileNavItems = [
    {
      label: "Home",
      href: user ? "/dashboard" : "/",
      icon: Home,
      isActive: pathname === "/" || (user ? pathname === "/dashboard" : false),
    },
    ...(user
      ? [
          {
            label: "Dashboard",
            href: "/dashboard",
            icon: Layers,
            isActive: pathname === "/dashboard",
          },
        ]
      : []),
    {
      label: "Notes",
      href: "/notes",
      icon: FileText,
      isActive: pathname.startsWith("/notes"),
    },
    {
      label: "Videos",
      href: "/videos",
      icon: Video,
      isActive: pathname.startsWith("/videos"),
    },
    {
      label: "MCQ",
      href: "/practice",
      icon: CheckSquare,
      isActive:
        pathname.startsWith("/practice") ||
        pathname.startsWith("/textbook-practice"),
    },
    {
      label: "Textbooks",
      href: "/textbooks",
      icon: BookOpen,
      isActive: pathname.startsWith("/textbooks"),
    },
    {
      label: "AI Tutor",
      href: "/ai-helper",
      icon: Sparkles,
      isActive:
        pathname.startsWith("/ai-helper") ||
        pathname.startsWith("/ai-study-tools"),
    },
    {
      label: "3D Lab",
      href: "/models",
      icon: Box,
      isActive:
        pathname.startsWith("/models") ||
        pathname.startsWith("/interactive-3d"),
    },
    {
      label: "Founder",
      href: "/founder",
      icon: GraduationCap,
      isActive: pathname.startsWith("/founder"),
    },
    ...(user?.role === "admin"
      ? [
          {
            label: "Admin",
            href: "/admin",
            icon: ShieldCheck,
            isActive: pathname.startsWith("/admin"),
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Institutional Banner */}
      <div className="bg-[#142B63] text-white px-3 sm:px-4 py-1.5 text-xs font-medium border-b border-blue-900/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-flex items-center gap-1 bg-[#3B82F6] text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs">
              <ShieldCheck className="w-3 h-3" />
              TN CLASS 12
            </span>
            <span className="truncate text-blue-100 text-[11px] sm:text-xs">
              SkillUp • Class 12 Higher Secondary Learning Portal
            </span>
          </div>
          <div className="flex items-center gap-2 text-blue-200 text-xs shrink-0">
            <Link
              href="/founder"
              className="inline-flex items-center gap-1 text-blue-200 hover:text-white transition-colors"
            >
              <span className="text-blue-300 hidden xs:inline">Founder:</span>
              <span className="font-semibold text-white">Dr. D. R. Joshua</span>
            </Link>
            <span className="text-blue-400 hidden sm:inline">•</span>
            <a
              href="tel:+917200008770"
              className="text-[#38BDF8] hover:text-white font-mono transition-colors font-semibold hidden sm:inline"
            >
              +91 7200008770
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar Top Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Name */}
        <Link
          href={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/"}
          className="flex min-w-0 items-center gap-2 sm:gap-3 touch-target group"
        >
          <BrandLogo size={36} className="sm:w-10 sm:h-10" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="whitespace-nowrap font-heading font-extrabold text-base sm:text-xl text-[#142B63] tracking-tight group-hover:text-blue-600 transition-colors">
                SkillUp
              </span>
              <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[9px] font-extrabold text-[#142B63] uppercase tracking-wide">
                12th Hub
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
              Class 12 Learning Platform
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Desktop Navigation">
          <Link
            href="/resources"
            aria-current={pathname.startsWith("/resources") ? "page" : undefined}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              pathname.startsWith("/resources")
                ? "bg-blue-50 text-[#3B82F6]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Resources
          </Link>

          {user && (
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                pathname === "/dashboard"
                  ? "bg-blue-50 text-[#3B82F6]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Dashboard
            </Link>
          )}

          <Link
            href="/subjects"
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              pathname.startsWith("/subjects")
                ? "bg-blue-50 text-[#3B82F6]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Subjects
          </Link>
          <Link
            href="/notes"
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              pathname.startsWith("/notes")
                ? "bg-blue-50 text-[#3B82F6]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Notes
          </Link>
          <Link
            href="/videos"
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              pathname.startsWith("/videos")
                ? "bg-blue-50 text-[#3B82F6]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Videos
          </Link>
          <Link
            href="/practice"
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              pathname.startsWith("/practice") || pathname.startsWith("/textbook-practice")
                ? "bg-blue-50 text-[#3B82F6]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Practice
          </Link>
          <Link
            href="/textbooks"
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              pathname.startsWith("/textbooks")
                ? "bg-blue-50 text-[#3B82F6]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Textbooks
          </Link>
          <Link
            href="/ai-helper"
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              pathname.startsWith("/ai-helper") || pathname.startsWith("/ai-study-tools")
                ? "bg-blue-50 text-[#3B82F6]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>AI Tutor</span>
          </Link>
          <Link
            href="/models"
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              pathname.startsWith("/models") || pathname.startsWith("/interactive-3d")
                ? "bg-emerald-50 text-emerald-700 font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Box className="w-3.5 h-3.5 text-[#10B981]" />
            <span>3D Lab</span>
          </Link>
          <Link
            href="/founder"
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              pathname.startsWith("/founder")
                ? "bg-blue-50 text-[#142B63] ring-1 ring-blue-200"
                : "text-[#142B63] hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            <span>Founder</span>
          </Link>

          {user?.role === "admin" && (
            <Link
              href="/admin"
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                pathname.startsWith("/admin")
                  ? "bg-amber-50 text-amber-800"
                  : "text-amber-700 hover:bg-amber-50"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Search Shortcut */}
          <Link
            href="/search"
            className="touch-target p-2 rounded-xl text-slate-600 hover:text-[#3B82F6] hover:bg-blue-50 transition-colors"
            title="Search learning materials"
            aria-label="Search learning materials"
          >
            <Search className="w-4 h-4" />
          </Link>

          {/* User Profile or Sign In */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/profile"
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#142B63] to-[#3B82F6] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user.studentName ? user.studentName[0] : "A"}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <div className="font-bold text-slate-900 truncate max-w-[110px]">
                    {user.studentName || (user.role === "admin" ? "Admin" : "Student")}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[110px]">
                    {user.studentId || user.email}
                  </div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex touch-target p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/register"
                className="hidden sm:inline-flex touch-target px-3.5 py-1.5 text-white rounded-xl text-xs font-bold transition-all items-center gap-1 shadow-xs hover:shadow-md active:scale-95 bg-[#142B63] hover:bg-blue-900"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>Sign Up</span>
              </Link>
              <Link
                href="/login"
                className="touch-target px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#142B63] border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
              >
                <span>Sign In</span>
              </Link>
            </div>
          )}

          {/* Install App Quick Action */}
          <div className="hidden sm:block">
            <InstallButton variant="nav" />
          </div>
          <div className="sm:hidden">
            <InstallButton variant="icon" />
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="touch-target p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Extended Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* SECOND ROW: HORIZONTALLY SCROLLABLE MOBILE NAVBAR */}
      <div className="lg:hidden relative border-t border-slate-100 bg-white/95 backdrop-blur-md">
        {/* Subtle Gradient Fade Overlays */}
        {canScrollLeft && (
          <div
            className="absolute left-0 top-0 bottom-[2.5px] w-6 pointer-events-none bg-gradient-to-r from-white via-white/80 to-transparent z-10"
            aria-hidden="true"
          />
        )}
        {canScrollRight && (
          <div
            className="absolute right-0 top-0 bottom-[2.5px] w-6 pointer-events-none bg-gradient-to-l from-white via-white/80 to-transparent z-10"
            aria-hidden="true"
          />
        )}

        {/* Scrollable Nav Items */}
        <nav
          ref={navScrollRef}
          onScroll={checkScroll}
          className="nav-horizontal-scroll px-3 py-2 gap-1.5 flex items-center min-w-0"
          aria-label="Mobile Sections Navigation"
        >
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={item.isActive}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition-all duration-150 shrink-0 select-none ${
                  item.isActive
                    ? "bg-[#142B63] text-white shadow-xs font-bold"
                    : "bg-slate-100/90 text-slate-700 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    item.isActive ? "text-cyan-300" : "text-slate-500"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Custom Visible Scroll Affordance Track & Thumb */}
        <div
          className="h-[2.5px] w-full bg-slate-100 relative overflow-hidden"
          role="progressbar"
          aria-label="Mobile navigation horizontal scroll position"
          aria-valuenow={Math.round(scrollProgress * 100)}
        >
          <div
            className="absolute top-0 bottom-0 bg-[#3B82F6] rounded-full transition-all duration-75"
            style={{
              width: "24%",
              left: `${scrollProgress * 76}%`,
            }}
          />
        </div>
      </div>

      {/* Mobile Drawer (When hamburger menu is open) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 py-4 space-y-2 shadow-xl animate-in slide-in-from-top-2 max-h-[80vh] overflow-y-auto">
          <InstagramLink
            className="w-full border border-pink-100 px-3 py-3"
            onClick={() => setMobileMenuOpen(false)}
          />

          <Link
            href="/founder"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between rounded-xl bg-blue-50/80 px-3 py-3 text-xs font-bold text-[#142B63] border border-blue-100"
          >
            <div className="flex items-center gap-2.5">
              <GraduationCap size={18} className="text-blue-600" />
              <div>
                <p className="font-bold text-slate-900">Dr. D. R. Joshua · Founder</p>
                <p className="text-[10px] text-slate-500 font-normal">Vice Principal, AVS Engineering College</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-blue-500" />
          </Link>

          <Link
            href="/resources"
            onClick={() => setMobileMenuOpen(false)}
            className="mb-2 flex items-center gap-3 rounded-xl bg-blue-50/50 px-3 py-3 text-xs font-bold text-blue-800"
          >
            <BookOpen size={16} />
            Study Resources & Syllabus
          </Link>

          {user ? (
            <>
              <div className="p-3 bg-blue-50/70 rounded-2xl mb-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#142B63] text-white flex items-center justify-center font-bold">
                  {user.studentName ? user.studentName[0] : "A"}
                </div>
                <div>
                  <p className="font-bold text-sm text-[#142B63]">
                    {user.studentName || "Student"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user.studentId || user.email}
                  </p>
                  {user.stream && (
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">
                      {user.stream}
                    </span>
                  )}
                </div>
              </div>

              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Home className="w-4 h-4 text-[#3B82F6]" />
                <span>Dashboard Overview</span>
              </Link>
              <Link
                href="/subjects"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Subjects & Syllabus</span>
              </Link>
              <Link
                href="/notes"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Handwritten Notes</span>
              </Link>
              <Link
                href="/videos"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Video className="w-4 h-4 text-purple-600" />
                <span>Video Revision Guides</span>
              </Link>
              <Link
                href="/practice"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <CheckSquare className="w-4 h-4 text-amber-600" />
                <span>1-Mark MCQ Practice Engine</span>
              </Link>
              <Link
                href="/textbooks"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Full Textbooks</span>
              </Link>
              <Link
                href="/ai-helper"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                <span>SkillUp AI Study Tutor</span>
              </Link>
              <Link
                href="/models"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50"
              >
                <Box className="w-4 h-4 text-emerald-600" />
                <span>3D Learning Lab</span>
              </Link>
              <Link
                href="/performance"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Performance & Analytics</span>
              </Link>
              <Link
                href="/search"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Search className="w-4 h-4 text-blue-600" />
                <span>Search learning materials</span>
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Admin Control Console</span>
                </Link>
              )}

              <div className="pt-2 pb-1">
                <InstallButton variant="card" />
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                href="/textbooks"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl"
              >
                <BookOpen className="w-4 h-4" />
                <span>Read Full Textbooks</span>
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#142B63] text-white text-center font-bold text-xs rounded-xl shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-blue-300" />
                <span>Create Free Student Account</span>
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-center text-slate-800 font-bold text-xs rounded-xl"
              >
                Sign In to Study Portal
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
