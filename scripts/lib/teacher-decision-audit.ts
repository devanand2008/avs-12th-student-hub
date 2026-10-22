import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import {
  evidenceDigest,
  reconcileManifest,
  requiredSourcePages,
  teacherCorrection,
  type LocalReviewEntry,
  type LocalReviewer,
} from "./local-physics-review";

const identity = z
  .object({
    id: z.string().min(1).max(200),
    name: z.string().trim().min(2).max(120),
    email: z.email().max(200),
  })
  .strict();
const decision = z.enum([
  "approved",
  "needs_correction",
  "rejected",
  "pending",
]);
const notes = z.string().max(12000);
const issues = z.array(z.string().trim().min(1).max(2000)).max(50);
const timestamp = z.iso.datetime({ offset: true });
const event = z
  .object({
    eventId: z.uuid(),
    at: timestamp,
    reviewer: identity,
    decision,
    notes,
    unresolvedIssues: issues,
    inspectedPages: z.array(z.number().int().positive()),
    textConfirmed: z.boolean(),
    keyConfirmed: z.boolean(),
    diagramConfirmed: z.boolean(),
    previousDecision: decision,
    revision: z.number().int().positive(),
    correction: teacherCorrection.optional(),
  })
  .strict();
const source = z
  .object({
    bookId: z.string(),
    subject: z.string(),
    medium: z.string(),
    volume: z.string().nullable(),
    chapterId: z.string(),
    chapterTitle: z.string(),
    sourceFile: z.string(),
    sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
    pdfPage: z.number().int().positive(),
    pdfEndPage: z.number().int().positive(),
    printedPages: z.array(z.number().int().positive()),
    sourcePageReferences: z.array(z.object({ pdfPage:z.number().int().positive(), printedPage:z.number().int().positive() }).strict()).optional(),
    keyPdfPage: z.number().int().positive().nullable(),
    keyPrintedPage: z.number().int().positive().nullable(),
    occurrence: z
      .object({
        section: z.string().trim().min(1),
        ordinal: z.number().int().positive(),
        printedNumber: z.number().int().positive(),
        pdfPage: z.number().int().positive(),
        reason: z.string().trim().min(1),
      })
      .strict()
      .optional(),
  })
  .strict();
export const reviewEntrySchema = z
  .object({
    id: z.string().min(1),
    number: z.number().int().positive(),
    source,
    evidenceSha256: z.string().regex(/^[a-f0-9]{64}$/),
    sourceWarnings: z.array(z.string()),
    requiresDiagram: z.boolean(),
    completeTextOptions: z.boolean(),
    candidateStatus: z.literal("Needs Review"),
    practicePublished: z.literal(false),
    revision: z.number().int().nonnegative(),
    decision,
    notes,
    unresolvedIssues: issues,
    reviewer: identity.nullable(),
    reviewedAt: timestamp.nullable(),
    history: z.array(event),
  })
  .strict();
const envelope = z
  .object({
    schemaVersion: z.literal(1),
    scope: z.literal("local-only-reference-no-publication"),
    entries: z.array(z.unknown()),
    exportedAt: timestamp.optional(),
    exportedBy: identity.optional(),
    notice: z.string().optional(),
  })
  .strict();
