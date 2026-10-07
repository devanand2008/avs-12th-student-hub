"use client";

import Sidebar from "@/components/layout/Sidebar";
import { QuizTest } from "@/types";
import { CheckCircle2, CheckSquare } from "lucide-react";
import { useState } from "react";

export default function AdminTestBuilderPage() {
  const [tests, setTests] = useState<QuizTest[]>([
    {
      id: "test-cs-1",
      title: "Class 12 CS Quick 10-Mark Drill",
      description:
        "Fast 10-question practice test covering Functions, Python basics, and SQL.",
      subjectId: "sub-cs",
      mode: "quick",
      questionCount: 10,
      durationMins: 10,
      passPercentage: 60,
      negativeMarking: false,
      allowedAttempts: 999,
      isActive: true,
    },
    {
      id: "test-bot-1",
      title: "Bio-Botany Chapter 1 Timed Exam",
      description:
        "Official 15-minute test on Plant Reproduction with server-side timer validation.",
      subjectId: "sub-botany",
      chapterId: "bot-ch-1",
      mode: "timed",
      questionCount: 10,
      durationMins: 15,
      passPercentage: 70,
      negativeMarking: false,
      allowedAttempts: 5,
      isActive: true,
    },
    {
      id: "test-zoo-1",
      title: "Bio-Zoology Daily 10 Practice",
      description:
        "Daily high-yield MCQs for Class 12 Biology public examination prep.",
      subjectId: "sub-zoology",
      mode: "daily10",
      questionCount: 10,
      durationMins: 10,
      passPercentage: 60,
      negativeMarking: false,
      allowedAttempts: 999,
      isActive: true,
    },
  ]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("sub-cs");
  const [count, setCount] = useState(10);
  const [duration, setDuration] = useState(15);
  const [passPct, setPassPct] = useState(60);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const applyTemplate = (cnt: number, dur: number) => {
    setCount(cnt);
    setDuration(dur);
  };

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    const newTest: QuizTest = {
      id: `test-custom-${Date.now()}`,
      title,
      description,
      subjectId,
      mode: "timed",
      questionCount: count,
      durationMins: duration,
      passPercentage: passPct,
      negativeMarking,
      allowedAttempts: 3,
      isActive: true,
    };
    setTests((prev) => [newTest, ...prev]);
    setTitle("");
    setDescription("");
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex-1 flex bg-[#F8FAFC]">
      <Sidebar isAdmin={true} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-[#2563EB] mb-2 border border-blue-200">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Standardized Assessment Builder</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A3D]">
            Class 12 Test Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure timed tests, question count, server-side tamper
            protection, and pass benchmarks.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Test successfully created and published for students!</span>
          </div>
        )}

        {/* Test Creation Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-[#071A3D]">
              Create New Assessment
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">
                Quick Templates:
              </span>
              <button
                type="button"
                onClick={() => applyTemplate(10, 15)}
                className="px-2.5 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 font-bold"
              >
                10 Questions (15 min)
              </button>
              <button
                type="button"
                onClick={() => applyTemplate(25, 30)}
                className="px-2.5 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 font-bold"
              >
                25 Questions (30 min)
              </button>
              <button
                type="button"
                onClick={() => applyTemplate(50, 60)}
                className="px-2.5 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 font-bold"
              >
                50 Questions (60 min)
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateTest} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Assessment Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Class 12 Computer Science Model Exam 1"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Instructions / Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specific test instructions or chapter coverage..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Subject
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="sub-cs">Computer Science</option>
                  <option value="sub-botany">Bio-Botany</option>
                  <option value="sub-zoology">Bio-Zoology</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Question Count
                </label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value, 10))}
                  min={5}
                  max={100}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                  min={5}
                  max={180}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Passing Percentage (%)
                </label>
                <input
                  type="number"
                  value={passPct}
                  onChange={(e) => setPassPct(parseInt(e.target.value, 10))}
                  min={35}
                  max={100}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="negMark"
                checked={negativeMarking}
                onChange={(e) => setNegativeMarking(e.target.checked)}
                className="w-4 h-4 text-[#2563EB] rounded accent-[#2563EB]"
              />
              <label htmlFor="negMark" className="font-semibold text-slate-700">
                Enable Negative Marking (0.25 mark deduction for wrong answers)
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="touch-target px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-all"
              >
                Create & Publish Test
              </button>
            </div>
          </form>
        </div>

        {/* Existing Tests Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#071A3D]">
            Published Assessment Tests
          </h2>

          <div className="space-y-3">
            {tests.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#071A3D]">
                    {t.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>{t.questionCount} Questions</span>
                    <span>•</span>
                    <span>{t.durationMins} Minutes</span>
                    <span>•</span>
                    <span>Pass: {t.passPercentage}%</span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
