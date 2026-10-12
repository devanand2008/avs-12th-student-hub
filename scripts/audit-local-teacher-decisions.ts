import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  auditTeacherManifest,
  sameManifestRecords,
} from "./lib/teacher-decision-audit";
import {
  readOptionalJson,
  type LocalReviewer,
} from "./lib/local-physics-review";
import type { Unit1Candidate } from "./lib/tamil-physics-unit1";
import { parsePrintedAnswerKey } from "./lib/textbook-answer-keys";
import { renderLocalReviewPages } from "./lib/local-physics-review-server";
import { searchTeacherManifests } from "./lib/teacher-manifest-discovery";

// Local preparation only. No database client, import RPC, publication or deployment.
const args = process.argv.slice(2);
assert.ok(
  !args.length || (args.length === 2 && args[0] === "--manifest"),
  "Use --manifest <exported JSON path>; importing/publishing is not supported",
);
const storeFile = ".local/teacher-review/physics-unit1-workflow/decisions.json";
const directory = ".local/teacher-review/decision-audit";
const sha = (bytes: Buffer | string) =>
  createHash("sha256").update(bytes).digest("hex");
async function main() {
  const checkedAt = new Date().toISOString();
  const packetFile = "docs/tamil-physics-unit1-candidates.json",
    queueFile = ".local/teacher-review/tamil-physics-unit1.json";
  const packetBytes = await readFile(packetFile),
    queueBytes = await readFile(queueFile),
    storeBytes = await readFile(storeFile);
  const packet = JSON.parse(packetBytes.toString("utf8")),
    candidates = packet.candidates as Unit1Candidate[],
    persisted = JSON.parse(storeBytes.toString("utf8"));
  assert.ok(
    isDeepStrictEqual(JSON.parse(queueBytes.toString("utf8")), candidates),
    "Actual queue differs from source packet; preserve and reconcile manually",
  );
  const reviewers = (
    (await readOptionalJson<LocalReviewer[]>(
      ".local/teacher-review/physics-unit1-workflow/reviewers.json",
    )) ?? []
  ).map(({ id, name, email }) => ({ id, name, email }));
  const roots = [
    process.cwd(),
    path.join(os.homedir(), "Downloads"),
    path.join(os.homedir(), "Desktop"),
    path.join(os.homedir(), "Documents"),
  ];
  const search = await searchTeacherManifests(roots);
  const found = args.length
    ? [path.resolve(args[1])]
    : [
        ...new Set(
          search.hits
            .filter((h) =>
              ["export_candidate", "malformed_candidate"].includes(
                h.classification,
              ),
            )
            .map((h) => h.file),
        ),
      ];
  const internalAudit = auditTeacherManifest(persisted, {
    candidates,
    persisted,
    reviewers,
    requireExport: false,
  });
  const audits: {
    file: string;
    sha256: string;
    parsed: unknown;
    audit: ReturnType<typeof auditTeacherManifest>;
  }[] = [];
  for (const file of found) {
    const bytes = await readFile(file);
    let parsed: unknown;
    try {
      parsed = JSON.parse(bytes.toString("utf8"));
    } catch {
      parsed = null;
    }
    audits.push({
      file,
      sha256: sha(bytes),
      parsed,
      audit: auditTeacherManifest(parsed, {
        candidates,
        persisted,
        reviewers,
        requireExport: true,
      }),
    });
  }
  // Multiple exports are never silently resolved by choosing the largest/newest.
  const conflict =
    audits.length > 1 &&
    audits.some((a) => !sameManifestRecords(a.parsed, audits[0].parsed));
  const selected = audits.length && !conflict ? audits[0] : null;
  const ready =
    !!selected?.audit.valid &&
    audits.every((a) => a.audit.valid) &&
    internalAudit.valid &&
    !conflict;
  const sourcePdf = await readFile(path.join("public", packet.localPdf));
  assert.equal(sha(sourcePdf), packet.sourceSha256);
  const freshImageDirectory = path.join(directory, "fresh-source-pages");
  await renderLocalReviewPages(process.cwd(), packet, freshImageDirectory);
  const evidence = candidates.map((c) => {
    assert.ok(
      c.originalExtraction &&
        c.extractionEvidence.proposedTranscription &&
        c.extractionEvidence.originalRawSpan,
    );
    assert.deepEqual(
      c.options,
      c.extractionEvidence.proposedTranscription.options,
    );
    assert.equal(
      c.questionText,
      c.extractionEvidence.proposedTranscription.questionText,
    );
    const key = parsePrintedAnswerKey(c.reviewPreparation!.keyPageText);
    assert.ok(!key.conflict && key.complete);
    assert.equal(key.answers.get(c.number), c.correctAnswer);
    const sourceImages = Array.from(
      new Set([c.page, c.endPage ?? c.page, c.keyPage!]),
    ).map((p) => ({
      pdfPage: p,
      printedPage: p - 8,
      file: `.local/teacher-review/physics-unit1-workflow/source-pages/${p}.png`,
    }));
    return {
      id: c.id,
      number: c.number,
      originalExtractionSeparate: true,
      proposedTranscriptionSeparate: true,
      originalOptionCount: c.originalExtraction.options.length,
      proposedOptionCount: c.options.length,
      diagramDependent: c.extractionEvidence.requiresDiagram,
      completeTextOptions: c.extractionEvidence.completeTextOptions,
      keyPdfPage: c.keyPage,
      keyPrintedPage: c.extractionEvidence.keyPrintedPage,
      sourceImages,
      warnings: c.qualityFlags,
    };
  });
  const sourceImageChecks = [];
  for (const file of [
    ...new Set(evidence.flatMap((e) => e.sourceImages.map((i) => i.file))),
  ]) {
    const bytes = await readFile(file);
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    const pdfPage = Number(path.basename(file, ".png"));
    const fresh = await readFile(
      path.join(freshImageDirectory, `${pdfPage}.png`),
    );
    const matchesFreshRendering = sha(bytes) === sha(fresh);
    sourceImageChecks.push({
      pdfPage,
      file,
      sha256: sha(bytes),
      freshSha256: sha(fresh),
      matchesFreshRendering,
    });
    assert.ok(
      matchesFreshRendering,
      `Source image ${pdfPage} differs from a fresh original PDF rendering; retain it and reconcile before review`,
    );
  }
  const confirmed = ready ? selected!.audit.confirmedEntries : [];
  const handoff = {
    schemaVersion: 1,
    checkedAt,
    scope: "local-only-confirmed-teacher-decision-handoff",
    readyForAuthorisedDecisionReconciliation: ready && confirmed.length > 0,
    publicationReady: false,
    automaticImportAllowed: false,
    sourcePacket: { file: packetFile, sha256: sha(packetBytes) },
    exportReference: selected
      ? { file: selected.file, sha256: selected.sha256 }
      : null,
    blockedReasons: [
      ...(!found.length
        ? [
            "Exported manifest not located; local decision store is not a substitute for an authenticated export.",
          ]
        : []),
      ...(conflict
        ? [
            "Different export files conflict; specify one exact export and reconcile it with the current store.",
          ]
        : []),
      ...(!internalAudit.valid
        ? ["Authoritative local decision store failed validation."]
        : []),
      ...(selected && !selected.audit.valid
        ? ["Selected export failed validation."]
        : []),
      ...(!confirmed.length
        ? [
            "No confirmed individually recorded teacher decisions are available for preparation.",
          ]
        : []),
    ],
    records: confirmed.map((entry) => ({
      candidateId: entry.id,
      source: entry.source,
      candidateEvidenceSha256: entry.evidenceSha256,
      decision: entry.decision,
      reviewer: entry.reviewer,
      notes: entry.notes,
      unresolvedIssues: entry.unresolvedIssues,
      history: entry.history,
      originalExtraction: candidates.find((c) => c.id === entry.id)!
        .originalExtraction,
      proposedTranscription: candidates.find((c) => c.id === entry.id)!
        .extractionEvidence.proposedTranscription,
      printedKeyEvidence: candidates.find((c) => c.id === entry.id)!
        .reviewPreparation!.keyPageText,
      diagramEvidence: candidates.find((c) => c.id === entry.id)!
        .extractionEvidence.diagramEvidence,
      sourceWarnings: entry.sourceWarnings,
      targetCandidateStatus: "Needs Review",
      practicePublished: false,
      plannedOperation:
        "Explicit decision reconciliation only; no question publication",
    })),
  };
  const report = {
    checkedAt,
    exportLocated: found.length > 0,
    exportFiles: audits.map((a) => ({
      file: a.file,
      sha256: a.sha256,
      valid: a.audit.valid,
      issues: a.audit.issues,
      claimedCounts: a.audit.claimedCounts,
      validatedCounts: a.audit.validatedCounts,
    })),
    conflictingExports: conflict,
    searchedRoots: roots,
    searchHits: search.hits,
    searchLimitations: search.limitations,
    persistedStore: {
      file: storeFile,
      sha256: sha(storeBytes),
      valid: internalAudit.valid,
      counts: internalAudit.validatedCounts,
      reviewed: internalAudit.reviewed,
      historyEvents: internalAudit.historyEvents,
      missingIds: internalAudit.missingIds,
      duplicateIds: internalAudit.duplicateIds,
      unknownIds: internalAudit.unknownIds,
      issues: internalAudit.issues,
    },
    exportCounts: selected?.audit.claimedCounts ?? null,
    confirmedDecisionCounts: selected?.audit.valid
      ? selected.audit.validatedCounts
      : null,
    confirmedHandoffRecords: confirmed.length,
    question10: {
      id: candidates.find((c) => c.number === 10)!.id,
      completeTextOptions: candidates.find((c) => c.number === 10)!
        .extractionEvidence.completeTextOptions,
      localDecision: persisted.entries.find(
        (e: { number: number }) => e.number === 10,
      )?.decision,
      approvalAllowed: candidates.find((c) => c.number === 10)!
        .extractionEvidence.completeTextOptions,
    },
    evidence,
    sourceImageChecks,
    sourcePdfHashMatches: true,
    productionWrites: 0,
    productionDeployments: 0,
    limits:
      "Export contents are checked against actual held candidates, provisioned local reviewer identities and exact authoritative local records/history. These manifests have no cryptographic signature; a matching unsigned file alone is not independent proof of human identity. No export was created by this audit. When no export is located, only the local pending state is reported, and the handoff remains blocked.",
  };
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, "review-package.json"),
    JSON.stringify(handoff, null, 2) + "\n",
  );
  await writeFile(
    path.join(directory, "audit.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  const publicReport = {
    ...report,
    exportFiles: report.exportFiles.map((e) => ({
      ...e,
      file: path.basename(e.file),
    })),
  };
  await writeFile(
    "docs/teacher-decision-manifest-audit.json",
    JSON.stringify(publicReport, null, 2) + "\n",
  );
  await writeFile(
    "docs/TEACHER_DECISION_MANIFEST_AUDIT.md",
    `# Tamil Physics Unit 1 teacher decision audit\n\nChecked ${checkedAt}. ${found.length ? `${found.length} export file(s) located.` : "**Exported manifest not located.** The local decision store does not have export metadata and is not treated as an export."}\n\nActual authoritative local store: approved ${internalAudit.validatedCounts.approved}; needs correction ${internalAudit.validatedCounts.needs_correction}; rejected ${internalAudit.validatedCounts.rejected}; pending ${internalAudit.validatedCounts.pending}; reviewed ${internalAudit.reviewed}; history events ${internalAudit.historyEvents}. These are local-store counts, not verified export outcomes. Confirmed handoff records: **${confirmed.length}**. Missing/duplicate/unknown IDs and per-record schema/history/source issues are listed in the [JSON audit](teacher-decision-manifest-audit.json).\n\n${internalAudit.valid ? "The local store matches all 15 candidates, source metadata/hashes, flags and individual history requirements." : "Local store validation failed; do not reconcile any decision."} Provisioned reviewer identities: ${reviewers.length}. No approval is inferred from the printed key. Question 10 remains ${report.question10.localDecision}; its graph-only choices are incomplete and approval is forbidden.\n\nAll 15 packets preserve original raw/source Tamil and extracted options separately from proposed Tamil/options, source diagrams, PDF/printed-page references and numbered printed-key evidence. Fresh original PDF hash matches. Required local source images exist. Seven questions depend on diagrams; diagram inspection is a mandatory approval check, and graph incompleteness cannot be cleared by changing only manifest flags. Source flags and history were not rewritten.\n\nLocal handoff: \`.local/teacher-review/decision-audit/review-package.json\`. ${handoff.readyForAuthorisedDecisionReconciliation ? "Confirmed explicit decisions are staged only for later authorised reconciliation; every target candidate remains held." : "**Blocked; not import-ready.** No confirmed decision has been staged for import."} No importer, database mutation or deployment is invoked.\n\n${handoff.blockedReasons.map((reason) => `- ${reason}`).join("\n")}\n\nAfter the actual teacher saves individual decisions, sign in to \`http://127.0.0.1:4312\` and click **Export decision manifest**. Keep the original download unchanged. Run:\n\n\`\`\`powershell\nnpm run mcqs:decision-audit -- --manifest "C:\\full\\path\\tamil-physics-unit1-decisions.json"\n\`\`\`\n\nThe audit checks each event's authorised reviewer identity, required notes and source/diagram confirmations, revision/previous-decision chain, event IDs/timestamps, latest decision consistency and exact correspondence with the authoritative local store. Unknown/missing/duplicate IDs, stale/conflicting histories, modified source references or Question 10 approval invalidate the export. Multiple differing exports are not silently combined. No exported history is altered.\n\n[Prior production preservation proof (not refreshed by this local command)](teacher-decision-audit-database-proof.json) · [Verification receipts](teacher-decision-audit-verification.json)\n`,
  );
  assert.equal(
    sha(await readFile(storeFile)),
    sha(storeBytes),
    "Local review history changed during audit; rerun before using package",
  );
  assert.equal(sha(await readFile(packetFile)), sha(packetBytes));
  assert.equal(sha(await readFile(queueFile)), sha(queueBytes));
  console.log(
    JSON.stringify({
      exportLocated: report.exportLocated,
      storeValid: internalAudit.valid,
      localCounts: internalAudit.validatedCounts,
      localReviewed: internalAudit.reviewed,
      historyEvents: internalAudit.historyEvents,
      confirmedHandoffRecords: confirmed.length,
      packageReady: handoff.readyForAuthorisedDecisionReconciliation,
    }),
  );
  if (!internalAudit.valid || conflict || audits.some((a) => !a.audit.valid))
    process.exitCode = 1;
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Local decision audit failed",
  );
  process.exitCode = 1;
});
