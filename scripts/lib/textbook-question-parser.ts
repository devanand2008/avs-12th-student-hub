import { createHash } from "node:crypto";
import type { Textbook } from "../../src/lib/textbooks";
import type {
  McqAnswer,
  TextbookMcqCandidate,
  TextbookMcqChapter,
} from "../../src/lib/textbook-question-types";

export interface ExtractedBook {
  id: string;
  sha256: string;
  pages: { page: number; text: string }[];
  outline:
    { title: string; page?: number; items?: ExtractedBook["outline"] }[] | null;
}
const letters: Record<string, McqAnswer> = {
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
const footer = /^(?:.*\.(?:indd|pmd|pdf)\s+.*|@@PAGE:\d+@@)$/i;
function clean(text: string) {
  return text
    .split("\n")
    .filter((line) => !footer.test(line.trim()))
    .join(" ")
    .replace(/\s+/gu, " ")
    .trim();
}
function flatten(
  items: ExtractedBook["outline"],
): NonNullable<ExtractedBook["outline"]> {
  return (items || []).flatMap((item) => [
    item,
    ...flatten(item.items || null),
  ]);
}
export function findBookChapters(
  book: Textbook,
  extracted: ExtractedBook,
): TextbookMcqChapter[] {
  const subjectId = `tb-${book.id}`;
  // Some PDF bookmarks point to units containing several numbered chapters.
  // Prefer explicit chapter headings printed on the chapter's opening page.
  const printed: TextbookMcqChapter[] = [];
  for (const page of extracted.pages.filter((page) => page.page > 6)) {
    const head = page.text.slice(0, 2500);
    const heading = head.match(
      /([A-Z][A-Z &'(),.–-]+(?:\n[A-Z][A-Z &'(),.–-]+){0,2})\s+(\d{1,2})\s+CHAPTER\b/,
    );
    const leading = head
      .slice(0, 900)
      .match(
        /(?:^|\n)CHAPTER\s*\n\s*(\d{1,2})\s+([^\n]+(?:\n(?:and|of|for|in)\b[^\n]+)?)/i,
      );
    const reverse = [...head.matchAll(/\b(\d{1,2})\s+CHAPTER\b/g)].at(-1);
    const tamil = head.match(/\b(\d{1,2})\s*\nஅத்திய[^\n]{0,15}ம்/);
    const number = Number(
      reverse?.[1] || tamil?.[1] || heading?.[2] || leading?.[1],
    );
    const title = clean(
      (Number(heading?.[2]) === number ? heading?.[1] : undefined) ||
        leading?.[2] ||
        (number ? `Chapter ${number}` : ""),
    );
    if (
      number > 0 &&
      number <= 60 &&
      title.length >= 3 &&
      title.length <= 150 &&
      !printed.some((ch) => ch.number === number)
    )
      printed.push({
        id: `${subjectId}-ch-${number}`,
        number,
        title,
        page: page.page,
        published: 0,
        review: 0,
      });
  }
  const items = flatten(extracted.outline).filter(
    (item) =>
      item.page &&
      !/front|\bFM\b|contents|glossary|answers|contributor|appendix|index|case.?study|references/i.test(
        item.title,
      ),
  );
  const chapters: TextbookMcqChapter[] = [];
  for (const item of items) {
    const numbered =
      item.title.match(/(?:chapter|unit|ch)[\s_-]*(\d{1,2})\b/i) ||
      item.title.match(/^(\d{1,2})[\s.)_-]+/);
    if (!numbered) continue;
    const number = Number(numbered[1]);
    if (!number || number > 60 || chapters.some((ch) => ch.number === number))
      continue;
    const title =
      /\.indd|(?:[_-](?:ENG|EM|TM|Chapter|Unit)[_-])|^\w+(?:[_-]\w+)*[_-]\d+$/i.test(
        item.title,
      )
        ? `Chapter ${number}`
        : item.title.replace(/\.(?:pdf|indd)$/i, "").replace(/_/g, " ");
    chapters.push({
      id: `${subjectId}-ch-${number}`,
      number,
      title,
      page: item.page!,
      published: 0,
      review: 0,
    });
  }
  if (printed.length >= 3 && printed.length >= chapters.length)
    return printed.sort((a, b) => a.page - b.page);
  if (!chapters.length) {
    for (const page of extracted.pages) {
      const matches = [
        ...page.text.matchAll(/(?:Chapter|Unit)[ _-]*(\d{1,2})(?:\b|_)/gi),
      ];
      for (const match of matches) {
        const number = Number(match[1]);
        if (
          number &&
          number <= 60 &&
          page.page > 6 &&
          !chapters.some((ch) => ch.number === number)
        )
          chapters.push({
            id: `${subjectId}-ch-${number}`,
            number,
            title: `Chapter ${number}`,
            page: page.page,
            published: 0,
            review: 0,
          });
      }
    }
  }
  if (!chapters.length)
    chapters.push({
      id: `${subjectId}-ch-1`,
      number: 1,
      title: "Textbook exercises",
      page: 1,
      published: 0,
      review: 0,
    });
  return chapters.sort((a, b) => a.page - b.page);
}

