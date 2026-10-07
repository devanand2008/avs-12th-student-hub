import { spawn } from "node:child_process";
const child = spawn(
  process.execPath,
  ["--import", "tsx", "scripts/start-test-server.ts"],
  { stdio: "inherit" },
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
