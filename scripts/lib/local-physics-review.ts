import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { PhysicsReviewCandidate } from "./physics-review-batches";

export const teacherCorrection = z
  .object({
    questionText: z.string().trim().min(1).max(20000),
    options: z
      .array(z.string().trim().min(1))
      .refine(
        (v) => v.length === 2 || v.length === 4 || v.length === 5,
        "Preserve the printed two, four or five choices",
      ),
    correctAnswer: z.enum(["A", "B", "C", "D"]).nullable(),
    sourceMappingConfirmed: z.boolean(),
  })
  .strict();

export interface LocalReviewer {
  id: string;
  name: string;
  email: string;
}
export const decisionInput = z
  .object({
    id: z.string(),
    expectedRevision: z.number().int().nonnegative(),
    decision: z.enum(["approved", "needs_correction", "rejected", "pending"]),
    notes: z.string().trim().max(12000),
    unresolvedIssues: z.array(z.string().trim().min(1).max(2000)).max(50),
    inspectedPages: z.array(z.number().int()),
    textConfirmed: z.boolean(),
    keyConfirmed: z.boolean(),
    diagramConfirmed: z.boolean(),
    correction: teacherCorrection.optional(),
  })
  .strict();
export type LocalDecisionInput = z.infer<typeof decisionInput>;
export interface DecisionEvent {
  eventId: string;
  at: string;
  reviewer: LocalReviewer;
  decision: LocalDecisionInput["decision"];
  notes: string;
  unresolvedIssues: string[];
  inspectedPages: number[];
  textConfirmed: boolean;
  keyConfirmed: boolean;
  diagramConfirmed: boolean;
  previousDecision: LocalDecisionInput["decision"];
  revision: number;
  correction?: z.infer<typeof teacherCorrection>;
}
export interface LocalReviewEntry {
  id: string;
  number: number;
  source: {
    bookId: string;
    subject: string;
    medium: string;
    volume: string | null;
    chapterId: string;
    chapterTitle: string;
    sourceFile: string;
    sourceSha256: string;
    pdfPage: number;
    pdfEndPage: number;
    printedPages: number[];
    sourcePageReferences?: { pdfPage:number; printedPage:number }[];
    keyPdfPage: number | null;
    keyPrintedPage: number | null;
    occurrence?: NonNullable<PhysicsReviewCandidate["sourceOccurrence"]>;
  };
  evidenceSha256: string;
  sourceWarnings: string[];
  requiresDiagram: boolean;
  completeTextOptions: boolean;
  candidateStatus: "Needs Review";
  practicePublished: false;
  revision: number;
  decision: LocalDecisionInput["decision"];
  notes: string;
  unresolvedIssues: string[];
  reviewer: LocalReviewer | null;
  reviewedAt: string | null;
  history: DecisionEvent[];
}
export interface LocalReviewManifest {
  schemaVersion: 1;
  scope: "local-only-reference-no-publication";
  entries: LocalReviewEntry[];
}
export class LocalReviewError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const evidenceDigest = (c: PhysicsReviewCandidate) =>
  createHash("sha256").update(JSON.stringify(c)).digest("hex");
export const requiredSourcePages = (c: PhysicsReviewCandidate) => {
  const pages = [
  ...new Set([
    c.page,
    ...Array.from(
      { length: (c.endPage ?? c.page) - c.page + 1 },
      (_, i) => c.page + i,
    ),
    ...(c.keyPage ? [c.keyPage] : []),
    ...(c.extractionEvidence.sourcePageReferences?.map(p=>p.pdfPage) ?? []),
  ]),
  ];
  return c.extractionEvidence.sourcePageReferences ? pages.sort((a,b)=>a-b) : pages;
};

