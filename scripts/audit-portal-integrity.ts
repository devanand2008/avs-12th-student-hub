import { createHash } from "node:crypto";
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import path from "node:path";

// Local files only. Never loads credentials or connects to a database.
const root = ".local/portal-baseline";
const hash = (bytes: Buffer | string) =>
  createHash("sha256").update(bytes).digest("hex");
async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory()
          ? files(path.join(dir, e.name))
          : [path.join(dir, e.name)],
      ),
    )
  ).flat();
}
async function main() {
  const snapshot = process.argv.includes("--snapshot");
  const baselineFile = `${root}/manifest.json`;
  if (snapshot) {
    await mkdir(root, { recursive: true });
    const candidates: Record<string, Record<string, string>> = {};
    const proposals: Record<string, Record<string, string>> = {};
    for (const file of await files(".local/teacher-review/extracted-books")) {
      if (!file.endsWith(".json")) continue;
      const data = JSON.parse(await readFile(file, "utf8"));
      candidates[file] = Object.fromEntries(
        data.candidates.map((c: { id: string }) => [
          c.id,
          hash(JSON.stringify(c)),
        ]),
      );
      proposals[file] = Object.fromEntries(
        data.sourceBoundedProposals.map((c: { id: string }) => [
          c.id,
          hash(JSON.stringify(c)),
        ]),
      );
    }
    const protectedFiles: Record<string, string> = {};
    for (const dir of [
      ".local/teacher-review/physics-unit1-workflow",
      ".local/teacher-review/source-evidence",
    ]) {
      for (const file of await files(dir))
        protectedFiles[file] = hash(await readFile(file));
    }
    for (const file of [
      ".local/independent-live-content.json",
      ".local/followup-platform-after-snapshot.json",
      "src/lib/textbook-publication-baseline.json",
      "scripts/data/shared-source-sections.json",
    ])
      protectedFiles[file] = hash(await readFile(file));
    await writeFile(
      baselineFile,
      JSON.stringify(
        { at: new Date().toISOString(), candidates, proposals, protectedFiles },
        null,
        2,
      ),
      { flag: "wx" },
    );
    console.log(
      JSON.stringify({
        candidates: Object.values(candidates).reduce(
          (n, v) => n + Object.keys(v).length,
          0,
        ),
        proposals: Object.values(proposals).reduce(
          (n, v) => n + Object.keys(v).length,
          0,
        ),
        protectedFiles: Object.keys(protectedFiles).length,
      }),
    );
    return;
  }
  const baseline = JSON.parse(await readFile(baselineFile, "utf8"));
  const errors: string[] = [],
    added: string[] = [];
  let preserved = 0,
    preservedProposals = 0;
  for (const [file, old] of Object.entries(baseline.candidates) as [
    string,
    Record<string, string>,
  ][]) {
    const data = JSON.parse(await readFile(file, "utf8"));
    const now = new Map(
      data.candidates.map((c: { id: string }) => [
        c.id,
        hash(JSON.stringify(c)),
      ]),
    );
    if (now.size !== data.candidates.length)
      errors.push(`Duplicate IDs: ${file}`);
    for (const [id, digest] of Object.entries(old)) {
      if (now.get(id) !== digest) errors.push(`Changed original: ${id}`);
      else preserved++;
    }
    for (const id of now.keys())
      if (!old[id as string]) added.push(id as string);
    const proposals = new Map(
      data.sourceBoundedProposals.map((c: { id: string }) => [
        c.id,
        hash(JSON.stringify(c)),
      ]),
    );
    for (const [id, digest] of Object.entries(baseline.proposals[file])) {
      if (proposals.get(id) !== digest) errors.push(`Changed proposal: ${id}`);
      else preservedProposals++;
    }
  }
  for (const [file, digest] of Object.entries(baseline.protectedFiles)) {
    // Source definitions and evidence index are append-only; compare their old entries separately.
    if (
      file === "scripts/data/shared-source-sections.json" ||
      /source-(pages|figures)\.json$/.test(file)
    )
      continue;
    if (hash(await readFile(file)) !== digest)
      errors.push(`Changed protected file: ${file}`);
  }
  for (const [saved, current, key] of [
    ["source-definitions.json", "scripts/data/shared-source-sections.json", ""],
    [
      "source-pages.json",
      ".local/teacher-review/source-evidence/systematic-computer-batch/source-pages.json",
      "pages",
    ],
    [
      "source-figures.json",
      ".local/teacher-review/source-evidence/systematic-computer-batch/source-figures.json",
      "",
    ],
  ]) {
    const before = JSON.parse(await readFile(`${root}/${saved}`, "utf8"));
    const after = JSON.parse(await readFile(current, "utf8"));
    const oldEntries = key ? before[key] : before;
    const entries = (key ? after[key] : after).map((v: unknown) =>
      JSON.stringify(v),
    );
    for (const item of oldEntries)
      if (!entries.includes(JSON.stringify(item)))
        errors.push(`Changed append-only evidence: ${current}`);
  }
  const report = {
    at: new Date().toISOString(),
    baselineAt: baseline.at,
    preserved,
    preservedProposals,
    protectedFiles: Object.keys(baseline.protectedFiles).length,
    added,
    errors,
  };
  await writeFile(
    "docs/portal-integrity.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report));
  if (errors.length) process.exitCode = 1;
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
