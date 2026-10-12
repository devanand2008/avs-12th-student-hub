import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  classifyManifestFile,
  searchTeacherManifests,
} from "../scripts/lib/teacher-manifest-discovery";

test("Bounded manifest search finds generic export names by content and distinguishes stores, templates, CSVs and reports", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "avs-manifest-discovery-fixture-"),
  );
  try {
    const fixtures: Record<string, string> = {
      "teacher-decision-manifest.json": JSON.stringify({
        scope: "local-only-reference-no-publication",
        entries: [],
        exportedAt: new Date().toISOString(),
        exportedBy: { id: "fixture" },
      }),
      "decision-manifest.json": JSON.stringify({
        scope: "local-only-reference-no-publication",
        entries: [],
      }),
      "physics-review-decisions.json": "broken JSON",
      "teacher-review-export.csv": "candidateId,decision\nfixture,pending\n",
      "teacher-decision-manifest-audit.json": JSON.stringify({
        checkedAt: new Date().toISOString(),
        exportLocated: false,
      }),
    };
    await mkdir(path.join(root, "exports"));
    await mkdir(path.join(root, "vercel-auth"));
    for (const [name, text] of Object.entries(fixtures))
      await writeFile(path.join(root, "exports", name), text);
    await writeFile(
      path.join(root, "vercel-auth", "teacher-decision-manifest.json"),
      "Must never be read",
    );
    const result = await searchTeacherManifests([root]);
    assert.equal(result.hits.length, 5);
    assert.equal(
      result.hits.find((h) =>
        h.file.endsWith(
          "exports" + path.sep + "teacher-decision-manifest.json",
        ),
      )!.classification,
      "export_candidate",
    );
    assert.equal(
      result.hits.find((h) =>
        h.file.endsWith(path.sep + "decision-manifest.json"),
      )!.classification,
      "local_store_or_template",
    );
    assert.equal(
      result.hits.find((h) => h.file.endsWith("physics-review-decisions.json"))!
        .classification,
      "malformed_candidate",
    );
    assert.equal(
      result.hits.find((h) => h.file.endsWith("teacher-review-export.csv"))!
        .classification,
      "reference_csv",
    );
    assert.equal(
      result.hits.find((h) =>
        h.file.endsWith("teacher-decision-manifest-audit.json"),
      )!.classification,
      "other_artifact",
    );
    assert.ok(result.hits.every((h) => !h.file.includes("vercel-auth")));
    const limited = await searchTeacherManifests([root], 0);
    assert.equal(limited.hits.length, 0);
    assert.ok(limited.limitations.length);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Manifest discovery never equates filenames or an empty JSON/CSV template with confirmed decisions", () => {
  assert.equal(
    classifyManifestFile("teacher-decision-manifest.json", "{}").classification,
    "other_artifact",
  );
  assert.equal(
    classifyManifestFile("teacher-review-export.csv", "approved,15")
      .classification,
    "reference_csv",
  );
  assert.equal(
    classifyManifestFile(
      "decision-manifest.json",
      JSON.stringify({ entries: [] }),
    ).classification,
    "malformed_candidate",
  );
});
