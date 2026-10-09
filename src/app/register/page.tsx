"use client";

import { useState } from "react";
import Link from "next/link";
import { useStudentActivation } from "@/components/auth/useStudentActivation";
import {
  ShieldCheck,
  Code2,
  Dna,
  User,
  Phone,
  School,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Hash,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Video,
  Target,
  Sparkles,
  Building2,
} from "lucide-react";

export default function RegisterPage() {
  const activationMode = useStudentActivation();

  // Form State
  const [studentName, setStudentName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const standard = "12th Standard";
  const [medium, setMedium] = useState<"English" | "Tamil">("English");
  const [stream, setStream] = useState<"Computer Science" | "Biology">(
    "Computer Science",
  );
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Submission State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validations
    if (!studentName.trim() || studentName.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid Gmail / email address.");
      return;
    }
    if (!activationMode) {
      setError("Registration settings are loading. Please try again shortly.");
      return;
    }
    if (activationMode !== "admin" && password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (activationMode !== "admin" && password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!schoolName.trim() || schoolName.trim().length < 2) {
      setError("Please enter your school name.");
      return;
    }
    if (!registerNumber.trim()) {
      setError("Please enter your school register number or roll number.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim(),
          email: cleanEmail,
          password: activationMode === "admin" ? undefined : password,
          phone: cleanPhone,
          schoolName: schoolName.trim(),
          registerNumber: registerNumber.trim(),
          standard,
          medium,
          stream,
          studentId: studentId.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to create account. Please try again.",
        );
      }

      setSuccess(true);
      setSuccessMessage(data.message || "Account created successfully! Logging you in...");
      setTimeout(() => {
        window.location.assign(data.redirectTo || "/dashboard");
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="login-layout min-h-[calc(100vh-4.2rem)] bg-[#eff5ff]">
      {/* Left Brand Story Column */}
      <section className="login-story relative overflow-hidden bg-gradient-to-br from-[#071a3d] via-[#102e68] to-[#1d4ed8] p-8 lg:p-14 text-white flex flex-col justify-between">
        {/* Floating Ambient Glow Orbs */}
        <div className="orb-animate absolute -top-16 -right-16 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="orb-animate-2 absolute -bottom-16 -left-16 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 text-cyan-200 text-xs font-bold border border-white/15 backdrop-blur-md">
            <Building2 className="w-3.5 h-3.5 text-cyan-300" />
            <span>SKILLUP · CLASS 12 HUB</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-black font-heading leading-tight tracking-tight text-white">
            Create Your Student Account
          </h1>

          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-md">
            Join the SkillUp Class 12 Higher Secondary learning hub.
            Register to access complete curriculum notes, videos, textbooks, and
            one-mark MCQ test engines.
          </p>

          {/* 4 Feature Highlights */}
          <div className="space-y-3 pt-3">
            {[
              {
                icon: BookOpen,
                title: "Handwritten Faculty Notes",
                desc: "Curated derivations, labeled diagrams & formulas",
                color: "text-amber-300",
              },
              {
                icon: Target,
                title: "Unit-Wise 1-Mark MCQ Engine",
                desc: "Practice with instant explanations & timer mode",
                color: "text-cyan-300",
              },
              {
                icon: Video,
                title: "Curated Video Summaries",
                desc: "Quick chapter breakdowns and key question walkthroughs",
                color: "text-emerald-300",
              },
              {
                icon: Sparkles,
                title: "AI Study Assistant",
                desc: "24/7 bilingual doubt solver in English & Tamil",
                color: "text-fuchsia-300",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs"
              >
                <div className="p-2 rounded-xl bg-white/10 shrink-0">
                  <f.icon className={`w-4 h-4 ${f.color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{f.title}</p>
                  <p className="text-[11px] text-blue-200/80">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Contact Box */}
        <div className="my-6 relative z-10 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5 text-xs text-blue-100">
          <div className="flex items-center justify-between">
            <span className="font-black uppercase tracking-wider text-cyan-300 text-[10px]">
              Academic Guidance Desk
            </span>
            <span className="font-semibold text-white">
              Dr. Joshua, Vice Principal
            </span>
          </div>
          <p className="text-[11px] text-blue-200">
            Helpline:{" "}
            <a
              href="tel:+917200008770"
              className="text-cyan-300 underline font-mono font-bold"
            >
              +91 7200008770
            </a>
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[11px] text-blue-200/80 pt-3 border-t border-white/10">
          <span>Free Educational Platform</span>
          <span>•</span>
          <span>TN SCERT 2024-2025 Syllabus</span>
        </div>
      </section>

      {/* Right Registration Form Column */}
      <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-white/95">
        <div className="w-full max-w-lg space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>STUDENT REGISTRATION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
              Create Your Free Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enter your details to register for the learning hub.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="alert"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Stream Selector Pills */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Your Stream <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStream("Computer Science")}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                    stream === "Computer Science"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/25"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Code2 className="w-4 h-4 text-cyan-300 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Computer Science</div>
                    <div
                      className={`text-[10px] ${
                        stream === "Computer Science"
                          ? "text-indigo-200"
                          : "text-slate-400"
                      }`}
                    >
                      16 Chapters · Python & SQL
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStream("Biology")}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                    stream === "Biology"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/25"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Dna className="w-4 h-4 text-emerald-200 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Biology Stream</div>
                    <div
                      className={`text-[10px] ${
                        stream === "Biology"
                          ? "text-emerald-100"
                          : "text-slate-400"
                      }`}
                    >
                      Botany & Zoology · 22 Units
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Medium Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Study Medium <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMedium("English")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    medium === "English"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  English Medium
                </button>
                <button
                  type="button"
                  onClick={() => setMedium("Tamil")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    medium === "Tamil"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  தமிழ் வழி (Tamil Medium)
                </button>
              </div>
            </div>

            {/* Student Name */}
            <div>
              <label
                htmlFor="studentName"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="studentName"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Karthikeyan R or Priya S"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Gmail / Email Address */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Gmail / Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-blue-600 font-medium">
                ★ Use this Gmail address to log in to SkillUp every time
              </p>
            </div>

            {/* Password & Confirm Password */}
            {activationMode !== "admin" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Create Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            )}

            {activationMode === "admin" && (
              <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
                Your administrator will review your registration and provide a
                temporary password after approval. You will choose your own
                password at first sign-in.
              </p>
            )}

            {/* School Name */}
            <div>
              <label
                htmlFor="schoolName"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                School Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="schoolName"
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. Government Model HSS, Salem / St. Mary's HSS"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* School Register Number & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="registerNumber"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  School Reg. No / Roll No <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="registerNumber"
                    type="text"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    placeholder="e.g. 120424 or REG-2026"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    required
                    maxLength={15}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Optional Custom Account ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="studentId"
                  className="block text-xs font-bold text-slate-700"
                >
                  Custom Account ID{" "}
                  <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-blue-600 font-bold">
                  Auto-generated if left empty
                </span>
              </div>
              <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                placeholder={`e.g. ${stream === "Computer Science" ? "SKILLCS26-0042" : "SKILLBIO26-0042"}`}
                maxLength={30}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono uppercase focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success || !activationMode}
              className="w-full py-3.5 px-4 rounded-xl text-white text-xs sm:text-sm font-bold shadow-electric hover:shadow-glow-blue transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              style={{
                background:
                  "linear-gradient(135deg, #1d4ed8, #2563eb, #0ea5e9)",
              }}
            >
              {loading ? (
                <span>Creating your account...</span>
              ) : success ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {activationMode === "admin"
                    ? "Registration received"
                    : "Account Created! Entering App..."}
                </span>
              ) : (
                <>
                  <span>Create Account & Start Learning</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Already have an account link */}
          <div className="text-center pt-2 border-t border-slate-200">
            <p className="text-xs text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-blue-600 hover:text-blue-800 underline"
              >
                Sign In with your Gmail here
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
