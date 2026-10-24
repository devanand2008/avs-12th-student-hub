import { z } from "zod";
import { youtubeEmbedUrl } from "./media";

export const httpsUrl = z.string().refine((value) => {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      !["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)
    );
  } catch {
    return false;
  }
}, "A public HTTPS source URL is required");
const state = z.enum(["confirmed", "pending", "unavailable", "not_applicable"]);
export const resourceSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9_-]+$/),
    category: z.enum([
      "question-papers",
      "learning-materials",
      "video-lessons",
    ]),
    title: z.string().min(3),
    class: z.literal(12),
    board: z.string().nullable(),
    subjects: z.array(z.string()).min(1),
    mediums: z.array(z.enum(["English", "Tamil", "Common", "Unknown"])).min(1),
    year: z.number().int().min(2000).max(2100).nullable(),
    session: z.string().nullable(),
    resourceType: z.string().min(2),
    chapter: z.string().nullable(),
    markFormats: z
      .array(
        z
          .object({
            marks: z.number().int().positive().max(100),
            subject: z.string().min(1),
            medium: z.enum(["English", "Tamil", "Common"]),
            pdfPage: z.number().int().positive(),
            evidence: z.string().min(5),
          })
          .strict(),
      )
      .default([]),
    publisher: z.string().min(2),
    sourceUrl: httpsUrl,
    originalUrl: httpsUrl,
    pdfUrl: httpsUrl.nullable(),
    localAsset: z
      .string()
      .regex(/^\/resources\/[a-zA-Z0-9/_-]+\.pdf$/)
      .nullable(),
    checksum: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    status: z.enum([
      "listed",
      "temporary_unverified",
      "unavailable",
      "retired",
    ]),
    availability: state,
    authenticity: state,
    relevance: state,
    rights: z.enum([
      "openly_licensed",
      "official_access_terms_unclear",
      "external_link_only",
      "permission_required",
      "unknown",
    ]),
    licence: z.string().nullable(),
    licenceUrl: httpsUrl.nullable(),
    redistribution: z.enum(["permitted", "unclear", "not_permitted"]),
    embedding: z.enum([
      "oembed_supported",
      "not_permitted",
      "unknown",
      "not_applicable",
    ]),
    download: z.enum(["source_browser", "local_permitted", "not_available"]),
    editorial: z.enum(["source_checked", "pending", "retired"]),
    checkedAt: z.iso.datetime(),
    description: z.string(),
    accessibilityNotes: z.string(),
    issues: z.array(z.string()),
    history: z
      .array(
        z.object({
          at: z.iso.datetime(),
          action: z.string(),
          evidence: z.string().min(3),
        }),
      )
      .min(1),
  })
  .strict()
  .superRefine((r, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    if (
      r.localAsset &&
      (r.redistribution !== "permitted" || !r.checksum || !r.licenceUrl)
    )
      issue("Local copies require permission evidence and a checksum");
    if (r.rights === "openly_licensed" && (!r.licence || !r.licenceUrl))
      issue("Open licence claims require actual licence evidence");
    if (r.category === "video-lessons" && !youtubeEmbedUrl(r.originalUrl))
      issue("Video must have a validated YouTube identity");
    if (
      r.embedding === "oembed_supported" &&
      (r.category !== "video-lessons" || r.availability !== "confirmed")
    )
      issue("Embedding requires reachable video evidence");
    if (
      r.status === "listed" &&
      [r.availability, r.authenticity, r.relevance].some(
        (s) => s !== "confirmed",
      )
    )
      issue("Unconfirmed resources must remain temporary or unavailable");
    if (r.editorial === "retired" && r.status !== "retired")
      issue("Retirement must preserve an explicit retired status");
    if (
      r.download === "local_permitted" &&
      (!r.localAsset || r.redistribution !== "permitted")
    )
      issue("Local downloads require a permitted local asset");
    if (r.localAsset?.split("/").includes(".."))
      issue("Local paths cannot traverse directories");
    for (const format of r.markFormats) {
      if (
        !r.pdfUrl ||
        !r.subjects.includes(format.subject) ||
        !r.mediums.includes(format.medium)
      )
        issue(
          "Mark formats require PDF evidence and matching subject/medium metadata",
        );
    }
  });
