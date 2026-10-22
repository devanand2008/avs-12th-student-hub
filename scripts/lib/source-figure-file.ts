import assert from "node:assert/strict";

/** Keep established filenames stable; a source question may span several crops. */
export function sourceFigureFile(region: {
  bookId: string;
  chapterNumber: number;
  question: number;
  part?: number;
}) {
  if (region.part !== undefined) {
    assert(Number.isSafeInteger(region.part) && region.part > 0, "Invalid source figure part");
  }
  return `${region.bookId}-ch-${region.chapterNumber}-q-${region.question}-figure${region.part === undefined ? "" : `-part-${region.part}`}.png`;
}
