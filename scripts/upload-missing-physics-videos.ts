import path from "node:path";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { request as httpsRequest } from "node:https";
import additionalRows from "../src/lib/additional-materials-resources.json";

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const repository = "devanand2008/avs-12th-student-hub";
const releaseId = 423417351; // learning-materials-2026-10-25

const targetChapters = new Set([
  'tb-12-physics-english-v1-1b1de8f8-ch-5',
  'tb-12-physics-tamil-v1-c1623725-ch-5',
  'tb-12-physics-english-v2-0ce6704c-ch-6',
  'tb-12-physics-tamil-v2-fb1fa4de-ch-6',
  'tb-12-physics-english-v2-0ce6704c-ch-7',
  'tb-12-physics-tamil-v2-fb1fa4de-ch-7',
  'tb-12-physics-english-v2-0ce6704c-ch-8',
  'tb-12-physics-tamil-v2-fb1fa4de-ch-8'
]);

async function fetchExistingAssets(): Promise<Set<string>> {
  let page = 1;
  const assetNames = new Set<string>();
  while (true) {
    const res = await fetch(`https://api.github.com/repos/${repository}/releases/${releaseId}/assets?per_page=100&page=${page}`, {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "SkillUp-Uploader" }
    });
    if (!res.ok) throw new Error(`Failed to list assets: ${res.statusText}`);
    const items = await res.json();
    if (!items.length) break;
    for (const item of items) {
      if (item.state === "uploaded") {
        assetNames.add(item.name);
      }
    }
    page++;
  }
  return assetNames;
}

async function uploadAsset(fullPath: string, fileName: string, size: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const req = httpsRequest(
      `https://uploads.github.com/repos/${repository}/releases/${releaseId}/assets?name=${fileName}`,
      {
        method: "POST",
        family: 4,
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "SkillUp-video-import",
          "Content-Type": "video/mp4",
          "Content-Length": size,
          Accept: "application/vnd.github+json"
        }
      },
      (res) => {
        let body = "";
        res.on("data", d => body += d);
        res.on("end", () => {
          if (res.statusCode === 201) {
            resolve();
          } else {
            reject(new Error(`Status ${res.statusCode}: ${body.slice(0, 200)}`));
          }
        });
      }
    );
    req.setTimeout(360000, () => req.destroy(new Error("Timeout during upload")));
    req.on("error", reject);
    createReadStream(fullPath).pipe(req);
  });
}

async function main() {
  console.log("=== UPLOADING MISSING PHYSICS VIDEOS TO GITHUB RELEASE ===");
  const existing = await fetchExistingAssets();
  console.log(`Currently uploaded assets in release: ${existing.size}`);

  const matching = (additionalRows as any[]).filter(r => 
    r.kind === "video" && targetChapters.has(r.resource.chapterId)
  );

  // Group by unique sha256 to avoid duplicates
  const toUpload: { sha256: string; fileName: string; title: string; sourceFile: string; size: number }[] = [];
  const seen = new Set<string>();

  for (const item of matching) {
    const sha = item.resource.sha256;
    if (seen.has(sha)) continue;
    seen.add(sha);

    const fileName = `${sha}.mp4`;
    if (existing.has(fileName)) {
      continue;
    }

    const fullPath = path.resolve("book's", item.resource.sourceFile);
    const s = await stat(fullPath);
    toUpload.push({
      sha256: sha,
      fileName,
      title: item.resource.title,
      sourceFile: item.resource.sourceFile,
      size: s.size
    });
  }

  console.log(`Remaining videos to upload: ${toUpload.length}`);
  if (toUpload.length === 0) {
    console.log("All videos are already uploaded!");
    return;
  }

  // Upload with concurrency 2
  const concurrency = 2;
  let index = 0;
  let completed = 0;
  let failed = 0;

  async function worker(workerId: number) {
    while (index < toUpload.length) {
      const current = toUpload[index++];
      const fullPath = path.resolve("book's", current.sourceFile);
      const sizeMb = (current.size / (1024 * 1024)).toFixed(2);
      console.log(`[Worker ${workerId}] [${completed + 1}/${toUpload.length}] Starting ${current.title} (${sizeMb} MB)`);

      let success = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await uploadAsset(fullPath, current.fileName, current.size);
          completed++;
          console.log(`[Worker ${workerId}] SUCCESS (${completed}/${toUpload.length}): ${current.title}`);
          success = true;
          break;
        } catch (err: any) {
          console.error(`[Worker ${workerId}] Attempt ${attempt} failed for ${current.fileName}: ${err.message}`);
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 5000));
          }
        }
      }

      if (!success) {
        failed++;
        console.error(`[Worker ${workerId}] PERMANENT FAILURE: ${current.fileName}`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  console.log(`\n=== UPLOAD SUMMARY ===`);
  console.log(`Total attempted: ${toUpload.length}`);
  console.log(`Completed successfully: ${completed}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
