import { mkdirSync } from "node:fs";

// Ensure questions directory exists
mkdirSync("src/lib/data/questions", { recursive: true });
console.log("Directory verified: src/lib/data/questions");
