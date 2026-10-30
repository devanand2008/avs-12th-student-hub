import { getSession } from "@/lib/auth";
import {
  generateGeminiAnswer,
  getGeminiStatus,
  GeminiLanguageError,
} from "@/lib/ai/gemini";
import {
  aiProvider,
  chatRequestSchema,
  generateLocalAnswer,
  getLocalModelStatus,
  LocalLanguageError,
  smallTalkAnswer,
  isEverydayConversation,
} from "@/lib/ai/local-gemma";
import { retrieveGroundedKnowledge } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { backendMode, BackendUnavailableError } from "@/lib/supabase/server";
import type { StreamType } from "@/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function GET() {
  if (!(await getSession()))
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  return NextResponse.json(
    aiProvider() === "gemini" ? getGeminiStatus() : await getLocalModelStatus(),
    {
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Send a valid JSON question." },
        { status: 400 },
      );
    }
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        {
          error:
            "Enter a question up to 4,000 characters and choose English or Tamil.",
        },
        { status: 400 },
      );
    const limit = await checkRateLimit(`ai_${session.userId}`, 12, 60);
    if (!limit.success)
      return NextResponse.json(
        { error: "Please wait a minute before asking more questions." },
        { status: 429 },
      );
    const input = parsed.data;
    const greeting = input.mode === "auto" ? smallTalkAnswer(input) : null;
    if (greeting)
      return NextResponse.json({
        response: greeting,
        citations: [],
        foundInKnowledgeBase: false,
        engine: "assistant",
        answerType: "conversation",
      });
    const stream = (session.stream as StreamType) || undefined;
    let matches =
      input.mode === "auto" && isEverydayConversation(input.message)
        ? []
        : await retrieveGroundedKnowledge(input.message, stream, 0.25);
    // Follow-ups can refer to the last student question, while retaining stream filtering.
    if (
      !matches.length &&
      /^(explain (it|that|this)|summari[sz]e|give (an? )?example|make (it|that)|translate|simplify|why\b|how so\b|மேலும்|சுருக்கமாக)/iu.test(
        input.message,
      )
    ) {
      const previous = [...input.history]
        .reverse()
        .find((turn) => turn.role === "user");
      if (
        previous &&
        !(input.mode === "auto" && isEverydayConversation(previous.content))
      )
        matches = await retrieveGroundedKnowledge(
          previous.content,
          stream,
          0.25,
        );
    }
    if (!matches.length && input.mode === "study")
      return NextResponse.json({
        response:
          input.language === "Tamil"
            ? "இந்தக் கேள்விக்கான தகவல் AVS பாடக் குறிப்புகளில் கிடைக்கவில்லை. உங்கள் பாட ஆசிரியரிடம் சரிபார்க்கவும்."
            : "I could not find this in the AVS study materials. Please check your Class 12 syllabus or ask your subject teacher.",
        citations: [],
        foundInKnowledgeBase: false,
        engine: "excerpts",
        answerType: "unavailable",
      });
    const citations = matches.map(({ chunk }) => ({
      subject: chunk.subjectName,
      chapter: chunk.chapterTitle,
      topic: chunk.topicTitle || "Key Concepts",
      source: `${backendMode() === "demo" ? "Demo curriculum excerpt · " : ""}${chunk.sourceType}`,
    }));
    const answerType = matches.length ? "study" : "conversation";
    let response = !matches.length
      ? input.language === "Tamil"
        ? "இப்போது AI உரையாடல் கிடைக்கவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும். பாடக் குறிப்புகளுக்குப் படிப்பு மூலங்கள் முறையைத் தேர்ந்தெடுக்கலாம்."
        : "AI conversation is temporarily unavailable. Please try again shortly, or choose Study sources to find matching course material."
      : input.language === "Tamil"
        ? matches[0].chunk.chunkTextTamil || matches[0].chunk.chunkText
        : matches[0].chunk.chunkText;
    let engine = matches.length ? "excerpts" : "assistant";
    let notice: string | undefined;
    let fallbackReason: "language" | "unavailable" | undefined;
    const provider = aiProvider();
    if (provider === "local" || provider === "gemini") {
      try {
        response = await (
          provider === "gemini" ? generateGeminiAnswer : generateLocalAnswer
        )(
          input,
          matches.map(({ chunk }) => chunk),
          request.signal,
          answerType,
        );
        engine = provider === "gemini" ? "gemini" : "local-gemma";
      } catch (error) {
        if (request.signal.aborted) return new Response(null, { status: 499 });
        const languageError =
          error instanceof LocalLanguageError ||
          error instanceof GeminiLanguageError;
        fallbackReason = languageError ? "language" : "unavailable";
        notice = !matches.length
          ? "The AI service is unavailable. Your message has not been answered by a model."
          : languageError
            ? error.message
            : provider === "gemini"
              ? "The AI service is unavailable. Showing the matching study excerpt instead."
              : "The local model is unavailable. Showing the matching study excerpt instead.";
      }
    }
    return NextResponse.json({
      response,
      citations,
      foundInKnowledgeBase: matches.length > 0,
      answerType:
        !matches.length && engine === "assistant" ? "unavailable" : answerType,
      engine,
      notice,
      fallbackReason,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "The study helper could not load your materials. Please try again.",
      },
      { status: error instanceof BackendUnavailableError ? 503 : 500 },
    );
  }
}
