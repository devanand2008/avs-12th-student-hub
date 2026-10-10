/** Recover text and four separate choices without changing the source's answer. */
export interface ReadableMcqText {
  questionText: string;
  options: string[];
}

const labels: Record<string, string> = {
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
const optionPattern =
  /(?:^|[\s(])([abcdஅஆஇஈ])[ \t]*[).][ \t]*|(?:^|\s)\([ \t]*([1-4])[ \t]*\)[ \t]*/giu;
const sectionEnd =
  /\n\s*(?:Answers?(?:\s*key)?|KEY|II\b|III\b|IV\b|PART\s*[-–]?\s*[BCD]|Miscellaneous\s+(?:problems|exercises)|(?:Very\s+)?Short\s+answers?|விடைகள்|விடை\s*குறிப்பு|பகுதி\s*[-–]?\s*[ஆஇஈ])/iu;

/** Ignore code arguments such as print(a + b): b) is not an option label. */
export function mcqOptionMatches(raw: string) {
  const matches = [...raw.matchAll(optionPattern)];
  let depth = 0;
  let cursor = 0;
  return matches.filter((match) => {
    for (; cursor < match.index!; cursor++) {
      if (raw[cursor] === "(") depth++;
      else if (raw[cursor] === ")") depth = Math.max(0, depth - 1);
    }
    const functionArgument =
      raw[match.index!] === "(" && /[\w)\]]/u.test(raw[match.index! - 1] || "");
    return depth === 0 && !functionArgument;
  });
}

function displayText(raw: string) {
  const lines = raw
    .split("\n")
    .filter(
      (line) =>
        !/^(?:.*\.(?:indd|pmd|pdf)\s+.*|@@PAGE:\d+@@|\d+\s+(?:12\s*th\s+Std\b|XII\s*[-–])[^\n]*|Unit\s+\d+\b[^\n]*\d+|EVALUATION)$/i.test(
          line.trim(),
        ),
    )
    .map((line) => line.replace(/\s+$/u, ""));
  const text = lines.join("\n").trim();
  // Keep printed program lines separate. Ordinary PDF prose is line-wrapped.
  const code =
    /(?:^|\n)\s*(?:def\s+\w+\(|class\s+\w+|(?:if|elif|while|for)\b[^\n]*:|(?:print|input|return)\b|#include\b|(?:int|void|float|char)\s+\w+\s*\(|[A-Za-z_]\w*\s*(?:=|:=|[+*/-]=)|[{}]\s*$)/mu.test(
      text,
    );
  return code ? text : text.replace(/\s+/gu, " ");
}

/** A complete printed key cannot make a damaged formula a readable question. */
export function textPresentationFlags(
  questionText: string,
  options: string[],
  subject: string,
) {
  const flags: string[] = [];
  const values = [questionText, ...options];
  const all = values.join("\n");
  if (
    /[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uE000-\uF8FF]/u.test(
      all,
    )
  )
    flags.push("Transcribe unreadable PDF glyphs before text publication");
  if (
    /Read printed question \d+ in the original textbook|^(?:First|Second|Third|Fourth) printed option$/imu.test(
      all,
    )
  )
    flags.push("Transcribe the original question and all four choices");
  if (options.length !== 4 || options.some((value) => !value.trim()))
    flags.push("Confirm that all original choices were extracted");
  if (
    new Set(
      options.map((value) => value.toLocaleLowerCase().replace(/\s+/gu, " ")),
    ).size !== options.length
  )
    flags.push("Options are not distinct");
  if (options.some((value) => value.length > 450))
    flags.push("Check the option boundaries");
  if (/\s[\u0BBE-\u0BCD]/u.test(all))
    flags.push(
      "Transcribe separated Tamil letter marks before text publication",
    );
  const tamilWords = all.match(/[\u0B80-\u0BFF]+/gu) || [];
  const isolatedTamil = tamilWords.filter((word) =>
    /^[\u0B85-\u0BB9][\u0BBE-\u0BCD]?$/.test(word),
  ).length;
  if (isolatedTamil >= 5 && isolatedTamil / tamilWords.length > 0.18)
    flags.push("Transcribe fragmented Tamil words before text publication");
  if (
    /\b(?:figure|diagram|graph)\b|(?:following|below|shown)\s+(?:resistor|circuit|Gaussian\s+surface)|(?:படம்|படத்தில்|வரைபட)/iu.test(
      questionText,
    )
  )
    flags.push(
      "Transcribe the figure-dependent question before text publication",
    );
  // Extracted mathematical/chemical notation often loses two-dimensional order:
  // e.g. a fraction becomes "1 4", a power becomes "x 2", or Al₂O₃ becomes
  // "Al O 2 3". Do not silently guess which symbols belong above/below others.
  if (
    /mathematics|statistics|physics|chemistry/i.test(subject) &&
    values.some(
      (value) =>
        /\b\d+(?:\s+[−–+\-]?\d+)+\b|\d+\s+o\b/u.test(value) ||
        /\b[A-Za-z]\s+\d\b|\b[A-Za-z]{1,3}\s+T\b|\b[A-Za-z]\s+[A-Za-z]\s*[×÷]|\([\d ]{3,}\)/u.test(
          value,
        ) ||
        /[∆Δ∇∂∫Σ∑√α-ωΑ-Ω]\s+\d\b/u.test(value) ||
        /(?:\b[A-Za-z]|[α-ωΑ-Ω])(?:\s+[A-Za-zα-ωΑ-Ω]){1,}(?=\s|[,.)=+−×÷]|$)|\(\s*\)|\b(?:cm|dm|mol|m|s)\s+[−–-]?\d\b/u.test(
          value,
        ) ||
        /[=+−–×÷<>]\s*(?:[,.)]|$)|\[\s*,\s*\]/mu.test(value) ||
        (subject.toLowerCase().includes("chemistry") &&
          /\b(?:[A-Z][a-z]?)+\s+\d\b/u.test(value)) ||
        /(?:\b[A-Z][a-z]?\s+){2,}(?:\d|[A-Z][a-z]?\s+\d)/u.test(value) ||
        /[∫∑√]|\b(?:matrix|matrices)\b[^\n]*(?:\d\s+\d|\[|\])/iu.test(value),
    )
  )
    flags.push("Transcribe mathematical layout before text publication");
  return [...new Set(flags)];
}

export function extractReadableMcqText(
  raw: string,
  subject: string,
): {
  text?: ReadableMcqText;
  flags: string[];
} {
  const body = raw.split(sectionEnd)[0];
  const matches = mcqOptionMatches(body);
  if (
    matches.length !== 4 ||
    matches
      .map((match) => labels[(match[1] || match[2]).toLowerCase()])
      .join("") !== "ABCD"
  )
    return { flags: ["Transcribe the original question and all four choices"] };
  const questionText = displayText(body.slice(0, matches[0].index));
  const options = matches.map((match, index) =>
    displayText(
      body.slice(
        match.index! + match[0].length,
        matches[index + 1]?.index ?? body.length,
      ),
    ),
  );
  const flags = textPresentationFlags(questionText, options, subject);
  if (
    questionText.length < 8 ||
    questionText.length > 2500 ||
    /https?:\/\//u.test(questionText)
  )
    flags.push("Check the question boundaries");
  return { text: { questionText, options }, flags: [...new Set(flags)] };
}
