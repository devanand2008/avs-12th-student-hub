import { z } from "zod";

export const questionImportSchema = z
  .object({
    chapter_id: z.string().trim().min(1).max(180),
    question: z.string().trim().min(8).max(2500),
    option_a: z.string().trim().min(1).max(1000),
    option_b: z.string().trim().min(1).max(1000),
    option_c: z.string().trim().max(1000).default(""),
    option_d: z.string().trim().max(1000).default(""),
    correct_answer: z
      .string()
      .trim()
      .toUpperCase()
      .pipe(z.enum(["A", "B", "C", "D"])),
    explanation: z.string().trim().max(4000).default(""),
    source_type: z.enum(["Book-In", "Book-Out"]).default("Book-In"),
    difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Medium"),
  })
  .superRefine((row, context) => {
    const options = [row.option_a, row.option_b, row.option_c, row.option_d];
    if (row.option_d && !row.option_c)
      context.addIssue({
        code: "custom",
        message: "Option C is required when option D is present.",
      });
    if (!options["ABCD".indexOf(row.correct_answer)])
      context.addIssue({
        code: "custom",
        message: "The correct answer must name a nonempty option.",
      });
    const present = options.filter(Boolean);
    if (
      new Set(present.map((value) => value.toLocaleLowerCase())).size !==
      present.length
    )
      context.addIssue({
        code: "custom",
        message: "Options must be distinct.",
      });
    if (/\uFFFD/.test(row.question + options.join("")))
      context.addIssue({
        code: "custom",
        message: "Correct damaged PDF text before importing.",
      });
  });

export function parseQuestionCsv(input: string) {
  // Share the quoted-field parser while requiring this import's own columns.
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  const text = input.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (quoted) throw new Error("Close the quoted CSV field.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  const headers = rows.shift()?.map((value) => value.toLowerCase()) || [];
  if (
    new Set(headers).size !== headers.length ||
    headers.some(
      (header) =>
        !/^[a-z_]+$/.test(header) ||
        ["__proto__", "constructor", "prototype"].includes(header),
    )
  )
    throw new Error("Use unique column names from the template.");
  if (!rows.length || rows.length > 100)
    throw new Error("Import between 1 and 100 questions at a time.");
  return rows.map((cells, i) => {
    if (cells.length !== headers.length)
      throw new Error(`Row ${i + 2} has a different number of columns.`);
    const parsed = questionImportSchema.safeParse(
      Object.fromEntries(
        headers.map((header, index) => [header, cells[index]]),
      ),
    );
    if (!parsed.success)
      throw new Error(`Row ${i + 2}: ${parsed.error.issues[0].message}`);
    return parsed.data;
  });
}
