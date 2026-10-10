import { existsSync } from "node:fs";

console.log(
  "Generated review datasets exist (answers still require verification):",
  existsSync("src/lib/data/questions/index.ts"),
);
