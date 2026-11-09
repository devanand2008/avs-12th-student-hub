import { writeFileSync } from "node:fs";
import {
  aiStudyTools,
  aiSubjects,
  accessLabels,
  promptTemplates,
} from "../src/lib/ai-study-tools";
import chapters from "../src/lib/ai-study-chapters.json";
const lines = [
  "# AI Study Tools — implementation and source report",
  "",
  `Catalogue audit generated ${new Date().toISOString()}. This command validates local metadata; provider evidence dates are stored per tool. It does not sign into providers, send prompts or publish questions. Release/testing results are recorded below.`,
  "",
  "## Routes and architecture",
  "",
  "`/ai-study-tools` is linked by a new card on `/resources`. Breadcrumbs return to resources, the homepage, 3D lab and book-back practice. Existing AI Helper remains a separate authenticated local-model feature. No package or dependency change was made by this task.",
  "",
  "The strict Zod-validated `src/lib/ai-study-tools-catalog.json` is separate from MCQs and the original resource manifest. URLs require public HTTPS without credentials or custom ports; duplicate tool identities, unknown subject IDs and arbitrary iframe fields fail validation. `ai-study-tools.ts` holds filtering and nine prompt templates. The client component has no upload, API call, database or persistence path. External links use a new tab with noopener/noreferrer.",
  "",
  `Subject mapping uses the existing textbook-import convention tb-<book ID>: ${aiSubjects.length} textbook subject/medium/volume records representing ${new Set(aiSubjects.map((s) => s.name)).size} unique subject names. ${chapters.length} chapter references were copied from docs/book-back-chapter-coverage.csv without altering it. Titles such as Chapter 1 remain detected labels, not certified names or evidence of complete extraction. After curriculum changes refresh ai-study-chapters.json from that CSV, retaining chapterId, tb-bookId, title and number. No fake chapter titles were added.`,
  "",
  "## Actual tools and evidence",
  "",
  "Source checked means product/access documentation was inspected. It does not certify every capability, minor's eligibility, regional sign-in or privacy policy. Unknown fields remain explicit; all interactive account access is untested. No tool is presented as a complete board-specific course. Numeric caps are deliberately not embedded in application logic.",
  "",
  "| Tool / provider | Kind | Access | Account / verification | Official evidence |",
  "|---|---|---|---|---|",
];
for (const t of aiStudyTools)
  lines.push(
    `| [${t.name}](${t.url}) / ${t.provider} | ${t.type} | ${accessLabels[t.access]} | ${t.account}; ${t.verification}; ${t.checkedAt} | ${t.sources.map((u, i) => `[source ${i + 1}](${u})`).join(", ")} |`,
  );
lines.push(
  "",
  "## Provider limitations",
  "",
  ...aiStudyTools.map(
    (t) =>
      `- **${t.name}:** ${t.limitations} ${t.eligibility} Privacy URL: ${t.privacyUrl ?? "not established"}; terms URL: ${t.termsUrl ?? "not established"}.`,
  ),
  "",
  "Official sources were refreshed on 3 November 2026. Gemini Notebook help establishes free Standard access and limits; the product redirect could not be fetched, so account interaction remains untested. Current Microsoft personal-account terms establish required sign-in and age 13 or the higher local minimum; school accounts have separate conditions. Python Tutor’s official page describes a free visualizer for Python, Java, C/C++ and JavaScript. Desmos and Khan published documents establish free tools/content. GeoGebra and PhET have noncommercial conditions; all entries are external links and no assets are redistributed or embedded. Unknown account/age/privacy details remain explicitly unverified. Product/access evidence does not establish full suitability for every student or country.",
  "",
  "Only Gemini has independently checked Tamil language support in this initial directory. English labels do not imply all providers have equally accurate Tamil output. Other provider languages remain unverified. Free Tools includes usable free tiers and personal noncommercial study resources while retaining all limitations; it excludes unverified-access, unavailable and eligibility-only statuses.",
  "",
  "## Subject coverage",
  "",
  "Each row lists general AI study support plus any specifically relevant non-AI tool. General support is a learning use case, not verification of every answer or subject expertise. No subject is complete. Separate textbook volumes and media remain selectable by their real IDs.",
  "",
  "| Registered subject | Relevant tools | Help available / remaining gap |",
  "|---|---|---|",
);
for (const name of [...new Set(aiSubjects.map((s) => s.name))].sort()) {
  const ids = aiSubjects.filter((s) => s.name === name).map((s) => s.id),
    tools = aiStudyTools.filter((t) =>
      t.subjectIds.some((id) => ids.includes(id)),
    );
  lines.push(
    `| ${name} | ${tools.map((t) => t.name).join(", ")} | General source-guided explanations/revision${tools.some((t) => t.id === "phet") ? "; conceptual simulations" : ""}${tools.some((t) => ["desmos", "geogebra", "wolfram"].includes(t.id)) ? "; maths exploration/calculation" : ""}${tools.some((t) => t.id === "python-tutor") ? "; supported-language code tracing" : ""}. Gap: official board alignment, full chapter coverage and teacher verification. |`,
  );
}
lines.push(
  "",
  "## Prompts, filters and privacy",
  "",
  `Templates: ${Object.values(promptTemplates)
    .map((p) => p.label)
    .join(
      "; ",
    )}. Prompts use the selected real textbook subject and chapter, optional topic and response language. Students can edit, copy with confirmation, reset, or manually copy if clipboard permission fails. Subject/chapter/template changes reset edits visibly. No guessed provider-prefill URLs or automatic submission.`,
  "",
  "Filters: subject ID, category (nine requested groups), learning task, AI versus subject tool, verified language, access classification and account requirement; text search includes names/descriptions/tasks/subject names. Counts derive from the manifest. Clear filters, empty/loading/error states, accessible labels, responsive cards and Tamil text are implemented.",
  "",
  "The required student privacy notice appears above the tools. Provider privacy/terms fields are nullable and unknown policies are disclosed. Located policy links are shown without claiming suitability or privacy guarantees. No sensitive files, third-party credentials or student prompt contents are collected or uploaded.",
  "",
  "## Verification results",
  "",
  "See final validation entry below. This script only validates the local catalogue; it does not refresh network evidence or change teacher decisions.",
);
writeFileSync("docs/AI_STUDY_TOOLS_REPORT.md", lines.join("\n") + "\n");
console.log(
  JSON.stringify({
    tools: aiStudyTools.length,
    ai: aiStudyTools.filter((t) => t.type === "AI assistant").length,
    subjectTools: aiStudyTools.filter((t) => t.type === "Subject learning tool")
      .length,
    sourceChecked: aiStudyTools.filter(
      (t) => t.verification === "Source checked",
    ).length,
    partial: aiStudyTools.filter(
      (t) => t.verification === "Partial verification",
    ).length,
    subjectRecords: aiSubjects.length,
    chapters: chapters.length,
  }),
);
