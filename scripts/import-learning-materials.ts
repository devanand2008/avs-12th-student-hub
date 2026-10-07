import { loadEnvConfig } from "@next/env";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { initDatabase } from "../src/lib/db";
import { backendMode, requireSupabase } from "../src/lib/supabase/server";
import {
  LEARNING_UPLOAD_LIMIT,
  SOURCE_MATERIALS,
} from "../src/lib/learning-materials";
import type { HandwrittenNote, VideoLesson } from "../src/types";
import { materialId, mp4Duration } from "./lib/material-inspection";

loadEnvConfig(process.cwd());
const root = path.resolve("book's");
const dryRun = process.argv.includes("--dry-run");
const verify = process.argv.includes("--verify");
const bucketName = "learning-materials";

async function walk(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(
        "Source materials must be regular files, without symbolic links.",
      );
    if (entry.isDirectory()) files.push(...(await walk(file)));
    else if (/\.(pdf|mp4)$/i.test(file))
      files.push(path.relative(root, file).replaceAll("\\", "/"));
  }
  return files.sort();
}

async function main() {
  const files = await walk(root);
  const known = new Set(SOURCE_MATERIALS.map((item) => item.file));
  const unknown = files.filter((file) => !known.has(file));
  const missing = [...known].filter((file) => !files.includes(file));
  if (unknown.length || missing.length)
    throw new Error(
      `Review the source catalogue before importing. Uncatalogued: ${unknown.join(", ") || "none"}. Missing: ${missing.join(", ") || "none"}.`,
    );

  // Validate every source before changing the database or uploading anything.
  const inspected = [];
  for (const source of SOURCE_MATERIALS) {
    const buffer = await readFile(path.join(root, source.file));
    if (!buffer.length || buffer.length > LEARNING_UPLOAD_LIMIT)
      throw new Error(`Invalid file size: ${source.file}. Limit is 50 MiB.`);
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    let pageCount = 0;
    let durationSeconds = 0;
    if (source.kind === "note") {
      if (buffer.toString("ascii", 0, 5) !== "%PDF-")
        throw new Error(`Not a PDF: ${source.file}`);
      const task = getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
      });
      try {
        pageCount = (await task.promise).numPages;
      } finally {
        await task.destroy();
      }
    } else durationSeconds = mp4Duration(buffer);
    inspected.push({
      source,
      sha256,
      sizeBytes: buffer.length,
      pageCount,
      durationSeconds,
      id: materialId(source.kind, source.file),
    });
    console.log(
      `Validated: ${source.title} (${source.kind === "note" ? `${pageCount} pages` : `${durationSeconds}s`}, ${(buffer.length / 1048576).toFixed(1)} MiB)`,
    );
  }
  if (dryRun) {
    console.log(
      `Ready to import ${inspected.length} materials; no files uploaded or database rows changed.`,
    );
    return;
  }
  if (backendMode() !== "supabase")
    throw new Error(
      "Configure a live Supabase project before importing. Demo storage is not supported.",
    );
  const client = requireSupabase();
  if (!verify) await initDatabase();
  const existing = await client
    .from("learning_resources")
    .select("id,kind,resource")
    .in(
      "id",
      inspected.map((item) => item.id),
    );
  if (existing.error)
    throw new Error(
      "Could not read learning_resources. Apply the existing database migrations first.",
    );
  const rows = new Map((existing.data || []).map((row) => [row.id, row]));
  const bucket = await client.storage.getBucket(bucketName);
  if (bucket.error || !bucket.data)
    throw new Error(
      "The learning-materials bucket is missing. Apply the learning-resources migration first.",
    );
  if (
    !verify &&
    ((bucket.data.file_size_limit != null &&
      bucket.data.file_size_limit < LEARNING_UPLOAD_LIMIT) ||
      !bucket.data.allowed_mime_types?.includes("video/mp4"))
  ) {
    const updated = await client.storage.updateBucket(bucketName, {
      public: bucket.data.public,
      fileSizeLimit: Math.max(
        bucket.data.file_size_limit || LEARNING_UPLOAD_LIMIT,
        LEARNING_UPLOAD_LIMIT,
      ),
      allowedMimeTypes: [
        ...new Set([
          ...(bucket.data.allowed_mime_types || []),
          "application/pdf",
          "image/jpeg",
          "image/png",
          "video/mp4",
        ]),
      ],
    });
    if (updated.error)
      throw new Error(
        "Could not enable 50 MiB material uploads in Supabase Storage.",
      );
    console.log(
      "Supabase Storage configured for notes and MP4 videos up to 50 MiB.",
    );
  }
  if (!bucket.data.public)
    throw new Error(
      "This app requires public learning-materials URLs. Review the bucket configuration.",
    );

  const report = [];
  for (const item of inspected) {
    const { source, id, sha256, sizeBytes } = item;
    const stored = rows.get(id);
    if (stored && stored.resource.sha256 !== sha256)
      throw new Error(
        `Source changed: ${source.file}. Review the existing resource before replacing it.`,
      );
    let resource = stored?.resource as
      HandwrittenNote | VideoLesson | undefined;
    if (!resource && verify) throw new Error(`Not imported: ${source.file}`);
    if (!resource) {
      const directory =
        source.kind === "note" ? "notes/imported" : "videos/imported";
      const fileName = sha256 + (source.kind === "note" ? ".pdf" : ".mp4");
      const storagePath = `${directory}/${fileName}`;
      const listed = await client.storage
        .from(bucketName)
        .list(directory, { search: fileName });
      if (listed.error)
        throw new Error(`Could not inspect uploaded files: ${source.file}`);
      if (!listed.data?.some((file) => file.name === fileName)) {
        const buffer = await readFile(path.join(root, source.file));
        if (createHash("sha256").update(buffer).digest("hex") !== sha256)
          throw new Error(`Source changed during import: ${source.file}`);
        console.log(`Uploading: ${source.file}`);
        const uploaded = await client.storage
          .from(bucketName)
          .upload(storagePath, buffer, {
            contentType:
              source.kind === "note" ? "application/pdf" : "video/mp4",
            upsert: false,
          });
        if (uploaded.error)
          throw new Error(
            `Upload failed: ${source.file} (${uploaded.error.message}). Rerun to resume.`,
          );
      }
      const url = client.storage.from(bucketName).getPublicUrl(storagePath)
        .data.publicUrl;
      const common = {
        id,
        chapterId: source.chapterId,
        subjectId: source.subjectId,
        subjectName: source.subjectName,
        title: source.title,
        titleTamil: source.titleTamil || "",
        topic: source.topic,
        language: source.language,
        academicYear: "2026-2027",
        sourceFile: source.file,
        sha256,
        sizeBytes,
        description:
          source.kind === "note"
            ? `Class 12 ${source.subjectName}: ${source.topic}. ${item.pageCount} PDF pages of notes and worked questions.`
            : `Tamil video lesson on ${source.titleTamil}.`,
        isPublished: true,
      };
      resource =
        source.kind === "note"
          ? {
              ...common,
              badge: "HANDWRITTEN",
              pageCount: item.pageCount,
              downloadAllowed: true,
              viewsCount: 0,
              pages: [],
              pdfUrl: url,
              updatedAt: new Date().toISOString(),
            }
          : {
              ...common,
              videoUrl: url,
              embedType: "mp4",
              durationSeconds: item.durationSeconds,
              thumbnailUrl: "",
              teacherName: "AVS Learning Materials",
              sourceLabel: "Tamil Video Lesson",
              createdAt: new Date().toISOString(),
            };
      const saved = await client
        .from("learning_resources")
        .upsert(
          { id, kind: source.kind, resource },
          { onConflict: "id", ignoreDuplicates: true },
        );
      if (saved.error)
        throw new Error(
          `Could not save metadata: ${source.file}. Rerun to resume.`,
        );
      console.log(`Published: ${source.title}`);
    } else console.log(`Preserved existing resource: ${source.title}`);

    const url =
      "pdfUrl" in resource
        ? resource.pdfUrl
        : (resource as VideoLesson).videoUrl;
    if (!url) throw new Error(`Missing file URL: ${source.file}`);
    const response = await fetch(url, {
      headers: { Range: "bytes=0-31" },
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok)
      throw new Error(
        `File is not accessible: ${source.file} (HTTP ${response.status})`,
      );
    const header = Buffer.from(await response.arrayBuffer());
    if (
      (source.kind === "note" && header.toString("ascii", 0, 5) !== "%PDF-") ||
      (source.kind === "video" && header.toString("ascii", 4, 8) !== "ftyp")
    )
      throw new Error(`Unexpected uploaded file: ${source.file}`);
    report.push({
      id,
      kind: source.kind,
      title: resource.title,
      sourceFile: source.file,
      sha256,
      sizeBytes,
      pageCount: item.pageCount || undefined,
      durationSeconds: item.durationSeconds || undefined,
      isPublished: resource.isPublished,
      url,
    });
  }
  const published = report.filter((item) => item.isPublished).length;
  console.log(
    `Verified ${report.length} stored materials (${published} published). Existing drafts/archives and edits were preserved.`,
  );
  if (!verify) {
    await mkdir(path.resolve(".local"), { recursive: true });
    await writeFile(
      path.resolve(".local/material-import-report.json"),
      JSON.stringify(
        { verifiedAt: new Date().toISOString(), materials: report },
        null,
        2,
      ) + "\n",
    );
    console.log("Import report: .local/material-import-report.json");
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Material import failed.",
  );
  process.exitCode = 1;
});
