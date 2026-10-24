import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";
import definitions from "./data/computer-source-sections.json";
import commerce from "./data/commerce-source-section.json";
import { readySourceDefinitions as sharedDefinitions } from "./lib/shared-source-definitions";
import figureRegions from "./data/shared-review-source-regions.json";
import { sourceFigureFile } from "./lib/source-figure-file";

async function main() {
  const directory = path.resolve(
    ".local/teacher-review/source-evidence/systematic-computer-batch",
  );
  await mkdir(directory, { recursive: true });
  const previous = await readFile(
    path.join(directory, "source-pages.json"),
    "utf8",
  )
    .then(JSON.parse)
    .catch((e: NodeJS.ErrnoException) => {
      if (e.code !== "ENOENT") throw e;
      return { pages: [] };
    });
  const pages: {
    file: string;
    bookId: string;
    pdfPage: number;
    printedPage: number | null;
    sourceSha256: string;
    sha256: string;
  }[] = [...previous.pages];
  const figureReceiptFile = path.join(directory, "source-figures.json");
  const figures: { file: string; bookId: string; chapterNumber: number; question: number; page: number; sourceSha256: string; sha256: string; rect: number[]; referenceWidth: number; referenceHeight: number; label: string }[] =
    await readFile(figureReceiptFile, "utf8").then(JSON.parse).catch((e: NodeJS.ErrnoException) => {
      if (e.code !== "ENOENT") throw e;
      return [];
    });
  for (const definition of [...definitions, commerce, ...sharedDefinitions]) {
    const bytes = await readFile(`public/textbooks/${definition.bookId}.pdf`);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      definition.sourceSha256,
    );
    const task = getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: true,
      verbosity: 0,
    });
    try {
      const pdf = await task.promise;
      for (const number of [
        definition.chapterStartPdfPage,
        ...definition.pages.map((p) => p.page),
        ...definition.inspectedEndingPages,
      ]) {
        const file = `${definition.bookId}-pdf-${number}.png`;
        const old = pages.find((p) => p.file === file);
        if (old) {
          assert.equal(old.sourceSha256, definition.sourceSha256);
          assert.equal(
            createHash("sha256")
              .update(await readFile(path.join(directory, file)))
              .digest("hex"),
            old.sha256,
            "Existing evidence changed; reconcile without overwriting",
          );
          continue;
        }
        const page = await pdf.getPage(number),
          viewport = page.getViewport({ scale: 1.5 });
        const canvas = createCanvas(
          Math.ceil(viewport.width),
          Math.ceil(viewport.height),
        );
        await page.render({
          canvas: canvas as never,
          canvasContext: canvas.getContext("2d") as never,
          viewport,
        }).promise;
        const png = canvas.toBuffer("image/png");
        await writeFile(path.join(directory, file), png);
        pages.push({
          file,
          bookId: definition.bookId,
          pdfPage: number,
          printedPage:
            definition.pages.find((p) => p.page === number)?.printedPage ??
            null,
          sourceSha256: definition.sourceSha256,
          sha256: createHash("sha256").update(png).digest("hex"),
        });
        page.cleanup();
      }
      for (const region of figureRegions.filter(r => r.bookId === definition.bookId && r.chapterNumber === definition.chapterNumber)) {
        const file = sourceFigureFile(region);
        const old = figures.find(f => f.file === file);
        if (old) {
          assert.equal(old.sourceSha256, definition.sourceSha256);
          assert.deepEqual(old.rect, region.rect);
          assert.equal(createHash("sha256").update(await readFile(path.join(directory, file))).digest("hex"), old.sha256);
          continue;
        }
        const page = await pdf.getPage(region.page), viewport = page.getViewport({ scale: 2 });
        const original = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        await page.render({ canvas: original as never, canvasContext: original.getContext("2d") as never, viewport }).promise;
        const [rx, ry, rw, rh] = region.rect;
        assert(rx >= 0 && ry >= 0 && rw > 0 && rh > 0 && rx + rw <= region.referenceWidth && ry + rh <= region.referenceHeight);
        const sx = viewport.width / region.referenceWidth, sy = viewport.height / region.referenceHeight;
        const x = Math.floor(rx * sx), y = Math.floor(ry * sy), width = Math.ceil(rw * sx), height = Math.ceil(rh * sy);
        const crop = createCanvas(width, height);
        crop.getContext("2d").drawImage(original, x, y, width, height, 0, 0, width, height);
        const png = crop.toBuffer("image/png");
        await writeFile(path.join(directory, file), png, { flag: "wx" }).catch(async (error: NodeJS.ErrnoException) => {
          if (error.code !== "EEXIST") throw error;
          // A previous interrupted run may have saved the crop before its receipt.
          // Reuse only byte-identical regenerated evidence; never overwrite it.
          assert.deepEqual(await readFile(path.join(directory, file)), png, "Unreceipted source crop differs; manual reconciliation required");
        });
        figures.push({ ...region, file, sourceSha256: definition.sourceSha256, sha256: createHash("sha256").update(png).digest("hex") });
        page.cleanup();
      }
    } finally {
      await task.destroy();
    }
  }
  await writeFile(
    path.join(directory, "source-pages.json"),
    JSON.stringify(
      {
        method:
          "Unaltered original PDF page rendering, scale 1.5; review evidence only",
        pages,
      },
      null,
      2,
    ) + "\n",
  );
  await writeFile(figureReceiptFile, JSON.stringify(figures, null, 2) + "\n");
  console.log(
    `Rendered ${pages.length} original source/title/ending pages; no decisions or publication.`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
