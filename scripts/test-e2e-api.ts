import { spawn } from "node:child_process";
import path from "node:path";

// Run the maintained suite with an isolated PostgreSQL fixture, not real users.
// Build the app first with npm run build. These checks verify software behavior;
// publication of academic answers still requires a source key or teacher review.
const child = spawn(
  process.execPath,
  [
    path.resolve("node_modules/@playwright/test/cli.js"),
    "test",
    "tests/e2e/direct-accounts.spec.ts",
  ],
  {
    stdio: "inherit",
    env: { ...process.env, AVS_TEST_ACTIVATION_MODE: "direct" },
  },
);
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
