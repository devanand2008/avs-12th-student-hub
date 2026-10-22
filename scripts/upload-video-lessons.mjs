// Resumable, content-addressed video assets. No database or question writes.
import { readFile, mkdir, link, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { request as httpsRequest } from "node:https";
import { createReadStream } from "node:fs";
const run = promisify(execFile);
const repository = "devanand2008/avs-12th-student-hub";
const tag = "video-lessons-2026-10-20";
const catalog = JSON.parse(await readFile("src/lib/video-lessons-catalog.json", "utf8"));
const api = async (endpoint) => JSON.parse((await run("gh", ["api", `repos/${repository}/${endpoint}`], { maxBuffer: 4 * 1024 * 1024 })).stdout);
const releases = await api("releases?per_page=100");
let release = releases.find((entry) => entry.tag_name === tag);
await mkdir(".local/video-catalog/uploads", { recursive: true });
// Validate the entire batch before creating a release or uploading files.
for (const video of catalog) {
  const buffer = await readFile(path.join("book's", video.file));
  if (buffer.length !== video.sizeBytes || createHash("sha256").update(buffer).digest("hex") !== video.sha256)
    throw new Error(`Source changed: ${video.file}`);
}
if (!release) {
  await writeFile(".local/video-catalog/release-notes.md", "User-supplied Class 12 English and Tamil NotebookLM video lessons. Original MP4 files are preserved. Asset filenames are SHA-256 digests. These are study guides, not teacher approval of MCQ candidates.\n");
  await run("gh", ["release", "create", tag, "--repo", repository, "--draft", "--target", (await run("git", ["rev-parse", "HEAD"])).stdout.trim(), "--title", "Class 12 English and Tamil video lessons", "--notes-file", ".local/video-catalog/release-notes.md"]);
  release = (await api("releases?per_page=100")).find((entry) => entry.tag_name === tag);
}
let assets = await api(`releases/${release.id}/assets?per_page=100`);
const token = (await run("gh", ["auth", "token"])).stdout.trim();
async function upload(local, name, size) {
  await new Promise((resolve, reject) => {
    const req = httpsRequest(`https://uploads.github.com/repos/${repository}/releases/${release.id}/assets?name=${name}`, {
      method: "POST", family: 4,
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "SkillUp-video-import", "Content-Type": "video/mp4", "Content-Length": size, Accept: "application/vnd.github+json" },
    }, (response) => {
      response.resume();
      response.on("end", () => response.statusCode === 201 ? resolve() : reject(new Error(`Asset upload returned HTTP ${response.statusCode}: ${name}`)));
      response.on("error", () => reject(new Error(`Upload response interrupted: ${name}`)));
    });
    req.setTimeout(240000, () => req.destroy(new Error(`Upload timed out: ${name}`)));
    req.on("error", (error) => reject(new Error(`Upload interrupted (${error.code || "connection"}): ${name}. Rerun to resume.`)));
    const stream = createReadStream(local);
    stream.on("error", () => { req.destroy(); reject(new Error(`Source read failed: ${name}`)); });
    stream.pipe(req);
  });
}
let cursor = 0;
const outcomes = await Promise.allSettled(Array.from({ length: 4 }, async () => {
  while (cursor < catalog.length) {
    const video = catalog[cursor++];
    const name = `${video.sha256}.mp4`;
    let current = assets.find((entry) => entry.name === name);
    if (current?.state === "starter" && !current.digest && release.draft) {
      await run("gh", ["api", "--method", "DELETE", `repos/${repository}/releases/assets/${current.id}`]);
      current = undefined;
    }
    if (current) {
      if (current.state !== "uploaded" || current.size !== video.sizeBytes || current.digest !== `sha256:${video.sha256}`)
        throw new Error(`Existing remote asset differs: ${name}`);
      console.log(`Preserved: ${video.title}`);
      continue;
    }
    const local = path.resolve(".local/video-catalog/uploads", name);
    try { await stat(local); } catch { await link(path.resolve("book's", video.file), local); }
    for (let attempt = 1; ; attempt++) {
      try { await upload(local, name, video.sizeBytes); break; }
      catch (error) {
        const remote = (await api(`releases/${release.id}/assets?per_page=100`)).find((entry) => entry.name === name);
        if (remote?.state === "uploaded" && remote.digest === `sha256:${video.sha256}` && remote.size === video.sizeBytes) break;
        if (attempt >= 3) throw error;
        if (remote?.state === "starter" && !remote.digest && release.draft)
          await run("gh", ["api", "--method", "DELETE", `repos/${repository}/releases/assets/${remote.id}`]);
        else if (remote) throw new Error(`Unexpected remote asset after interruption: ${name}`);
        console.log(`Retry ${attempt}: ${video.title}`);
      }
    }
    console.log(`Uploaded: ${video.title}`);
  }
}));
for (const outcome of outcomes) if (outcome.status === "rejected") throw outcome.reason;
assets = await api(`releases/${release.id}/assets?per_page=100`);
for (const video of catalog) {
  const asset = assets.find((entry) => entry.name === `${video.sha256}.mp4`);
  if (!asset || asset.state !== "uploaded" || asset.size !== video.sizeBytes || asset.digest !== `sha256:${video.sha256}`)
    throw new Error(`Remote integrity check failed: ${video.file}`);
}
if (release.draft) await run("gh", ["release", "edit", tag, "--repo", repository, "--draft=false", "--latest=false"]);
await writeFile(".local/video-catalog/upload-report.json", JSON.stringify({ checkedAt: new Date().toISOString(), releaseId: release.id, count: catalog.length, assets: assets.map(({ name, size, digest, browser_download_url }) => ({ name, size, digest, url: browser_download_url })) }, null, 2));
console.log(`Verified ${catalog.length} remote SHA-256 digests. Release assets are available.`);
