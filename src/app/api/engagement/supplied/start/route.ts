import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { issueCompletionToken } from "@/lib/completion-token";
import { suppliedPracticeQuestions } from "@/lib/supplied-practice/bank";
const input = z.object({
  collectionId: z.string().min(1).max(150),
  questionIds: z.array(z.string().max(180)).min(1).max(500),
});
export async function POST(request: Request) {
  const user = await getSession();
  if (!user || user.role !== "student")
    return NextResponse.json(
      { error: "Student sign-in required." },
      { status: 401 },
    );
  try {
    const p = input.safeParse(await request.json());
    if (!p.success)
      return NextResponse.json({ error: "Invalid attempt." }, { status: 400 });
    const { collectionId, questionIds } = p.data,
      bank = new Set(suppliedPracticeQuestions(collectionId).map((q) => q.id));
    if (
      new Set(questionIds).size !== questionIds.length ||
      questionIds.some((id) => !bank.has(id))
    )
      return NextResponse.json(
        { error: "Invalid questions." },
        { status: 400 },
      );
    return NextResponse.json(
      { token: issueCompletionToken(user.userId, collectionId, questionIds) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not start points tracking." },
      { status: 503 },
    );
  }
}
