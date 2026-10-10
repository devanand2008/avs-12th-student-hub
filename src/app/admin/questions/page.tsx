"use client";

import Sidebar from "@/components/layout/Sidebar";
import { Question, Subject, Chapter } from "@/types";
import Link from "next/link";
import { Eye, HelpCircle, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState<
    (Subject & { chapters: Chapter[] })[]
  >([]);
  const [filterSubject, setFilterSubject] = useState("all");
  useEffect(() => {
    fetch("/api/subjects?library=all")
      .then((response) => response.json())
      .then((data) => setSubjects(data.subjects || []))
      .catch(() => setError("Could not load chapters. Refresh to try again."));
  }, []);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Form state
  const [newQText, setNewQText] = useState("");
  const [newQTextTamil, setNewQTextTamil] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correct, setCorrect] = useState<"A" | "B" | "C" | "D">("A");
  const [explanation, setExplanation] = useState("");
  const [explanationTamil, setExplanationTamil] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Medium",
  );
  const [sourceType, setSourceType] = useState<"Book-In" | "Book-Out">(
    "Book-In",
  );
  const [chapterId, setChapterId] = useState("cs-ch-1");

  const fetchQuestions = useCallback(() => {
    const params = new URLSearchParams();
    if (filterSource !== "all") params.set("sourceType", filterSource);
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (filterSubject !== "all") params.set("subjectId", filterSubject);
    params.set("page", String(page));
    return fetch("/api/admin/questions?" + params.toString())
      .then((response) => response.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setQuestions(data.questions || []);
        setTotal(data.total || 0);
      })
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, [filterSource, filterStatus, filterSubject, page]);

  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  const updateStatus = async (
    questionId: string,
    newStatus: Question["status"],
  ) => {
    await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-status", questionId, newStatus }),
    });
    fetchQuestions();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapterId,
        questionText: newQText,
        questionTextTamil: newQTextTamil,
        optionA: optA,
        optionB: optB,
        optionC: optC,
        optionD: optD,
        correctAnswer: correct,
        explanation,
        explanationTamil,
        difficulty,
        sourceType,
        status: "Published",
        stream: chapterId.startsWith("cs") ? "Computer Science" : "Biology",
        subjectId: chapterId.startsWith("cs")
          ? "sub-cs"
          : chapterId.startsWith("zoo")
            ? "sub-zoology"
            : "sub-botany",
      }),
    });

    if (res.ok) {
      setShowCreateModal(false);
      // Reset form
      setNewQText("");
      setOptA("");
      setOptB("");
      setOptC("");
      setOptD("");
      setExplanation("");
      fetchQuestions();
    } else {
      const data = await res.json();
      setError(data.error || "Could not create the question.");
    }
  };

  if (loading)
    return (
      <div className="flex flex-1">
        <Sidebar isAdmin />
        <main
          className="workspace"
          role="status"
          aria-label="Loading question bank"
        >
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
        </main>
      </div>
    );

  return (
    <div className="flex-1 flex bg-[#F8FAFC]">
      <Sidebar isAdmin={true} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-[#2563EB] mb-2 border border-blue-200">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>TN Class 12 MCQ Bank Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A3D]">
              Question Bank & Moderation
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Teacher review workflow: AI Draft → Teacher Review → Approved →
              Published. Separated Book-In textbook questions and Book-Out
              application problems.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="touch-target px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New MCQ</span>
          </button>
        </div>

        {/* Filter Bar */}
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Filter subject
            <select
              value={filterSubject}
              onChange={(event) => {
                setPage(1);
                setFilterSubject(event.target.value);
              }}
            >
              <option value="all">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>
          <Link
            href="/admin/textbook-questions"
            className="btn-secondary text-sm"
          >
            Review imported textbook MCQs
          </Link>
          <Link
            href="/admin/questions/import"
            className="btn-secondary text-sm"
          >
            Import MCQ spreadsheet
          </Link>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Category:</span>
            <button
              onClick={() => {
                setPage(1);
                setFilterSource("all");
              }}
              className={`px-3 py-1.5 rounded-lg font-bold ${
                filterSource === "all"
                  ? "bg-[#2563EB] text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setPage(1);
                setFilterSource("Book-In");
              }}
              className={`px-3 py-1.5 rounded-lg font-bold ${
                filterSource === "Book-In"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              Book-In (Textbook)
            </button>
            <button
              onClick={() => {
                setPage(1);
                setFilterSource("Book-Out");
              }}
              className={`px-3 py-1.5 rounded-lg font-bold ${
                filterSource === "Book-Out"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              Book-Out (Advanced)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Workflow Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setPage(1);
                setFilterStatus(e.target.value);
              }}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Approved">Approved</option>
              <option value="Teacher Review">Teacher Review</option>
              <option value="Draft">AI Draft</option>
            </select>
          </div>
        </div>

        {/* Questions Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Question Text</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Answer</th>
                  <th className="py-3 px-4">Workflow Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map((q) => (
                  <tr
                    key={q.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-md">
                      <div className="line-clamp-2">{q.questionText}</div>
                      {q.questionTextTamil && (
                        <div className="text-[11px] text-slate-400 font-normal line-clamp-1 mt-0.5">
                          {q.questionTextTamil}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          q.sourceType === "Book-In"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {q.sourceType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          q.difficulty === "Easy"
                            ? "bg-blue-50 text-blue-700"
                            : q.difficulty === "Medium"
                              ? "bg-amber-50 text-amber-800"
                              : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#2563EB]">
                      Option {q.correctAnswer}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setPreviewQuestion(q)}
                        className="p-1.5 text-slate-500 hover:text-[#2563EB] rounded-lg hover:bg-blue-50"
                        title="Preview Full Question"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                      {q.status !== "Published" ? (
                        <button
                          onClick={() => updateStatus(q.id, "Published")}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold text-[10px]"
                        >
                          Approve & Publish
                        </button>
                      ) : (
                        <button
                          onClick={() => updateStatus(q.id, "Teacher Review")}
                          className="px-2 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg font-bold text-[10px]"
                        >
                          Set Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Question Modal */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p>
            {total} questions · Page {page} of{" "}
            {Math.max(1, Math.ceil(total / 50))}
          </p>
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </button>
            <button
              className="btn-secondary"
              disabled={page * 50 >= total}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </button>
          </div>
        </div>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-4">
              <h2 className="text-xl font-bold text-[#071A3D]">
                Add New Class 12 MCQ
              </h2>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Target Chapter
                  </label>
                  <select
                    value={chapterId}
                    onChange={(e) => setChapterId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    {subjects.map((subject) => (
                      <optgroup key={subject.id} label={subject.name}>
                        {subject.chapters.map((chapter) => (
                          <option key={chapter.id} value={chapter.id}>
                            {chapter.chapterNumber}. {chapter.title}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Question Text (English) *
                  </label>
                  <textarea
                    rows={2}
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    required
                    placeholder="Enter full objective question statement..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Question Text (Tamil)
                  </label>
                  <textarea
                    rows={2}
                    value={newQTextTamil}
                    onChange={(e) => setNewQTextTamil(e.target.value)}
                    placeholder="வினா தமிழ் வடிவம் (விரும்பினால்)..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Option A *
                    </label>
                    <input
                      type="text"
                      value={optA}
                      onChange={(e) => setOptA(e.target.value)}
                      required
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Option B *
                    </label>
                    <input
                      type="text"
                      value={optB}
                      onChange={(e) => setOptB(e.target.value)}
                      required
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Option C *
                    </label>
                    <input
                      type="text"
                      value={optC}
                      onChange={(e) => setOptC(e.target.value)}
                      required
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Option D *
                    </label>
                    <input
                      type="text"
                      value={optD}
                      onChange={(e) => setOptD(e.target.value)}
                      required
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <label className="block font-bold text-slate-700">
                  Tamil explanation (optional)
                  <textarea
                    value={explanationTamil}
                    onChange={(e) => setExplanationTamil(e.target.value)}
                    rows={2}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 p-3"
                  />
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Correct Answer *
                    </label>
                    <select
                      value={correct}
                      onChange={(e) =>
                        setCorrect(e.target.value as Question["correctAnswer"])
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Source Category
                    </label>
                    <select
                      value={sourceType}
                      onChange={(e) =>
                        setSourceType(e.target.value as Question["sourceType"])
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="Book-In">Book-In (Textbook)</option>
                      <option value="Book-Out">Book-Out (Application)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) =>
                        setDifficulty(e.target.value as Question["difficulty"])
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Answer Explanation
                  </label>
                  <textarea
                    rows={2}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Provide textbook reasoning for the answer..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                  >
                    Save & Publish Question
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Question Preview Modal */}
        {previewQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2563EB]">
                  {previewQuestion.sourceType} • {previewQuestion.difficulty}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600">
                  Correct: Option {previewQuestion.correctAnswer}
                </span>
              </div>

              <h3 className="text-base font-bold text-[#071A3D]">
                {previewQuestion.questionText}
              </h3>
              {previewQuestion.questionTextTamil && (
                <p className="text-xs text-slate-500">
                  {previewQuestion.questionTextTamil}
                </p>
              )}

              <div className="space-y-1.5 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  A. {previewQuestion.optionA}
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  B. {previewQuestion.optionB}
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  C. {previewQuestion.optionC}
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  D. {previewQuestion.optionD}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-xs text-slate-700">
                <strong>Explanation:</strong> {previewQuestion.explanation}
              </div>

              <button
                onClick={() => setPreviewQuestion(null)}
                className="w-full py-2 bg-[#071A3D] text-white rounded-xl text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
