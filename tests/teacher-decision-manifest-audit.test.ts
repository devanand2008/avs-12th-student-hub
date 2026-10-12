import assert from "node:assert/strict";
import test from "node:test";
import packet from "../docs/tamil-physics-unit1-candidates.json";
import {
  auditTeacherManifest,
  sameManifestRecords,
} from "../scripts/lib/teacher-decision-audit";
import {
  reconcileManifest,
  recordDecision,
  requiredSourcePages,
  type LocalReviewManifest,
  type LocalDecisionInput,
} from "../scripts/lib/local-physics-review";
import type { Unit1Candidate } from "../scripts/lib/tamil-physics-unit1";

const candidates = packet.candidates as Unit1Candidate[];
const reviewer = {
  id: "isolated-audit-teacher",
  name: "Audit Fixture Teacher",
  email: "audit-fixture@example.test",
};
function choose(
  number: number,
  decision: LocalDecisionInput["decision"],
  expectedRevision = 0,
): LocalDecisionInput {
  const c = candidates.find((c) => c.number === number)!;
  return {
    id: c.id,
    expectedRevision,
    decision,
    notes: "Isolated audit fixture decision only",
    unresolvedIssues:
      decision === "approved" ? [] : ["Teacher correction needed"],
    inspectedPages: requiredSourcePages(c),
    textConfirmed: true,
    keyConfirmed: true,
    diagramConfirmed: true,
  };
}
const exported = (m: LocalReviewManifest) => ({
  ...structuredClone(m),
  exportedAt: new Date(Date.now() + 100).toISOString(),
  exportedBy: reviewer,
  notice: "Reference only; never publish",
});
const audit = (
  m: unknown,
  persisted: LocalReviewManifest,
  reviewers = [reviewer],
) =>
  auditTeacherManifest(m, {
    candidates,
    persisted,
    reviewers,
    requireExport: true,
  });

test("Pending local store is valid but is never accepted as an exported or reviewed manifest", () => {
  const m = reconcileManifest(candidates),
    original = JSON.stringify(m);
  const local = auditTeacherManifest(m, {
    candidates,
    persisted: m,
    reviewers: [],
    requireExport: false,
  });
  assert.equal(local.valid, true);
  assert.equal(local.exportProven, false);
  assert.equal(local.reviewed, 0);
  assert.equal(local.historyEvents, 0);
  assert.equal(local.validatedCounts.pending, 15);
  const missing = audit(m, m, []);
  assert.equal(missing.valid, false);
  assert.ok(missing.issues.some((i) => i.code === "not_exported"));
  assert.deepEqual(missing.confirmedEntries, []);
  assert.equal(JSON.stringify(m), original);
});

test("Export matches explicit individual authorised decisions and retains exact source/notes/history without publishing", () => {
  let m = reconcileManifest(candidates);
  for (const [n, d] of [
    [2, "approved"],
    [4, "needs_correction"],
    [7, "rejected"],
  ] as const)
    m = recordDecision(m, candidates, choose(n, d), reviewer);
  const file = exported(m),
    before = JSON.stringify(file),
    result = audit(file, m);
  assert.equal(result.valid, true);
  assert.equal(result.exportProven, true);
  assert.equal(result.reviewed, 3);
  assert.equal(result.historyEvents, 3);
  assert.deepEqual(result.validatedCounts, {
    approved: 1,
    needs_correction: 1,
    rejected: 1,
    pending: 12,
    invalid: 0,
  });
  assert.equal(result.confirmedEntries.length, 3);
  assert.equal(JSON.stringify(file), before);
  assert.ok(
    result.confirmedEntries.every(
      (e) => e.candidateStatus === "Needs Review" && !e.practicePublished,
    ),
  );

  test("Repeated genuine exports with different timestamps or row order are equivalent; changed notes/history remain conflicting", () => {
    const m = recordDecision(
      reconcileManifest(candidates),
      candidates,
      choose(2, "needs_correction"),
      reviewer,
    );
    const first = exported(m),
      again = exported(m);
    again.exportedAt = new Date(Date.now() + 200).toISOString();
    again.entries.reverse();
    assert.equal(sameManifestRecords(first, again), true);
    again.entries.find((e) => e.number === 2)!.notes = "Changed notes";
    assert.equal(sameManifestRecords(first, again), false);
    assert.equal(sameManifestRecords(first, { entries: [] }), false);
  });
});

test("Missing, duplicate, unknown IDs and invalid statuses invalidate the manifest and produce explicit findings", () => {
  const m = reconcileManifest(candidates),
    file = exported(m);
  file.entries.pop();
  file.entries.push(structuredClone(file.entries[0]));
  file.entries[1].id = "unrelated-candidate";
  const result = audit(file, m);
  assert.equal(result.valid, false);
  assert.equal(result.duplicateIds.length, 1);
  assert.equal(result.missingIds.length, 2);
  assert.deepEqual(result.unknownIds, ["unrelated-candidate"]);
  assert.equal(result.confirmedEntries.length, 0);
  const invalid = exported(m);
  Reflect.set(invalid.entries[0], "decision", "auto_approved");
  const invalidResult = audit(invalid, m);
  assert.ok(invalidResult.issues.some((i) => i.code === "entry_schema"));
  assert.equal(invalidResult.claimedCounts.invalid, 1);
});

