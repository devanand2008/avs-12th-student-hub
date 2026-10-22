import test from "node:test";
import assert from "node:assert/strict";
import {
  extractionProgress,
  questionContentSignature,
  type ProgressCandidate,
} from "../scripts/lib/extraction-progress";

const c = (id: string, bookId = "book-one") =>
  ({
    id,
    bookId,
    subjectId: `tb-${bookId}`,
    chapterTitle: "Source chapter",
    section: "Book-back",
    sourceSha256: "fixture-source-hash",
    chapterId: "chapter",
    number: 1,
    page: 2,
    questionText: "Original question?",
    options: ["one", "two", "three", "four"],
    correctAnswer: null,
    status: "Needs Review",
    qualityFlags: [],
    practicePublished: false,
  }) as ProgressCandidate;

test("progress separates source occurrences, exact content duplicates, inactive artifacts and bounded proposals", () => {
  const first = c("a"),
    second = c("b", "book-two"),
    inactive = c("old");
  const proposal = {
    ...first,
    questionText: "Original   question?",
    extractionEvidence: { keyMatched: false, completeTextOptions: true },
  };
  const p = extractionProgress(
    [first, second, inactive],
    ["a", "b"],
    [proposal],
  );
  assert.equal(p.savedRecords, 3);
  assert.equal(p.activeOccurrences, 2);
  assert.equal(p.inactiveArtifacts, 1);
  assert.equal(p.sourceBoundedOccurrences, 1);
  assert.equal(p.uniqueContentSignatures, 1);
  assert.equal(p.duplicateOccurrencesBeyondFirst, 1);
  assert.equal(p.duplicateGroups[0].sources.length, 2);
  assert.equal(p.answersUnknown, 2);
  assert.equal(p.sourceBoundedPrintedKeyMatches, 0);
  assert.deepEqual(p.errors, []);
  assert.notEqual(
    questionContentSignature(first),
    questionContentSignature({
      ...first,
      options: [...first.options].reverse(),
    }),
  );
});

test("integrity flags duplicated IDs, orphan proposals, publication bypass and invalid answer mappings without manufacturing corrections", () => {
  const first = c("a"),
    invalid = {
      ...c("orphan"),
      status: "Published",
      practicePublished: true,
      correctAnswer: "D",
      options: ["one", "two"],
    } as ProgressCandidate;
  const p = extractionProgress(
    [first, first],
    ["a", "a", "missing"],
    [invalid, invalid],
  );
  for (const reason of [
    "Duplicate saved",
    "Duplicate active",
    "Duplicate source",
    "lacks an active",
    "held status",
    "Correct-answer",
    "lacks saved",
  ])
    assert(p.errors.some((e) => e.reason.includes(reason)));
  assert.equal(invalid.correctAnswer, "D");
  assert.equal(invalid.options.length, 2);
});
