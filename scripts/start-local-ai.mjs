import { launchLocalAI, localAIConfig, stopChild } from "./local-ai-config.mjs";

try {
  const child = launchLocalAI(localAIConfig());
  child.on("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => stopChild(child));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
