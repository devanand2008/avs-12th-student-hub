"use client";
import Sidebar from "@/components/layout/Sidebar";
import type { Chapter, HandwrittenNote, Subject, VideoLesson } from "@/types";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Check,
  Edit3,
  Eye,
  FileText,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  uploadLearningMedia,
  inspectVideoFile,
  inspectPdfFile,
} from "@/lib/upload-learning-file";
import { storedMediaId } from "@/lib/media-upload-policy";

interface UploadedPage {
  pageNumber: number;
  imageUrl: string;
  caption?: string;
  fileName?: string;
}

function naturalSortFiles(files: File[]): File[] {
  return [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

export default function ContentManager({ kind }: { kind: "note" | "video" }) {
  const [resources, setResources] = useState<(HandwrittenNote | VideoLesson)[]>(
    [],
  );
  const [subjects, setSubjects] = useState<
    (Subject & { chapters: Chapter[] })[]
  >([]);
  const [mode, setMode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);
  const [resourceUrl, setResourceUrl] = useState("");
  const [fileType, setFileType] = useState("pdf");
  const [pages, setPages] = useState<UploadedPage[]>([]);
  const [editingResource, setEditingResource] = useState<
    HandwrittenNote | VideoLesson | null
  >(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [language, setLanguage] = useState("all");
  const [embedType, setEmbedType] = useState("youtube");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const formRef = useRef<HTMLElement>(null);
  const uploadController = useRef<AbortController | null>(null);
  useEffect(() => () => uploadController.current?.abort(), []);
  const notes = kind === "note";
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/content?kind=${kind}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResources(data.resources);
      setMode(data.storageMode);
    } catch (error) {
      setMessage({
        text:
          error instanceof Error ? error.message : "Could not load content.",
        error: true,
      });
    } finally {
      setLoading(false);
    }
  }, [kind]);
  useEffect(() => {
    void refresh();
    fetch("/api/subjects")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok)
          throw new Error(data.error || "Could not load curriculum chapters.");
        return data;
      })
      .then((data) => setSubjects(data.subjects || []))
      .catch((error) =>
        setSubjectsError(
          error instanceof Error
            ? error.message
            : "Could not load curriculum chapters.",
        ),
      );
  }, [refresh]);
  useEffect(() => {
    if (open)
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="title"]')
        ?.focus();
  }, [open]);
  function openForm() {
    setEditingResource(null);
    setPages([]);
    setResourceUrl("");
    setFileType("pdf");
    setEmbedType("youtube");
    setOpen(true);
    setMessage(null);
  }
  function openEdit(resource: HandwrittenNote | VideoLesson) {
    setEditingResource(resource);
    setResourceUrl(
      "videoUrl" in resource
        ? resource.videoUrl
        : resource.pdfUrl || resource.pages?.[0]?.imageUrl || "",
    );
    if (notes) {
      const isImage =
        "pages" in resource &&
        Array.isArray(resource.pages) &&
        resource.pages.length > 0;
      setFileType(isImage ? "image" : "pdf");
      if (isImage && resource.pages) {
        setPages(
          resource.pages.map((p) => ({
            pageNumber: p.pageNumber,
            imageUrl: p.imageUrl,
            caption: p.caption,
            fileName: `Page ${p.pageNumber}`,
          })),
        );
      } else {
        setPages([]);
      }
    } else if ("embedType" in resource) {
      setEmbedType(resource.embedType);
    }
    setOpen(true);
    setMessage(null);
  }
  function movePage(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= pages.length) return;
    const reordered = [...pages];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    const reindexed = reordered.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    setPages(reindexed);
    if (reindexed.length > 0) {
      setResourceUrl(reindexed[0].imageUrl);
    }
  }
  function removePage(index: number) {
    const remaining = pages
      .filter((_, idx) => idx !== index)
      .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    setPages(remaining);
    if (remaining.length > 0) {
      setResourceUrl(remaining[0].imageUrl);
    } else {
      setResourceUrl("");
    }
    const pagesField = formRef.current?.querySelector<HTMLInputElement>(
      'input[name="pageCount"]',
    );
    if (pagesField) pagesField.value = String(Math.max(1, remaining.length));
  }
  async function replacePage(index: number, file: File) {
    if (uploadController.current) return;
    const controller = new AbortController();
    uploadController.current = controller;
    setBusy(true);
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        throw new Error("Choose a JPG, PNG, or WebP image to replace this page.");
      }
      setMessage({ text: `Uploading replacement for page ${index + 1}...` });
      const data = await uploadLearningMedia(
        file,
        setUploadProgress,
        controller.signal,
      );
      setPages((prev) =>
        prev.map((p, idx) =>
          idx === index
            ? { ...p, imageUrl: data.url, fileName: file.name }
            : p,
        ),
      );
      if (index === 0) setResourceUrl(data.url);
      setMessage({ text: `Page ${index + 1} image replaced successfully.` });
    } catch (error) {
      setMessage({
        text:
          error instanceof Error ? error.message : "Page replacement failed.",
        error: true,
      });
    } finally {
      uploadController.current = null;
      setBusy(false);
      setUploadProgress(null);
    }
  }
  async function uploadBatchImages(files: File[]) {
    if (!files.length || uploadController.current) return;
    const controller = new AbortController();
    uploadController.current = controller;
    setBusy(true);
    try {
      const sorted = naturalSortFiles(files);
      const updated = [...pages];
      for (let i = 0; i < sorted.length; i++) {
        const file = sorted[i];
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          throw new Error(
            `File "${file.name}" must be a JPG, PNG, or WebP image.`,
          );
        }
        setMessage({
          text: `Uploading page ${i + 1} of ${sorted.length} (${file.name})...`,
        });
        const data = await uploadLearningMedia(
          file,
          (pct) => setUploadProgress(pct),
          controller.signal,
        );
        updated.push({
          pageNumber: updated.length + 1,
          imageUrl: data.url,
          fileName: file.name,
        });
      }
      const reindexed = updated.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
      setPages(reindexed);
      setFileType("image");
      if (reindexed.length > 0) {
        setResourceUrl(reindexed[0].imageUrl);
      }
      const pagesField = formRef.current?.querySelector<HTMLInputElement>(
        'input[name="pageCount"]',
      );
      if (pagesField) pagesField.value = String(reindexed.length);
      const titleField = formRef.current?.querySelector<HTMLInputElement>(
        'input[name="title"]',
      );
      if (titleField && !titleField.value && sorted[0]) {
        titleField.value = sorted[0].name
          .replace(/\.[^.]+$/, "")
          .replaceAll("_", " ");
      }
      setMessage({
        text: `Uploaded ${sorted.length} page(s) successfully (${reindexed.length} total pages). Verify order and details below.`,
      });
    } catch (error) {
      setMessage({
        text: controller.signal.aborted
          ? "Upload cancelled."
          : error instanceof Error
            ? error.message
            : "Batch upload failed.",
        error: !controller.signal.aborted,
      });
    } finally {
      uploadController.current = null;
      setBusy(false);
      setUploadProgress(null);
    }
  }
  async function action(id: string, action: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, kind, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({
        text:
          action === "publish"
            ? "Published. Students can now see this resource."
            : action === "archive"
              ? "Archived. This resource is hidden from students."
              : "Resource removed.",
      });
      setDeleteId(null);
      await refresh();
    } catch (error) {
      setMessage({
        text:
          error instanceof Error ? error.message : "Could not update content.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file || uploadController.current) return;
    const controller = new AbortController();
    uploadController.current = controller;
    setBusy(true);
    try {
      if ((file.type === "video/mp4") === notes)
        throw new Error(
          notes
            ? "Choose a PDF, JPG, PNG or WebP for notes."
            : "Choose an MP4 video.",
        );
      setResourceUrl("");
      setUploadProgress(0);
      let duration = 0;
      const pageCount =
        file.type === "application/pdf"
          ? await inspectPdfFile(file, controller.signal)
          : 1;
      if (file.type === "video/mp4")
        duration = await inspectVideoFile(file, controller.signal);
      const data = await uploadLearningMedia(
        file,
        setUploadProgress,
        controller.signal,
      );
      if (controller.signal.aborted) throw new Error("Upload cancelled.");
      setResourceUrl(data.url);
      if (notes) {
        const isPdf = file.type === "application/pdf";
        setFileType(isPdf ? "pdf" : "image");
        if (!isPdf) {
          setPages([
            {
              pageNumber: 1,
              imageUrl: data.url,
              fileName: file.name,
            },
          ]);
        } else {
          setPages([]);
        }
      } else setEmbedType("mp4");
      const durationField = formRef.current?.querySelector<HTMLInputElement>(
        'input[name="durationSeconds"]',
      );
      if (durationField && duration) durationField.value = String(duration);
      const pagesField = formRef.current?.querySelector<HTMLInputElement>(
        'input[name="pageCount"]',
      );
      if (pagesField) pagesField.value = String(pageCount);
      const titleField = formRef.current?.querySelector<HTMLInputElement>(
        'input[name="title"]',
      );
      if (titleField && !titleField.value)
        titleField.value = file.name
          .replace(/\.[^.]+$/, "")
          .replaceAll("_", " ");
      setMessage({
        text: "File stored securely. Save as draft or publish below to store its lesson details in the database.",
      });
    } catch (error) {
      setMessage({
        text: controller.signal.aborted
          ? "Upload cancelled. Select the same file again to resume."
          : error instanceof Error
            ? error.message
            : "Upload failed.",
        error: !controller.signal.aborted,
      });
    } finally {
      uploadController.current = null;
      setBusy(false);
      setUploadProgress(null);
    }
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    const publish =
      (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ===
      "publish";
    try {
      const payload: Record<string, unknown> = {
        ...Object.fromEntries(form),
        kind,
        url: resourceUrl,
        fileType,
        embedType,
        durationSeconds: Number(form.get("durationSeconds") || 0),
        pageCount:
          notes && fileType === "image" && pages.length > 0
            ? pages.length
            : Number(form.get("pageCount") || 1),
        isPublished: publish,
        downloadAllowed: form.get("downloadAllowed") === "on",
      };
      if (editingResource) {
        payload.id = editingResource.id;
      }
      if (notes && fileType === "image") {
        payload.pages = pages.map((p, idx) => ({
          pageNumber: idx + 1,
          imageUrl: p.imageUrl,
          caption: p.caption,
        }));
      }
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOpen(false);
      setEditingResource(null);
      setPages([]);
      setResourceUrl("");
      setSearch("");
      setStatus("all");
      setLanguage("all");
      setMessage({
        text: publish
          ? "Resource published successfully."
          : "Draft saved. Publish it when you are ready.",
      });
      await refresh();
    } catch (error) {
      setMessage({
        text:
          error instanceof Error
            ? error.message
            : "Could not save this resource.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }
  const shownResources = resources.filter((resource) => {
    const chapter = subjects
      .flatMap((subject) => subject.chapters)
      .find((item) => item.id === resource.chapterId);
    const matchesSearch = [
      resource.title,
      resource.titleTamil,
      resource.description,
      resource.topic,
      chapter?.title,
    ].some((value) =>
      value?.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
    );
    return (
      matchesSearch &&
      (status === "all" || resource.isPublished === (status === "published")) &&
      (language === "all" || (resource.language || "English") === language)
    );
  });
  return (
    <div className="flex flex-1">
      <Sidebar isAdmin />
      <main className="workspace min-w-0 flex-1">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">CONTENT STUDIO</span>
            <h1 className="page-title">
              {notes ? "Handwritten notes" : "Video lessons"}
            </h1>
            <p className="page-description">
              Add your material whenever it’s ready. You decide when students
              see it.
            </p>
          </div>
          <button onClick={openForm} className="btn-primary" disabled={busy}>
            <Plus size={17} /> Add {notes ? "notes" : "video"}
          </button>
        </div>
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {[
            ["Total resources", resources.length],
            [
              "Published",
              resources.filter((resource) => resource.isPublished).length,
            ],
            [
              "Drafts / archived",
              resources.filter((resource) => !resource.isPublished).length,
            ],
          ].map(([label, count]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-extrabold text-navy">
                {loading && !resources.length ? "—" : count}
              </p>
            </div>
          ))}
        </div>
        {mode === "preview" && (
          <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Preview content is temporary and resets when the server restarts.
            Connect Supabase to keep uploads and published resources.
          </p>
        )}
        {mode === "supabase" && (
          <p className="mb-5 flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <ShieldCheck size={16} /> Resources are saved in Supabase. Uploaded
            files use private Supabase Storage. Large uploads resume in parts.
          </p>
        )}
        {mode === "supabase" && (
          <button
            type="button"
            disabled={busy}
            className="mb-5 min-h-11 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800 disabled:opacity-50"
            onClick={async () => {
              setBusy(true);
              try {
                const r = await fetch("/api/admin/content/sync", {
                    method: "POST",
                  }),
                  d = await r.json();
                if (!r.ok) throw Error(d.error);
                setMessage({
                  text: `Database sync complete: ${d.inserted} missing supplied records saved. Existing edits and archives were preserved.`,
                });
                await refresh();
              } catch (e) {
                setMessage({
                  text: e instanceof Error ? e.message : "Sync failed.",
                  error: true,
                });
              } finally {
                setBusy(false);
              }
            }}
          >
            Save supplied library to database
          </button>
        )}
        {uploadProgress !== null && (
          <div className="mb-4 rounded-xl bg-blue-50 p-4" role="status">
            <p className="text-sm font-bold">Uploading: {uploadProgress}%</p>
            <progress
              aria-label="File upload progress"
              value={uploadProgress}
              max={100}
              className="mt-2 w-full"
            />
            <p className="mt-1 text-xs">
              If interrupted, select the same file to resume. Storage quota
              still applies.
            </p>
            <button
              type="button"
              onClick={() => uploadController.current?.abort()}
              className="mt-3 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-800"
            >
              Cancel upload
            </button>
          </div>
        )}
        {subjectsError && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            {subjectsError} Check your database connection before adding
            content.
          </p>
        )}
        {message && (
          <p
            role={message.error ? "alert" : "status"}
            className={`mb-5 rounded-xl border p-4 text-sm ${message.error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
          >
            {message.text}
            {message.error && (
              <button
                className="ml-3 font-semibold underline"
                disabled={busy || loading}
                onClick={() => void refresh()}
              >
                Reload content
              </button>
            )}
          </p>
        )}
        {loading ? (
          <div className="empty-state" role="status">
            Loading your content…
          </div>
        ) : !resources.length ? (
          <div className="empty-state">
            {notes ? (
              <FileText size={38} className="mx-auto text-blue-400" />
            ) : (
              <Video size={38} className="mx-auto text-blue-400" />
            )}
            <h2>Your content starts here.</h2>
            <p>
              {notes
                ? "Upload a PDF or scanned page, or attach a hosted file. Assign a chapter and save a draft."
                : "Add YouTube, hosted MP4, or NotebookLM share links. Assign a chapter and publish when ready."}
            </p>
            <button className="btn-secondary" onClick={openForm}>
              Add your first resource <Plus size={16} />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="content-form grid items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
              <label className="xl:col-span-2">
                Search resources
                <div className="relative mt-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    className="!pl-9"
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search title, chapter, or topic"
                  />
                </div>
              </label>
              <label>
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">All resources</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft / archived</option>
                </select>
              </label>
              <label>
                Language
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="all">All languages</option>
                  <option>English</option>
                  <option>Tamil</option>
                </select>
              </label>
            </div>
            <div className="flex items-center justify-between gap-3 px-1">
              <p className="text-xs text-slate-500">
                {shownResources.length} matching resources
              </p>
              <button
                className="btn-secondary text-xs"
                disabled={loading || busy}
                onClick={() => void refresh()}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
            {!shownResources.length && (
              <div className="empty-state">
                <h2>No resources match these filters.</h2>
                <p>
                  Try another search or choose a different status or language.
                </p>
              </div>
            )}
            {shownResources.map((resource) => (
              <article
                key={resource.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="min-w-0">
                  <span
                    className={`status-pill ${resource.isPublished ? "text-emerald-700" : "text-amber-700"}`}
                  >
                    {resource.isPublished ? "Published" : "Draft / archived"}
                  </span>
                  <h2 className="mt-2 font-bold text-navy">{resource.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {subjects
                      .flatMap((s) => s.chapters)
                      .find((c) => c.id === resource.chapterId)?.title ||
                      resource.chapterId}{" "}
                    · {resource.language || "English"} · {resource.academicYear}
                  </p>
                  {resource.description && (
                    <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
                      {resource.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    className="btn-secondary text-xs"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={
                      "videoUrl" in resource
                        ? resource.videoUrl
                        : resource.pdfUrl || resource.pages[0]?.imageUrl
                    }
                  >
                    <ExternalLink size={15} /> Preview
                  </a>
                  <button
                    disabled={busy}
                    className="btn-secondary text-xs"
                    onClick={() => openEdit(resource)}
                  >
                    <Edit3 size={15} /> Edit
                  </button>
                  <button
                    disabled={busy}
                    className="btn-secondary text-xs"
                    onClick={() =>
                      void action(
                        resource.id,
                        resource.isPublished ? "archive" : "publish",
                      )
                    }
                  >
                    {resource.isPublished ? (
                      <Archive size={15} />
                    ) : (
                      <Eye size={15} />
                    )}
                    {resource.isPublished ? "Archive" : "Publish"}
                  </button>
                  <button
                    className="model-control text-rose-600"
                    disabled={busy}
                    aria-label={`Delete ${resource.title}`}
                    onClick={() => setDeleteId(resource.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        {open && (
          <section
            ref={formRef}
            className="mt-7 rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy">
                {editingResource ? "Edit" : "Add"}{" "}
                {notes ? "handwritten notes" : "a video lesson"}
              </h2>
              <button
                disabled={busy}
                aria-label="Close content form"
                className="model-control"
                onClick={() => {
                  setOpen(false);
                  setEditingResource(null);
                  setPages([]);
                  setResourceUrl("");
                }}
              >
                <X size={18} />
              </button>
            </div>
            <form
              key={editingResource ? editingResource.id : "new"}
              onSubmit={save}
              className="content-form grid gap-5 sm:grid-cols-2"
            >
              <label className="sm:col-span-2">
                Title
                <input
                  name="title"
                  required
                  minLength={3}
                  maxLength={180}
                  defaultValue={editingResource ? editingResource.title : ""}
                  placeholder="e.g. Python Functions – chapter revision"
                />
              </label>
              <label className="sm:col-span-2">
                Tamil title (optional)
                <input
                  name="titleTamil"
                  maxLength={180}
                  defaultValue={
                    editingResource ? editingResource.titleTamil || "" : ""
                  }
                  placeholder="தமிழ் தலைப்பு"
                />
              </label>
              <label>
                Chapter
                <select
                  name="chapterId"
                  required
                  defaultValue={
                    editingResource ? editingResource.chapterId : ""
                  }
                >
                  <option value="" disabled>
                    Choose subject and chapter
                  </option>
                  {subjects.map((subject) => (
                    <optgroup key={subject.id} label={subject.name}>
                      {subject.chapters
                        .filter((c) => c.isActive)
                        .map((chapter) => (
                          <option key={chapter.id} value={chapter.id}>
                            {chapter.chapterNumber}. {chapter.title}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label>
                Topic (optional)
                <input
                  name="topic"
                  defaultValue={
                    editingResource ? editingResource.topic || "" : ""
                  }
                  placeholder="e.g. Pure and impure functions"
                />
              </label>
              <label>
                Language
                <select
                  name="language"
                  defaultValue={
                    editingResource
                      ? editingResource.language || "English"
                      : "English"
                  }
                >
                  <option>English</option>
                  <option>Tamil</option>
                </select>
              </label>
              <label>
                Academic year
                <input
                  name="academicYear"
                  defaultValue={
                    editingResource
                      ? editingResource.academicYear || "2026-2027"
                      : "2026-2027"
                  }
                  pattern="[0-9]{4}-[0-9]{4}"
                  required
                />
              </label>
              <label className="sm:col-span-2">
                Description
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={
                    editingResource ? editingResource.description || "" : ""
                  }
                  placeholder="What will students learn?"
                />
              </label>
              {notes ? (
                <>
                  <label>
                    Resource format
                    <select
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value)}
                    >
                      <option value="pdf">PDF document</option>
                      <option value="image">
                        Scanned handwritten pages (batch JPG / PNG / WebP)
                      </option>
                    </select>
                  </label>
                  <label>
                    Number of pages
                    <input
                      type="number"
                      name="pageCount"
                      min={1}
                      max={2000}
                      defaultValue={
                        editingResource && "pageCount" in editingResource
                          ? editingResource.pageCount
                          : pages.length || 1
                      }
                      required
                    />
                  </label>
                  {fileType === "image" ? (
                    <>
                      <label className="sm:col-span-2 flex flex-col gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-4">
                        <span className="flex items-center gap-2 font-medium text-slate-800">
                          <Upload size={16} /> Upload handwritten pages (JPG /
                          PNG / WebP, batch 10+ supported)
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          disabled={busy}
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              void uploadBatchImages(Array.from(files));
                            }
                            e.target.value = "";
                          }}
                        />
                        <span className="text-xs text-slate-500">
                          Select one or multiple handwritten page images.
                          Files are automatically sorted with natural numeric
                          order (e.g. Page 1, Page 2... Page 10).
                        </span>
                      </label>
                      {pages.length > 0 && (
                        <div className="sm:col-span-2 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                              Page Sequence ({pages.length} pages arranged)
                            </h3>
                            <span className="text-[11px] text-slate-500">
                              Arrows reorder • replace or delete individual
                              pages
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {pages.map((p, idx) => (
                              <div
                                key={`${p.pageNumber}-${p.imageUrl}`}
                                className="group relative rounded-lg border border-slate-200 bg-white p-2 shadow-sm flex flex-col items-center"
                              >
                                <div className="relative w-full aspect-[3/4] bg-slate-100 rounded overflow-hidden flex items-center justify-center">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={p.imageUrl}
                                    alt={`Page ${p.pageNumber}`}
                                    className="w-full h-full object-contain select-none"
                                  />
                                  <span className="absolute top-1 left-1 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    P. {p.pageNumber}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between w-full">
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      disabled={idx === 0 || busy}
                                      onClick={() => movePage(idx, "up")}
                                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                                      title="Move earlier"
                                    >
                                      <ArrowUp size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={
                                        idx === pages.length - 1 || busy
                                      }
                                      onClick={() => movePage(idx, "down")}
                                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                                      title="Move later"
                                    >
                                      <ArrowDown size={13} />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-0.5">
                                    <label
                                      className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                                      title="Replace this page image"
                                    >
                                      <RefreshCw size={13} />
                                      <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        disabled={busy}
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          if (f) void replacePage(idx, f);
                                          e.target.value = "";
                                        }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => removePage(idx)}
                                      className="p-1 text-slate-500 hover:text-rose-600"
                                      title="Delete this page"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <label className="sm:col-span-2 flex flex-col gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                      <span className="flex items-center gap-2">
                        <Upload size={16} /> Upload PDF Document (up to 512 MB)
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        disabled={busy}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          void upload(file);
                        }}
                      />
                    </label>
                  )}
                  <label>
                    Badge
                    <select
                      name="badge"
                      defaultValue={
                        editingResource && "badge" in editingResource
                          ? editingResource.badge
                          : "HANDWRITTEN"
                      }
                    >
                      <option>HANDWRITTEN</option>
                      <option>IMPORTANT</option>
                      <option>REVISION</option>
                      <option>EXAM FOCUS</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="downloadAllowed"
                      defaultChecked={
                        editingResource && "downloadAllowed" in editingResource
                          ? editingResource.downloadAllowed
                          : false
                      }
                    />{" "}
                    Allow download
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Video source
                    <select
                      name="embedType"
                      value={embedType}
                      onChange={(e) => setEmbedType(e.target.value)}
                    >
                      <option value="youtube">YouTube</option>
                      <option value="mp4">Hosted MP4</option>
                      <option value="notebooklm">NotebookLM share link</option>
                    </select>
                  </label>
                  <label>
                    Duration in seconds
                    <input
                      name="durationSeconds"
                      type="number"
                      min={0}
                      max={86400}
                      defaultValue={
                        editingResource && "durationSeconds" in editingResource
                          ? editingResource.durationSeconds
                          : 0
                      }
                    />
                  </label>
                  <label className="sm:col-span-2">
                    Teacher / author
                    <input
                      name="teacherName"
                      defaultValue={
                        editingResource && "teacherName" in editingResource
                          ? editingResource.teacherName
                          : "AVS Faculty"
                      }
                    />
                  </label>
                  <label className="sm:col-span-2 flex flex-col gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <span className="flex items-center gap-2">
                      <Upload size={16} /> Upload NotebookLM / other MP4 (up to
                      512 MB)
                    </span>
                    <input
                      type="file"
                      accept="video/mp4"
                      disabled={busy}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        void upload(file);
                      }}
                    />
                    <span className="text-xs font-normal leading-5 text-slate-500">
                      Export your NotebookLM video as MP4 and upload it here.
                      Uploads resume after interruptions and use your available
                      Supabase storage quota. YouTube and hosted links are also
                      supported.
                    </span>
                  </label>
                </>
              )}
              <label className="sm:col-span-2">
                {notes ? "File URL (or use upload above)" : "Video / share URL"}
                <input
                  type={storedMediaId(resourceUrl) ? "text" : "url"}
                  readOnly={
                    Boolean(storedMediaId(resourceUrl)) ||
                    (notes && fileType === "image" && pages.length > 0)
                  }
                  required
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  placeholder="https://…"
                />
                <span className="mt-2 block text-xs font-normal text-slate-500">
                  {notes
                    ? fileType === "image" && pages.length > 0
                      ? "Primary first page image URL (managed automatically from arranged pages above)."
                      : "Use a direct HTTPS link to your own file."
                    : "NotebookLM share links open at their source. Hosted MP4 and YouTube use the lesson player."}
                </span>
              </label>
              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <button
                  type="submit"
                  value="draft"
                  className="btn-secondary"
                  disabled={
                    busy ||
                    !subjects.some((subject) =>
                      subject.chapters.some((chapter) => chapter.isActive),
                    )
                  }
                >
                  Save draft
                </button>
                <button
                  type="submit"
                  value="publish"
                  className="btn-primary"
                  disabled={
                    busy ||
                    !subjects.some((subject) =>
                      subject.chapters.some((chapter) => chapter.isActive),
                    )
                  }
                >
                  <Check size={16} />
                  {busy ? "Saving…" : "Publish resource"}
                </button>
              </div>
            </form>
          </section>
        )}
        {deleteId && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-5"
          >
            <div className="max-w-sm rounded-2xl bg-white p-6">
              <h2 id="delete-title" className="text-lg font-bold text-navy">
                Remove this resource?
              </h2>
              <p className="my-4 text-sm leading-6 text-slate-500">
                The listing will be deleted. Its original storage file remains
                available for recovery.
              </p>
              <div className="flex gap-3">
                <button
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => setDeleteId(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary bg-rose-600"
                  disabled={busy}
                  onClick={() => void action(deleteId, "delete")}
                >
                  Delete resource
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