export interface DecisionAuditIssue {
  id: string | null;
  code: string;
  detail: string;
}
type Counts = {
  approved: number;
  needs_correction: number;
  rejected: number;
  pending: number;
  invalid: number;
};
const counts = (): Counts => ({
  approved: 0,
  needs_correction: 0,
  rejected: 0,
  pending: 0,
  invalid: 0,
});
/** Repeated downloads may differ in export time or formatting but carry the same decisions. */
export function sameManifestRecords(left: unknown, right: unknown): boolean {
  function entries(input: unknown) {
    const parsed = envelope.safeParse(input);
    if (!parsed.success) return null;
    const records = parsed.data.entries.map((e) =>
      reviewEntrySchema.safeParse(e),
    );
    if (records.some((r) => !r.success)) return null;
    return records.map((r) => r.data!).sort((a, b) => a.id.localeCompare(b.id));
  }
  const a = entries(left),
    b = entries(right);
  return a !== null && b !== null && isDeepStrictEqual(a, b);
}
export function auditTeacherManifest(
  input: unknown,
  options: {
    candidates: import("./physics-review-batches").PhysicsReviewCandidate[];
    persisted: unknown;
    reviewers: LocalReviewer[];
    requireExport: boolean;
  },
) {
  const { candidates, reviewers } = options;
  const expected = reconcileManifest(candidates);
  const problems: DecisionAuditIssue[] = [];
  const add = (id: string | null, code: string, detail: string) =>
    problems.push({ id, code, detail });
  const parsed = envelope.safeParse(input);
  if (!parsed.success) {
    for (const issue of parsed.error.issues)
      add(null, "manifest_schema", `${issue.path.join(".")}: ${issue.message}`);
    return {
      valid: false,
      exportProven: false,
      claimedCounts: counts(),
      validatedCounts: counts(),
      reviewed: 0,
      historyEvents: 0,
      missingIds: candidates.map((c) => c.id),
      duplicateIds: [],
      unknownIds: [],
      issues: problems,
      confirmedEntries: [] as LocalReviewEntry[],
    };
  }
  const raw = parsed.data;
  const exportProven = !!raw.exportedAt && !!raw.exportedBy && !!raw.notice;
  const authorised = (actor: LocalReviewer) =>
    reviewers.some((r) => isDeepStrictEqual(r, actor));
  if (options.requireExport && !exportProven)
    add(
      null,
      "not_exported",
      "Manifest lacks exportedAt/exportedBy/notice; the local decision store is not an authenticated export.",
    );
  if (exportProven && !authorised(raw.exportedBy!))
    add(
      null,
      "exporter_unauthorised",
      "Export identity does not match a provisioned local reviewer; authenticity is not established.",
    );
  const entries = raw.entries;
  const rawIds = entries.map((e) =>
    e && typeof e === "object" ? Reflect.get(e, "id") : undefined,
  );
  const duplicateIds = [
    ...new Set(
      rawIds.filter(
        (id, i) => typeof id === "string" && rawIds.indexOf(id) !== i,
      ),
    ),
  ] as string[];
  const missingIds = candidates
    .filter((c) => !rawIds.includes(c.id))
    .map((c) => c.id);
  const unknownIds = [
    ...new Set(
      rawIds.filter(
        (id) => typeof id === "string" && !candidates.some((c) => c.id === id),
      ),
    ),
  ] as string[];
  for (const id of duplicateIds)
    add(
      id,
      "duplicate_id",
      "More than one decision entry for the same candidate; no entry is chosen automatically.",
    );
  for (const id of missingIds)
    add(id, "missing_id", "Candidate absent from the manifest.");
  for (const id of unknownIds)
    add(
      id,
      "unknown_id",
      "Manifest ID is not in the selected unit's actual candidate packet.",
    );
  const persistedResult = envelope.safeParse(options.persisted);
  if (!persistedResult.success)
    add(
      null,
      "persisted_store_invalid",
      "The authoritative local decision store is missing or has an invalid envelope.",
    );
  const persisted = persistedResult.success ? persistedResult.data.entries : [];
  const claimedCounts = counts(),
    validatedCounts = counts(),
    confirmedEntries: LocalReviewEntry[] = [];
  const events = new Set<string>();
  let reviewed = 0,
    historyEvents = 0;
  for (const [index, value] of entries.entries()) {
    const row = reviewEntrySchema.safeParse(value);
    const id =
      typeof rawIds[index] === "string" ? (rawIds[index] as string) : null;
    const before = problems.length;
    if (!row.success) {
      claimedCounts.invalid++;
      for (const issue of row.error.issues)
        add(id, "entry_schema", `${issue.path.join(".")}: ${issue.message}`);
      continue;
    }
    const e = row.data;
    claimedCounts[e.decision]++;
    const c = candidates.find((c) => c.id === e.id),
      original = expected.entries.find((r) => r.id === e.id);
    if (!c || !original) continue;
    if (duplicateIds.includes(e.id))
      add(
        e.id,
        "conflicting_duplicate",
        "Duplicated candidate is not eligible for a handoff.",
      );
    if (e.number !== c.number || !isDeepStrictEqual(e.source, original.source))
      add(
        e.id,
        "source_mismatch",
        "Question number or textbook/chapter/hash/PDF/printed/key-page references differ from source candidate.",
      );
    if (e.evidenceSha256 !== evidenceDigest(c))
      add(
        e.id,
        "evidence_mismatch",
        "Original extraction/proposed transcription/options/key evidence hash differs.",
      );
    if (
      !isDeepStrictEqual(e.sourceWarnings, c.qualityFlags) ||
      e.requiresDiagram !== c.extractionEvidence.requiresDiagram ||
      e.completeTextOptions !== c.extractionEvidence.completeTextOptions
    )
      add(
        e.id,
        "warnings_changed",
        "Original warnings or diagram/graph completeness flags were changed.",
      );
    const matches = persisted.filter(
      (p) => p && typeof p === "object" && Reflect.get(p, "id") === e.id,
    );
    if (matches.length !== 1 || !isDeepStrictEqual(matches[0], e))
      add(
        e.id,
        "persisted_conflict",
        "Export does not match the current single authoritative local record/history. A stale or modified export requires reconciliation.",
      );
    if (e.revision !== e.history.length)
      add(
        e.id,
        "revision_conflict",
        "Revision must match the number of individual history events.",
      );
    let priorDecision = "pending",
      previousTime = 0;
    for (const [eventIndex, h] of e.history.entries()) {
      historyEvents++;
      if (events.has(h.eventId))
        add(
          e.id,
          "duplicate_event",
          "History event ID occurs more than once across the manifest.",
        );
      events.add(h.eventId);
      if (h.revision !== eventIndex + 1 || h.previousDecision !== priorDecision)
        add(
          e.id,
          "history_chain",
          "History revisions or prior decisions are not sequential.",
        );
      const at = Date.parse(h.at);
      if (
        at < previousTime ||
        (raw.exportedAt && at > Date.parse(raw.exportedAt))
      )
        add(
          e.id,
          "history_time",
          "History chronology conflicts with the previous event or export time.",
        );
      if (!authorised(h.reviewer))
        add(
          e.id,
          "reviewer_unauthorised",
          "History reviewer does not match a provisioned local identity; no authorisation is inferred from an email alone.",
        );
      if (h.decision !== "pending" && !h.notes.trim())
        add(
          e.id,
          "missing_notes",
          "Non-pending action needs verification/correction notes or a rejection reason.",
        );
      const pages = requiredSourcePages(c);
      if (c.options.length === 5 && h.correction && h.correction.options.length !== 5)
        add(e.id, "source_choice_count", "Local correction drops a choice from a five-choice printed source.");
      if (
        new Set(h.inspectedPages).size !== h.inspectedPages.length ||
        h.inspectedPages.some((p) => !pages.includes(p))
      )
        add(
          e.id,
          "invalid_page_confirmation",
          "Page confirmations contain duplicates or unrelated pages.",
        );
      if (h.decision === "approved") {
        if (c.localReviewRequirements?.answerEvidenceUnavailable)
          add(
            e.id,
            "answer_evidence_unavailable",
            "No prepared answer evidence exists for this held candidate; approval is invalid.",
          );
        if (
          c.localReviewRequirements &&
          (!h.correction ||
            h.correction.options.length !== 4 ||
            !h.correction.correctAnswer ||
            !h.correction.sourceMappingConfirmed ||
            h.correction.correctAnswer !==
              c.localReviewRequirements.proposedPrintedAnswer)
        )
          add(
            e.id,
            "missing_verified_transcription",
            "Approval lacks a complete recorded teacher correction, source mapping confirmation or valid printed-key mapping.",
          );
        if (!c.extractionEvidence.completeTextOptions)
          add(
            e.id,
            "incomplete_graph_approval",
            `Question ${c.number} text/graph choices are incomplete; this approval is invalid.`,
          );
        if (
          !h.textConfirmed ||
          !h.keyConfirmed ||
          pages.some((p) => !h.inspectedPages.includes(p))
        )
          add(
            e.id,
            "unverified_approval",
            "Approval lacks individual Tamil/options/key or all source-page confirmations.",
          );
        if (c.extractionEvidence.requiresDiagram && !h.diagramConfirmed)
          add(
            e.id,
            "unverified_diagram",
            "Approval lacks explicit inspection of the actual source diagram.",
          );
        if (h.unresolvedIssues.length)
          add(
            e.id,
            "unresolved_approval",
            "Approval still has unresolved issues.",
          );
      }
      priorDecision = h.decision;
      previousTime = at;
    }
    if (e.history.length) {
      reviewed++;
      const last = e.history.at(-1)!;
      if (
        e.decision !== last.decision ||
        e.notes !== last.notes ||
        !isDeepStrictEqual(e.unresolvedIssues, last.unresolvedIssues) ||
        !isDeepStrictEqual(e.reviewer, last.reviewer) ||
        e.reviewedAt !== last.at
      )
        add(
          e.id,
          "latest_event_conflict",
          "Current decision/notes/issues/reviewer/time do not match the latest recorded event.",
        );
    } else if (
      e.decision !== "pending" ||
      e.revision !== 0 ||
      e.reviewer !== null ||
      e.reviewedAt !== null ||
      e.notes !== "" ||
      !isDeepStrictEqual(e.unresolvedIssues, original.unresolvedIssues)
    )
      add(
        e.id,
        "decision_without_history",
        "An untouched entry must remain pending with original unresolved warnings and no reviewer or notes.",
      );
    if (
      c.chapterId.endsWith("-ch-1") &&
      e.number === 10 &&
      e.decision === "approved" &&
      !c.extractionEvidence.completeTextOptions
    )
      add(
        e.id,
        "question10_blocked",
        "Question 10 cannot count as confirmed approval while graph choices remain incomplete.",
      );
    if (problems.length === before) {
      validatedCounts[e.decision]++;
      if (e.history.length) confirmedEntries.push(e);
    } else validatedCounts.invalid++;
  }
  const valid = problems.length === 0;
  return {
    valid,
    exportProven,
    claimedCounts,
    validatedCounts,
    reviewed,
    historyEvents,
    missingIds,
    duplicateIds,
    unknownIds,
    issues: problems,
    confirmedEntries: valid && exportProven ? confirmedEntries : [],
  };
}
