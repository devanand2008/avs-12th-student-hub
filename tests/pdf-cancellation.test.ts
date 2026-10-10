import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { patchPdfjsCancellation } from "../scripts/lib/pdfjs-cancellation.mjs";

test("PDF transport cancellation settles an already-aborted stream without hiding load failures", async () => {
  const source = await readFile(
    "node_modules/pdfjs-dist/build/pdf.mjs",
    "utf8",
  );
  const fixed = patchPdfjsCancellation(source);
  assert.equal(patchPdfjsCancellation(fixed), fixed);
  assert.throws(
    () => patchPdfjsCancellation("changed upstream transport"),
    /Review PDF.js/,
  );
  const rangeReader = fixed.slice(
    fixed.indexOf("class PDFFetchStreamRangeReader"),
  );
  const body = rangeReader.match(/cancel\(reason\) \{([\s\S]*?)\n  \}/)![1];
  const cancel = new Function("reason", body);
  const abort = new DOMException(
    "signal is aborted without reason",
    "AbortError",
  );
  const unhandled: unknown[] = [];
  const record = (reason: unknown) => {
    if (reason === abort) unhandled.push(reason);
  };
  process.on("unhandledRejection", record);
  try {
    const controller = new AbortController();
    const stream = new ReadableStream({ cancel: () => Promise.reject(abort) });
    cancel.call({ _reader: stream.getReader(), _abortController: controller });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(controller.signal.aborted, true);
    assert.deepEqual(unhandled, []);
    const broken = new ReadableStream({
      start: (control) => control.error(new Error("Actual PDF load failure")),
    });
    await assert.rejects(broken.getReader().read(), /Actual PDF load failure/);
  } finally {
    process.off("unhandledRejection", record);
  }
});
