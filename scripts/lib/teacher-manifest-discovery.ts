import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

export interface ManifestSearchHit {
  file: string;
  classification:
    | "export_candidate"
    | "local_store_or_template"
    | "reference_csv"
    | "malformed_candidate"
    | "other_artifact";
  reason: string;
}
const excluded = new Set([
  "node_modules",
  ".git",
  ".next",
  "tools",
  ".ssh",
  ".aws",
  ".codex",
  ".vscode",
  "vercel-auth",
  "auth",
  "source-pages",
  "fresh-source-pages",
  "textbook-text",
  ".venv",
]);
const plausible = (name: string) =>
  /^(?:teacher-decision-manifest|decision-manifest|physics-review-decisions|teacher-review-export|tamil-physics-unit1-decisions)(?:[ _-]?\(\d+\)|[-_][\dTZ.]+)?\.(?:json|csv)$/i.test(
    name,
  ) ||
  /(?:teacher.*(?:decision|export)|physics.*(?:decision|review.*export)|decision.*manifest).*\.(?:json|csv)$/i.test(
    name,
  ) ||
  /^decisions\.json$/i.test(name);
export function classifyManifestFile(
  file: string,
  text: string,
): ManifestSearchHit {
  if (file.toLowerCase().endsWith(".csv"))
    return {
      file,
      classification: "reference_csv",
      reason:
        "CSV may contain reference decisions, but it is not the JSON export with authenticated reviewer/history evidence; no decisions inferred.",
    };
  let value: Record<string, unknown>;
  try {
    value = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    return {
      file,
      classification: "malformed_candidate",
      reason:
        "Named JSON candidate cannot be parsed; inspect rather than assume a missing export.",
    };
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    return {
      file,
      classification: "other_artifact",
      reason: "File is not a manifest object.",
    };
  if (
    value.scope === "local-only-reference-no-publication" &&
    Array.isArray(value.entries)
  ) {
    return {
      file,
      classification:
        value.exportedAt && value.exportedBy
          ? "export_candidate"
          : "local_store_or_template",
      reason:
        value.exportedAt && value.exportedBy
          ? "Export metadata present; schema, identity and authoritative history still require audit."
          : "Local store/template without authenticated export metadata; not a teacher export.",
    };
  }
  if (Array.isArray(value.entries) || value.exportedBy || value.exportedAt)
    return {
      file,
      classification: "malformed_candidate",
      reason:
        "Potential export envelope does not match this workflow; validation required.",
    };
  return {
    file,
    classification: "other_artifact",
    reason:
      "Report/dataset lacks the workflow manifest envelope; filename alone is not evidence.",
  };
}
export async function searchTeacherManifests(
  roots: string[],
  maxDepth = 6,
): Promise<{ hits: ManifestSearchHit[]; limitations: string[] }> {
  const hits: ManifestSearchHit[] = [],
    limitations: string[] = [],
    seen = new Set<string>();
  async function visit(root: string, depth: number) {
    if (seen.has(path.resolve(root))) return;
    seen.add(path.resolve(root));
    let items;
    try {
      items = await readdir(root, { withFileTypes: true });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT")
        limitations.push(`Could not list ${root}`);
      return;
    }
    for (const item of items) {
      const file = path.resolve(root, item.name);
      if (item.isSymbolicLink()) continue;
      if (item.isDirectory()) {
        if (
          excluded.has(item.name.toLowerCase()) ||
          /browser-profile$|^(?:credentials|secrets)$/i.test(item.name)
        )
          continue;
        if (depth < maxDepth) await visit(file, depth + 1);
        else limitations.push(`Depth limit reached: ${file}`);
      } else if (
        item.isFile() &&
        plausible(item.name) &&
        !/^reviewer/i.test(item.name)
      ) {
        try {
          if ((await stat(file)).size > 4 * 1024 * 1024) {
            limitations.push(`Skipped oversized candidate: ${file}`);
            continue;
          }
          const bytes = await readFile(file);
          const text =
            bytes[0] === 255 && bytes[1] === 254
              ? bytes.subarray(2).toString("utf16le")
              : bytes.toString("utf8");
          hits.push(classifyManifestFile(file, text));
        } catch {
          limitations.push(`Could not inspect candidate: ${file}`);
        }
      }
    }
  }
  for (const root of roots) await visit(root, 0);
  return { hits, limitations };
}
