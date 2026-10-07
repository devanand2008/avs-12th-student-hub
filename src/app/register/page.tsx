"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Video,
  Target,
  Building2,
} from "lucide-react";

export default function RegisterPage() {
  const activationMode = useStudentActivation();
  const router = useRouter();

  // Form State
  const [studentName, setStudentName] = useState("");
  const [phone, setPhone] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [standard, setStandard] = useState("12th Standard");
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
      setError("Please enter your full name.");
      return;
    }
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!schoolName.trim() || schoolName.trim().length < 2) {
      setError("Please enter your school name.");
      return;
    }
    if (!activationMode) {
      setError("Account setup is still loading. Please try again.");
      return;
    }
    if (activationMode === "sms" && password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (activationMode === "sms" && password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim(),
          phone: cleanPhone,
          schoolName: schoolName.trim(),
          standard,
          stream,
          studentId: studentId.trim() || undefined,
          password: activationMode === "sms" ? password : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to create account. Please try again.",
        );
      }

      setSuccess(true);
      setSuccessMessage(data.message || "Registration received.");
      setTimeout(() => {
        router.push(data.redirectTo || "/login/mobile");
        router.refresh();
      }, 1000);
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
            <span>AVS ENGINEERING COLLEGE · SALEM</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-black font-heading leading-tight tracking-tight text-white">
            Create Your Student Account
          </h1>

          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-md">
            Join the official Tamil Nadu Class 12 Higher Secondary learning hub.
            Register to access complete curriculum notes, videos, textbooks, and
            one-mark MCQ test engines.
          </p>

          {/* 4 Colorful Feature Cards */}
          <div className="space-y-3 pt-3">
            {[
              {
                icon: BookOpen,
                title: "Handwritten Faculty Notes",
                desc: "High-yield chapter notes with derivations & diagrams",
                gradient: "from-blue-600 to-cyan-500",
                badgeColor: "text-blue-300",
              },
              {
                icon: Target,
                title: "Book-In & Book-Out MCQs",
                desc: "Practice with instant scoring and Tamil explanation",
                gradient: "from-emerald-500 to-teal-500",
                badgeColor: "text-emerald-300",
              },
              {
                icon: Video,
                title: "NotebookLM Video Lessons",
                desc: "Bite-sized audio & video breakdown for every unit",
                gradient: "from-amber-500 to-orange-500",
                badgeColor: "text-amber-300",
              },
              {
                icon: Sparkles,
                title: "Grounded AI Study Assistant",
                desc: "Ask any doubt in English or Tamil with textbook citations",
                gradient: "from-purple-600 to-fuchsia-600",
                badgeColor: "text-purple-300",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all"
              >
                <div
                  className={`p-2.5 rounded-xl bg-gradient-to-br ${feature.gradient} text-white shrink-0 shadow-md`}
                >
                  <feature.icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">
                    {feature.title}
                  </h4>
                  <p className="text-[11px] text-blue-100/80 leading-relaxed mt-0.5">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Patron Contact Box */}
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
          <span>Free Educational Initiative</span>
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
              <span>NEW STUDENT ENROLLMENT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
              Create Your Free Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Fill in your details below to get immediate access to study notes,
              videos, and practice tests.
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
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                    stream === "Computer Science"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/25"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Code2 className="w-4 h-4 text-cyan-300" />
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
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                    stream === "Biology"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/25"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Dna className="w-4 h-4 text-emerald-200" />
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

            {/* Phone Number & Standard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div>
                <label
                  htmlFor="standard"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Standard / Class <span className="text-rose-500">*</span>
                </label>
                <select
                  id="standard"
                  value={standard}
                  onChange={(e) => setStandard(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none"
                >
                  <option value="12th Standard">
                    12th Standard (Higher Secondary)
                  </option>
                  <option value="11th Standard">
                    11th Standard (Higher Secondary)
                  </option>
                </select>
              </div>
            </div>

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
                  placeholder="e.g. Government Model HSS, Salem / AVS Matriculation"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Optional Custom Account ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="studentId"
                  className="block text-xs font-bold text-slate-700"
                >
                  Account ID / Student ID{" "}
                  <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-blue-600 font-bold">
                  Auto-generated if left blank
                </span>
              </div>
              <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                placeholder={`e.g. ${stream === "Computer Science" ? "AVSCS26-0042" : "AVSBIO26-0042"}`}
                maxLength={30}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono uppercase focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* Password & Confirm Password */}
            {activationMode === "sms" && (
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
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
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
                  <CheckCircle2 className="w-4 h-4" /> Account Ready! Entering
                  App...
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
                Sign In here
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
