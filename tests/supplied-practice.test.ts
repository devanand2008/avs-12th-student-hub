import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readHtmlLiteralData } from "../scripts/lib/static-html-data";
import {
  safeTextTree,
  type SafeTextNode,
} from "../src/lib/supplied-practice/rich-text";
import {
  suppliedQuestions,
  suppliedCollectionSummaries,
  selectSuppliedPreview,
  suppliedPracticeQuestions,
  hasUsableSuppliedAnswer,
} from "../src/lib/supplied-practice/bank";
import {
  recordSuppliedAnswer,
  suppliedScore,
} from "../src/lib/supplied-practice/session";
import { streamVerifiedPdf } from "../src/lib/hosted-textbooks";
import supplied from "../src/lib/supplied-materials-catalog.json";
const digest = (s: string | Buffer) =>
  createHash("sha256").update(s).digest("hex");

test("HTML ingestion reads literal banks without executing supplied scripts", () => {
  assert.deepEqual(
    readHtmlLiteralData(
      '<script>throw new Error("must not run"); const QUESTIONS=[{q:"தமிழ்",ans:0,options:["A","B"]}]; window.location="https://example.test";</script>',
    ),
    { QUESTIONS: [{ q: "தமிழ்", ans: 0, options: ["A", "B"] }] },
  );
  for (const value of [
    "run()",
    "[...getQuestions()]",
    '[{get q(){return "bad"}}]',
    "[{__proto__:1}]",
    "[{q:window.secret}]",
  ])
    assert.throws(() =>
      readHtmlLiteralData(`<script>const QUESTIONS=${value};</script>`),
    );
});

test("every imported occurrence preserves its real source hash and original row ID", () => {
  const files = readdirSync("one mark html page").filter((f) =>
    f.endsWith(".html"),
  );
  const raw = new Map(
    files.map((file) => {
      const html = readFileSync(`one mark html page/${file}`, "utf8"),
        data = readHtmlLiteralData(html);
      return [
        file,
        {
          sha: digest(html),
          rows: (data.QUESTION_BANK ||
            data.ALL_QUESTIONS ||
            data.QUESTIONS) as Record<string, unknown>[],
        },
      ];
    }),
  );
  const ids = new Set<string>(),
    fingerprints = new Set<string>();
  let occurrences = 0;
  for (const q of suppliedQuestions) {
    assert.ok(!ids.has(q.id));
    ids.add(q.id);
    assert.ok(!fingerprints.has(q.fingerprint));
    fingerprints.add(q.fingerprint);
    assert.equal(q.reviewStatus, "pending");
    assert.ok(q.warnings.length);
    assert.equal(
      q.fingerprint,
      digest(
        JSON.stringify([
          q.subject,
          q.section,
          q.questionEn,
          q.questionTa,
          q.optionsEn,
          q.optionsTa,
        ]),
      ),
    );
    assert.equal(q.id, "supplied-" + q.fingerprint.slice(0, 24));
    const options = q.optionsEn.length ? q.optionsEn : q.optionsTa;
    assert.ok(
      Number.isInteger(q.proposedAnswer) &&
        q.proposedAnswer! >= 0 &&
        q.proposedAnswer! < options.length,
    );
    for (const s of q.sources) {
      const source = raw.get(s.file);
      assert.ok(source);
      assert.equal(s.sha256, source.sha);
      assert.equal(
        s.originalId,
        String(source.rows[s.row - 1].id ?? s.row - 1),
      );
      occurrences++;
    }
    if (q.originalDiagram)
      assert.ok(
        q.warnings.includes("Supplied diagram requires visual verification"),
      );
  }
  assert.equal(
    occurrences,
    [...raw.values()].reduce((n, f) => n + f.rows.length, 0),
  );
  assert.equal(occurrences - suppliedQuestions.length, 180);
  assert.equal(
    suppliedCollectionSummaries().reduce((n, c) => n + c.count, 0),
    suppliedQuestions.length,
  );
  assert.ok(
    suppliedCollectionSummaries().every(
      (c) => c.ready === 0 && c.held === c.count,
    ),
  );
});

test("reimport is byte-stable and never creates a teacher decision", () => {
  const before = readFileSync("src/lib/supplied-practice/data.json");
  execFileSync(
    process.execPath,
    ["--import", "tsx", "scripts/import-supplied-practice.ts"],
    { stdio: "pipe", timeout: 60000 },
  );
  assert.equal(
    digest(readFileSync("src/lib/supplied-practice/data.json")),
    digest(before),
  );
});

test("admin preview selection is bounded, paginated and uses actual source sections", () => {
  const all = selectSuppliedPreview(
    new URLSearchParams("collection=mathematics-v2&page=99999"),
  );
  assert.equal(all.total, 180);
  assert.equal(all.page, 8);
  assert.equal(all.questions.length, 5);
  assert.ok(all.questions.every((q) => q.collectionId === "mathematics-v2"));
  const section = selectSuppliedPreview(
    new URLSearchParams("collection=chemistry-v1&section=1&page=NaN"),
  );
  assert.equal(section.page, 1);
  assert.ok(section.questions.every((q) => q.section === "1"));
  assert.equal(
    selectSuppliedPreview(new URLSearchParams("collection=unknown")).total,
    0,
  );
});

