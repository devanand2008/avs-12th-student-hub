import { createReadStream, existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

// Pinned upstream artifacts. Downloads are verified before they are installed.
const artifacts = [
  {
    name: "Gemma 3 1B IT Q4_K_M (806 MB)",
    url: "https://huggingface.co/lmstudio-community/gemma-3-1b-it-GGUF/resolve/a029b19eb98005eb2d2d91d7c09de52194874be5/gemma-3-1b-it-Q4_K_M.gguf",
    path: "local ai model/gemma-3-1b-it-Q4_K_M.gguf",
    sha256: "8d78d9d059a7605c401c105e169e0b08e9f0edc603ceb842f1c4bbb834296d17",
  },
  {
    name: "llama.cpp b11445 Windows CPU runtime (19 MB)",
    url: "https://github.com/ggml-org/llama.cpp/releases/download/b11445/llama-b11445-bin-win-cpu-x64.zip",
    path: ".local/ai/runtime.zip",
    sha256: "6918f1695ec80ab09b88e743fc03df5d1f53b8ba755735f9c542204c4b143776",
  },
];

async function digest(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: "inherit", windowsHide: true });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolveRun()
        : reject(
            new Error(
              `${command} failed (${code}). Rerun npm run ai:setup to resume the download.`,
            ),
          ),
    );
  });
}

async function main() {
  if (process.platform !== "win32" || process.arch !== "x64")
    throw new Error(
      "This installer targets Windows x64. See docs/LOCAL_AI_SETUP.md for other hosts.",
    );
  await mkdir("local ai model", { recursive: true });
  await mkdir(".local/ai/runtime", { recursive: true });
  console.log(
    "Installing Google Gemma from Hugging Face and the llama.cpp CPU runtime.",
  );
  console.log("Model terms: https://ai.google.dev/gemma/terms (Gemma license)");
  for (const artifact of artifacts) {
    const path = resolve(artifact.path);
    if (existsSync(path)) {
      if ((await digest(path)) !== artifact.sha256)
        throw new Error(
          `Checksum mismatch for ${artifact.path}. Move that file aside and rerun setup.`,
        );
      console.log(`${artifact.name} already verified.`);
      continue;
    }
    console.log(`Downloading ${artifact.name}...`);
    const partial = `${path}.part`;
    await run("curl.exe", [
      "--fail",
      "--location",
      "--retry",
      "5",
      "--retry-all-errors",
      "--connect-timeout",
      "30",
      "--max-time",
      "1800",
      "--continue-at",
      "-",
      "--output",
      partial,
      "--silent",
      "--show-error",
      artifact.url,
    ]);
    if ((await digest(partial)) !== artifact.sha256)
      throw new Error(
        `Checksum mismatch for ${partial}. Move the partial file aside before retrying.`,
      );
    await rename(partial, path);
    console.log(`${artifact.name} verified.`);
  }
  const zip = resolve(".local/ai/runtime.zip").replaceAll("'", "''");
  const destination = resolve(".local/ai/runtime").replaceAll("'", "''");
  let installed;
  try {
    installed = JSON.parse(
      await readFile(".local/ai/installation.json", "utf8"),
    );
  } catch {
    /* First installation or missing marker. */
  }
  const runtimeInstalled =
    existsSync(resolve(".local/ai/runtime/llama-server.exe")) &&
    installed?.artifacts?.some(
      (artifact) => artifact.sha256 === artifacts[1].sha256,
    );
  if (!runtimeInstalled)
    await run("powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `$ErrorActionPreference = 'Stop'; Expand-Archive -LiteralPath '${zip}' -DestinationPath '${destination}' -Force`,
    ]);
  else
    console.log(
      "Matching runtime is already installed; keeping the active files.",
    );
  if (!existsSync(resolve(".local/ai/runtime/llama-server.exe")))
    throw new Error("The runtime archive did not contain llama-server.exe.");
  await writeFile(
    ".local/ai/installation.json",
    JSON.stringify(
      { installedAt: new Date().toISOString(), artifacts },
      null,
      2,
    ),
  );
  console.log(
    "Gemma is installed. Run npm run dev:local to start the model and website together.",
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
