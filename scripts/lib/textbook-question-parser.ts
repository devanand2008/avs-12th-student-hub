import { createHash } from "node:crypto";
import { chapterNumber, parsePrintedAnswerKey } from "./textbook-answer-keys";
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
    const leading = head.match(
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
      item.title.match(
        /(?:chapter|unit|ch|(?:^|[\s_])U)[\s_-]*(\d{1,2})(?=[\s_.(-]|$)/i,
      ) || item.title.match(/^(\d{1,2})[\s.)_-]+/);
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
  const footerChapters: TextbookMcqChapter[] = [];
  for (const page of extracted.pages.filter((page) => page.page > 4)) {
    const file = page.text
      .split("\n")
      .find(
        (line) =>
          /\.indd\b/i.test(line) &&
          !/front|prelim|intro|practical|glossary|answers|acknow|reference/i.test(
            line,
          ),
      );
    const number = Number(
      file?.match(
        /(?:CH(?:APTER)?|UNIT|(?:^|[\s_])U)[\s_-]*(\d{1,2})(?=[\s_.(-]|$)/i,
      )?.[1],
    );
    if (
      !number ||
      number > 60 ||
      footerChapters.some((ch) => ch.number === number)
    )
      continue;
    footerChapters.push({
      id: `${subjectId}-ch-${number}`,
      number,
      title:
        chapters.find((ch) => ch.number === number)?.title ||
        printed.find((ch) => ch.number === number)?.title ||
        `Chapter ${number}`,
      page: page.page,
      published: 0,
      review: 0,
    });
  }
  if (
    footerChapters.length >= 3 &&
    footerChapters.length >= chapters.length &&
    footerChapters.length >= printed.length
  )
    return footerChapters.sort((a, b) => a.page - b.page);
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
  const subjectId = `tb-${book.id}`;
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
      Math.max(
        pages.find((p) => p.page === chapter.page)?.offset || 0,
        match.index! - 30000,
      ),
      match.index!,
    );
    const evaluation =
      /c\s*h\s*o\s*o\s*s\s*e\s+(?:the\s+)?(?:correct|best|most\s+suitable)|multiple\s+choice|objective\s+questions|self.?examination|self.?evaluation|evaluation|E\s+V\s+A\s+L\s+U\s+A\s+T\s+I\s+O\s+N|சரியான\s+விடை|மதிப்பீடு|ஒரு\s*மதிப்பெண்/iu.test(
        preceding,
      );
    const exerciseHead =
      [
        ...preceding.matchAll(
          /(?:^|\n)\s*(?:I[.)]?\s*)?(?:c\s*h\s*o\s*o\s*s\s*e\s+(?:the\s+)?(?:correct|best|most\s+suitable)|Multiple\s+Choice|Objective\s+Questions|Self.?examination|Self.?evaluation|EVALUATION\b|E\s+V\s+A\s+L\s+U\s+A\s+T\s+I\s+O\s+N)/gimu,
        ),
      ].at(-1)?.index ?? -1;
    const otherPart =
      [
        ...preceding.matchAll(
          /(?:^|\n)\s*(?:II|III|IV)[.)]?\s+(?:Short|Very|Answer|Give|Choose|Fill|Match|[\u0B80-\u0BFF])|(?:^|\n)\s*PART\s*[-–]?\s*(?:II|III|IV|[BCD])\b|(?:^|\n)\s*Answer\s+the\s+following\s+questions/gimu,
        ),
      ].at(-1)?.index ?? -1;
    const bookBack =
      evaluation && (book.sourceMedium === "Tamil" || exerciseHead > otherPart);
    const qualityFlags: string[] = [];
    if (options.length !== 4)
      qualityFlags.push("Confirm that all original choices were extracted");
    if (!bookBack)
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
      section: bookBack ? "Book-back" : "In-text",
      questionText,
      options,
      correctAnswer: null,
      status: "Needs Review",
      qualityFlags,
      sourceSha256: book.sha256,
      exercise: [
        ...preceding.matchAll(
          /(?:\bEXERCISE\s*:?\s*|பயி[^\n\d]{0,12}\s*)(\d{1,2}\.\d{1,2})\b/gi,
        ),
      ].at(-1)?.[1],
      endPage: Math.min(
        page + 1,
        pageAt(start + (optionMatches.at(-1)?.index || 0)),
      ),
      offset: match.index!,
      end,
    });
  }
  const keyHeads = [
    ...text.matchAll(
      /(?:^|\n)\s*(?:Answers?(?:\s*key|\s+for\s+Objective\s+Questions)?|KEY|வி\s*(?:டை|மட)\s*கள்|விடை\s*குறிப்பு)\s*:?\s*(?=\n|\d)/gimu,
    ),
  ];
  if (book.sourceMedium === "Tamil") {
    // A few legacy fonts corrupt the word "answers" but preserve the numbered
    // option-code row. This is a printed key, not a guessed language conversion.
    for (const match of text.matchAll(
      /(?:^|\n)\s*(?=1\s*[.)]\s*\(\s*[அஆஇஈ]\s*\))/gu,
    ))
      keyHeads.push(
        Object.assign([""] as unknown as RegExpExecArray, {
          index: match.index! + match[0].length,
          input: text,
        }),
      );
    keyHeads.sort((a, b) => a.index! - b.index!);
  }
  let previousKey = 0;
  for (const header of keyHeads) {
    const offset = header.index!;
    const rawKey = text
      .slice(offset + header[0].length, offset + header[0].length + 2500)
      .split(
        /\n\s*(?:II\b|III\b|IV\b|Very\s+short|Short\s+answer|Long\s+answer|Exercises|PART\s*[-–]?\s*[BCD]|பகுதி|.*\.(?:indd|pmd)\b)/iu,
      )[0];
    const { answers, conflict, complete, positions } =
      parsePrintedAnswerKey(rawKey);
    const chapter = chapterAt(pageAt(offset));
    const nearby = questions.filter(
      (q) =>
        q.offset > previousKey &&
        q.offset < offset &&
        q.chapterId === chapter.id &&
        (q.section === "Book-back" || q.options.length === 4),
    );
    const run = (values: typeof nearby) => {
      const reset = values.findLastIndex((q) => q.number === 1);
      return reset >= 0 ? values.slice(reset) : values;
    };
    let eligible = run(nearby.filter((q) => q.section === "Book-back"));
    const full = run(nearby);
    // Restore a split-column exercise only when the complete printed key has
    // exactly one corresponding four-option question for every number.
    if (
      full.length === answers.size &&
      new Set(full.map((q) => q.number)).size === full.length &&
      full.every((q) => answers.has(q.number))
    )
      eligible = full;
    previousKey = offset;
    if (conflict || !complete || !eligible.length) continue;
    // A complete, unambiguous numbering sequence must match the printed key.
    const sequence = eligible.map((q) => q.number);
    if (
      new Set(sequence).size !== eligible.length ||
      eligible.some((q) => !answers.has(q.number)) ||
      (eligible.some((q) => q.section !== "Book-back") &&
        eligible.length !== answers.size)
    )
      continue;
    for (const question of eligible) {
      if (question.section !== "Book-back") {
        question.section = "Book-back";
        question.qualityFlags = question.qualityFlags.filter(
          (flag) => flag !== "Confirm whether this is a one-mark exercise",
        );
      }
      question.correctAnswer = answers.get(question.number)!;
      question.keyPage = pageAt(
        offset + header[0].length + (positions.get(question.number) || 0),
      );
      if ("ABCD".indexOf(question.correctAnswer) >= question.options.length)
        question.qualityFlags.push(
          "Printed answer does not match the extracted options",
        );
      if (!question.qualityFlags.length) question.status = "Published";
    }
  }
  // Chemistry and mathematics print their keys in a separate back-of-book
  // section. Match the explicit unit/exercise label, never the key's PDF chapter.
  const answerStart = flatten(extracted.outline).find((item) =>
    /\banswers(?:\b|_)/i.test(item.title),
  )?.page;
  if (answerStart && answerStart > 7) {
    const from =
      pages.find((p) => p.page === answerStart)?.offset ?? text.length;
    const nextBookPart = flatten(extracted.outline)
      .filter((item) => item.page && item.page > answerStart)
      .sort((a, b) => a.page! - b.page!)[0]?.page;
    const tail = text.slice(
      from,
      pages.find((p) => p.page === nextBookPart)?.offset ?? text.length,
    );
    const headings = [
      ...tail.matchAll(
        /(?:^|\n)\s*(?:(?:UNIT\s*[-–:]?\s*|பா[^\n\d]{0,12}ம்\s*[-–:]?\s*)(\d{1,2}|[IVX]+)\b|(?:EXERCISE\s*:?\s*|பயி[^\n\d]{0,12}\s*)(\d{1,2}\.\d{1,2})\b)/gi,
      ),
    ];
    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const block = tail.slice(
        heading.index! + heading[0].length,
        headings[i + 1]?.index ?? tail.length,
      );
      const { answers, conflict, complete, tablePairs, positions } =
        parsePrintedAnswerKey(
          block.split(/\n\s*(?:II\b|III\b|IV\b|Miscellaneous\b)/i)[0],
          !heading[2],
        );
      if (
        conflict ||
        answers.size < 3 ||
        (heading[2] && (!complete || tablePairs !== answers.size))
      )
        continue;
      const exercise = heading[2];
      const number = exercise
        ? Number(exercise.split(".")[0])
        : chapterNumber(heading[1]);
      const chapter = chapters.find((ch) => ch.number === number);
      if (!chapter) continue;
      const chapterStart =
        pages.find((p) => p.page === chapter.page)?.offset || 0;
      const chapterEnd = Math.min(
        from,
        pages.find(
          (p) => p.page === chapters[chapters.indexOf(chapter) + 1]?.page,
        )?.offset || from,
      );
      const body = text.slice(chapterStart, chapterEnd);
      const sourceHeaders = exercise
        ? [
            ...body.matchAll(
              /(?:^|\n)\s*(?:EXERCISE\s*:?\s*|பயி[^\n\d]{0,12}\s*)(\d{1,2}\.\d{1,2})\b/gi,
            ),
          ].filter((h) => h[1] === exercise)
        : [
            ...body.matchAll(
              /(?:^|\n)\s*(?:I[.)]?\s*)?(?:choose\s+(?:the\s+)?(?:correct|best|most\s+suitable)|சரியான)[^\n]*/gi,
            ),
          ];
      if (sourceHeaders.length === 1) {
        const sourceFrom =
          chapterStart + sourceHeaders[0].index! + sourceHeaders[0][0].length;
        const nextExercise = text
          .slice(sourceFrom, chapterEnd)
          .match(
            /(?:^|\n)\s*(?:EXERCISE\s*:?\s*|பயி[^\n\d]{0,12}\s*)\d{1,2}\.\d{1,2}\b/i,
          );
        const nextPart = text
          .slice(sourceFrom, chapterEnd)
          .match(
            /(?:^|\n)\s*(?:Answer\s+the\s+following|(?:II|III|IV)[.)]?\s+(?:Short|Very|Answer|Give)|Part\s*[-–]?\s*(?:II|III|IV|[BCD])\b)/i,
          );
        const sourceTo = Math.min(
          chapterEnd,
          nextExercise ? sourceFrom + nextExercise.index! : chapterEnd,
          nextPart ? sourceFrom + nextPart.index! : chapterEnd,
        );
        const numbered = starts.filter(
          (start) =>
            start.index! >= sourceFrom &&
            start.index! < sourceTo &&
            answers.has(Number(start[1])),
        );
        if (
          new Set(numbered.map((start) => Number(start[1]))).size ===
          numbered.length
        ) {
          numbered.forEach((start, index) => {
            const questionNumber = Number(start[1]);
            const end = numbered[index + 1]?.index ?? sourceTo;
            const raw = text.slice(start.index! + start[0].length, end);
            // The original page is the question payload. Require all four
            // printed option codes even when formulas defeat text extraction.
            const codes = [
              ...raw.matchAll(
                /(?:^|[\s(])([abcdஅஆஇஈ])\s*[).]\s*|(?:^|\s)\(\s*([1-4])\s*\)\s*/giu,
              ),
            ].map((m) => letters[(m[1] || m[2]).toLowerCase()]);
            if (
              !["A", "B", "C", "D"].every((code) =>
                codes.includes(code as McqAnswer),
              ) &&
              !(
                exercise &&
                /(?:four\s+alternatives|four\s+(?:options|choices)|நா\s*ன்\s*கு)/iu.test(
                  text.slice(sourceFrom, sourceFrom + 600),
                )
              )
            )
              return;
            const answer = answers.get(questionNumber)!;
            let question = questions.find((q) => q.offset === start.index!);
            if (
              question?.qualityFlags.includes(
                "Conflicting printed answer keys",
              ) ||
              (question?.correctAnswer && question.correctAnswer !== answer)
            )
              return;
            const page = pageAt(start.index!);
            if (!question) {
              const suffix = createHash("sha256")
                .update(
                  `${book.sha256}:${page}:${questionNumber}:original-pdf:${exercise || chapter.id}`,
                )
                .digest("hex")
                .slice(0, 16);
              question = {
                id: `textbook-q-${book.id}-${suffix}`,
                bookId: book.id,
                subjectId,
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                number: questionNumber,
                page,
                section: "Book-back",
                questionText: `Read printed question ${questionNumber} in the original textbook.`,
                options: [
                  "First printed option",
                  "Second printed option",
                  "Third printed option",
                  "Fourth printed option",
                ],
                correctAnswer: null,
                status: "Needs Review",
                qualityFlags: [],
                sourceSha256: book.sha256!,
                offset: start.index!,
                end,
              };
              questions.push(question);
            }
            Object.assign(question, {
              options: [
                "First printed option",
                "Second printed option",
                "Third printed option",
                "Fourth printed option",
              ],
              correctAnswer: answer,
              keyPage: pageAt(
                from +
                  heading.index! +
                  heading[0].length +
                  (positions.get(questionNumber) || 0),
              ),
              endPage: Math.min(page + 1, pageAt(end - 1)),
              exercise,
              section: "Book-back",
              qualityFlags: [],
              presentation: "Original PDF",
              status: "Published",
            });
          });
        }
      }
      const eligible = questions.filter(
        (q) =>
          q.offset < from &&
          q.chapterId === chapter.id &&
          (q.section === "Book-back" ||
            (book.sourceMedium === "Tamil" && !!exercise)) &&
          (!exercise || q.exercise === exercise),
      );
      if (
        !eligible.length ||
        new Set(eligible.map((q) => q.number)).size !== eligible.length ||
        eligible.some((q) => !answers.has(q.number))
      )
        continue;
      for (const q of eligible) {
        if (book.sourceMedium === "Tamil" && exercise) {
          q.section = "Book-back";
          q.qualityFlags = q.qualityFlags.filter(
            (flag) => flag !== "Confirm whether this is a one-mark exercise",
          );
        }
        const answer = answers.get(q.number)!;
        if (q.correctAnswer && q.correctAnswer !== answer) {
          q.correctAnswer = null;
          q.status = "Needs Review";
          q.qualityFlags.push("Conflicting printed answer keys");
          continue;
        }
        q.correctAnswer = answer;
        q.keyPage = pageAt(
          from +
            heading.index! +
            heading[0].length +
            (positions.get(q.number) || 0),
        );
        if ("ABCD".indexOf(answer) >= q.options.length)
          q.qualityFlags.push(
            "Printed answer does not match the extracted options",
          );
        if (!q.qualityFlags.length) q.status = "Published";
      }
    }
  }
  const extractedCandidates = questions.map(({ offset, end, ...question }) => {
    void offset;
    void end;
    const pdfFlags = new Set([
      "PDF text needs correction",
      "Options are not distinct",
      "Check mathematical formatting against the PDF",
    ]);
    if (
      question.correctAnswer &&
      question.options.length === 4 &&
      question.section === "Book-back" &&
      question.qualityFlags.every((flag) => pdfFlags.has(flag))
    ) {
      question.presentation =
        question.presentation === "Original PDF" ||
        book.sourceMedium === "Tamil" ||
        /mathematics|statistics|physics|chemistry/i.test(book.subject) ||
        question.qualityFlags.length
          ? "Original PDF"
          : "Text";
      question.status = "Published";
    }
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
    } else if (
      !prior ||
      (!prior.qualityFlags.includes("Conflicting printed answer keys") &&
        question.status === "Published")
    )
      unique.set(question.id, question);
  }
  const candidates = [...unique.values()];
  for (const chapter of chapters) {
    chapter.exercisePage = candidates
      .filter((q) => q.chapterId === chapter.id && q.section === "Book-back")
      .sort((a, b) => a.page - b.page)[0]?.page;
    chapter.published = candidates.filter(
      (q) => q.chapterId === chapter.id && q.status === "Published",
    ).length;
    chapter.review = candidates.filter(
      (q) => q.chapterId === chapter.id && q.status !== "Published",
    ).length;
  }
  return { candidates, chapters };
}
