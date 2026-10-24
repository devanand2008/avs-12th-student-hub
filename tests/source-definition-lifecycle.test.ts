import assert from "node:assert/strict";
import test from "node:test";
import { draftSourceDefinitions, readySourceDefinitions } from "../scripts/lib/shared-source-definitions";
import definitions from "../scripts/data/shared-source-sections.json";

test("unfinished source definitions remain inventoried but cannot enter extraction or block existing review batches", () => {
  assert.equal(readySourceDefinitions.length + draftSourceDefinitions.length, definitions.length);
  assert.deepEqual(draftSourceDefinitions, definitions.filter(d => "preparationStatus" in d && d.preparationStatus !== "source_checked"));
  for (const d of draftSourceDefinitions) {
    assert.equal(d.preparationStatus, "in_progress");
    assert(!readySourceDefinitions.includes(d));
  }
  assert(readySourceDefinitions.some(d => d.bookId === "12-bio-zoology-english-7e848813" && d.chapterNumber === 3));
});
