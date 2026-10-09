"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";
import InstallButton from "@/components/pwa/InstallButton";

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

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-blue-100/80 bg-white/95 backdrop-blur-md">
      {/* Institutional details remain available inside the learning workspace. */}
      {user && (
        <div className="bg-[#1b3574] text-white px-4 py-1.5 text-xs font-medium border-b border-blue-900/40">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 truncate">
              <span className="inline-flex items-center gap-1 bg-[#2563EB] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-xs">
                <ShieldCheck className="w-3 h-3" />
                TN CLASS 12
              </span>
              <span className="truncate text-blue-100 text-[11px] sm:text-xs">
                SkillUp • Class 12 Higher Secondary Learning Portal
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-blue-200 text-xs">
              <span className="text-blue-300">Patron:</span>
              <span className="font-semibold text-white">
                Dr. Joshua, Vice Principal
              </span>
              <span className="text-blue-400">•</span>
              <a
                href="tel:+917200008770"
                className="text-[#38BDF8] hover:text-white font-mono transition-colors font-semibold"
              >
                +91 7200008770
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <Link
          href={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/"}
          className="flex min-w-0 items-center gap-2 sm:gap-3 touch-target group"
        >
          <BrandLogo size={40} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="whitespace-nowrap font-heading font-extrabold text-base sm:text-xl text-[#1b3574] tracking-tight group-hover:text-blue-600 transition-colors">
                SkillUp
              </span>
              <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[9px] font-extrabold text-blue-700 uppercase tracking-wide hidden xs:inline-block">
                12th Hub
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
              Class 12 Learning Platform
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  pathname === "/dashboard"
                    ? "bg-blue-50 text-[#2563EB]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/subjects"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  pathname.startsWith("/subjects")
                    ? "bg-blue-50 text-[#2563EB]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Subjects
              </Link>
              <Link
                href="/notes"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  pathname.startsWith("/notes")
                    ? "bg-blue-50 text-[#2563EB]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Notes
              </Link>
              <Link
                href="/videos"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  pathname.startsWith("/videos")
                    ? "bg-blue-50 text-[#2563EB]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Videos
              </Link>
              <Link
                href="/practice"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  pathname.startsWith("/practice")
                    ? "bg-blue-50 text-[#2563EB]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Practice
              </Link>
              <Link
                href="/ai-helper"
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  pathname.startsWith("/ai-helper")
                    ? "bg-blue-50 text-[#2563EB]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>AI</span>
              </Link>
              <Link
                href="/models"
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  pathname.startsWith("/models")
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Box className="w-3.5 h-3.5 text-emerald-600" />
                <span>3D Lab</span>
              </Link>
              <Link
                href="/textbooks"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  pathname.startsWith("/textbooks")
                    ? "bg-blue-50 text-[#2563EB]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Textbooks
              </Link>
              {user.role === "admin" && (
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
            </>
          ) : (
            <>
              <Link
                href="/subjects"
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#1b3574] hover:bg-blue-50 transition-colors"
              >
                Subjects
              </Link>
              <Link
                href="/notes"
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#1b3574] hover:bg-blue-50 transition-colors"
              >
                Notes
              </Link>
              <Link
                href="/practice"
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#1b3574] hover:bg-blue-50 transition-colors"
              >
                1-Mark Practice
              </Link>
              <Link
                href="/videos"
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#1b3574] hover:bg-blue-50 transition-colors"
              >
                Videos
              </Link>
              <Link
                href="/ai-helper"
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#1b3574] hover:bg-blue-50 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>AI Tutor</span>
              </Link>
              <Link
                href="/textbooks"
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#1b3574] hover:bg-blue-50 transition-colors"
              >
                Textbooks
              </Link>
              <Link
                href="/models"
                className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 transition-colors"
              >
                <Box className="w-3.5 h-3.5 text-emerald-600" />
                <span>3D Lab</span>
              </Link>
            </>
          )}
        </nav>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-2">
          {user && (
            <>
              {/* Search button with shortcut indicator */}
              <div className="hidden md:block">
                <Link
                  href="/search"
                  className="touch-target p-2 rounded-xl text-slate-600 hover:text-[#2563EB] hover:bg-blue-50 transition-colors"
                  title="Search learning materials"
                >
                  <Search className="w-4 h-4" />
                </Link>
              </div>

              {/* Profile button */}
              <Link
                href="/profile"
                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-blue-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user.studentName ? user.studentName[0] : "A"}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <div className="font-bold text-slate-900 truncate max-w-[120px]">
                    {user.studentName ||
                      (user.role === "admin" ? "Administrator" : "Student")}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {user.studentId || user.email}
                  </div>
                </div>
              </Link>

              {/* Logout Button */}
              <div className="hidden sm:block">
                <button
                  onClick={handleLogout}
                  className="touch-target p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {!user && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <Link
                  href="/register"
                  className="hidden sm:inline-flex touch-target px-4 py-2 text-white rounded-xl text-xs font-bold transition-all items-center gap-1.5 shadow-electric hover:shadow-glow-blue active:scale-95"
                  style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb, #0ea5e9)" }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Create Account</span>
                </Link>
              </div>
              <Link
                href="/login"
                className="touch-target px-4 py-2 bg-blue-50/80 hover:bg-blue-100 text-blue-700 border border-blue-200/90 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
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

          {/* Mobile hamburger menu */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden touch-target p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 py-4 space-y-2 shadow-xl animate-in slide-in-from-top-2">
          {user ? (
            <>
              <div className="p-3 bg-blue-50/70 rounded-2xl mb-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold">
                  {user.studentName ? user.studentName[0] : "A"}
                </div>
                <div>
                  <p className="font-bold text-sm text-[#071A3D]">
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <BookOpen className="w-4 h-4 text-[#2563EB]" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/subjects"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Subjects & Syllabus</span>
              </Link>
              <Link
                href="/notes"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Handwritten Notes</span>
              </Link>
              <Link
                href="/textbooks"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Full textbooks</span>
              </Link>
              <Link
                href="/videos"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Video className="w-4 h-4 text-purple-600" />
                <span>NotebookLM Videos</span>
              </Link>
              <Link
                href="/practice"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <CheckSquare className="w-4 h-4 text-amber-600" />
                <span>1-Mark MCQ Engine</span>
              </Link>
              <Link
                href="/ai-helper"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Sparkles className="w-4 h-4 text-[#38BDF8]" />
                <span>SkillUp AI Study Helper</span>
              </Link>
              <Link
                href="/models"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50"
              >
                <Box className="w-4 h-4 text-emerald-600" />
                <span>3D Learning Lab</span>
              </Link>
              <Link
                href="/performance"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Performance & Analytics</span>
              </Link>
              <Link
                href="/search"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Search className="w-4 h-4 text-blue-600" />
                <span>Search learning materials</span>
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Admin Control Console</span>
                </Link>
              )}
              {/* Mobile App Install Card for Signed In Students */}
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
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl"
              >
                <BookOpen className="w-4 h-4" />
                <span>Read all full textbooks</span>
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 text-[#1b3574] border border-blue-200 text-center font-bold text-xs rounded-xl shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Create Free Student Account</span>
              </Link>

              {/* Mobile App Install Card for Guests */}
              <div className="pt-1">
                <InstallButton variant="card" />
              </div>

              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-3 bg-[#1b3574] text-center text-white font-bold text-xs rounded-xl shadow-md shadow-blue-900/20"
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
