import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { readHtmlLiteralData } from "./lib/static-html-data";
import { hasUsableSuppliedAnswer } from "../src/lib/supplied-practice/eligibility";
import type { SuppliedQuestion } from "../src/lib/supplied-practice/types";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
type Raw = Record<string, unknown>;
async function main() {
  const folder = "one mark html page",
    questions: Record<string, unknown>[] = [],
    files = [],
    seen = new Map<string, Record<string, unknown>>();
  let occurrences = 0;
  for (const file of (await readdir(folder))
    .filter((f) => f.endsWith(".html"))
    .sort()) {
    const html = await readFile(path.join(folder, file), "utf8"),
      data = readHtmlLiteralData(html),
      rows = (data.QUESTION_BANK ||
        data.ALL_QUESTIONS ||
        data.QUESTIONS) as Raw[];
    if (!Array.isArray(rows) || !rows.length)
      throw Error("No literal question bank: " + file);
    const subject = file.includes("chemistry")
      ? "Chemistry"
      : file.includes("physics")
        ? "Physics"
        : file.includes("mathematics")
          ? "Mathematics"
          : file.includes("computer_science")
            ? "Computer Science"
            : file.includes("zoology")
              ? "Bio-Zoology"
              : file === "tamil.html"
                ? "Tamil"
                : "English";
    const meta = (data.CHAPTERS_META ||
      data.CHAPTERS ||
      data.UNIT_META ||
      data.UNITS_META ||
      []) as Raw[] | Raw;
    const metadata: Raw[] = Array.isArray(meta)
      ? meta
      : Object.entries(meta).map(([id, v]) => ({ id, ...(v as object) }));
    files.push({ file, sha256: sha(html), subject, occurrences: rows.length });
    for (const [index, r] of rows.entries()) {
      occurrences++;
      const chapter = String(r.ch ?? r.chapter ?? r.unit ?? "Unmapped"),
        chapterMeta = metadata.find((m) => String(m.id) === chapter),
        volume =
          subject === "Mathematics"
            ? Number(r.ch) <= 6
              ? 1
              : 2
            : /vol_(?:1|i)_/.test(file)
              ? 1
              : /vol_(?:2|ii)_/.test(file)
                ? 2
                : null;
      const questionEn = String(
          r.q_en ?? r.en ?? (subject !== "Tamil" ? r.q : "") ?? "",
        ),
        questionTa = String(
          r.q_ta ?? r.ta ?? (subject === "Tamil" ? r.q : "") ?? "",
        );
      const optionsEn = (r.opts_en ??
          (subject !== "Tamil" ? r.options : []) ??
          []) as string[],
        optionsTa = (r.opts_ta ??
          (subject === "Tamil" ? r.options : []) ??
          []) as string[];
      const proposedAnswer = typeof r.ans === "number" ? r.ans : null,
        options = optionsEn.length ? optionsEn : optionsTa;
      const fingerprint = sha(
        JSON.stringify([
          subject,
          chapter,
          questionEn,
          questionTa,
          optionsEn,
          optionsTa,
        ]),
      );
      const source = {
        file,
        sha256: sha(html),
        originalId: String(r.id ?? index),
        row: index + 1,
        claimedSource: String(
          r.source ?? r.src ?? r.type ?? r.category ?? "Unspecified",
        ),
        reference: String(r.topic ?? r.num ?? r.qno ?? ""),
      };
      const prior = seen.get(fingerprint);
      if (prior) {
        (prior.sources as unknown[]).push(source);
        if (prior.proposedAnswer !== proposedAnswer)
          (prior.warnings as string[]).push(
            "Conflicting supplied answer indices across source occurrences",
          );
        continue;
      }
      const warnings = [
        "Supplied answers and textbook references require individual teacher verification",
      ];
      if (
        !Number.isInteger(proposedAnswer) ||
        proposedAnswer === null ||
        proposedAnswer < 0 ||
        proposedAnswer >= options.length
      )
        warnings.push("Missing or invalid answer index");
      if (
        options.length < 2 ||
        options.some((o) => typeof o !== "string" || !o.trim())
      )
        warnings.push("Incomplete choices");
      if (new Set(options.map((o) => o.trim())).size !== options.length)
        warnings.push("Duplicate supplied choices");
      if (
        r.svg ||
        /<svg\b/i.test(
          [questionEn, questionTa, ...optionsEn, ...optionsTa].join(" "),
        )
      )
        warnings.push("Supplied diagram requires visual verification");
      if (/\uFFFD|[\u0900-\u097f]/u.test(questionTa + optionsTa.join(" ")))
        warnings.push(
          "Unexpected or damaged characters in Tamil transcription",
        );
      const collectionId =
        subject.toLowerCase().replace(/[^a-z]+/g, "-") +
        (volume ? `-v${volume}` : "");
      const q = {
        id: "supplied-" + fingerprint.slice(0, 24),
        fingerprint,
        collectionId,
        subject,
        volume,
        section: chapter,
        sectionTitle: String(
          chapterMeta?.en ??
            chapterMeta?.title ??
            (typeof metadata[0] === "object"
              ? (metadata[0]?.[chapter] as Raw)?.en
              : undefined) ??
            chapter,
        ),
        questionEn,
        questionTa,
        optionsEn,
        optionsTa,
        proposedAnswer,
        explanationEn: String(r.exp_en ?? r.exp ?? ""),
        explanationTa: String(r.exp_ta ?? ""),
        originalDiagram: typeof r.svg === "string" ? r.svg : null,
        warnings,
        sources: [source],
        reviewStatus: "pending",
      };
      questions.push(q);
      seen.set(fingerprint, q);
    }
  }
  const collections = [
    ...new Set(questions.map((q) => String(q.collectionId))),
  ].map((id) => {
    const q = questions.filter((q) => q.collectionId === id);
    return {
      id,
      subject: q[0].subject,
      volume: q[0].volume,
      count: q.length,
      sections: [...new Set(q.map((r) => String(r.section)))],
      mediums: [
        ...(q.some((r) => r.questionEn) ? ["English"] : []),
        ...(q.some((r) => r.questionTa) ? ["Tamil"] : []),
      ],
      sourceFiles: [
        ...new Set(
          q.flatMap((r) =>
            (r.sources as { file: string }[]).map((s) => s.file),
          ),
        ),
      ],
    };
  });
  await mkdir("src/lib/supplied-practice", { recursive: true });
  await writeFile(
    "src/lib/supplied-practice/data.json",
    JSON.stringify({ version: 1, files, collections, questions }, null, 2) +
      "\n",
  );
  const report = {
    files: files.length,
    occurrences,
    uniqueQuestions: questions.length,
    duplicateOccurrences: occurrences - questions.length,
    approved: 0,
    pendingTeacherVerification: questions.length,
    availableSuppliedPractice: questions.filter((q) =>
      hasUsableSuppliedAnswer(q as unknown as SuppliedQuestion),
    ).length,
    accessPolicy:
      "Owner enabled supplied, unverified practice on 2026-10-25; no teacher approval or verified publication is implied.",
    collections,
    warnings: questions.reduce<Record<string, number>>(
      (out, q) => {
        for (const w of q.warnings as string[]) out[w] = (out[w] || 0) + 1;
        return out;
      },
      {} as Record<string, number>,
    ),
  };
  await writeFile(
    "docs/supplied-practice-import.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      files: report.files,
      occurrences,
      uniqueQuestions: questions.length,
      duplicateOccurrences: report.duplicateOccurrences,
      collections: collections.length,
      approved: 0,
    }),
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
