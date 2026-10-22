import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { loadAdditionalPhysicsBatches } from "./lib/physics-review-batches";
import {
  readOptionalJson,
  reconcileManifest,
  type LocalReviewManifest,
  type LocalReviewer,
} from "./lib/local-physics-review";
import { auditTeacherManifest } from "./lib/teacher-decision-audit";

async function main() {
  const args = process.argv.slice(2);
  assert.ok(
    !args.length || (args.length === 2 && args[0] === "--manifest"),
    "Use --manifest <actual Units 2–5 exported JSON path>; no import is supported",
  );
  const root = process.cwd(),
    directory = path.resolve(".local/teacher-review/physics-unit1-workflow");
  const batches = await loadAdditionalPhysicsBatches(root);
  assert.equal(batches.length, 4);
  const reviewers = (
    (await readOptionalJson<LocalReviewer[]>(
      path.join(directory, "reviewers.json"),
    )) || []
  ).map(({ id, name, email }) => ({ id, name, email }));
  const inventory = [];
  for (const batch of batches) {
    const file = path.join(directory, batch.id, "decisions.json");
    const saved = await readOptionalJson<LocalReviewManifest>(file);
    const manifest = reconcileManifest(batch.candidates, saved);
    const audit = auditTeacherManifest(manifest, {
      candidates: batch.candidates,
      persisted: manifest,
      reviewers,
      requireExport: false,
    });
    assert.ok(audit.valid, JSON.stringify(audit.issues));
    inventory.push({
      batchId: batch.id,
      unit: batch.unit,
      title: batch.title,
      manifestPath: saved ? file : null,
      manifestSaved: Boolean(saved),
      counts: audit.validatedCounts,
      reviewed: audit.reviewed,
      historyEvents: audit.historyEvents,
      held: batch.candidates.length,
      published: 0,
      authenticExportAudited: false,
      candidates: batch.candidates.map((c) => ({
        id: c.id,
        number: c.number,
        chapterId: c.chapterId,
        batchId: c.reviewPreparation!.batchId,
        pdfPages: Array.from(
          { length: c.endPage! - c.page + 1 },
          (_, i) => c.page + i,
        ),
        printedPages: c.extractionEvidence.printedPages,
        keyPdfPage: c.keyPage,
        keyPrintedPage: c.extractionEvidence.keyPrintedPage,
        keyEntry: c.extractionEvidence.printedKeyEntry,
        reusedExistingId: c.extractionEvidence.reusedExistingId,
        decision: manifest.entries.find((e) => e.id === c.id)!.decision,
        localReviewHeld: true,
        practicePublished: false,
        optionsRecoveredProposal: Boolean(
          c.localReviewRequirements!.optionRecovery,
        ),
        completeTextOptions: c.extractionEvidence.completeTextOptions,
        diagramRequired: c.extractionEvidence.requiresDiagram,
        diagramTeacherVerified:
          manifest.entries.find((e) => e.id === c.id)!.history.at(-1)
            ?.diagramConfirmed === true,
        figureFiles: c.localReviewRequirements!.figures.map((f) => ({
          file: f.file,
          page: f.page,
          rect: f.rect,
          option: f.option ?? null,
        })),
        originalProposalSha256:
          c.localReviewRequirements!.originalProposalSha256,
        reviewEvidenceSha256: createHash("sha256")
          .update(JSON.stringify(c))
          .digest("hex"),
        unresolvedIssues: manifest.entries.find((e) => e.id === c.id)!
          .unresolvedIssues,
      })),
    });
  }
  const original = JSON.parse(
    await readFile(
      path.join(
        root,
        ".local/teacher-review/extracted-books/12-physics-tamil-v1-c1623725.json",
      ),
      "utf8",
    ),
  );
  const overlap = original.sourceBoundedProposals
    .filter(
      (c: {
        id: string;
        extractionEvidence: {
          requiresDiagram: boolean;
          completeTextOptions: boolean;
        };
      }) =>
        c.extractionEvidence.requiresDiagram &&
        !c.extractionEvidence.completeTextOptions,
    )
    .map((c: { id: string }) => c.id);
  const records = inventory.flatMap((b) => b.candidates);
  const uniqueIds = new Set(records.map((c) => c.id));
  assert.equal(uniqueIds.size, records.length);
  const raw = original.sourceBoundedProposals as {
    extractionEvidence: {
      requiresDiagram: boolean;
      completeTextOptions: boolean;
    };
  }[];
  const report = {
    checkedAt: new Date().toISOString(),
    scope:
      "Local individual review inventory; no production connection or publication",
    integrated: records.length,
    duplicateIds: records.length - uniqueIds.size,
    originalIncompleteOptions: raw.filter(
      (c) => !c.extractionEvidence.completeTextOptions,
    ).length,
    originalDiagramDependent: raw.filter(
      (c) => c.extractionEvidence.requiresDiagram,
    ).length,
    overlapCandidateIds: overlap,
    optionRecoveryProposals: records.filter((c) => c.optionsRecoveredProposal)
      .length,
    graphOptionSetsStillBlocked: records.filter((c) => !c.completeTextOptions)
      .length,
    batches: inventory,
  };
  let exportAudit = null;
  if (args.length) {
    const manifestPath = path.resolve(args[1]);
    const exported = JSON.parse(
      (await readFile(manifestPath, "utf8")).replace(/^\uFEFF/, ""),
    );
    const batch = batches.find((b) =>
      b.candidates.some((c) =>
        exported.entries?.some((e: { id: string }) => e.id === c.id),
      ),
    );
    assert.ok(batch, "Export does not identify an actual Units 2–5 batch");
    const persisted = await readOptionalJson<LocalReviewManifest>(
      path.join(directory, batch.id, "decisions.json"),
    );
    exportAudit = {
      manifestPath,
      batchId: batch.id,
      ...auditTeacherManifest(exported, {
        candidates: batch.candidates,
        persisted,
        reviewers,
        requireExport: true,
      }),
    };
  }
  await writeFile(
    "docs/physics-local-review-inventory.json",
    JSON.stringify({ ...report, exportAudit }, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      integrated: report.integrated,
      counts: inventory.map((b) => ({
        unit: b.unit,
        counts: b.counts,
        reviewed: b.reviewed,
      })),
      overlap: overlap.length,
      exportAudit: exportAudit
        ? {
            path: exportAudit.manifestPath,
            valid: exportAudit.valid,
            counts: exportAudit.validatedCounts,
          }
        : null,
    }),
  );
  if (exportAudit && !exportAudit.valid) process.exitCode = 1;
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