function emptyEntry(c: PhysicsReviewCandidate): LocalReviewEntry {
  const prep = c.reviewPreparation!,
    e = c.extractionEvidence;
  return {
    id: c.id,
    number: c.number,
    source: {
      bookId: c.bookId,
      subject: prep.subject,
      medium: prep.medium,
      volume: prep.volume,
      chapterId: c.chapterId,
      chapterTitle: c.chapterTitle,
      sourceFile: e.sourceFile,
      sourceSha256: c.sourceSha256,
      pdfPage: c.page,
      pdfEndPage: c.endPage ?? c.page,
      printedPages: e.printedPages,
      ...(e.sourcePageReferences ? { sourcePageReferences:structuredClone(e.sourcePageReferences) } : {}),
      keyPdfPage: c.keyPage ?? null,
      keyPrintedPage: e.keyPrintedPage,
      ...(c.sourceOccurrence ? { occurrence: c.sourceOccurrence } : {}),
    },
    evidenceSha256: evidenceDigest(c),
    sourceWarnings: [...c.qualityFlags],
    requiresDiagram: e.requiresDiagram,
    completeTextOptions: e.completeTextOptions,
    candidateStatus: "Needs Review",
    practicePublished: false,
    revision: 0,
    decision: "pending",
    notes: "",
    unresolvedIssues: [...c.qualityFlags],
    reviewer: null,
    reviewedAt: null,
    history: [],
  };
}

export function reconcileManifest(
  candidates: PhysicsReviewCandidate[],
  saved?: LocalReviewManifest,
): LocalReviewManifest {
  const occurrenceOrdered =
    candidates.length > 0 &&
    candidates.every(
      (c, i) =>
        c.sourceOccurrence?.ordinal === i + 1 &&
        c.sourceOccurrence.printedNumber === c.number &&
        c.sourceOccurrence.pdfPage === c.page &&
        Boolean(c.sourceOccurrence.section.trim()) &&
        Boolean(c.sourceOccurrence.reason.trim()),
    );
  if (candidates.some((c) => c.sourceOccurrence) && !occurrenceOrdered)
    throw new LocalReviewError(
      "Physical source occurrence metadata must be complete, unique and source-ordered",
    );
  if (
    candidates.length === 0 ||
    new Set(candidates.map((c) => c.id)).size !== candidates.length ||
    new Set(candidates.map((c) => c.chapterId)).size !== 1 ||
    (new Set(candidates.map((c) => c.number)).size !== candidates.length &&
      !occurrenceOrdered) ||
    candidates.some(
      (c, i) =>
        !Number.isInteger(c.number) ||
        c.number < 1 ||
        (i > 0 && c.number <= candidates[i - 1].number && !occurrenceOrdered),
    ) ||
    (candidates[0].bookId === "12-physics-tamil-v1-c1623725" &&
      (candidates.length !== 15 ||
        candidates.some((c, i) => c.number !== i + 1)))
  )
    throw new LocalReviewError(
      "Expected a unique, source-ordered single-chapter batch (15 consecutive questions for Physics units)",
    );
  if (
    saved &&
    (saved.schemaVersion !== 1 ||
      saved.scope !== "local-only-reference-no-publication")
  )
    throw new LocalReviewError("Unsupported local manifest");
  const existing = new Map(saved?.entries.map((e) => [e.id, e]));
  if (
    saved &&
    (existing.size !== saved.entries.length ||
      saved.entries.some((e) => !candidates.some((c) => c.id === e.id)))
  )
    throw new LocalReviewError("Manifest IDs do not match the source packet");
  const entries = candidates.map((c) => {
    if (
      c.status !== "Needs Review" ||
      c.reviewStatus !== "needs_teacher_review" ||
      c.practicePublished ||
      c.reviewedBy ||
      c.reviewHistory?.length
    )
      throw new LocalReviewError(
        "Candidate packet must remain held; decisions belong in the separate manifest",
      );
    const old = existing.get(c.id);
    if (old && old.evidenceSha256 !== evidenceDigest(c))
      throw new LocalReviewError(
        `Source evidence changed for question ${c.number}; reconcile manually before review`,
        409,
      );
    return old ?? emptyEntry(c);
  });
  return {
    schemaVersion: 1,
    scope: "local-only-reference-no-publication",
    entries,
  };
}

