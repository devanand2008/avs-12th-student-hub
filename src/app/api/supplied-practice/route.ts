import { getSession } from "@/lib/auth";
import {
  selectSuppliedPreview,
  suppliedCollectionSummaries,
  suppliedPracticeQuestions,
} from "@/lib/supplied-practice/bank";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  if (params.has("questions")) {
    const collectionId = params.get("collection") || "";
    const collection = suppliedCollectionSummaries().find(
      (c) => c.id === collectionId,
    );
    if (!collection)
      return NextResponse.json(
        { error: "Question collection not found." },
        { status: 404 },
      );
    return NextResponse.json(
      {
        collection,
        questions: suppliedPracticeQuestions(collectionId),
        ownerId: session.userId,
        answerStatus: "supplied_unverified",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
  if (params.has("preview")) {
    if (session.role !== "admin")
      return NextResponse.json(
        { error: "Administrator access required for held questions." },
        { status: 403 },
      );
    return NextResponse.json(
      { ...selectSuppliedPreview(params), preview: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
  return NextResponse.json(
    {
      collections: suppliedCollectionSummaries(),
      canPreview: session.role === "admin",
      message:
        "Supplied practice is available. Answers have not been independently teacher verified.",
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
