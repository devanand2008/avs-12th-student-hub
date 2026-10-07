import { getSession } from "@/lib/auth";
import {
  aiProvider,
  chatRequestSchema,
  generateLocalAnswer,
  getLocalModelStatus,
  LocalLanguageError,
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
  return NextResponse.json(await getLocalModelStatus(), {
    headers: { "Cache-Control": "private, no-store" },
  });
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
    const stream = (session.stream as StreamType) || undefined;
    let matches = await retrieveGroundedKnowledge(input.message, stream, 0.25);
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
      if (previous)
        matches = await retrieveGroundedKnowledge(
          previous.content,
          stream,
          0.25,
        );
    }
    if (!matches.length)
      return NextResponse.json({
        response:
          input.language === "Tamil"
            ? "இந்தக் கேள்விக்கான தகவல் AVS பாடக் குறிப்புகளில் கிடைக்கவில்லை. உங்கள் பாட ஆசிரியரிடம் சரிபார்க்கவும்."
            : "I could not find this in the AVS study materials. Please check your Class 12 syllabus or ask your subject teacher.",
        citations: [],
        foundInKnowledgeBase: false,
        engine: "excerpts",
      });
    const citations = matches.map(({ chunk }) => ({
      subject: chunk.subjectName,
      chapter: chunk.chapterTitle,
      topic: chunk.topicTitle || "Key Concepts",
      source: `${backendMode() === "demo" ? "Demo curriculum excerpt · " : ""}${chunk.sourceType}`,
    }));
    let response =
      input.language === "Tamil"
        ? matches[0].chunk.chunkTextTamil || matches[0].chunk.chunkText
        : matches[0].chunk.chunkText;
    let engine = "excerpts";
    let notice: string | undefined;
    let fallbackReason: "language" | "unavailable" | undefined;
    if (aiProvider() === "local") {
      try {
        response = await generateLocalAnswer(
          input,
          matches.map(({ chunk }) => chunk),
          request.signal,
        );
        engine = "local-gemma";
      } catch (error) {
        if (request.signal.aborted) return new Response(null, { status: 499 });
        fallbackReason =
          error instanceof LocalLanguageError ? "language" : "unavailable";
        notice =
          error instanceof LocalLanguageError
            ? error.message
            : "The local model is unavailable. Showing the matching study excerpt instead.";
      }
    }
    return NextResponse.json({
      response,
      citations,
      foundInKnowledgeBase: true,
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
