import nextEnv from "@next/env";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

export function localAIConfig() {
  const url = new URL(
    process.env.LOCAL_AI_BASE_URL || "http://127.0.0.1:8080/v1",
  );
  if (
    url.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname.replace(/\/$/, "") !== "/v1"
  ) {
    throw new Error(
      "LOCAL_AI_BASE_URL must be an HTTP loopback URL ending in /v1.",
    );
  }
  return {
    url: url.href.replace(/\/$/, ""),
    host: url.hostname === "[::1]" ? "::1" : "127.0.0.1",
    port: url.port || "80",
    model: process.env.LOCAL_AI_MODEL || "avs-gemma-3-1b",
    binary: resolve(
      process.env.LOCAL_AI_EXECUTABLE ||
        `.local/ai/runtime/llama-server${process.platform === "win32" ? ".exe" : ""}`,
    ),
    modelPath: resolve(
      process.env.LOCAL_AI_MODEL_PATH ||
        "local ai model/gemma-3-1b-it-Q4_K_M.gguf",
    ),
  };
}

export function launchLocalAI(config, stdio = "inherit") {
  if (!existsSync(config.binary) || !existsSync(config.modelPath)) {
    throw new Error(
      "Local Gemma is not installed. Run npm run ai:setup first.",
    );
  }
  return spawn(
    config.binary,
    [
      "--model",
      config.modelPath,
      "--alias",
      config.model,
      "--host",
      config.host,
      "--port",
      config.port,
      "--ctx-size",
      "8192",
      "--parallel",
      "1",
      "--threads",
      "4",
      "--n-gpu-layers",
      "0",
      "--no-ui",
      "--cors-origins",
      "localhost",
    ],
    { stdio, windowsHide: true },
  );
}

export async function modelReady(config) {
  const response = await fetch(`${config.url}/models`, {
    signal: AbortSignal.timeout(2000),
    redirect: "error",
  });
  if (!response.ok) return false;
  const body = await response.json();
  if (!body.data?.some((model) => model.id === config.model)) {
    throw new Error(
      `Port ${config.port} is serving a different model. Choose a free LOCAL_AI_BASE_URL port.`,
    );
  }
  return true;
}

export function stopChild(child) {
  if (!child?.pid || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
  } else child.kill("SIGTERM");
}
