export function parseRosterCsv(input: string): Record<string, string>[] {
  const text = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index++;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index++;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (quoted) throw new Error("A quoted CSV field is not closed.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2)
    throw new Error("Provide a header and at least one student record.");
  const headers = rows.shift()!.map((h) => h.toLowerCase());
  if (
    new Set(headers).size !== headers.length ||
    headers.some(
      (h) =>
        !/^[a-z_]+$/.test(h) ||
        ["__proto__", "constructor", "prototype"].includes(h),
    )
  )
    throw new Error("CSV headers must be unique field names.");
  for (const required of [
    "student_name",
    "register_number",
    "school_name",
    "stream",
  ])
    if (!headers.includes(required))
      throw new Error(`Missing required CSV column: ${required}`);
  if (rows.length > 500)
    throw new Error("Import at most 500 students at a time.");
  return rows.map((cells, index) => {
    if (cells.length !== headers.length)
      throw new Error(`Row ${index + 2} has a different number of columns.`);
    return Object.fromEntries(headers.map((header, i) => [header, cells[i]]));
  });
}

export function csvCell(value: string): string {
  const safe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
