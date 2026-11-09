import { z } from "zod";
import raw from "./open-pdf-guides.json";
import textbooks from "./textbooks-catalog.json";
const guide = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  subjects: z.array(z.string()).min(1),
  topics: z.array(z.string()).min(1),
  medium: z.literal("English"),
  authors: z.string().min(3),
  publisher: z.string().min(2),
  sourceUrl: z.string().url().startsWith("https://"),
  sourcePdf: z.string().url().startsWith("https://"),
  hostedUrl: z
    .string()
    .regex(
      /^https:\/\/github\.com\/devanand2008\/avs-12th-student-hub\/releases\/download\/learning-materials-2026-10-25\/open-reference-[a-z0-9-]+\.pdf$/,
    ),
  licence: z.enum(["CC BY 4.0", "CC BY-SA 4.0", "CC BY-SA 2.0"]),
  licenceUrl: z
    .string()
    .regex(
      /^https:\/\/creativecommons\.org\/licenses\/(by|by-sa)\/(4\.0|2\.0)\/$/,
    ),
  licencePdfPage: z.number().int().positive(),
  attribution: z.string().min(10),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  sizeBytes: z.number().int().positive(),
  pages: z.number().int().positive(),
  limitations: z.string().min(10),
  checkedAt: z.string().datetime(),
});
export const openPdfGuides = z.array(guide).parse(raw);
export const guideSubjects = [
  ...new Set(textbooks.books.map((b) => b.subject)),
].sort();
for (const g of openPdfGuides) {
  if (
    g.subjects.some((s) => !guideSubjects.includes(s)) ||
    g.licencePdfPage > g.pages
  )
    throw Error(`Invalid open reference mapping: ${g.id}`);
}
if (
  new Set(openPdfGuides.map((g) => g.id)).size !== openPdfGuides.length ||
  new Set(openPdfGuides.map((g) => g.sha256)).size !== openPdfGuides.length
)
  throw Error("Duplicate open PDF reference.");
export function guidesForSubject(subject: string) {
  return openPdfGuides.filter((g) => g.subjects.includes(subject));
}
