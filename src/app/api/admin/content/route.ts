import { getSession } from "@/lib/auth";
import {
  contentStorageMode,
  deleteResource,
  listResources,
  saveResource,
  uploadLearningFile,
  type ResourceKind,
} from "@/lib/content";
import { getChapterById, getSubjectById, logAudit } from "@/lib/db";
import { safeMediaUrl, youtubeEmbedUrl } from "@/lib/media";
import type { HandwrittenNote, VideoLesson } from "@/types";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { LEARNING_UPLOAD_LIMIT } from "@/lib/learning-materials";
import { z } from "zod";
import { storedMediaId } from "@/lib/media-upload-policy";
import { findMediaUpload } from "@/lib/media-uploads";

const pageItem = z.object({
  pageNumber: z.number().int().min(1),
  imageUrl: z
    .string()
    .refine(
      (url) => Boolean(storedMediaId(url)) || safeMediaUrl(url),
      "Use a valid image URL for note pages.",
    ),
  caption: z.string().max(300).optional(),
  captionTamil: z.string().max(300).optional(),
});

const form = z.object({
  id: z.string().optional(),
  kind: z.enum(["note", "video"]),
  title: z.string().trim().min(3).max(180),
  titleTamil: z.string().trim().max(180).default(""),
  chapterId: z.string().min(1),
  description: z.string().max(2000).default(""),
  language: z.enum(["English", "Tamil"]).default("English"),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/)
    .default("2026-2027"),
  topic: z.string().max(180).default(""),
  url: z
    .string()
    .refine(
      (url) => Boolean(storedMediaId(url)) || safeMediaUrl(url),
      "Use a valid HTTPS resource URL or completed upload.",
    ),
  isPublished: z.boolean().default(false),
  embedType: z.enum(["youtube", "mp4", "notebooklm"]).default("youtube"),
  teacherName: z.string().max(120).default("AVS Faculty"),
  durationSeconds: z.number().int().min(0).max(86400).default(0),
  pageCount: z.number().int().min(1).max(2000).default(1),
  fileType: z.enum(["pdf", "image"]).default("pdf"),
  badge: z
    .enum(["HANDWRITTEN", "IMPORTANT", "REVISION", "EXAM FOCUS"])
    .default("HANDWRITTEN"),
  downloadAllowed: z.boolean().default(false),
  pages: z.array(pageItem).optional(),
});
function kindOf(value: string | null): ResourceKind | null {
  return value === "note" || value === "video" ? value : null;
}
export async function GET(request: Request) {
  const session = await getSession();
  if (session?.role !== "admin")
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  const kind = kindOf(new URL(request.url).searchParams.get("kind"));
  if (!kind)
    return NextResponse.json(
      { error: "Choose notes or videos." },
      { status: 400 },
    );
  try {
    return NextResponse.json({
      resources: await listResources(kind, true),
      storageMode: contentStorageMode(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load content.",
      },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "admin")
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  try {
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const body = await request.formData();
      const file = body.get("file");
      if (
        !(file instanceof File) ||
        ![
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/webp",
          "video/mp4",
        ].includes(file.type) ||
        file.size > LEARNING_UPLOAD_LIMIT ||
        !file.size
      )
        return NextResponse.json(
          { error: "Choose a PDF, JPG, PNG, WebP or MP4 up to 50 MB." },
          { status: 400 },
        );
      return NextResponse.json({ url: await uploadLearningFile(file) });
    }
    const body = await request.json();
    const kind = kindOf(body.kind);
    if (!kind)
      return NextResponse.json(
        { error: "Choose notes or videos." },
        { status: 400 },
      );
    if (["publish", "archive", "delete"].includes(body.action)) {
      const resource = (await listResources(kind, true)).find(
        (item) => item.id === body.id,
      );
      if (!resource)
        return NextResponse.json(
          { error: "Resource not found." },
          { status: 404 },
        );
      if (body.action === "delete") await deleteResource(kind, resource.id);
      else
        await saveResource(kind, {
          ...resource,
          isPublished: body.action === "publish",
        });
      await logAudit(
        session.userId,
        body.action.toUpperCase(),
        kind,
        resource.id,
      );
      return NextResponse.json({ success: true });
    }
    const parsed = form.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    const data = parsed.data;
    const uploadId = storedMediaId(data.url);
    const upload = uploadId ? await findMediaUpload(uploadId) : null;
    if (uploadId) {
      if (
        !upload ||
        upload.status !== "complete" ||
        upload.created_by !== session.userId
      )
        return NextResponse.json(
          { error: "Complete your upload before saving this resource." },
          { status: 400 },
        );
      if ((kind === "video") !== (upload.mime === "video/mp4"))
        return NextResponse.json(
          { error: "This file type does not match the selected resource." },
          { status: 400 },
        );
      if (
        kind === "note" &&
        (upload.mime === "application/pdf") !== (data.fileType === "pdf")
      )
        return NextResponse.json(
          { error: "Choose PDF or image to match the uploaded file." },
          { status: 400 },
        );
      if (kind === "video" && data.embedType !== "mp4")
        return NextResponse.json(
          { error: "Uploaded videos use the MP4 player." },
          { status: 400 },
        );
    }
    const chapter = await getChapterById(data.chapterId);
    if (!chapter?.isActive)
      return NextResponse.json(
        { error: "Choose an active curriculum chapter." },
        { status: 400 },
      );
    if (
      kind === "video" &&
      data.embedType === "youtube" &&
      !youtubeEmbedUrl(data.url)
    )
      return NextResponse.json(
        { error: "Enter a valid YouTube video link." },
        { status: 400 },
      );
    if (
      kind === "video" &&
      data.embedType === "notebooklm" &&
      new URL(data.url).hostname !== "notebooklm.google.com"
    )
      return NextResponse.json(
        { error: "Enter a NotebookLM share link." },
        { status: 400 },
      );

    const existingResource = data.id
      ? (await listResources(kind, true)).find((item) => item.id === data.id)
      : null;
    if (data.id && !existingResource)
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 },
      );

    const common = {
      id: existingResource?.id || `${kind}-${randomUUID()}`,
      title: data.title,
      titleTamil: data.titleTamil,
      chapterId: chapter.id,
      subjectId: chapter.subjectId,
      subjectName: (await getSubjectById(chapter.subjectId))?.name,
      topic: data.topic,
      language: data.language,
      academicYear: data.academicYear,
      description: data.description,
      ...(upload
        ? { sourceFile: upload.name, sizeBytes: Number(upload.size_bytes) }
        : {}),
      isPublished: data.isPublished,
    };

    const resolvedPages =
      data.fileType === "image"
        ? data.pages && data.pages.length > 0
          ? [...data.pages]
              .sort((a, b) => a.pageNumber - b.pageNumber)
              .map((p, idx) => ({
                pageNumber: idx + 1,
                imageUrl: p.imageUrl,
                caption: p.caption,
                captionTamil: p.captionTamil,
              }))
          : [{ pageNumber: 1, imageUrl: data.url }]
        : [];

    const resolvedPageCount =
      data.fileType === "image"
        ? (resolvedPages.length || 1)
        : data.pageCount;

    const resource: HandwrittenNote | VideoLesson =
      kind === "note"
        ? {
            ...common,
            badge: data.badge,
            pageCount: resolvedPageCount,
            downloadAllowed: data.downloadAllowed,
            viewsCount:
              existingResource && "viewsCount" in existingResource
                ? (existingResource as HandwrittenNote).viewsCount
                : 0,
            pages: resolvedPages,
            pdfUrl: data.fileType === "pdf" ? data.url : undefined,
            updatedAt: new Date().toISOString(),
          }
        : {
            ...common,
            videoUrl: data.url,
            embedType: data.embedType,
            durationSeconds: data.durationSeconds,
            teacherName: data.teacherName,
            sourceLabel:
              data.embedType === "notebooklm"
                ? "Gemini Notebook / NotebookLM Video Lessons"
                : "AVS Video Lesson",
            thumbnailUrl:
              existingResource && "thumbnailUrl" in existingResource
                ? (existingResource as VideoLesson).thumbnailUrl
                : "",
            createdAt:
              existingResource && "createdAt" in existingResource
                ? (existingResource as VideoLesson).createdAt
                : new Date().toISOString(),
          };

    await saveResource(kind, resource);
    await logAudit(
      session.userId,
      existingResource ? "UPDATE_CONTENT" : "CREATE_CONTENT",
      kind,
      resource.id,
      {
        chapterId: chapter.id,
      },
    );
    return NextResponse.json(
      { success: true, resource },
      { status: existingResource ? 200 : 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not save content.",
      },
      { status: 400 },
    );
  }
}