test("owner-enabled supplied practice stays unverified and validates all answer references", () => {
  const collections = suppliedCollectionSummaries();
  assert.equal(
    collections.reduce((n, c) => n + c.available, 0),
    2244,
  );
  for (const collection of collections) {
    const questions = suppliedPracticeQuestions(collection.id);
    assert.equal(questions.length, collection.available);
    assert.ok(
      questions.every(
        (q) => q.reviewStatus === "pending" && hasUsableSuppliedAnswer(q),
      ),
    );
  }
  const question = suppliedQuestions[0];
  assert.equal(
    hasUsableSuppliedAnswer({ ...question, proposedAnswer: 99 }),
    false,
  );
  assert.equal(
    hasUsableSuppliedAnswer({ ...question, optionsEn: ["", ""] }),
    false,
  );
  assert.equal(
    hasUsableSuppliedAnswer({ ...question, optionsTa: ["one"] }),
    false,
  );
});

test("supplied practice locks submitted choices, rejects invalid choices and counts skipped questions", () => {
  const questions = suppliedQuestions.slice(0, 3),
    first = questions[0];
  let answers = recordSuppliedAnswer(
    questions,
    {},
    first.id,
    first.proposedAnswer!,
  );
  assert.deepEqual(
    recordSuppliedAnswer(
      questions,
      answers,
      first.id,
      (first.proposedAnswer! + 1) % 4,
    ),
    answers,
  );
  assert.deepEqual(
    recordSuppliedAnswer(questions, answers, questions[1].id, 99),
    answers,
  );
  answers = recordSuppliedAnswer(
    questions,
    answers,
    questions[1].id,
    (questions[1].proposedAnswer! + 1) % 4,
  );
  assert.deepEqual(suppliedScore(questions, answers), {
    correct: 1,
    wrong: 1,
    unanswered: 1,
    total: 3,
    percentage: 33,
  });
  assert.deepEqual(suppliedScore([], {}), {
    correct: 0,
    wrong: 0,
    unanswered: 0,
    total: 0,
    percentage: 0,
  });
});

test("rich text preserves text, tables and SVG geometry while removing executable attributes and URLs", () => {
  const tree = safeTextTree(
    '<table><tr><td>A &amp; B</td></tr></table><svg viewBox="0 0 100 100" onload="alert(1)"><line x1="0" y1="0" x2="100" y2="100"/><image href="https://evil.test/x"/></svg><span style="background:url(https://evil.test)">தமிழ்</span>',
  );
  const nodes: Exclude<SafeTextNode, string>[] = [];
  function walk(a: SafeTextNode[]) {
    for (const n of a)
      if (typeof n !== "string") {
        nodes.push(n);
        walk(n.children);
      }
  }
  walk(tree);
  assert.ok(nodes.some((n) => n.tag === "table"));
  assert.ok(nodes.some((n) => n.tag === "tbody"));
  assert.ok(nodes.some((n) => n.tag === "line" && n.attrs.x2 === "100"));
  assert.ok(
    nodes.some((n) => n.tag === "svg" && n.attrs.viewBox === "0 0 100 100"),
  );
  for (const n of nodes) {
    assert.ok(!("onload" in n.attrs));
    assert.ok(!("style" in n.attrs));
    assert.ok(!("href" in n.attrs));
    assert.notEqual(n.tag, "image");
  }
  assert.match(JSON.stringify(tree), /தமிழ்/);
});

test("supplied PDF delivery validates byte ranges and serves inline without arbitrary upstreams", async () => {
  const source = supplied.find((s) => s.kind === "note")!;
  let calls = 0;
  const fetcher: typeof fetch = async (_url, init) => {
    calls++;
    assert.equal(new Headers(init?.headers).get("range"), "bytes=0-31");
    return new Response(Buffer.alloc(32), {
      status: 206,
      headers: {
        "content-length": "32",
        "content-range": `bytes 0-31/${source.sizeBytes}`,
      },
    });
  };
  const response = await streamVerifiedPdf(
    new Request("https://app.test/pdf", { headers: { Range: "bytes=0-31" } }),
    source.hostedUrl,
    source.sizeBytes,
    "supplied-note",
    fetcher,
  );
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-type"), "application/pdf");
  assert.match(response.headers.get("content-disposition")!, /^inline/);
  await response.arrayBuffer();
  assert.equal(calls, 1);
  const invalid = await streamVerifiedPdf(
    new Request("https://app.test/pdf"),
    "https://evil.test/private.pdf",
    10,
    "note",
    fetcher,
  );
  assert.equal(invalid.status, 404);
  assert.equal(calls, 1);
  const range = await streamVerifiedPdf(
    new Request("https://app.test/pdf", {
      headers: { Range: "bytes=9999999999-" },
    }),
    source.hostedUrl,
    source.sizeBytes,
    "note",
    fetcher,
  );
  assert.equal(range.status, 416);
  assert.equal(calls, 1);
});

test("diagram arrowheads, dashed lines and local pattern references retain their source geometry", () => {
  const tree = safeTextTree(
    '<svg><defs><marker id="arrow" markerWidth="5" markerHeight="5" refX="4" refY="2" orient="auto"><path d="M0 0L5 2L0 5"/></marker></defs><line x1="0" x2="20" marker-end="url(#arrow)" stroke-dasharray="2 3"/><rect fill="url(https://evil.test/x)"/></svg>',
  );
  const raw = JSON.stringify(tree);
  assert.match(raw, /"markerEnd":"url\(#arrow\)"/);
  assert.match(raw, /"strokeDasharray":"2 3"/);
  assert.match(raw, /"id":"arrow"/);
  assert.ok(!raw.includes("https://evil.test"));
});
