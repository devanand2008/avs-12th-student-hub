import { createHash } from "node:crypto";
import type { TextbookMcqCandidate } from "../../src/lib/textbook-question-types";

export type ProgressCandidate = TextbookMcqCandidate & {
  qualityFlags: string[];
  practicePublished?: boolean;
  extractionEvidence?: {
    keyMatched?: boolean;
    requiresDiagram?: boolean;
    completeTextOptions?: boolean;
  };
};

/** Exact text diagnostic only: preserve case, option order and source IDs. */
export function questionContentSignature(
  c: Pick<ProgressCandidate, "questionText" | "options">,
) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        [c.questionText, ...c.options].map((s) =>
          s.trim().replace(/\s+/gu, " "),
        ),
      ),
    )
    .digest("hex");
}

export function extractionProgress(
  candidates: ProgressCandidate[],
  activeIds: string[],
  proposals: ProgressCandidate[],
) {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const proposed = new Map(proposals.map((c) => [c.id, c]));
  const errors: { candidateId: string; reason: string }[] = [];
  if (byId.size !== candidates.length)
    errors.push({ candidateId: "", reason: "Duplicate saved candidate IDs" });
  if (new Set(activeIds).size !== activeIds.length)
    errors.push({ candidateId: "", reason: "Duplicate active candidate IDs" });
  if (proposed.size !== proposals.length)
    errors.push({ candidateId: "", reason: "Duplicate source proposal IDs" });
  for (const c of proposals) {
    if (!byId.has(c.id) || !activeIds.includes(c.id))
      errors.push({
        candidateId: c.id,
        reason: "Source proposal lacks an active saved candidate",
      });
    if (c.practicePublished || c.status !== "Needs Review")
      errors.push({
        candidateId: c.id,
        reason: "Extraction proposal bypasses its held status",
      });
    if (!c.questionText.trim())
      errors.push({ candidateId: c.id, reason: "Empty source question" });
    if (
      c.correctAnswer &&
      (!/^[ABCD]$/.test(c.correctAnswer) ||
        !c.options[c.correctAnswer.charCodeAt(0) - 65]?.trim())
    )
      errors.push({
        candidateId: c.id,
        reason: "Correct-answer mapping has no corresponding option",
      });
  }
  const active = [...new Set(activeIds)].flatMap((id) => {
    const c = proposed.get(id) ?? byId.get(id);
    if (!c) {
      errors.push({ candidateId: id, reason: "Active ID lacks saved record" });
      return [];
    }
    return [c];
  });
  const groups = new Map<string, ProgressCandidate[]>();
  for (const c of active) {
    const signature = questionContentSignature(c);
    const group = groups.get(signature) ?? [];
    group.push(c);
    groups.set(signature, group);
  }
  const invalidAnswers = active.filter(
    (c) =>
      Boolean(c.correctAnswer) &&
      (!/^[ABCD]$/.test(c.correctAnswer!) ||
        !c.options[c.correctAnswer!.charCodeAt(0) - 65]?.trim()),
  );
  return {
    savedRecords: candidates.length,
    activeOccurrences: active.length,
    inactiveArtifacts: candidates.length - new Set(activeIds).size,
    sourceBoundedOccurrences: proposals.length,
    uniqueContentSignatures: groups.size,
    duplicateGroups: [...groups.entries()]
      .filter(([, group]) => group.length > 1)
      .map(([signature, group]) => ({
        signature,
        sources: group.map((c) => ({
          candidateId: c.id,
          bookId: c.bookId,
          chapterId: c.chapterId,
          questionNumber: c.number,
          pdfPage: c.page,
        })),
      })),
    duplicateOccurrencesBeyondFirst: active.length - groups.size,
    activeMissingQuestionText: active.filter((c) => !c.questionText.trim())
      .length,
    activeWithoutFourNonemptyOptions: active.filter(
      (c) => c.options.length !== 4 || c.options.some((o) => !o.trim()),
    ).length,
    activeInvalidAnswerMappings: invalidAnswers.length,
    heldInvalidAnswerMappings: invalidAnswers.map((c) => ({
      candidateId: c.id,
      bookId: c.bookId,
      chapterId: c.chapterId,
      pdfPage: c.page,
      proposedAnswer: c.correctAnswer,
      optionCount: c.options.length,
      action:
        "Keep held; recover source options or correct mapping through an authorised individual review",
    })),
    activeMissingSourceChecksum: active.filter((c) => !c.sourceSha256).length,
    activeInvalidPageReference: active.filter(
      (c) => !Number.isInteger(c.page) || c.page < 1,
    ).length,
    answersUnknown: active.filter((c) => !c.correctAnswer).length,
    parserOrProposedAnswersKnown: active.filter((c) => Boolean(c.correctAnswer))
      .length,
    // Only the explicit bounded source comparison is counted as a printed-key match.
    sourceBoundedPrintedKeyMatches: proposals.filter(
      (c) => c.extractionEvidence?.keyMatched && c.correctAnswer,
    ).length,
    sourceBoundedTamilCorrection: proposals.filter((c) =>
      c.qualityFlags.some((f) =>
        /Tamil.*(?:correction|damag|fragment)|damaged.*Tamil/i.test(f),
      ),
    ).length,
    sourceBoundedOptionRecovery: proposals.filter(
      (c) => c.extractionEvidence?.completeTextOptions === false,
    ).length,
    sourceBoundedDiagramVerification: proposals.filter(
      (c) => c.extractionEvidence?.requiresDiagram,
    ).length,
    errors,
  };
}
