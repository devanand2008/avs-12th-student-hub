import { isDeepStrictEqual } from "node:util";

export interface ReviewDecisionEvent {
  action: string;
  actorId: string;
  at: string;
  reason?: string;
  before: unknown;
  after: unknown;
}
export interface ReviewDecisionAudit {
  entityId: string;
  userId: string;
  review?: ReviewDecisionEvent;
  before?: unknown;
  after?: unknown;
}

function snapshotMatches(full: unknown, summary: unknown) {
  if (
    !full ||
    !summary ||
    typeof full !== "object" ||
    typeof summary !== "object" ||
    Array.isArray(full) ||
    Array.isArray(summary)
  )
    return false;
  const fields = summary as Record<string, unknown>;
  const record = full as Record<string, unknown>;
  return (
    ["questionText", "options", "correctAnswer"].every((key) =>
      Object.hasOwn(fields, key),
    ) &&
    Object.keys(fields).every((key) =>
      isDeepStrictEqual(record[key], fields[key]),
    )
  );
}

/** SQL audit roots are complete candidate snapshots; review.before/after are summaries. */
export function reviewAuditMatches(
  candidateId: string,
  event: ReviewDecisionEvent,
  audit: ReviewDecisionAudit,
) {
  const review = audit.review;
  return (
    audit.entityId === candidateId &&
    audit.userId === event.actorId &&
    !!review &&
    review.actorId === event.actorId &&
    review.action === event.action &&
    review.at === event.at &&
    review.reason === event.reason &&
    isDeepStrictEqual(review.before, event.before) &&
    isDeepStrictEqual(review.after, event.after) &&
    snapshotMatches(audit.before, event.before) &&
    snapshotMatches(audit.after, event.after)
  );
}
