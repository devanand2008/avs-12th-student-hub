import type { McqAnswer } from "../../src/lib/textbook-question-types";

const labels: Record<string, McqAnswer> = {
  a: "A",
  b: "B",
  c: "C",
  d: "D",
  அ: "A",
  ஆ: "B",
  இ: "C",
  ஈ: "D",
  "1": "A",
  "2": "B",
  "3": "C",
  "4": "D",
};

/** Parse printed keys, never infer a key from question text or option frequency. */
export function parsePrintedAnswerKey(text: string, explained = false) {
  const answers = new Map<number, McqAnswer>();
  const positions = new Map<number, number>();
  let conflict = false;
  let tablePairs = 0;
  const put = (number: number, label: string, position: number) => {
    const answer = labels[label.toLowerCase()];
    if (!answer || number < 1 || number > 999) return;
    if (answers.has(number) && answers.get(number) !== answer) conflict = true;
    answers.set(number, answer);
    if (!positions.has(number)) positions.set(number, position);
  };
  const lines = text.split("\n");
  const offsets: number[] = [];
  lines.reduce((offset, line) => {
    offsets.push(offset);
    return offset + line.length + 1;
  }, 0);
  for (let i = 0; i < lines.length - 1; i++) {
    const numbers = lines[i].trim().replace(/\s*-{2,}\s*$/, "");
    const choices = lines[i + 1].trim().replace(/\s*-{2,}\s*$/, "");
    if (!/^\d+(?:\s+\d+)+$/.test(numbers)) continue;
    if (!/^(?:\(?[abcdஅஆஇஈ1-4]\)?)(?:\s+\(?[abcdஅஆஇஈ1-4]\)?)+$/i.test(choices))
      continue;
    const ns = numbers.split(/\s+/).map(Number);
    const cs = choices.replace(/[()]/g, "").toLowerCase().split(/\s+/);
    if (ns.length !== cs.length) {
      conflict = true;
      continue;
    }
    ns.forEach((n, j) => put(n, cs[j], offsets[i]));
    tablePairs += ns.length;
    lines[i] = " ".repeat(lines[i].length);
    lines[i + 1] = " ".repeat(lines[i + 1].length);
    i++;
  }
  const remainder = lines.join("\n");
  const pair = explained
    ? /(?<![\d\w])([1-9]\d{0,2})\s*[.)]\s*\(?\s*([abcdஅஆஇஈ])\s*[).]/giu
    : /(?<![\d\w])([1-9]\d{0,2})\s*[.)]?\s*\(?\s*([abcdஅஆஇஈ])(?:\s*[).]|(?=\s|\d|[.,]|$))/giu;
  for (const match of remainder.matchAll(pair))
    put(Number(match[1]), match[2], match.index!);
  // Numeric option codes are only accepted with explicit punctuation: 1. (3).
  for (const match of remainder.matchAll(
    /(?<!\d)([1-9]\d{0,2})\s*[.)]\s*\(\s*([1-4])\s*\)/g,
  ))
    put(Number(match[1]), match[2], match.index!);
  if (explained) {
    const starts = [
      ...remainder.matchAll(/(?:^|\n)\s*([1-9]\d{0,2})\s*\.\s+/g),
    ];
    starts.forEach((start, i) => {
      const block = remainder.slice(
        start.index! + start[0].length,
        starts[i + 1]?.index ?? remainder.length,
      );
      const explicit = [
        ...block.matchAll(/(?:Answer\s*:\s*)?option\s*\(\s*([abcd])\s*\)/gi),
      ];
      if (explicit.length === 1)
        put(
          Number(start[1]),
          explicit[0][1],
          start.index! + start[0].length + explicit[0].index!,
        );
      if (explicit.length > 1) conflict = true;
    });
  }
  const complete =
    answers.size >= 3 && [...answers.keys()].every((n) => n <= answers.size);
  return { answers, conflict, complete, tablePairs, positions };
}

export function chapterNumber(label: string): number {
  const numeric = label.match(/\d+/);
  if (numeric) return Number(numeric[0]);
  const roman = label.trim().toUpperCase();
  if (!/^[IVX]+$/.test(roman)) return 0;
  const values: Record<string, number> = { I: 1, V: 5, X: 10 };
  return [...roman].reduce(
    (n, c, i) =>
      n + (values[c] < (values[roman[i + 1]] || 0) ? -values[c] : values[c]),
    0,
  );
}
