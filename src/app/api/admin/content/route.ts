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

const form = z.object({
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
  url: z.string().refine(safeMediaUrl, "Use a valid HTTPS resource URL."),
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
        !["application/pdf", "image/jpeg", "image/png", "video/mp4"].includes(
          file.type,
        ) ||
        file.size > LEARNING_UPLOAD_LIMIT ||
        !file.size
      )
        return NextResponse.json(
          { error: "Choose a PDF, JPG, PNG, or MP4 up to 50 MB." },
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
    const common = {
      id: `${kind}-${randomUUID()}`,
      title: data.title,
      titleTamil: data.titleTamil,
      chapterId: chapter.id,
      subjectId: chapter.subjectId,
      subjectName: (await getSubjectById(chapter.subjectId))?.name,
      topic: data.topic,
      language: data.language,
      academicYear: data.academicYear,
      description: data.description,
      isPublished: data.isPublished,
    };
    const resource: HandwrittenNote | VideoLesson =
      kind === "note"
        ? {
            ...common,
            badge: data.badge,
            pageCount: data.fileType === "image" ? 1 : data.pageCount,
            downloadAllowed: data.downloadAllowed,
            viewsCount: 0,
            pages:
              data.fileType === "image"
                ? [{ pageNumber: 1, imageUrl: data.url }]
                : [],
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
            thumbnailUrl: "",
            createdAt: new Date().toISOString(),
          };
    await saveResource(kind, resource);
    await logAudit(session.userId, "CREATE_CONTENT", kind, resource.id, {
      chapterId: chapter.id,
    });
    return NextResponse.json({ success: true, resource }, { status: 201 });
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
