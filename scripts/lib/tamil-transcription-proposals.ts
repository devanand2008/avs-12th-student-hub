import assert from "node:assert/strict";
import proposals from "../data/tamil-computer-transcription-proposals.json";
import type { PhysicsReviewCandidate } from "./physics-review-batches";

/** Supplementary proposals must never alter the authoritative candidate digest or decisions. */
export function localTranscriptionProposals(
  candidates: PhysicsReviewCandidate[],
) {
  assert.equal(
    proposals.scope,
    "local-source-proposals-only-no-teacher-decisions",
  );
  assert.equal(
    new Set(proposals.entries.map((e) => e.candidateId)).size,
    proposals.entries.length,
  );
  return proposals.entries
    .filter((entry) => candidates.some((c) => c.id === entry.candidateId))
    .map((entry) => {
      const c = candidates.find((c) => c.id === entry.candidateId)!;
      assert.equal(entry.source.sourceSha256, c.sourceSha256);
      assert.equal(entry.source.bookId, c.bookId);
      assert.equal(entry.printedQuestionNumber, c.number);
      assert.equal(
        entry.originalProposalSha256,
        c.localReviewRequirements?.originalProposalSha256,
      );
      assert.equal(entry.proposedAnswer, null);
      assert.equal(entry.teacherVerified, false);
      assert.equal(entry.reviewDecision, null);
      assert.deepEqual(
        entry.source.pdfPages,
        Array.from(
          { length: (c.endPage ?? c.page) - c.page + 1 },
          (_, i) => c.page + i,
        ),
      );
      assert.deepEqual(
        entry.source.printedPages,
        c.extractionEvidence.printedPages,
      );
      if (entry.proposedOptions) {
        assert.equal(entry.proposedOptions.length, 4);
        assert(entry.proposedOptions.every((o) => o.trim()));
        assert(entry.proposedQuestionText?.trim());
      }
      return entry;
    });
}
