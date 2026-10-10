import { readFileSync } from "node:fs";

interface RawEval {
  chapter: number;
  title: string;
  text: string;
}

const evals: RawEval[] = JSON.parse(readFileSync(".local/cs-eval-extracted.json", "utf8"));

for (const e of evals) {
  console.log(`\n================ CHAPTER ${e.chapter}: ${e.title} ================`);
  // clean footer lines
  const cleaned = e.text
    .split("\n")
    .filter(line => !line.includes("XII Std") && !line.includes(".indd") && !line.includes("Hands on"))
    .join("\n");
  console.log(cleaned.slice(0, 800));
}
