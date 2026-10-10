"use client";

import type { Question, QuizSession } from "@/types";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Flag,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import PracticeText from "@/components/learning/PracticeText";
import { isTextPracticeQuestion } from "@/lib/practice-question-text";

type Answer = "A" | "B" | "C" | "D";
type PracticeQuestion = Omit<Question, "correctAnswer" | "explanation"> & {
  correctAnswer?: Answer;
  explanation?: string;
};

interface Review {
  questionId: string;
  questionText: string;
  selectedAnswer: Answer | null;
  correctAnswer: Answer;
  explanation: string;
  isCorrect: boolean;
  sourceTextbookId?: string;
  sourcePage?: number;
  sourceAnswerPage?: number;
  sourceQuestionNumber?: number;
}

interface Result {
  session: QuizSession;
  accuracy: number;
  recommendation: string;
  reviewDetails: Review[];
}

function ReviewQuestion({
  review,
  question,
}: {
  review: Review;
  question?: PracticeQuestion;
}) {
  if (!question || !isTextPracticeQuestion(question)) {
    return (
      <p className="mt-2 text-sm text-slate-600">
        This earlier attempt used a textbook page question. Its score is saved;
        start a new practice for separate text questions and choices.
      </p>
    );
  }
  return (
    <>
      <h3 className="mt-2 text-sm font-bold text-[#071A3D] leading-snug">
        <PracticeText text={question.questionText} />
      </h3>
      <ol aria-label="Answer options" className="mt-3 space-y-2">
        {(["A", "B", "C", "D"] as const).map((answer) => {
          const optionText =
            question[
              `option${answer}` as "optionA" | "optionB" | "optionC" | "optionD"
            ];
          if (!optionText?.trim()) return null;
          return (
            <li
              key={answer}
              className={`flex gap-3 rounded-xl border p-3 text-sm ${
                answer === review.correctAnswer
                  ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <strong className="shrink-0">{answer}.</strong>
              <PracticeText text={optionText} />
            </li>
          );
        })}
      </ol>
    </>
  );
}

function PracticeContent() {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.toString();
  const [quiz, setQuiz] = useState<QuizSession | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [syncText, setSyncText] = useState("Your answers save automatically.");
  const [result, setResult] = useState<Result | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [wrongOnly, setWrongOnly] = useState(false);

  const storageKey = useRef("");
  const answerRef = useRef<Record<string, Answer>>({});
  const flagRef = useRef<Record<string, boolean>>({});
  const busyRef = useRef(false);

  useEffect(() => {
    let disposed = false;
    async function load() {
      try {
        const auth = await fetch("/api/auth/me").then((r) => r.json());
        storageKey.current = "avs_practice_" + auth.user?.id + "_" + query;
        const p = new URLSearchParams(query);
        let stored: {
          id?: string;
          answers?: Record<string, Answer>;
          flags?: Record<string, boolean>;
          index?: number;
        } = {};
        try {
          stored = JSON.parse(localStorage.getItem(storageKey.current) || "{}");
        } catch {}

        let data;
        if (stored.id) {
          const res = await fetch("/api/practice/session?id=" + stored.id);
          if (res.ok) {
            const previous = await res.json();
            if (!previous.session.isCompleted) data = previous;
          }
        }
        if (!data) {
          const res = await fetch("/api/practice/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subjectId: p.get("subjectId") || "sub-cs",
              chapterId: p.get("chapterId") || undefined,
              mode: p.get("mode") || "quick",
              sourceFilter: p.get("sourceFilter") || "All",
              limit: Number(p.get("count") || 10),
            }),
          });
          data = await res.json();
          if (!res.ok)
            throw new Error(data.error || "Could not start practice.");
          stored = {};
        }
        if (disposed) return;
        const serverAnswers = Object.fromEntries(
          Object.entries(data.session.answers || {})
            .filter(
              ([, answer]) =>
                (answer as { selectedAnswer: Answer | null }).selectedAnswer,
            )
            .map(([id, answer]) => [
              id,
              (answer as { selectedAnswer: Answer }).selectedAnswer,
            ]),
        );
        answerRef.current = { ...serverAnswers, ...stored.answers };
        flagRef.current = stored.flags || {};
        setAnswers(answerRef.current);
        setFlags(flagRef.current);
        setIndex(Math.min(stored.index || 0, data.questions.length - 1));
        setQuiz(data.session);
        setQuestions(data.questions);
        try {
          localStorage.setItem(
            storageKey.current,
            JSON.stringify({
              id: data.session.id,
              answers: answerRef.current,
              flags: flagRef.current,
              index: stored.index || 0,
            }),
          );
        } catch {}
      } catch (err) {
        if (!disposed)
          setError(
            err instanceof Error
              ? err.message
              : "Could not start practice. Please try again.",
          );
      } finally {
        if (!disposed) setLoading(false);
      }
    }
    void load();
    return () => {
      disposed = true;
    };
  }, [query]);

  const sync = useCallback(async () => {
    if (!quiz || busyRef.current) return;
    const answeredCount = Object.keys(answerRef.current).length;
    setSyncText(
      answeredCount > 0 ? "Saving answers to cloud…" : "Ready to save answers.",
    );
    try {
      const res = await fetch("/api/practice/save", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: quiz.id,
          answers: answerRef.current,
        }),
      });
      if (res.ok) {
        setSyncText("All answers saved securely.");
      } else {
        setSyncText("Saving locally on this device.");
      }
    } catch {
      setSyncText("Offline mode: saved locally on device.");
    }
  }, [quiz]);

  const submit = useCallback(async () => {
    if (!quiz || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/practice/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: quiz.id,
          answers: answerRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit practice.");
      try {
        localStorage.removeItem(storageKey.current);
      } catch {}
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Submission failed. Please retry.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [quiz]);

  useEffect(() => {
    if (!quiz || result) return;
    const tick = () => {
      const now = Date.now();
      const start = Date.parse(quiz.startedAt);
      setSeconds(Math.max(0, Math.floor((now - start) / 1000)));
      if (
        quiz.expiresAt &&
        Date.now() >= Date.parse(quiz.expiresAt) &&
        navigator.onLine
      ) {
        void submit();
      }
    };
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, [quiz, result, submit]);

  function persist(nextIndex = index) {
    if (!quiz) return;
    try {
      localStorage.setItem(
        storageKey.current,
        JSON.stringify({
          id: quiz.id,
          answers: answerRef.current,
          flags: flagRef.current,
          index: nextIndex,
        }),
      );
    } catch {
      setSyncText("Device storage full. Keep this tab open.");
    }
  }

  function choose(answer: Answer) {
    if (!quiz || busy || result) return;
    const question = questions[index];
    answerRef.current = { ...answerRef.current, [question.id]: answer };
    setAnswers(answerRef.current);
    persist();
    void sync().catch(() => {});
  }

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12" role="status">
        <div className="h-96 animate-pulse rounded-3xl bg-slate-200/80" />
      </main>
    );
  }

  if (!quiz) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center rounded-3xl border border-slate-200 bg-white p-12 shadow-sm">
          <Target size={44} className="mx-auto text-blue-500 mb-4" />
          <h2 className="text-xl font-bold text-[#071A3D]">
            No Questions Ready
          </h2>
          <p
            role="alert"
            className="text-sm text-slate-500 mt-2 max-w-md mx-auto"
          >
            {error ||
              "Questions are being curated for this chapter. Please choose another chapter or subject."}
          </p>
          <div className="mt-6">
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              <ArrowLeft size={14} /> Return to Practice Hub
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const question = questions[index];
  const exam = quiz.mode === "timed";
  const selected = answers[question?.id];
  const remaining = quiz.expiresAt
    ? Math.max(
        0,
        Math.ceil(
          (Date.parse(quiz.expiresAt) - Date.parse(quiz.startedAt)) / 1000,
        ) - seconds,
      )
    : seconds;
  const time =
    Math.floor(remaining / 60) + ":" + String(remaining % 60).padStart(2, "0");

  // RESULT SCREEN
  if (result) {
    const accuracy = Math.round(result.accuracy);
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (accuracy / 100) * circumference;

    return (
      <main className="w-full min-w-0 max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-7">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>SESSION COMPLETE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#071A3D] font-heading">
            Practice Performance Summary
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Every practice attempt solidifies your board exam recall.
          </p>
        </div>

        {/* Scorecard Hero with Radial Accuracy Ring */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-md">
          <div className="grid gap-6 sm:grid-cols-12 items-center">
            {/* Left: Radial Accuracy Meter */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50/70 rounded-2xl border border-slate-100">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg
                  className="w-36 h-36 transform -rotate-90"
                  viewBox="0 0 120 120"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="text-slate-200"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="text-emerald-500 transition-all duration-1000"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-extrabold text-[#071A3D] font-heading">
                    {accuracy}%
                  </span>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Accuracy
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs font-bold text-slate-700">
                Score: {result.session.score} / {result.session.totalQuestions}
              </div>
            </div>

            {/* Right: Breakdown & Recommendation */}
            <div className="sm:col-span-7 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-lg font-extrabold text-emerald-800">
                    {result.session.correctCount}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600">
                    Correct
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-lg font-extrabold text-rose-800">
                    {result.session.wrongCount}
                  </div>
                  <div className="text-[11px] font-semibold text-rose-600">
                    Wrong
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
                  <div className="text-lg font-extrabold text-slate-700">
                    {result.session.unansweredCount}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Skipped
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-blue-800">
                  <Sparkles size={14} /> Academic Recommendation
                </div>
                <p>{result.recommendation}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const next = new URLSearchParams(query);
                    next.set("attempt", String(Date.now()));
                    router.push(`/practice/session?${next}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <RotateCcw size={14} /> Practice Again
                </button>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                >
                  Dashboard <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Answer Review Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#071A3D]">
              Detailed Answer Review
            </h2>
            <button
              onClick={() => setWrongOnly(!wrongOnly)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {wrongOnly ? "Show All Questions" : "Show Mistakes Only"}
            </button>
          </div>

          <div className="space-y-3">
            {result.reviewDetails
              .filter((rev) => !wrongOnly || !rev.isCorrect)
              .map((rev, idx) => (
                <div
                  key={rev.questionId}
                  className={`p-5 rounded-2xl border transition-all ${
                    rev.isCorrect
                      ? "bg-white border-slate-200/90"
                      : "bg-rose-50/40 border-rose-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-bold text-slate-400">
                      Q{idx + 1}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        rev.isCorrect
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {rev.isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>

                  <ReviewQuestion
                    review={rev}
                    question={questions.find(
                      (item) => item.id === rev.questionId,
                    )}
                  />

                  <div className="mt-3 flex flex-wrap gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Your Answer: </span>
                      <strong
                        className={
                          rev.isCorrect ? "text-emerald-700" : "text-rose-700"
                        }
                      >
                        {rev.selectedAnswer || "Unanswered"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Correct Answer: </span>
                      <strong className="text-emerald-700">
                        {rev.correctAnswer}
                      </strong>
                    </div>
                  </div>

                  {rev.explanation && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl">
                      <strong className="text-slate-800">Explanation: </strong>
                      <PracticeText text={rev.explanation} />
                    </div>
                  )}
                  {rev.sourceTextbookId && (
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-blue-700">
                      <Link
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`/textbooks/${rev.sourceTextbookId}?page=${rev.sourcePage || 1}`}
                      >
                        Original question {rev.sourceQuestionNumber || ""}
                      </Link>
                      {rev.sourceAnswerPage && (
                        <Link
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`/textbooks/${rev.sourceTextbookId}?page=${rev.sourceAnswerPage}`}
                        >
                          Printed answer key
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      </main>
    );
  }

  if (!question || !isTextPracticeQuestion(question)) {
    return (
      <main className="w-full min-w-0 max-w-4xl mx-auto px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-[#071A3D]">
            Start a new text practice
          </h1>
          <p role="alert" className="mt-3 text-sm text-slate-600">
            This saved attempt used textbook pages. Choose a new practice with
            separate text questions and answer choices.
          </p>
          <Link
            href="/textbook-practice"
            className="btn-primary mt-6 inline-flex"
          >
            Choose a chapter
          </Link>
        </div>
      </main>
    );
  }

  // ACTIVE QUESTION RUNNER SCREEN
  return (
    <main className="w-full min-w-0 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        <Link
          href={
            params.get("subjectId")?.startsWith("tb-")
              ? "/textbook-practice"
              : "/practice"
          }
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={15} />
          <span>Exit to Practice Hub</span>
        </Link>

        {/* Timer Pill */}
        <div
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
            exam && remaining <= 60
              ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
              : "bg-white border-slate-200 text-slate-700 shadow-2xs"
          }`}
        >
          <Clock
            size={14}
            className={
              exam && remaining <= 60 ? "text-rose-600" : "text-slate-500"
            }
          />
          <span>
            {exam ? "Time Left: " : "Timer: "} {time}
          </span>
        </div>
      </div>

      {/* Progress Bar & Status Line */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700">
            {quiz.sourceFilter || "All Questions"} ·{" "}
            {exam ? "Timed Mode" : "Quick Practice"}
          </span>
          <span>
            <strong>{Object.keys(answers).length}</strong> of {questions.length}{" "}
            Answered
          </span>
        </div>
        <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{
              width: `${(Object.keys(answers).length / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800"
        >
          {error}
        </div>
      )}

      {/* Active Question Card */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-md space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="inline-flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              QUESTION {index + 1} OF {questions.length}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {question.sourceType === "Book-Out"
                ? "B. Book-Out 1 Mark"
                : "A. Book-In 1 Mark"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              flagRef.current = {
                ...flagRef.current,
                [question.id]: !flagRef.current[question.id],
              };
              setFlags(flagRef.current);
              persist();
              void sync().catch(() => {});
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              flags[question.id]
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Flag
              size={13}
              className={
                flags[question.id]
                  ? "text-amber-600 fill-amber-600"
                  : "text-slate-400"
              }
            />
            <span>{flags[question.id] ? "Flagged for Review" : "Flag"}</span>
          </button>
        </div>

        {/* Question Text */}
        <div className="space-y-3">
          <h1 className="text-base sm:text-lg font-bold text-[#071A3D] leading-relaxed font-heading">
            <PracticeText text={question.questionText} testId="question-text" />
          </h1>

          {/* Bilingual Tamil Question */}
          {question.questionTextTamil && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                தமிழ் வடிவம்:
              </div>
              <p lang="ta">
                <PracticeText text={question.questionTextTamil} />
              </p>
            </div>
          )}
        </div>

        {/* 4 Options Grid */}
        <fieldset className="space-y-3 pt-2">
          <legend className="sr-only">Choose your answer</legend>
          {(["A", "B", "C", "D"] as const).map((key) => {
            const isThisSelected = selected === key;
            const optionText =
              question[
                ("option" + key) as
                  "optionA" | "optionB" | "optionC" | "optionD"
              ];

            if (!optionText) return null;

            return (
              <label
                key={key}
                className={`flex min-h-[52px] cursor-pointer items-center gap-3.5 rounded-2xl border px-4 py-3 transition-all ${
                  isThisSelected
                    ? "border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={key}
                  checked={isThisSelected}
                  onChange={() => choose(key)}
                  disabled={busy}
                  className="sr-only"
                />
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isThisSelected
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {key}
                </span>

                <PracticeText
                  text={optionText}
                  testId="option-text"
                  className="text-xs sm:text-sm font-medium text-slate-800 leading-snug"
                />

                {isThisSelected && (
                  <Check size={16} className="ml-auto shrink-0 text-blue-600" />
                )}
              </label>
            );
          })}
        </fieldset>

        {/* Instant Answer Feedback (Only in Quick Mode) */}
        {selected && !exam && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
              selected === question.correctAnswer
                ? "bg-emerald-50/90 border-emerald-300 text-emerald-950"
                : "bg-amber-50/90 border-amber-300 text-amber-950"
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 mb-1.5">
              <BookOpen size={16} />
              <span>
                {selected === question.correctAnswer
                  ? "Correct Answer! Well done."
                  : `Incorrect. The correct answer is Option ${question.correctAnswer}.`}
              </span>
            </div>
            {question.explanation && (
              <PracticeText
                text={question.explanation}
                className="text-xs text-slate-700"
              />
            )}
            {question.sourceAnswerPage && question.sourceTextbookId && (
              <Link
                className="mt-2 inline-block font-semibold text-blue-700 underline"
                target="_blank"
                rel="noopener noreferrer"
                href={`/textbooks/${question.sourceTextbookId}?page=${question.sourceAnswerPage}`}
              >
                View the printed answer key
              </Link>
            )}
          </div>
        )}

        {question.sourceTextbookId && !exam && (
          <Link
            href={`/textbooks/${question.sourceTextbookId}?page=${question.sourcePage || 1}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-blue-700"
          >
            <BookOpen size={14} /> View textbook source (optional)
          </Link>
        )}

        {/* Bottom Card Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={index === 0 || busy}
            onClick={() => {
              setIndex(index - 1);
              persist(index - 1);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ArrowLeft size={14} /> Previous
          </button>

          {index < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                setIndex(index + 1);
                persist(index + 1);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <span>Next Question</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
            >
              <span>{busy ? "Submitting..." : "Submit Practice Test"}</span>
              <Check size={15} />
            </button>
          )}
        </div>
      </section>

      {/* Cloud Sync Status */}
      <p className="text-center text-[11px] text-slate-400" role="status">
        {syncText}
      </p>

      {/* Question Dot Navigator Grid */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-bold text-slate-700">Question Navigator:</span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Answered
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Flagged
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300" /> Unanswered
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {questions.map((q, i) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = index === i;
            const isFlagged = !!flags[q.id];

            let dotClasses =
              "w-11 h-11 scroll-mt-40 scroll-mb-32 rounded-xl text-xs font-bold flex items-center justify-center transition-all relative ";

            if (isCurrent) {
              dotClasses +=
                "bg-blue-600 text-white ring-2 ring-blue-300 shadow-xs ";
            } else if (isAnswered) {
              dotClasses +=
                "bg-emerald-100 text-emerald-800 border border-emerald-300 ";
            } else {
              dotClasses +=
                "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 ";
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setIndex(i);
                  persist(i);
                }}
                className={dotClasses}
                aria-label={`Jump to question ${i + 1}`}
              >
                {i + 1}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function PracticeAttempt() {
  const params = useSearchParams();
  return <PracticeContent key={params.toString()} />;
}

export default function PracticeSessionPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-4xl mx-auto px-4 py-12" role="status">
          <div className="h-96 animate-pulse rounded-3xl bg-slate-200" />
        </main>
      }
    >
      <PracticeAttempt />
    </Suspense>
  );
}
