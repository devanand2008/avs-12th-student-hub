"use client";

import Sidebar from "@/components/layout/Sidebar";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Lock,
  ShieldCheck,
  Smartphone,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePwa } from "@/components/pwa/PwaContext";


export default function ProfilePage() {
  const [user, setUser] = useState<{
    studentName?: string;
    studentId?: string;
    schoolName?: string;
    stream?: string;
    medium?: string;
    academicYear?: string;
    role?: string;
    email?: string;
    registerNumber?: string;
  } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passMsg, setPassMsg] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { isInstalled, isStandalone, promptInstall } = usePwa();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
        }
      });
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setLoading(true);
    setPassMsg(null);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPassMsg({ text: "Password changed successfully!", isError: false });
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setPassMsg({
          text: data.error || "Failed to update password",
          isError: true,
        });
      }
    } catch {
      setPassMsg({ text: "Network error occurred", isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-[#2563EB] mb-2 border border-blue-200">
            <User className="w-3.5 h-3.5" />
            <span>Student Profile & Account Settings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A3D]">
            My Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Protected academic identity details and personal account password
            settings.
          </p>
        </div>

        {/* Academic Identity Details (Protected Fields) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-lg">
                {user?.studentName ? user.studentName[0] : "A"}
              </div>
              <div>
                <h2 className="text-base font-bold text-[#071A3D]">
                  {user?.studentName || "Student"}
                </h2>
                <div className="text-xs text-slate-500">
                  {user?.studentId || "—"}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Signed-in account</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 font-medium">
                Register Number
              </span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {user?.registerNumber || "—"}
              </div>
              <span className="text-[10px] text-slate-400">
                Protected Academic Field
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 font-medium">
                Institution / School
              </span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {user?.schoolName || "—"}
              </div>
              <span className="text-[10px] text-slate-400">
                Protected Academic Field
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 font-medium">
                Enrolled Stream
              </span>
              <div className="font-bold text-[#2563EB] text-sm mt-0.5">
                {user?.stream || "—"}
              </div>
              <span className="text-[10px] text-slate-400">
                Fixed Curriculum Track
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 font-medium">Academic Year</span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {user?.academicYear || "—"}
              </div>
              <span className="text-[10px] text-slate-400">
                Current Session
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#071A3D]">
              Security & Password
            </h3>
          </div>

          {passMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                passMsg.isError
                  ? "bg-rose-50 border border-rose-200 text-rose-800"
                  : "bg-emerald-50 border border-emerald-200 text-emerald-800"
              }`}
            >
              {passMsg.isError ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span>{passMsg.text}</span>
            </div>
          )}

          <form
            onSubmit={handlePasswordChange}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 10 characters"
                minLength={10}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="touch-target px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>

        {/* Mobile App & PWA Status Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-[#071A3D]">
              Mobile App & Device Setup
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  {isInstalled || isStandalone
                    ? "Installed Application Mode"
                    : "Web Browser Mode"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isInstalled || isStandalone
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {isInstalled || isStandalone ? "App Installed" : "Install Ready"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                {isInstalled || isStandalone
                  ? "AVS 12th Hub is running in standalone app mode with instant local caching enabled."
                  : "Install AVS 12th Hub on your mobile phone or tablet for 1-tap study access, offline handwritten notes, and a clean full-screen view."}
              </p>
            </div>

            {!isInstalled && !isStandalone && (
              <button
                onClick={promptInstall}
                className="touch-target px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install Mobile App</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

