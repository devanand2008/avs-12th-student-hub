import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";
const [command = "dev", ...nextArgs] = process.argv.slice(2);
if (!["dev", "start"].includes(command))
  throw new Error("Choose dev or start.");
process.env.NODE_ENV = command === "start" ? "production" : "development";
const { launchLocalAI, localAIConfig, modelReady, stopChild } =
  await import("./local-ai-config.mjs");

let model;
let app;
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  stopChild(app);
  stopChild(model);
  process.exitCode = code;
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => stop());

try {
  const useLocalAI = process.env.AI_PROVIDER !== "excerpts";
  const config = useLocalAI ? localAIConfig() : null;
  let ready = false;
  try {
    ready = !useLocalAI || (await modelReady(config));
  } catch (error) {
    if (!error.cause && !["TimeoutError", "AbortError"].includes(error.name))
      throw error;
  }
  if (!ready) {
    model = launchLocalAI(config);
    let startupError;
    model.on("error", (error) => {
      startupError = error;
    });
    model.on("exit", (code) => {
      if (!stopping && app) stop(code || 1);
    });
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline && !ready && !stopping) {
      if (startupError) throw startupError;
      if (model.exitCode !== null)
        throw new Error(
          "Gemma stopped during startup. Check the model log above.",
        );
      await setTimeout(1000);
      try {
        ready = await modelReady(config);
      } catch (error) {
        if (
          !error.cause &&
          !["TimeoutError", "AbortError"].includes(error.name)
        )
          throw error;
      }
    }
    if (!ready && !stopping)
      throw new Error("Gemma did not become ready within two minutes.");
  }
  if (!stopping) {
    console.log(
      useLocalAI
        ? "Local Gemma is ready. Starting AVS 12 Hub..."
        : "Starting AVS 12 Hub in study-excerpt mode...",
    );
    app = spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", command, ...nextArgs],
      {
        stdio: "inherit",
        windowsHide: true,
        env: { ...process.env, AI_PROVIDER: useLocalAI ? "local" : "excerpts" },
      },
    );
    app.on("error", (error) => {
      console.error(error.message);
      stop(1);
    });
    app.on("exit", (code) => stop(code ?? 1));
  }
} catch (error) {
  console.error(error.message);
  stop(1);
}