test("Forged incomplete Question 10 approval remains blocked even if manifest graph flags are changed", () => {
  let m = reconcileManifest(candidates);
  m = recordDecision(m, candidates, choose(2, "approved"), reviewer);
  const forged = reconcileManifest(candidates),
    e = forged.entries.find((e) => e.number === 10)!,
    model = m.entries.find((e) => e.number === 2)!;
  Object.assign(e, {
    decision: "approved",
    revision: 1,
    reviewer: structuredClone(reviewer),
    reviewedAt: model.reviewedAt,
    notes: model.notes,
    unresolvedIssues: [],
    completeTextOptions: true,
    history: structuredClone(model.history),
  });
  e.history[0].inspectedPages = requiredSourcePages(
    candidates.find((c) => c.number === 10)!,
  );
  const result = audit(exported(forged), forged);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((i) => i.code === "incomplete_graph_approval"));
  assert.ok(result.issues.some((i) => i.code === "warnings_changed"));
  assert.equal(result.validatedCounts.approved, 0);
  assert.equal(result.confirmedEntries.length, 0);
});

test("Unauthorised reviewers, source drift, missing notes, absent diagram inspection and fake decisions without history are rejected", () => {
  const m = recordDecision(
    reconcileManifest(candidates),
    candidates,
    choose(1, "approved"),
    reviewer,
  );
  const unknown = audit(exported(m), m, []);
  assert.ok(unknown.issues.some((i) => i.code === "reviewer_unauthorised"));
  assert.equal(unknown.confirmedEntries.length, 0);
  const drift = exported(m);
  drift.entries[0].source.pdfPage = 80;
  assert.ok(audit(drift, m).issues.some((i) => i.code === "source_mismatch"));
  const flags = structuredClone(m);
  flags.entries[0].history[0].diagramConfirmed = false;
  assert.ok(
    audit(exported(flags), flags).issues.some(
      (i) => i.code === "unverified_diagram",
    ),
  );
  const absent = structuredClone(m);
  absent.entries[0].history[0].notes = "";
  absent.entries[0].notes = "";
  assert.ok(
    audit(exported(absent), absent).issues.some(
      (i) => i.code === "missing_notes",
    ),
  );
  const noHistory = reconcileManifest(candidates);
  noHistory.entries[0].decision = "approved";
  assert.ok(
    audit(exported(noHistory), noHistory).issues.some(
      (i) => i.code === "decision_without_history",
    ),
  );
});

test("History chains, duplicate event IDs, latest-note conflicts and stale exports cannot silently become importable", () => {
  let m = recordDecision(
    reconcileManifest(candidates),
    candidates,
    choose(2, "needs_correction"),
    reviewer,
  );
  const stale = exported(m);
  m = recordDecision(m, candidates, choose(2, "approved", 1), reviewer);
  assert.ok(
    audit(stale, m).issues.some((i) => i.code === "persisted_conflict"),
  );
  const broken = structuredClone(m),
    e = broken.entries.find((e) => e.number === 2)!;
  e.history[1].previousDecision = "pending";
  assert.ok(
    audit(exported(broken), broken).issues.some(
      (i) => i.code === "history_chain",
    ),
  );
  const duplicate = structuredClone(m);
  duplicate.entries.find((e) => e.number === 2)!.history[1].eventId =
    duplicate.entries.find((e) => e.number === 2)!.history[0].eventId;
  assert.ok(
    audit(exported(duplicate), duplicate).issues.some(
      (i) => i.code === "duplicate_event",
    ),
  );
  const noteConflict = exported(m);
  noteConflict.entries.find((e) => e.number === 2)!.notes =
    "Changed after export";
  assert.ok(
    audit(noteConflict, m).issues.some(
      (i) => i.code === "latest_event_conflict",
    ),
  );
});

test("Approval confirmations, unresolved issues and export chronology are independently checked", () => {
  const m = recordDecision(
    reconcileManifest(candidates),
    candidates,
    choose(2, "approved"),
    reviewer,
  );
  for (const change of ["pages", "key", "issues", "time"]) {
    const edited = structuredClone(m),
      e = edited.entries.find((e) => e.number === 2)!;
    if (change === "pages") e.history[0].inspectedPages = [];
    if (change === "key") e.history[0].keyConfirmed = false;
    if (change === "issues") {
      e.history[0].unresolvedIssues = ["unresolved"];
      e.unresolvedIssues = ["unresolved"];
    }
    const file = exported(edited);
    if (change === "time") file.exportedAt = "2000-01-01T00:00:00.000Z";
    const result = audit(file, edited);
    assert.equal(result.valid, false);
    assert.equal(result.confirmedEntries.length, 0);
  }
});
