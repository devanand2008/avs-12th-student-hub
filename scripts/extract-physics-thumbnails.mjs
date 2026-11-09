import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const root = process.cwd();
const booksDir = path.resolve(root, "book's");
const outputDir = path.resolve(root, "public/images/learning-materials");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const catalogPath = path.resolve(root, "src/lib/additional-materials-catalog.json");
const resourcesPath = path.resolve(root, "src/lib/additional-materials-resources.json");
const inventoryPath = path.resolve(root, "docs/materials-folder-nov9-inventory.json");

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const resources = JSON.parse(fs.readFileSync(resourcesPath, "utf8"));
const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));

// The 39 new Physics videos
const newPhysicsVideos = catalog.slice(197);
console.log(`Processing thumbnails for ${newPhysicsVideos.length} Physics videos...`);

let successCount = 0;

for (let i = 0; i < newPhysicsVideos.length; i++) {
  const item = newPhysicsVideos[i];
  const videoPath = path.resolve(booksDir, item.file);
  const targetName = `${item.sha256}.jpg`;
  const targetPath = path.resolve(outputDir, targetName);
  const relativeUrl = `/images/learning-materials/${targetName}`;

  if (!fs.existsSync(videoPath)) {
    console.error(`[${i + 1}/${newPhysicsVideos.length}] Missing video: ${item.file}`);
    continue;
  }

  try {
    execFileSync(
      ffmpeg,
      [
        "-ss",
        "00:00:05",
        "-i",
        videoPath,
        "-vframes",
        "1",
        "-vf",
        "scale=850:480:force_original_aspect_ratio=decrease,pad=850:480:(ow-iw)/2:(oh-ih)/2",
        "-q:v",
        "2",
        "-y",
        targetPath,
      ],
      { stdio: "pipe" },
    );

    const buf = fs.readFileSync(targetPath);
    if (buf.length === 0 || buf.readUInt16BE(0) !== 0xffd8) {
      throw new Error("Invalid JPEG header or empty file generated.");
    }

    // Set thumbnail URL in catalog entry
    item.thumbnailUrl = relativeUrl;

    // Set in resources
    const resEntry = resources.find(
      (r) => r.resource.id === item.id || r.resource.sourceFile === item.file,
    );
    if (resEntry) {
      resEntry.resource.thumbnailUrl = relativeUrl;
    }

    // Set in inventory
    const invEntry = inventory.additions.find((a) => a.sha256 === item.sha256);
    if (invEntry) {
      invEntry.thumbnailUrl = relativeUrl;
    }

    successCount++;
    console.log(
      `[${i + 1}/${newPhysicsVideos.length}] Generated (${(buf.length / 1024).toFixed(1)} KB): ${item.title}`,
    );
  } catch (err) {
    console.error(`[${i + 1}/${newPhysicsVideos.length}] Error for ${item.file}:`, err.message);
  }
}

// Write back updated JSON files
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");
fs.writeFileSync(resourcesPath, JSON.stringify(resources, null, 2) + "\n", "utf8");
fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2) + "\n", "utf8");

console.log(`\nSuccessfully generated ${successCount}/${newPhysicsVideos.length} thumbnails and updated all catalogues!`);

