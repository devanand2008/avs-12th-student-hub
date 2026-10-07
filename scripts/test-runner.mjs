import { spawnSync } from "node:child_process";
const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", "tests/platform.test.ts"],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
