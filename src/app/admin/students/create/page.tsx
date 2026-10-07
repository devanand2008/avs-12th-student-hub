"use client";

import Sidebar from "@/components/layout/Sidebar";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useStudentActivation } from "@/components/auth/useStudentActivation";

export default function CreateStudentPage() {
  const activationMode = useStudentActivation();
  const [studentName, setStudentName] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [stream, setStream] = useState("Computer Science");
  const [medium, setMedium] = useState("English");
  const [academicYear, setAcademicYear] = useState("2026-2027");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{
    student: import("@/types").Student;
    temporaryPassword: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/students/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          registerNumber,
          schoolName,
          studentEmail,
          studentPhone,
          stream,
          medium,
          academicYear,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create student account.");
        setLoading(false);
        return;
      }

      setCreatedResult(data);
    } catch {
      setError("Network error while connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex bg-[#F8FAFC]">
      <Sidebar isAdmin={true} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/students"
            className="touch-target p-2 rounded-xl hover:bg-slate-100 text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#071A3D]">
              Add New Student Account
            </h1>
            <p className="text-xs text-slate-500">
              The system automatically generates an institutional Student ID and
              initial temporary password.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {createdResult ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Student Account Successfully Created!</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div>
                <span className="text-slate-500">Student Name: </span>
                <strong className="text-slate-900">
                  {createdResult.student.studentName}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Assigned Student ID: </span>
                <strong className="font-mono text-[#2563EB] text-sm">
                  {createdResult.student.studentId}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Temporary Password: </span>
                <strong className="font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-sm">
                  {createdResult.temporaryPassword}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Stream: </span>
                <strong className="text-slate-900">
                  {createdResult.student.stream}
                </strong>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCreatedResult(null);
                  setStudentName("");
                  setRegisterNumber("");
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Add Another Student
              </button>
              <Link
                href={
                  activationMode === "admin"
                    ? "/login?studentId=" +
                      encodeURIComponent(createdResult.student.studentId)
                    : "/login/mobile?phone=" +
                      encodeURIComponent(createdResult.student.studentPhone)
                }
                className="btn-secondary"
              >
                Open student sign-in
              </Link>
              <Link
                href="/admin/students"
                className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-semibold"
              >
                Go to Students Roster
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2 content-form">
              <label>
                Medium
                <select
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                >
                  <option>English</option>
                  <option>Tamil</option>
                </select>
              </label>
              <label>
                Academic year
                <input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  pattern="[0-9]{4}-[0-9]{4}"
                  required
                />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="student-name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Full Student Name *
                </label>
                <input
                  id="student-name"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Meenakshi Sundaram K."
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="student-register"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Register Number *
                </label>
                <input
                  id="student-register"
                  type="text"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  placeholder="e.g. 12CS202615"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#2563EB] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor="student-school"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  School / Institution *
                </label>
                <input
                  id="student-school"
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="student-stream"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Stream *
                </label>
                <select
                  id="student-stream"
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Biology">Biology</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="student-email"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Email (Optional)
                </label>
                <input
                  id="student-email"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="student-phone"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Mobile Number *
                </label>
                <input
                  id="student-phone"
                  type="tel"
                  required
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  placeholder="+91 9842100000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="touch-target px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-60"
              >
                {loading ? "Generating Account..." : "Create Student Account"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
