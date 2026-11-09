import { getSession } from "@/lib/auth";
import { tryAwardPoints } from "@/lib/engagement";
import { readCompletionToken } from "@/lib/completion-token";
import { suppliedPracticeQuestions } from "@/lib/supplied-practice/bank";
import { NextResponse } from "next/server";
import { z } from "zod";
const input = z.object({
  collectionId: z.string().min(1).max(150),
  token: z.string().max(150000),
  answers: z
    .record(z.string().max(180), z.number().int().min(0).max(3))
    .refine((a) => Object.keys(a).length <= 500),
});
export async function POST(request: Request) {
  const user = await getSession();
  if (!user || user.role !== "student")
    return NextResponse.json(
      { error: "Student sign-in required." },
      { status: 401 },
    );
  try {
    const parsed = input.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid practice answers." },
        { status: 400 },
      );
    const attempt = readCompletionToken(
      parsed.data.token,
      user.userId,
      parsed.data.collectionId,
    );
    if (
      !attempt ||
      Object.keys(parsed.data.answers).length !== attempt.ids.length ||
      attempt.ids.some((id) => !Object.hasOwn(parsed.data.answers, id))
    )
      return NextResponse.json(
        { error: "Answer every question in this attempt to earn 10 points." },
        { status: 400 },
      );
    const bank = suppliedPracticeQuestions(parsed.data.collectionId);
    for (const [id, choice] of Object.entries(parsed.data.answers)) {
      const q = bank.find((q) => q.id === id),
        options = q && (q.optionsEn.length ? q.optionsEn : q.optionsTa);
      if (!q || !options || choice >= options.length)
        return NextResponse.json(
          { error: "Question or choice unavailable." },
          { status: 400 },
        );
      // Participation only: these source answers remain academically unverified.
    }
    const points = await tryAwardPoints(user.userId, [
      {
        key: `supplied-complete:v2:${attempt.id}`,
        kind: "Supplied practice completed",
        points: 10,
      },
    ]);
    return NextResponse.json({ points }, { status: points.saved ? 200 : 503 });
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not save practice points. Your local result is preserved.",
      },
      { status: 503 },
    );
  }
}
