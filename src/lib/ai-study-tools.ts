import { z } from "zod";
import catalog from "./textbooks-catalog.json";
import savedTools from "./ai-study-tools-catalog.json";

const url = z.string().refine((s) => {
  try {
    const u = new URL(s);
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
}, "Public HTTPS URL required");
export const accessLabels = {
  free: "Free",
  free_with_usage_limits: "Free tier — usage limits apply",
  free_basic_paid_advanced: "Free basic tool; advanced features paid",
  free_for_noncommercial_educational_use:
    "Free for personal noncommercial study",
  free_content_not_an_ai_tool: "Free educational content",
  school_or_account_eligibility_required:
    "Account or school eligibility may apply",
  access_status_unverified: "Access details not verified",
  temporarily_unavailable: "Temporarily unavailable",
} as const;
export const toolCategories = [
  "General AI Study Assistants",
  "Maths and Problem Solving",
  "Physics and Chemistry Learning",
  "Biology, Botany and Zoology",
  "Computer Science and Programming",
  "English and Tamil Language Learning",
  "Accountancy, Commerce, Economics and Other Registered Subjects",
  "Notes, PDFs and Study Research",
  "Interactive Learning Tools",
] as const;
export const toolSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(2),
    provider: z.string().min(2),
    url,
    accessUrl: url,
    type: z.enum(["AI assistant", "Subject learning tool"]),
    categories: z.array(z.enum(toolCategories)).min(1),
    subjectIds: z.array(z.string()).min(1),
    languages: z.array(z.enum(["English", "Tamil"])),
    tasks: z.array(z.string()).min(1),
    access: z.enum(
      Object.keys(accessLabels) as [
        keyof typeof accessLabels,
        ...(keyof typeof accessLabels)[],
      ],
    ),
    account: z.enum(["Required", "Optional", "Unknown"]),
    eligibility: z.string().min(3),
    limitations: z.string().min(5),
    privacyUrl: url.nullable(),
    termsUrl: url.nullable(),
    sources: z.array(url).min(1),
    checkedAt: z.iso.date(),
    verification: z.enum(["Source checked", "Partial verification"]),
    availability: z.enum([
      "Official page reachable",
      "Interactive access not tested",
    ]),
    description: z.string().min(5),
  })
  .strict();
export type AiStudyTool = z.infer<typeof toolSchema>;
export const aiSubjects = catalog.books.map((b) => ({
  id: `tb-${b.id}`,
  bookId: b.id,
  name: b.subject,
  label: `${b.title} · ${b.medium}${b.volume ? ` · Vol ${b.volume}` : ""}`,
}));
export function validateAiTools(value: unknown) {
  const rows = z.array(toolSchema).parse(value),
    ids = new Set<string>(),
    urls = new Set<string>();
  for (const r of rows) {
    const identity = new URL(r.url);
    identity.hash = "";
    if (ids.has(r.id) || urls.has(identity.href))
      throw new Error("Duplicate AI tool identity");
    ids.add(r.id);
    urls.add(identity.href);
    if (r.subjectIds.some((id) => !aiSubjects.some((s) => s.id === id)))
      throw new Error("Unknown subject ID");
    if (
      r.access === "temporarily_unavailable" &&
      r.verification === "Source checked"
    )
      throw new Error("Unavailable tool cannot be listed as checked");
  }
  return rows;
}
export const aiStudyTools = validateAiTools(savedTools);
export function isFreeTool(t: AiStudyTool) {
  return ![
    "access_status_unverified",
    "temporarily_unavailable",
    "school_or_account_eligibility_required",
  ].includes(t.access);
}
export function matchesTool(t: AiStudyTool, f: Record<string, string>) {
  const subjectNames = aiSubjects
    .filter((s) => t.subjectIds.includes(s.id))
    .map((s) => s.name);
  return (
    (!f.q ||
      [t.name, t.description, ...t.tasks, ...subjectNames]
        .join(" ")
        .toLocaleLowerCase()
        .includes(f.q.trim().toLocaleLowerCase())) &&
    (!f.subject || t.subjectIds.includes(f.subject)) &&
    (!f.task || t.tasks.includes(f.task)) &&
    (!f.type || t.type === f.type) &&
    (!f.category ||
      t.categories.includes(f.category as (typeof toolCategories)[number])) &&
    (!f.language || t.languages.includes(f.language as "English" | "Tamil")) &&
    (!f.access ||
      (f.access === "free-tools" ? isFreeTool(t) : t.access === f.access)) &&
    (!f.account || t.account === f.account)
  );
}
export const promptTemplates = {
  concept: {
    label: "Understand a concept",
    text: "Explain the topic from the basics with an overview, steps and one example. Ask what I already understand, then finish with five practice questions.",
  },
  maths: {
    label: "Maths tutor",
    text: "Give hints first. Explain the formula, why each step works, common mistakes and how to check the result. Then give me one similar problem to solve.",
  },
  biology: {
    label: "Biology tutor",
    text: "Define scientific terms simply, organise the process into steps, explain structures and relationships, and finish with a revision summary and five questions. Do not invent diagram labels.",
  },
  science: {
    label: "Physics and Chemistry tutor",
    text: "Explain the idea, define every symbol and unit, demonstrate one worked example, and give me a similar problem. Check equations, chemical formulas, conditions and final units. State when source evidence is insufficient.",
  },
  code: {
    label: "Programming tutor",
    text: "Explain each line of my supplied code, trace a sample input and expected output, discuss errors and edge cases, then give a similar exercise. Do not claim code was executed unless it was.",
  },
  revision: {
    label: "Exam revision",
    text: "Create a concise revision outline, key terms, relevant formulas or concepts, common mistakes and a quiz. Label generated questions as practice, not authentic previous-year questions unless the source is verified.",
  },
  documents: {
    label: "Learn from PDFs and notes",
    text: "Use only the document I supply. Summarise concepts, create flashcards, a study guide and a quiz with source references when supported. If the document lacks an answer, say so.",
  },
  language: {
    label: "English and Tamil language tutor",
    text: "Explain the grammar or passage I supply, define unfamiliar words and give writing feedback with reasons. Give a short exercise. Flag uncertain Tamil translations and literature interpretations for textbook or teacher checking.",
  },
  commerce: {
    label: "Commerce and accountancy tutor",
    text: "Explain the supplied definition, transaction or graph step by step. For journal entries show debit/credit reasoning and check totals. Give a similar exercise; do not invent official exam answers.",
  },
} as const;
export function studyPrompt(
  template: keyof typeof promptTemplates,
  subject: string,
  chapter: string,
  topic: string,
  language: string,
) {
  return `I am a Tamil Nadu Class 12 student studying ${subject || "my selected subject"}${chapter ? `, ${chapter}` : ""}. Topic: ${topic.trim() || "the topic I will supply"}. Respond in ${language}.\n\n${promptTemplates[template].text}\n\nUse my supplied textbook or notes as the primary source when available. Distinguish supported facts from uncertain information. Do not invent textbook wording or page references. Help me understand rather than simply copy an answer.`;
}
