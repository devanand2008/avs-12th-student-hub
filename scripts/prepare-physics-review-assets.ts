import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";
import regions from "./data/physics-review-source-regions.json";
import {
  reviewAssetFile,
  loadAdditionalPhysicsBatches,
} from "./lib/physics-review-batches";

/** Faithful original-PDF region extraction only; no drawing or image reconstruction. */
export async function preparePhysicsReviewAssets(
  root: string,
  directory: string,
) {
  const bytes = await readFile(
    path.join(root, `public/textbooks/${regions.bookId}.pdf`),
  );
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    regions.sourceSha256,
  );
  const batches = await loadAdditionalPhysicsBatches(root);
  assert.equal(
    batches.length,
    4,
    "Prepare the bounded source extraction first",
  );
  const assets = [
    ...regions.figures.map((r, i) => ({
      ...r,
      file: reviewAssetFile(
        r.unit,
        r.question,
        `figure-${regions.figures.slice(0, i + 1).filter((v) => v.unit === r.unit && v.question === r.question).length}`,
      ),
    })),
    ...regions.optionRecoveries.map((r) => ({
      ...r,
      file: reviewAssetFile(r.unit, r.question, "options"),
    })),
  ];
  await mkdir(directory, { recursive: true });
  const task = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
    verbosity: 0,
  });
  const receipts = [];
  try {
    const pdf = await task.promise;
    for (const number of [126, 127, 197, 198, 199, 267, 268, 269, 291, 292]) {
      const page = await pdf.getPage(number),
        viewport = page.getViewport({ scale: 2 });
      const original = createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height),
      );
      await page.render({
        canvas: original as never,
        canvasContext: original.getContext("2d") as never,
        viewport,
      }).promise;
      await writeFile(
        path.join(directory, `pdf-${number}.png`),
        original.toBuffer("image/png"),
      );
      for (const asset of assets.filter((a) => a.page === number)) {
        const [rx, ry, rw, rh] = asset.rect;
        assert.ok(
          rx >= 0 &&
            ry >= 0 &&
            rx + rw <= regions.referenceWidth &&
            ry + rh <= regions.referenceHeight,
        );
        const sx = viewport.width / regions.referenceWidth,
          sy = viewport.height / regions.referenceHeight;
        const x = Math.floor(rx * sx),
          y = Math.floor(ry * sy);
        const width = Math.ceil(rw * sx),
          height = Math.ceil(rh * sy);
        const crop = createCanvas(width, height);
        crop
          .getContext("2d")
          .drawImage(original, x, y, width, height, 0, 0, width, height);
        const png = crop.toBuffer("image/png");
        await writeFile(path.join(directory, asset.file), png);
        const candidate = batches
          .find((b) => b.unit === asset.unit)!
          .candidates.find((c) => c.number === asset.question)!;
        receipts.push({
          ...asset,
          candidateId: candidate.id,
          printedPage: number - 8,
          sourceSha256: regions.sourceSha256,
          sha256: createHash("sha256").update(png).digest("hex"),
          width,
          height,
        });
      }
      page.cleanup();
    }
  } finally {
    await task.destroy();
  }
  await writeFile(
    path.join(directory, "source-assets.json"),
    JSON.stringify(
      {
        method:
          "Original PDF rendering at scale 2, literal region crop; reference rectangle coordinates use 893 × 1234 page rendering",
        sourceSha256: regions.sourceSha256,
        assets: receipts,
      },
      null,
      2,
    ) + "\n",
  );
  return receipts;
}

if (
  process.argv[1]
    ?.replaceAll("\\", "/")
    .endsWith("/prepare-physics-review-assets.ts")
) {
  preparePhysicsReviewAssets(
    process.cwd(),
    path.resolve(
      ".local/teacher-review/physics-unit1-workflow/units2-5-source-assets",
    ),
  )
    .then((assets) =>
      console.log(
        `Prepared ${assets.length} original source-region assets; no teacher decision or publication.`,
      ),
    )
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