export type StudyResource = z.infer<typeof resourceSchema>;
export const resourceManifestSchema = z
  .object({ version: z.literal(1), resources: z.array(resourceSchema) })
  .strict();

export function validateResourceManifest(value: unknown, subjects: string[]) {
  const manifest = resourceManifestSchema.parse(value),
    ids = new Set<string>(),
    identities = new Set<string>();
  for (const r of manifest.resources) {
    if (ids.has(r.id)) throw new Error(`Duplicate resource ID: ${r.id}`);
    ids.add(r.id);
    const identity =
      r.category === "video-lessons"
        ? youtubeEmbedUrl(r.originalUrl)!
        : (() => {
            const u = new URL(r.pdfUrl || r.originalUrl);
            u.hash = "";
            return u.href;
          })();
    if (identities.has(identity))
      throw new Error(`Duplicate resource identity: ${r.id}`);
    identities.add(identity);
    if (r.subjects.some((s) => !subjects.includes(s)))
      throw new Error(`Unknown textbook subject: ${r.id}`);
  }
  return manifest;
}

export function resourceMatches(
  r: StudyResource,
  filters: Record<string, string | undefined>,
) {
  return (
    (!filters.q ||
      [
        r.title,
        r.publisher,
        r.description,
        r.chapter,
        ...r.subjects,
        ...r.mediums,
        r.year,
        r.resourceType,
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(filters.q.trim().toLocaleLowerCase())) &&
    (!filters.subject || r.subjects.includes(filters.subject)) &&
    (!filters.medium ||
      r.mediums.includes(filters.medium as StudyResource["mediums"][number]) ||
      r.mediums.includes("Common")) &&
    (!filters.year || String(r.year) === filters.year) &&
    (!filters.type || r.resourceType === filters.type) &&
    (!filters.source || r.publisher === filters.source) &&
    (!filters.chapter || r.chapter === filters.chapter) &&
    (!filters.rights || r.rights === filters.rights) &&
    (!filters.marks ||
      r.markFormats.some(
        (f) =>
          String(f.marks) === filters.marks &&
          (!filters.subject || f.subject === filters.subject) &&
          (!filters.medium ||
            f.medium === filters.medium ||
            f.medium === "Common"),
      ))
  );
}

/** Facets are evidence-backed and scoped to the selected subject/medium. */
export function resourceFilterChoices(
  rows: StudyResource[],
  filters: Record<string, string | undefined> = {},
) {
  const unique = (values: string[]) => [...new Set(values)].sort();
  const scoped = rows.filter((r) =>
    resourceMatches(r, { subject: filters.subject, medium: filters.medium }),
  );
  return {
    subjects: unique(rows.flatMap((r) => r.subjects)),
    mediums: unique(rows.flatMap((r) => r.mediums)),
    years: [...new Set(scoped.flatMap((r) => (r.year ? [r.year] : [])))].sort(
      (a, b) => b - a,
    ),
    types: unique(scoped.map((r) => r.resourceType)),
    sources: unique(scoped.map((r) => r.publisher)),
    chapters: unique(scoped.flatMap((r) => (r.chapter ? [r.chapter] : []))),
    rights: unique(scoped.map((r) => r.rights)),
    marks: [
      ...new Set(
        scoped.flatMap((r) =>
          r.markFormats
            .filter(
              (f) =>
                (!filters.subject || f.subject === filters.subject) &&
                (!filters.medium ||
                  f.medium === filters.medium ||
                  f.medium === "Common"),
            )
            .map((f) => f.marks),
        ),
      ),
    ].sort((a, b) => a - b),
  };
}
