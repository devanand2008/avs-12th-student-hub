/**
 * PDF.js 6.4.299 drops the promises returned by transport reader.cancel().
 * An already-aborted stream can reject during book/page teardown. Consume
 * only cancellation rejections; loading and rendering errors stay unchanged.
 */
export function patchPdfjsCancellation(source) {
  const original = "this._reader?.cancel(reason);";
  const fixed = "this._reader?.cancel(reason).catch(() => {});";
  const originalCount = source.split(original).length - 1;
  const fixedCount = source.split(fixed).length - 1;
  if (originalCount === 0 && fixedCount === 4) return source;
  if (originalCount !== 4 || fixedCount !== 0)
    throw new Error(
      "Review PDF.js reader cancellation before updating its transport patch.",
    );
  return source.replaceAll(original, fixed);
}
