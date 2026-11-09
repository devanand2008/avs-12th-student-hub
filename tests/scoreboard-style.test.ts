import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { transform } from "lightningcss";

test("production CSS optimisation retains native glass blur alongside browser fallbacks", async () => {
  const source = await readFile(
    "src/components/learning/PointsCard.module.css",
  );
  const css = transform({
    filename: "PointsCard.module.css",
    code: source,
    minify: true,
  }).code.toString();
  const panel = css.match(/\.panel\{([^}]*)\}/)?.[1];
  assert.ok(panel);
  assert.match(panel, /(?:^|;)backdrop-filter:blur\(14px\)(?:;|$)/);
  assert.match(css, /\.panel\{-webkit-backdrop-filter:blur\(14px\)\}/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /forced-colors:active/);
  assert.match(css, /@supports not/);
});
