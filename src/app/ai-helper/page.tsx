"use client";

import Sidebar from "@/components/layout/Sidebar";
import {
  AlertCircle,
  BookOpen,
  Check,
  Code2,
  Copy,
  Dna,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";

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
}
interface ModelStatus {
  ready: boolean;
  provider: string;
}

const welcome: Message = {
  id: "welcome",
  sender: "assistant",
  text: "Vanakkam! Let’s make your next chapter a little clearer. Ask about Computer Science or Biology in English or Tamil. I use the study excerpts available in SkillUp and show the sources with each answer.",
};
const samplePrompts = [
  { text: "What are Pure and Impure functions in Chapter 1?", category: "CS" },
  {
    text: "Explain the four argument types in Python functions",
    category: "CS",
  },
  {
    text: "What is Tapetum and its biological functions in Anther?",
    category: "Bio",
  },
  { text: "Explain the four phases of the menstrual cycle", category: "Bio" },
];

export default function AIStudyHelperPage() {
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [inputText, setInputText] = useState("");
  const [language, setLanguage] = useState<"English" | "Tamil">("English");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages, loading]);

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
        if (active) setStatus({ ready: false, provider: "local" });
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
      { id: crypto.randomUUID(), sender: "user", text },
    ]);
    setInputText("");
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language, history }),
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
        },
      ]);
      if (data.engine === "local-gemma")
        setStatus({ ready: true, provider: "local" });
      else if (data.fallbackReason === "unavailable")
        setStatus({ ready: false, provider: "local" });
    } catch (err) {
      setInputText(text);
      setError(
        controller.signal.aborted
          ? "Generation stopped. Your question is ready to send again."
          : err instanceof Error && err.name !== "TimeoutError"
            ? err.message
            : "The local model took too long. Please try a shorter question.",
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
    <div className="flex-1 flex bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 min-w-0 max-w-5xl mx-auto px-4 sm:px-7 py-5 sm:py-7 pb-24 md:pb-7 flex flex-col h-[calc(100dvh-88px)] min-h-[660px]">
        <header className="shrink-0 rounded-3xl bg-gradient-to-br from-[#071A3D] to-[#174477] p-4 sm:p-6 text-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-blue-100">
              <ShieldCheck className="w-4 h-4 text-emerald-300" /> Your Class 12
              study companion
            </span>
            <span
              role="status"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${status?.ready ? "bg-emerald-300" : "bg-amber-300"}`}
              />
              {!status
                ? "Checking local AI…"
                : status.provider === "excerpts"
                  ? "Study excerpts"
                  : status.ready
                    ? "Gemma · running locally"
                    : "Local AI paused · study excerpts available"}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-xl sm:text-3xl font-bold tracking-tight">
                SkillUp AI Study Assistant
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-blue-100/80">
                Understand a concept. Find your source. Keep learning.
              </p>
            </div>
            <button
              type="button"
              aria-label="New chat"
              disabled={loading || messages.length === 1}
              onClick={() => {
                setMessages([welcome]);
                setError("");
                setInputText("");
              }}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20 disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New chat</span>
            </button>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-2 py-3 shrink-0">
          <span className="text-[11px] font-medium text-slate-500">
            Computer Science & Biology · Sources included
          </span>
          <div
            className="inline-flex rounded-xl border border-slate-200 bg-white p-1"
            aria-label="Answer language"
          >
            {(["English", "Tamil"] as const).map((value) => (
              <button
                key={value}
                type="button"
                disabled={loading}
                aria-pressed={language === value}
                onClick={() => setLanguage(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${language === value ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {value === "Tamil" ? "தமிழ்" : "English"}
              </button>
            ))}
          </div>
        </div>

        <div
          role="log"
          aria-label="Study conversation"
          aria-live="polite"
          aria-relevant="additions"
          aria-busy={loading}
          className="flex-1 min-h-0 overflow-y-auto space-y-5 py-3 pr-1"
        >
          {messages.map((message) => {
            const isUser = message.sender === "user";
            return (
              <div
                key={message.id}
                className={`flex gap-2.5 sm:gap-3 max-w-3xl ${isUser ? "ml-auto justify-end" : "mr-auto"}`}
              >
                {!isUser && (
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-[#071A3D] text-sky-200 grid place-items-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <article
                  className={`min-w-0 rounded-2xl p-4 sm:p-5 shadow-xs ${isUser ? "bg-blue-600 text-white rounded-tr-sm" : message.foundInKnowledgeBase === false ? "bg-amber-50 border border-amber-200 text-amber-950 rounded-tl-sm" : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"}`}
                >
                  {!isUser && (
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                        {message.engine === "local-gemma"
                          ? "Gemma · local explanation"
                          : message.engine === "excerpts"
                            ? "Study material"
                            : "AVS study companion"}
                      </span>
                      <button
                        type="button"
                        onClick={() => void copyText(message.id, message.text)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
                ? "Gemma is preparing your explanation…"
                : "Finding the matching study material…"}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 overflow-x-auto py-3 shrink-0">
          {samplePrompts.map((prompt) => (
            <button
              key={prompt.text}
              type="button"
              disabled={loading}
              onClick={() => void handleSend(prompt.text)}
              className="flex items-center gap-2 shrink-0 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-600 hover:border-blue-300 hover:text-blue-700 disabled:opacity-40"
            >
              {prompt.category === "CS" ? (
                <Code2 className="w-3.5 h-3.5 text-blue-600" />
              ) : (
                <Dna className="w-3.5 h-3.5 text-emerald-600" />
              )}
              {prompt.text}
            </button>
          ))}
        </div>
        {error && (
          <div
            role="alert"
            className="mb-2 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
          className="shrink-0 flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
        >
          <label className="sr-only" htmlFor="study-question">
            Your study question
          </label>
          <textarea
            id="study-question"
            rows={2}
            maxLength={4000}
            value={inputText}
            disabled={loading}
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder={
              language === "Tamil"
                ? "உங்கள் பாடக் கேள்வியை இங்கே எழுதுங்கள்…"
                : "Ask a question about your chapter…"
            }
            className="min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {loading ? (
            <button
              type="button"
              onClick={() => requestRef.current?.abort()}
              aria-label="Stop generating"
              className="rounded-xl bg-slate-800 p-3 text-white"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputText.trim()}
              aria-label="Ask AI"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          )}
        </form>
        <div className="shrink-0 flex items-center justify-between gap-3 mt-2 text-[10px] text-slate-500">
          <p>
            Local AI uses your study sources. Check explanations with your
            textbook.
          </p>
          <span>{inputText.length}/4000</span>
        </div>
      </main>
    </div>
  );
}
