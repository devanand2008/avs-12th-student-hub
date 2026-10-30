import {
  buildStudyPrompt,
  buildConversationPrompt,
  type AnswerType,
  type ChatRequest,
  type StudyContext,
} from "./local-gemma";

const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/";
export class GeminiLanguageError extends Error {
  constructor() {
    super(
      "Gemini could not produce a Tamil explanation. Showing the matching study excerpt instead.",
    );
  }
}

function config() {
  const keys = [
    ...new Set(
      [
        ...(process.env.GEMINI_API_KEYS || "").split(/[\s,]+/),
        process.env.GEMINI_API_KEY || "",
      ]
        .map((key) => key.trim())
        .filter(Boolean),
    ),
  ].slice(0, 5);
  const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  if (!/^gemini-[a-z0-9.-]+$/.test(model))
    throw new Error("Invalid Gemini model configuration.");
  const requested = Number(process.env.GEMINI_TIMEOUT_MS || 12000);
  return {
    keys,
    model,
    timeout: Number.isFinite(requested)
      ? Math.max(1000, Math.min(requested, 20000))
      : 12000,
  };
}

export function getGeminiStatus() {
  try {
    const { keys, model } = config();
    return {
      provider: "gemini",
      ready: keys.length > 0,
      label: keys.length ? "Gemini · enabled" : "Gemini · unavailable",
      model,
    };
  } catch {
    return {
      provider: "gemini",
      ready: false,
      label: "Gemini · unavailable",
      model: null,
    };
  }
}

export async function generateGeminiAnswer(
  input: ChatRequest,
  context: StudyContext[],
  signal?: AbortSignal,
  answerType: AnswerType = "study",
) {
  const { keys, model, timeout } = config();
  const deadline = AbortSignal.timeout(30000);
  const body = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              answerType === "conversation"
                ? buildConversationPrompt(input)
                : buildStudyPrompt(input, context),
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.2, maxOutputTokens: 768 },
  });
  for (const key of keys) {
    if (signal?.aborted) throw new Error("Generation cancelled.");
    if (deadline.aborted) break;
    try {
      const response = await fetch(`${endpoint}${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.any([
          deadline,
          AbortSignal.timeout(timeout),
          ...(signal ? [signal] : []),
        ]),
      });
      if (!response.ok) {
        if (response.status === 400) {
          const failure = await response.json().catch(() => null);
          const keyFailure =
            Array.isArray(failure?.error?.details) &&
            failure.error.details.some((detail: { reason?: string }) =>
              ["API_KEY_INVALID", "API_KEY_EXPIRED"].includes(
                detail.reason || "",
              ),
            );
          if (keyFailure) continue;
          break;
        }
        await response.body?.cancel();
        if (
          [401, 403, 404, 408, 429].includes(response.status) ||
          response.status >= 500
        )
          continue;
        break;
      }
      const data = await response.json();
      const candidate = data.candidates?.[0];
      // Safety blocks and incomplete generations must not be bypassed by key rotation.
      if (
        data.promptFeedback?.blockReason ||
        candidate?.finishReason !== "STOP"
      )
        break;
      const answer = candidate.content?.parts
        ?.filter((part: { thought?: boolean }) => !part.thought)
        .map((part: { text?: string }) =>
          typeof part.text === "string" ? part.text : "",
        )
        .join("")
        .trim();
      if (!answer || answer.length > 16000) break;
      if (input.language === "Tamil") {
        const letters = answer.match(/[\p{L}\p{M}]/gu)?.length || 0;
        const tamil = answer.match(/[\u0b80-\u0bff]/g)?.length || 0;
        if (!letters || tamil / letters < 0.3) throw new GeminiLanguageError();
      }
      return answer;
    } catch (error) {
      if (error instanceof GeminiLanguageError) throw error;
      if (signal?.aborted) throw new Error("Generation cancelled.");
      // Network/timeout/invalid transport failures can try the next configured key.
      // Provider response bodies and credentials never become application errors.
    }
  }
  throw new Error("Gemini could not complete this question.");
}