export function recordDecision(
  manifest: LocalReviewManifest,
  candidates: PhysicsReviewCandidate[],
  input: LocalDecisionInput,
  reviewer: LocalReviewer,
): LocalReviewManifest {
  const data = decisionInput.parse(input),
    c = candidates.find((c) => c.id === data.id),
    previous = manifest.entries.find((e) => e.id === data.id);
  if (!c || !previous) throw new LocalReviewError("Unknown candidate", 404);
  if (previous.revision !== data.expectedRevision)
    throw new LocalReviewError(
      "Another review changed this question. Reload before saving.",
      409,
    );
  if (data.decision !== "pending" && !data.notes)
    throw new LocalReviewError(
      "Enter verification notes, correction details or a rejection reason",
    );
  const pages = requiredSourcePages(c);
  if (data.inspectedPages.some((p) => !pages.includes(p)))
    throw new LocalReviewError("Invalid source page confirmation");
  if (c.options.length === 5 && data.correction && data.correction.options.length !== 5)
    throw new LocalReviewError("Preserve all five printed choices in a local correction; do not silently drop the fifth choice");
  if (data.decision === "approved") {
    if (c.localReviewRequirements?.answerEvidenceUnavailable)
      throw new LocalReviewError(
        "Answer evidence is unavailable. Keep this candidate held until a separately evidenced teacher answer verification is prepared.",
      );
    if (!c.extractionEvidence.completeTextOptions)
      throw new LocalReviewError(
        c.chapterId.endsWith("-ch-1") && c.number === 10
          ? "Question 10 cannot be approved: required graph options are incomplete"
          : "Cannot approve: required text/graph options are incomplete",
      );
    if (
      c.localReviewRequirements &&
      (!data.correction ||
        data.correction.options.length !== 4 ||
        !data.correction.correctAnswer ||
        !data.correction.sourceMappingConfirmed ||
        data.correction.correctAnswer !==
          c.localReviewRequirements.proposedPrintedAnswer)
    )
      throw new LocalReviewError(
        "Enter a complete teacher-corrected Tamil transcription, four options and source mapping confirmation. Reconcile answer-key disagreements before approval.",
      );
    if (
      !data.textConfirmed ||
      !data.keyConfirmed ||
      pages.some((p) => !data.inspectedPages.includes(p))
    )
      throw new LocalReviewError(
        "Inspect each original source/key page and verify every Tamil word, option and answer before approving",
      );
    if (c.extractionEvidence.requiresDiagram && !data.diagramConfirmed)
      throw new LocalReviewError(
        "Inspect and verify the original diagram before approving",
      );
    if (data.unresolvedIssues.length)
      throw new LocalReviewError(
        "Resolve all issues and explain the resolution in notes before approving",
      );
  }
  const event: DecisionEvent = {
    eventId: randomUUID(),
    at: new Date().toISOString(),
    reviewer: { ...reviewer },
    decision: data.decision,
    notes: data.notes,
    unresolvedIssues: [...data.unresolvedIssues],
    inspectedPages: [...new Set(data.inspectedPages)],
    textConfirmed: data.textConfirmed,
    keyConfirmed: data.keyConfirmed,
    diagramConfirmed: data.diagramConfirmed,
    previousDecision: previous.decision,
    revision: previous.revision + 1,
    ...(data.correction
      ? { correction: structuredClone(data.correction) }
      : {}),
  };
  const next = structuredClone(manifest),
    entry = next.entries.find((e) => e.id === data.id)!;
  Object.assign(entry, {
    revision: event.revision,
    decision: event.decision,
    notes: event.notes,
    unresolvedIssues: event.unresolvedIssues,
    reviewer: event.reviewer,
    reviewedAt: event.at,
    history: [...entry.history, event],
  });
  return next;
}

export async function readOptionalJson<T>(
  file: string,
): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
}
export async function writeLocalJson(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
  await rename(temp, file);
}