export function extractBookMcqs(book: Textbook, extracted: ExtractedBook) {
  if (!book.sha256 || book.sha256 !== extracted.sha256)
    throw new Error("Textbook checksum does not match the extracted text.");
  const chapters = findBookChapters(book, extracted);
  const text = extracted.pages
    .map(
      (page) => `\n@@PAGE:${page.page}@@\n${page.text.replace(/^\d+\n/, "")}`,
    )
    .join("\n");
  const pages = [...text.matchAll(/@@PAGE:(\d+)@@/g)].map((match) => ({
    offset: match.index!,
    page: Number(match[1]),
  }));
  const pageAt = (offset: number) =>
    pages.findLast((page) => page.offset <= offset)?.page || 1;
  const chapterAt = (page: number) =>
    chapters.findLast((ch) => ch.page <= page) || chapters[0];
  const starts = [...text.matchAll(/(?:^|\n)\s*(\d{1,3})\s*[.)]\s+(?=\S)/g)];
  const questions: (TextbookMcqCandidate & { offset: number; end: number })[] =
    [];
  for (let index = 0; index < starts.length; index++) {
    const match = starts[index];
    const start = match.index! + match[0].length;
    const end = starts[index + 1]?.index ?? text.length;
    const raw = text
      .slice(start, end)
      .split(
        /\n\s*(?:Answers?(?:\s*key)?|KEY|விடைகள்|விடை\s*குறிப்பு)\s*:?\s*(?=\n|\d)/iu,
      )[0];
    const optionMatches = [
      ...raw.matchAll(
        /(?:^|[\s(])([abcdஅஆஇஈ])\s*[).]\s*|(?:^|\s)\(\s*([1-4])\s*\)\s*/giu,
      ),
    ];
    if (
      optionMatches.length < 2 ||
      optionMatches.length > 4 ||
      optionMatches
        .map((m) => letters[(m[1] || m[2]).toLowerCase()])
        .join("") !== "ABCD".slice(0, optionMatches.length)
    )
      continue;
    const questionText = clean(raw.slice(0, optionMatches[0].index));
    if (
      questionText.length < 8 ||
      questionText.length > 2500 ||
      /https?:\/\//.test(questionText)
    )
      continue;
    const options = optionMatches.map((option, i) =>
      clean(
        raw
          .slice(
            option.index! + option[0].length,
            optionMatches[i + 1]?.index ?? raw.length,
          )
          .split(
            /\n\s*(?:Answers?|Answer\s*key|II\b|III\b|IV\b|PART\s*[-–]?\s*[BCD]|விடைகள்|பகுதி\s*[-–]?\s*[ஆஇஈ])/iu,
          )[0],
      ),
    );
    if (options.some((option) => !option || option.length > 1000)) continue;
    const page = pageAt(match.index!);
    if (page <= 7) continue;
    const chapter = chapterAt(page);
    const preceding = text.slice(
      Math.max(0, match.index! - 14000),
      match.index!,
    );
    const evaluation =
      /choose\s+the\s+correct|multiple\s+choice|self.?examination|self.?evaluation|evaluation|சரியான\s+விடை|மதிப்பீடு|ஒரு\s*மதிப்பெண்/iu.test(
        preceding,
      );
    const qualityFlags: string[] = [];
    if (options.length !== 4)
      qualityFlags.push("Confirm that all original choices were extracted");
    if (!evaluation)
      qualityFlags.push("Confirm whether this is a one-mark exercise");
    if (/[\uFFFD\u0000]/u.test(questionText + options.join("")))
      qualityFlags.push("PDF text needs correction");
    if (
      new Set(options.map((option) => option.toLocaleLowerCase())).size <
      options.length
    )
      qualityFlags.push("Options are not distinct");
    if (options.some((option) => option.length > 450))
      qualityFlags.push("Check the option boundaries");
    if (
      /mathematics|statistics|physics|chemistry/i.test(book.subject) &&
      /[=∫∑√±⁰¹²³⁴⁵⁶⁷⁸⁹^]|\b(?:matrix|matrices|integral|derivative|equation)\b/i.test(
        questionText + options.join(""),
      )
    )
      qualityFlags.push("Check mathematical formatting against the PDF");
    const suffix = createHash("sha256")
      .update(
        `${book.sha256}:${page}:${match[1]}:${questionText}:${options.join("\n")}`,
      )
      .digest("hex")
      .slice(0, 16);
    questions.push({
      id: `textbook-q-${book.id}-${suffix}`,
      bookId: book.id,
      subjectId: `tb-${book.id}`,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      number: Number(match[1]),
      page,
      section: evaluation ? "Book-back" : "In-text",
      questionText,
      options,
      correctAnswer: null,
      status: "Needs Review",
      qualityFlags,
      sourceSha256: book.sha256,
      offset: match.index!,
      end,
    });
  }
  const keyHeads = [
    ...text.matchAll(
      /(?:^|\n)\s*(?:Answers?(?:\s*key)?|KEY|விடைகள்|விடை\s*குறிப்பு)\s*:?\s*(?=\n|\d)/gimu,
    ),
  ];
  let previousKey = 0;
  for (const header of keyHeads) {
    const offset = header.index!;
    const rawKey = text
      .slice(offset + header[0].length, offset + header[0].length + 2500)
      .split(
        /\n\s*(?:II\b|III\b|IV\b|Very\s+short|Short\s+answer|Long\s+answer|Exercises|PART\s*[-–]?\s*[BCD]|பகுதி)/iu,
      )[0];
    const answers = new Map<number, McqAnswer>();
    let conflict = false;
    const keyLines = rawKey.split("\n");
    for (let i = 0; i < keyLines.length - 1; i++) {
      const numbers = keyLines[i].trim();
      const choices = keyLines[i + 1].trim();
      if (
        !/^\d+(?:\s+\d+)+$/.test(numbers) ||
        !/^[abcdஅஆஇஈ](?:\s+[abcdஅஆஇஈ])+$/i.test(choices)
      )
        continue;
      const values = numbers.split(/\s+/).map(Number);
      const keys = choices.toLowerCase().split(/\s+/);
      if (values.length !== keys.length) {
        conflict = true;
        continue;
      }
      values.forEach((number, index) => {
        if (answers.has(number)) conflict = true;
        answers.set(number, letters[keys[index]]);
      });
      keyLines[i] = "";
      keyLines[i + 1] = "";
      i++;
    }
    const pairs = [
      ...keyLines
        .join("\n")
        .matchAll(
          /(?<!\d)(\d{1,3})\s*[.)]?\s*\(?\s*([abcdஅஆஇஈ])\s*\)?(?=\s|\d|[.,]|$)/giu,
        ),
    ];
    for (const pair of pairs) {
      const number = Number(pair[1]);
      const answer = letters[pair[2].toLowerCase()];
      if (answers.has(number)) conflict = true;
      answers.set(number, answer);
    }
    const chapter = chapterAt(pageAt(offset));
    let eligible = questions.filter(
      (q) =>
        q.offset > previousKey &&
        q.offset < offset &&
        q.chapterId === chapter.id &&
        q.section === "Book-back",
    );
    const reset = eligible.findLastIndex((q) => q.number === 1);
    if (reset >= 0) eligible = eligible.slice(reset);
    previousKey = offset;
    if (conflict || answers.size < 3 || !eligible.length) continue;
    // A complete, unambiguous numbering sequence must match the printed key.
    const sequence = eligible.map((q) => q.number);
    if (
      new Set(sequence).size !== eligible.length ||
      eligible.some((q) => !answers.has(q.number))
    )
      continue;
    for (const question of eligible) {
      question.correctAnswer = answers.get(question.number)!;
      question.keyPage = pageAt(offset);
      if ("ABCD".indexOf(question.correctAnswer) >= question.options.length)
        question.qualityFlags.push(
          "Printed answer does not match the extracted options",
        );
      if (!question.qualityFlags.length) question.status = "Published";
    }
  }
  const extractedCandidates = questions.map(({ offset, end, ...question }) => {
    void offset;
    void end;
    return question;
  });
  const unique = new Map<string, TextbookMcqCandidate>();
  for (const question of extractedCandidates) {
    const prior = unique.get(question.id);
    if (
      prior?.correctAnswer &&
      question.correctAnswer &&
      prior.correctAnswer !== question.correctAnswer
    ) {
      unique.set(question.id, {
        ...prior,
        correctAnswer: null,
        status: "Needs Review",
        qualityFlags: [
          ...prior.qualityFlags,
          "Conflicting printed answer keys",
        ],
      });
    } else if (!prior || question.status === "Published")
      unique.set(question.id, question);
  }
  const candidates = [...unique.values()];
  for (const chapter of chapters) {
    chapter.published = candidates.filter(
      (q) => q.chapterId === chapter.id && q.status === "Published",
    ).length;
    chapter.review = candidates.filter(
      (q) => q.chapterId === chapter.id && q.status !== "Published",
    ).length;
  }
  return { candidates, chapters };
}
