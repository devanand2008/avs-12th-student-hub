import {
  readFile,
  readdir,
  mkdir,
  writeFile,
  rename,
  rm,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { readHtmlLiteralData } from "./lib/static-html-data";
import { hasUsableSuppliedAnswer } from "../src/lib/supplied-practice/eligibility";
import type { SuppliedQuestion } from "../src/lib/supplied-practice/types";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
type Raw = Record<string, unknown>;
async function writeJson(file: string, value: unknown) {
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(value, null, 2) + "\n");
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
}
async function main() {
  const folder = "one mark html page",
    questions: Record<string, unknown>[] = [],
    files = [],
    seen = new Map<string, Record<string, unknown>>();
  let occurrences = 0;
  const inputs = await Promise.all(
    (await readdir(folder))
      .filter((f) => f.endsWith(".html"))
      .sort()
      .map(async (file) => {
        const html = await readFile(path.join(folder, file), "utf8");
        const data = readHtmlLiteralData(html);
        const units = Object.values(
          (data.UNIT_META || {}) as Record<string, Raw>,
        );
        const mixedBiology =
          units.some((unit) => unit.subject === "botany") &&
          units.some((unit) => unit.subject === "zoology");
        return { file, html, data, mixedBiology };
      }),
  );
  // Keep the original source order stable while appending the distinct Biology-group sources.
  inputs.sort((a, b) => Number(a.mixedBiology) - Number(b.mixedBiology));
  for (const { file, html, data, mixedBiology } of inputs) {
    const rows = (data.QUESTION_BANK ||
      data.ALL_QUESTIONS ||
      data.QUESTIONS) as Raw[];
    if (!Array.isArray(rows) || !rows.length)
      throw Error("No literal question bank: " + file);
    const fileSubject = mixedBiology
      ? "Biology (Bio-Botany & Bio-Zoology)"
      : file.includes("chemistry")
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
    files.push({
      file,
      sha256: sha(html),
      subject: fileSubject,
      occurrences: rows.length,
    });
    for (const [index, r] of rows.entries()) {
      occurrences++;
      const chapter = String(r.ch ?? r.chapter ?? r.unit ?? "Unmapped"),
        chapterMeta = metadata.find(
          (m) => String(m.id) === (mixedBiology ? String(r.unit) : chapter),
        ),
        subject = mixedBiology
          ? r.subject === "botany"
            ? "Bio-Botany"
            : r.subject === "zoology"
              ? "Bio-Zoology"
              : ""
          : fileSubject,
        sourceContext = mixedBiology ? "biology-group" : undefined,
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
      if (
        !subject ||
        (mixedBiology &&
          (chapterMeta?.subject !== r.subject ||
            String(chapterMeta?.ch) !== chapter))
      )
        throw Error(
          `Conflicting Biology subject/chapter metadata: ${file} row ${index + 1}`,
        );
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
          ...(sourceContext ? [sourceContext] : []),
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
        if (prior.proposedAnswer !== proposedAnswer) {
          prior.answerConflict = true;
          (prior.warnings as string[]).push(
            "Conflicting supplied answer indices across source occurrences",
          );
        }
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
        (volume ? `-v${volume}` : "") +
        (sourceContext ? "-biology-group" : "");
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
        ...(sourceContext ? { sourceContext } : {}),
      };
      questions.push(q);
      seen.set(fingerprint, q);
    }
  }
  const variants = new Map<string, Set<Record<string, unknown>>>();
  for (const question of questions.filter((q) => q.sourceContext)) {
    for (const source of question.sources as { originalId: string }[]) {
      const key = JSON.stringify([
        question.sourceContext,
        question.subject,
        question.section,
        source.originalId,
      ]);
      const entries = variants.get(key) || new Set<Record<string, unknown>>();
      entries.add(question);
      variants.set(key, entries);
    }
  }
  for (const entries of variants.values()) {
    if (entries.size > 1)
      for (const question of entries) {
        const warning =
          "Source versions differ for the same original question ID; wording/options require verification";
        const warnings = question.warnings as string[];
        if (!warnings.includes(warning)) warnings.push(warning);
      }
  }
  const collections = [
    ...new Set(questions.map((q) => String(q.collectionId))),
  ].map((id) => {
    const q = questions.filter((q) => q.collectionId === id);
    return {
      id,
      subject: q[0].subject,
      ...(q[0].sourceContext
        ? {
            sourceContext: q[0].sourceContext,
            title: `${q[0].subject} · Biology group`,
          }
        : {}),
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
  await writeJson("src/lib/supplied-practice/data.json", {
    version: 1,
    files,
    collections,
    questions,
  });
  const report = {
    files: files.length,
    occurrences,
    uniqueQuestions: questions.length,
    duplicateOccurrences: occurrences - questions.length,
    deduplicationScope:
      "Subject, source context, section, exact bilingual wording and ordered choices; not a global count across textbook editions or the verified bank",
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
  await writeJson("docs/supplied-practice-import.json", report);
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
