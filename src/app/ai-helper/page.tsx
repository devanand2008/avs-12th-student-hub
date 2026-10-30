"use client";

import Sidebar from "@/components/layout/Sidebar";
import {
  AlertCircle,
  BookOpen,
  Check,
  Copy,
  ArrowLeft,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  Square,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import Link from "next/link";

interface Citation {
  subject: string;
  chapter: string;
  topic?: string;
  source: string;
}
interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  citations?: Citation[];
  foundInKnowledgeBase?: boolean;
  engine?: string;
  notice?: string;
  answerType?: "study" | "conversation" | "unavailable";
}
interface ModelStatus {
  ready: boolean;
  provider: string;
}

const welcome: Message = {
  id: "welcome",
  sender: "assistant",
  text: "Vanakkam! 👋 We can chat, plan your revision, or explore a study question in English or Tamil. When I use your course material, I’ll show the sources. Choose Study sources for answers limited to those notes.",
  answerType: "conversation",
};
const samplePrompts = [
  { text: "Hi!", category: "Chat" },
  {
    text: "Help me plan my revision for today",
    category: "Chat",
  },
  {
    text: "Explain pure and impure functions",
    category: "Study",
  },
  { text: "Explain the four phases of the menstrual cycle", category: "Study" },
];

export default function AIStudyHelperPage() {
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [inputText, setInputText] = useState("");
  const [language, setLanguage] = useState<"English" | "Tamil">("English");
  const [mode, setMode] = useState<"auto" | "study">("auto");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const followLatest = useRef(true);
  const requestRef = useRef<AbortController | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (followLatest.current && logRef.current)
      logRef.current.scrollTo({
        top: logRef.current.scrollHeight,
        // Instant scrolling keeps programmatic scroll events at the bottom and
        // respects reduced-motion preferences without losing the next reply.
        behavior: "instant",
      });
  }, [messages, loading]);

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 112) + "px";
    }
  }, [inputText]);

  useEffect(() => {
    let frame = 0;
    const viewport = window.visualViewport;
    function resize() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const shell = shellRef.current;
        if (!shell) return;
        const top = Math.max(
          0,
          shell.getBoundingClientRect().top - (viewport?.offsetTop || 0),
        );
        const height = Math.max(
          180,
          (viewport?.height || window.innerHeight) - top,
        );
        shell.style.height = height + "px";
        shell.dataset.compact = String(height < 400);
      });
    }
    resize();
    const siteHeader = document.querySelector("body header");
    const observer = new ResizeObserver(resize);
    if (siteHeader) observer.observe(siteHeader);
    window.addEventListener("resize", resize);
    viewport?.addEventListener("resize", resize);
    viewport?.addEventListener("scroll", resize);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      viewport?.removeEventListener("resize", resize);
      viewport?.removeEventListener("scroll", resize);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/ai/chat", {
          cache: "no-store",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(5000),
          ]),
        });
        if (!response.ok) throw new Error("Status unavailable");
        const data = await response.json();
        if (active) setStatus(data);
      } catch {
        if (active) setStatus({ ready: false, provider: "unknown" });
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 30000);
    return () => {
      active = false;
      controller.abort();
      requestRef.current?.abort();
      if (copyTimer.current) clearTimeout(copyTimer.current);
      clearInterval(timer);
    };
  }, []);

  async function handleSend(query?: string) {
    const text = (query || inputText).trim();
    if (!text || requestRef.current) return;
    const controller = new AbortController();
    const userMessageId = crypto.randomUUID();
    followLatest.current = true;
    requestRef.current = controller;
    const history = messages
      .filter((m) => m.id !== "welcome")
      .slice(-6)
      .map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text.slice(0, 4000),
      }));
    setMessages((previous) => [
      ...previous,
      { id: userMessageId, sender: "user", text },
    ]);
    setInputText("");
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language, history, mode }),
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(185000),
        ]),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "The study helper could not answer. Please try again.",
        );
      if (typeof data.response !== "string" || !data.response.trim())
        throw new Error("No explanation was returned. Please try again.");
      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          sender: "assistant",
          text: data.response,
          citations: data.citations || [],
          foundInKnowledgeBase: data.foundInKnowledgeBase,
          engine: data.engine,
          notice: data.notice,
          answerType: data.answerType,
        },
      ]);
      if (data.engine === "local-gemma")
        setStatus({ ready: true, provider: "local" });
      else if (data.engine === "gemini")
        setStatus({ ready: true, provider: "gemini" });
      else if (data.fallbackReason === "unavailable")
        setStatus((current) => ({
          ready: false,
          provider: current?.provider || "local",
        }));
    } catch (err) {
      setMessages((previous) =>
        previous.filter((message) => message.id !== userMessageId),
      );
      setInputText(text);
      setError(
        controller.signal.aborted
          ? "Generation stopped. Your question is ready to send again."
          : err instanceof Error && err.name !== "TimeoutError"
            ? err.message
            : "The AI service took too long. Please try a shorter question.",
      );
    } finally {
      requestRef.current = null;
      setLoading(false);
    }
  }

  async function copyText(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError(
        "Copy is unavailable in this browser. You can select the explanation and copy it.",
      );
    }
  }

  return (
    <div
      ref={shellRef}
      data-testid="chat-shell"
      className="study-chat flex h-[calc(100dvh-94px)] min-h-0 bg-[#f5f7fb] [&[data-compact=true]_.chat-toolbar]:hidden [&[data-compact=true]_.chat-subtitle]:hidden"
    >
      <Sidebar />
      <main className="mx-auto flex h-full min-h-0 min-w-0 max-w-5xl flex-1 flex-col bg-white md:border-x md:border-slate-200/70">
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-3 py-2 sm:px-6 sm:py-3">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 md:hidden"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="hidden h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white sm:grid">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-base font-extrabold tracking-tight text-slate-900 sm:text-xl">
              SkillUp AI Study Assistant
            </h1>
            <span
              role="status"
              className="chat-subtitle mt-1 inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500 sm:text-xs"
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${status?.ready ? "bg-emerald-500" : "bg-amber-500"}`}
              />
              {!status
                ? "Checking AI…"
                : status.provider === "excerpts"
                  ? "Study excerpts"
                  : status.provider === "gemini"
                    ? status.ready
                      ? "Gemini · enabled"
                      : "Gemini unavailable · study excerpts available"
                    : status.provider === "unknown"
                      ? "AI status unavailable"
                      : status.ready
                        ? "Gemma · running locally"
                        : "Local AI paused · study excerpts available"}
            </span>
          </div>
          <button
            type="button"
            aria-label="New chat"
            disabled={loading || messages.length === 1}
            onClick={() => {
              setMessages([welcome]);
              setError("");
              setInputText("");
              followLatest.current = true;
            }}
            className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </header>
        <div className="chat-toolbar flex shrink-0 flex-wrap items-center justify-between gap-1 border-b border-slate-100 bg-slate-50/70 px-3 py-1.5 sm:px-6">
          <div
            role="group"
            aria-label="Conversation mode"
            className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5"
          >
            {(
              [
                ["auto", "Chat & study"],
                ["study", "Study sources"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                disabled={loading}
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className={`min-h-11 rounded-lg px-2.5 text-[11px] font-semibold sm:px-3 sm:text-xs ${mode === value ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            role="group"
            aria-label="Answer language"
            className="inline-flex gap-0.5 rounded-xl p-0.5"
          >
            {(["English", "Tamil"] as const).map((value) => (
              <button
                key={value}
                type="button"
                disabled={loading}
                aria-pressed={language === value}
                onClick={() => setLanguage(value)}
                className={`min-h-11 rounded-lg px-2 text-xs font-semibold ${language === value ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100"}`}
              >
                {value === "Tamil" ? "தமிழ்" : "English"}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={logRef}
          onScroll={(event) => {
            const log = event.currentTarget;
            followLatest.current =
              log.scrollHeight - log.scrollTop - log.clientHeight < 100;
          }}
          role="log"
          aria-label="Study conversation"
          aria-live="polite"
          aria-relevant="additions"
          aria-busy={loading}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-5 sm:px-6 sm:py-6"
        >
          {messages.map((message) => {
            const isUser = message.sender === "user";
            return (
              <div
                key={message.id}
                className={`flex gap-2.5 sm:gap-3 max-w-3xl ${isUser ? "ml-auto justify-end" : "mr-auto"}`}
              >
                {!isUser && (
                  <div className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#071A3D] text-sky-200 sm:grid">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <article
                  className={`min-w-0 max-w-full rounded-2xl p-3.5 sm:p-5 ${isUser ? "max-w-[90%] rounded-tr-sm bg-blue-600 text-white shadow-sm" : message.answerType === "unavailable" || (message.foundInKnowledgeBase === false && message.answerType !== "conversation") ? "rounded-tl-sm border border-amber-200 bg-amber-50 text-amber-950" : "rounded-tl-sm border border-slate-100 bg-slate-50 text-slate-800"}`}
                >
                  {!isUser && (
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                        {message.answerType === "conversation"
                          ? message.engine === "gemini"
                            ? "Gemini · conversation"
                            : "SkillUp · conversation"
                          : message.engine === "local-gemma"
                            ? "Gemma · local explanation"
                            : message.engine === "gemini"
                              ? "Gemini · source-based explanation"
                              : message.engine === "excerpts"
                                ? "Study material"
                                : "AVS study companion"}
                      </span>
                      <button
                        type="button"
                        onClick={() => void copyText(message.id, message.text)}
                        className="grid min-h-11 min-w-11 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700"
                        aria-label="Copy explanation"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                  {isUser ? (
                    <p className="text-sm whitespace-pre-wrap leading-7 wrap-break-word">
                      {message.text}
                    </p>
                  ) : (
                    <div className="text-sm leading-7 wrap-break-word [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-slate-100 [&_code]:font-mono [&_code]:text-xs">
                      <Markdown
                        skipHtml
                        allowedElements={[
                          "p",
                          "strong",
                          "em",
                          "ul",
                          "ol",
                          "li",
                          "pre",
                          "code",
                          "blockquote",
                          "h1",
                          "h2",
                          "h3",
                          "h4",
                          "hr",
                          "br",
                        ]}
                        unwrapDisallowed
                      >
                        {message.text}
                      </Markdown>
                    </div>
                  )}
                  {message.notice && (
                    <p className="mt-3 text-xs text-amber-800 bg-amber-50 rounded-lg p-2">
                      {message.notice}
                    </p>
                  )}
                  {!!message.citations?.length && (
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <span className="inline-flex gap-1.5 items-center text-[10px] uppercase tracking-wider font-bold text-slate-500">
                        <BookOpen className="w-3.5 h-3.5" /> Study sources
                      </span>
                      {message.citations.map((citation, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-blue-100 bg-blue-50/60 p-2.5 text-xs"
                        >
                          <p className="font-semibold text-[#071A3D]">
                            {citation.subject} · {citation.chapter}
                          </p>
                          <p className="mt-1 text-slate-500">
                            {citation.topic} · {citation.source}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </div>
            );
          })}
          {loading && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-4 text-xs text-slate-600 w-fit"
            >
              <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              {status?.ready
                ? status.provider === "gemini"
                  ? "Gemini is preparing your explanation…"
                  : "Gemma is preparing your explanation…"
                : "Finding the matching study material…"}
            </div>
          )}
          {messages.length === 1 && (
            <div
              className="grid gap-2 sm:grid-cols-2"
              aria-label="Conversation starters"
            >
              {samplePrompts.map((prompt) => (
                <button
                  key={prompt.text}
                  type="button"
                  disabled={loading}
                  onClick={() => void handleSend(prompt.text)}
                  className="flex min-h-11 items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-xs font-medium leading-5 text-slate-600 hover:border-blue-300 hover:text-blue-700 disabled:opacity-40"
                >
                  {prompt.category === "Chat" ? (
                    <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  ) : (
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  )}
                  {prompt.text}
                </button>
              ))}
            </div>
          )}
        </div>
        <div
          data-testid="chat-composer"
          className="shrink-0 border-t border-slate-100 bg-white px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-3"
        >
          {error && (
            <div
              role="alert"
              className="mb-2 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {status?.provider === "gemini" && (
            <p className="chat-subtitle mb-2 text-[10px] leading-4 text-slate-500">
              Gemini receives messages, recent chat, and matching study
              excerpts.
            </p>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
            className="flex items-end gap-1 rounded-2xl border border-slate-300 bg-slate-50/50 p-1.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-visible:ring-blue-100"
          >
            <label className="sr-only" htmlFor="study-question">
              Your study question
            </label>
            <textarea
              id="study-question"
              ref={inputRef}
              rows={1}
              maxLength={4000}
              value={inputText}
              disabled={loading}
              onChange={(event) => setInputText(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !window.matchMedia("(pointer: coarse)").matches &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={
                language === "Tamil"
                  ? "உங்கள் செய்தியை எழுதுங்கள்…"
                  : mode === "study"
                    ? "Ask about your study notes…"
                    : "Message SkillUp…"
              }
              className="max-h-28 min-h-11 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-2.5 py-2 text-base leading-6 text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {loading ? (
              <button
                type="button"
                onClick={() => requestRef.current?.abort()}
                aria-label="Stop generating"
                className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-slate-800 p-3 text-white"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputText.trim()}
                aria-label="Ask AI"
                className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Ask AI</span>
              </button>
            )}
          </form>
          <div className="shrink-0 flex items-center justify-between gap-3 mt-2 text-[10px] text-slate-500">
            <p>
              {mode === "study"
                ? "Answers use matching study sources."
                : "General chat can make mistakes. Check study facts."}
            </p>
            <span>{inputText.length}/4000</span>
          </div>
        </div>
      </main>
    </div>
  );
}
