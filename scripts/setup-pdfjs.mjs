import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { patchPdfjsCancellation } from "./lib/pdfjs-cancellation.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const packagePath = require.resolve("pdfjs-dist/package.json");
const packageDirectory = path.dirname(packagePath);
const { version } = JSON.parse(await readFile(packagePath, "utf8"));
if (!/^\d+\.\d+\.\d+$/.test(version))
  throw new Error("Invalid PDF.js package version.");
const assetDirectory = path.join(root, "public", "pdfjs", version);
if (version === "6.4.299") {
  for (const directory of ["build", "legacy/build"]) {
    const filename = path.join(packageDirectory, directory, "pdf.mjs");
    const original = await readFile(filename, "utf8");
    const fixed = patchPdfjsCancellation(original);
    if (fixed !== original) await writeFile(filename, fixed);
  }
}
await mkdir(assetDirectory, { recursive: true });
await cp(
  path.join(packageDirectory, "build", "pdf.worker.min.mjs"),
  path.join(assetDirectory, "pdf.worker.min.mjs"),
);
for (const directory of ["cmaps", "standard_fonts", "wasm", "iccs"]) {
  await cp(
    path.join(packageDirectory, directory),
    path.join(assetDirectory, directory),
    { recursive: true },
  );
}
await cp(
  path.join(packageDirectory, "LICENSE"),
  path.join(assetDirectory, "LICENSE"),
);
console.log(
  `PDF.js ${version} reader assets ready locally at /pdfjs/${version}/`,
);
