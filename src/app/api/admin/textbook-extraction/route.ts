import { getSession } from "@/lib/auth";
import { readFile } from "node:fs/promises";
import path from "node:path";
import catalog from "@/lib/textbooks-catalog.json";
import { csvCell } from "@/lib/csv";

interface SourceProposal {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string | null;
  keyPage: number;
  qualityFlags: string[];
  extractionEvidence: {
    printedPages: number[];
    printedKeyEntry: string;
    keyMatched: boolean;
    requiresDiagram: boolean;
    completeTextOptions: boolean;
    approvalBlocked: boolean;
    batchId: string;
  };
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session)
    return Response.json({ error: "Please sign in." }, { status: 401 });
  if (session.role !== "admin")
    return Response.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  const params = new URL(request.url).searchParams;
  const csv = params.get("format") === "csv";
  try {
    if (params.get("format") === "manifest") {
      const manifest = await readFile(
        path.join(process.cwd(), "docs/textbook-processing-manifest.json"),
        "utf8",
      );
      return new Response(manifest, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="textbook-processing-manifest.json"',
          "Cache-Control": "private, no-store",
        },
      });
    }
    if (params.get("format") === "review-csv") {
      const book = catalog.books.find((b) => b.id === params.get("bookId"));
      if (!book)
        return Response.json(
          { error: "Choose a catalog textbook." },
          { status: 400 },
        );
      const local = JSON.parse(
        await readFile(
          path.join(
            process.cwd(),
            ".local/teacher-review/extracted-books",
            book.id + ".json",
          ),
          "utf8",
        ),
      );
      const active = new Set(local.activeExtractionIds);
      const proposals = new Map<string, SourceProposal>(
        (local.sourceBoundedProposals || []).map((p: SourceProposal) => [
          p.id,
          p,
        ]),
      );
      const fields = [
        "candidateId",
        "bookId",
        "sourceFile",
        "sourceSha256",
        "medium",
        "volume",
        "chapterId",
        "questionNumber",
        "pdfPage",
        "printedPage",
        "keyPdfPage",
        "proposedAnswer",
        "questionText",
        "options",
        "status",
        "warnings",
        "proposedQuestionText",
        "proposedOptions",
        "printedKeyEntry",
        "printedKeyMatched",
        "requiresDiagram",
        "completeTextOptions",
        "approvalBlocked",
        "batchId",
      ];
      const escape = (value: unknown) => {
        return csvCell(String(value ?? ""));
      };
      const rows = local.candidates
        .filter((c: { id: string }) => active.has(c.id))
        .map(
          (c: {
            id: string;
            chapterId: string;
            number: number;
            page: number;
            printedPage?: number;
            keyPage?: number;
            correctAnswer?: string;
            questionText: string;
            options: string[];
            qualityFlags: string[];
          }) => {
            const proposed = proposals.get(c.id);
            return [
              c.id,
              book.id,
              book.sourceFile,
              book.sha256,
              book.sourceMedium,
              book.volume,
              c.chapterId,
              c.number,
              c.page,
              proposed?.extractionEvidence.printedPages[0] ?? c.printedPage,
              proposed?.keyPage ?? c.keyPage,
              proposed ? proposed.correctAnswer : c.correctAnswer,
              c.questionText,
              c.options.join(" | "),
              "Held; teacher review required",
              [
                ...new Set([
                  ...c.qualityFlags,
                  ...(proposed?.qualityFlags || []),
                ]),
              ].join("; "),
              proposed?.questionText ?? "",
              proposed?.options.join(" | ") ?? "",
              proposed?.extractionEvidence.printedKeyEntry ?? "",
              proposed?.extractionEvidence.keyMatched ?? "",
              proposed?.extractionEvidence.requiresDiagram ?? "",
              proposed?.extractionEvidence.completeTextOptions ?? "",
              proposed?.extractionEvidence.approvalBlocked ?? "",
              proposed?.extractionEvidence.batchId ?? "",
            ];
          },
        );
      return new Response(
        "\uFEFF" +
          [
            fields.map(escape).join(","),
            ...rows.map((r: unknown[]) => r.map(escape).join(",")),
          ].join("\n") +
          "\n",
        {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${book.id}-review-reference.csv"`,
            "Cache-Control": "private, no-store",
          },
        },
      );
    }
    if (csv)
      return new Response(
        await readFile(
          path.join(process.cwd(), "docs/book-back-chapter-coverage.csv"),
          "utf8",
        ),
        {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition":
              'attachment; filename="book-back-chapter-coverage.csv"',
            "Cache-Control": "private, no-store",
          },
        },
      );
    const report = JSON.parse(
      await readFile(
        path.join(process.cwd(), "docs/book-back-extraction-coverage.json"),
        "utf8",
      ),
    );
    try {
      const progress = JSON.parse(
        await readFile(
          path.join(process.cwd(), "docs/textbook-processing-manifest.json"),
          "utf8",
        ),
      );
      report.progressAudit = {
        checkedAt: progress.checkedAt,
        checksumVerifiedPdfs: progress.checksumVerifiedPdfs,
        ...Object.fromEntries(
          Object.entries(progress.summary).filter(
            ([, value]) => typeof value === "number",
          ),
        ),
        decisions: progress.teacherDecisionCounts,
      };
      for (const book of report.books) {
        for (const chapter of book.chapters) {
          const batches = progress.reviewBatches.filter((batch: { bookId?: string; chapterId?: string }) => batch.bookId === book.book.id && batch.chapterId === chapter.id);
          chapter.localReview = batches.length ? batches.reduce((counts: Record<string, number>, batch: { counts: Record<string, number> }) => {
            for (const status of ["pending", "approved", "needs_correction", "rejected"]) counts[status] += batch.counts[status] ?? 0;
            return counts;
          }, {pending: 0, approved: 0, needs_correction: 0, rejected: 0}) : null;
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    return Response.json(report, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json(
      {
        error:
          "No local extraction report is available. Run npm run mcqs:extract-local on the textbook installation first.",
      },
      { status: 503 },
    );
  }
}
