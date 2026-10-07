"use client";
import Sidebar from "@/components/layout/Sidebar";
import type { Chapter, HandwrittenNote, Subject, VideoLesson } from "@/types";
import {
  Archive,
  Check,
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [language, setLanguage] = useState("all");
  const [embedType, setEmbedType] = useState("youtube");
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const formRef = useRef<HTMLElement>(null);
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
    if (open) {
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="title"]')
        ?.focus();
      return;
    }
    setResourceUrl("");
    setFileType("pdf");
    setEmbedType("youtube");
    setOpen(true);
    setMessage(null);
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
    if (!file) return;
    setBusy(true);
    try {
      if (
        !["application/pdf", "image/jpeg", "image/png", "video/mp4"].includes(
          file.type,
        ) ||
        !file.size ||
        file.size > 50 * 1024 * 1024
      )
        throw new Error("Choose a PDF, JPG, PNG, or MP4 up to 50 MB.");
      const res = await fetch("/api/admin/content/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const uploaded = await fetch(data.signedUrl, {
        method: "PUT",
        credentials: "omit",
        headers: {
          "Content-Type": file.type,
          "Cache-Control": "max-age=3600",
          "x-upsert": "false",
        },
        body: file,
      });
      if (!uploaded.ok)
        throw new Error("File upload failed. Please try again.");
      setResourceUrl(data.url);
      if (notes) setFileType(file.type === "application/pdf" ? "pdf" : "image");
      else setEmbedType("mp4");
      setMessage({ text: "File uploaded. Save its chapter details below." });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Upload failed.",
        error: true,
      });
    } finally {
      setBusy(false);
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
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(form),
          kind,
          url: resourceUrl,
          fileType,
          embedType,
          durationSeconds: Number(form.get("durationSeconds") || 0),
          pageCount: Number(form.get("pageCount") || 1),
          isPublished: publish,
          downloadAllowed: form.get("downloadAllowed") === "on",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOpen(false);
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
            files are stored in your learning-materials bucket.
          </p>
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
                Add {notes ? "handwritten notes" : "a video lesson"}
              </h2>
              <button
                disabled={busy}
                aria-label="Close content form"
                className="model-control"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form
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
                  placeholder="e.g. Python Functions – chapter revision"
                />
              </label>
              <label className="sm:col-span-2">
                Tamil title (optional)
                <input
                  name="titleTamil"
                  maxLength={180}
                  placeholder="தமிழ் தலைப்பு"
                />
              </label>
              <label>
                Chapter
                <select name="chapterId" required defaultValue="">
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
                  placeholder="e.g. Pure and impure functions"
                />
              </label>
              <label>
                Language
                <select name="language">
                  <option>English</option>
                  <option>Tamil</option>
                </select>
              </label>
              <label>
                Academic year
                <input
                  name="academicYear"
                  defaultValue="2026-2027"
                  pattern="[0-9]{4}-[0-9]{4}"
                  required
                />
              </label>
              <label className="sm:col-span-2">
                Description
                <textarea
                  name="description"
                  rows={3}
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
                      <option value="image">Scanned JPG / PNG page</option>
                    </select>
                  </label>
                  <label>
                    Number of pages
                    <input
                      type="number"
                      name="pageCount"
                      min={1}
                      max={2000}
                      defaultValue={1}
                      required
                    />
                  </label>
                  <label className="sm:col-span-2 flex flex-col gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <span className="flex items-center gap-2">
                      <Upload size={16} /> Upload PDF / JPG / PNG (max 50 MB)
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      disabled={busy}
                      onChange={(e) => void upload(e.target.files?.[0])}
                    />
                  </label>
                  <label>
                    Badge
                    <select name="badge">
                      <option>HANDWRITTEN</option>
                      <option>IMPORTANT</option>
                      <option>REVISION</option>
                      <option>EXAM FOCUS</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="downloadAllowed" /> Allow
                    download
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
                      defaultValue={0}
                    />
                  </label>
                  <label className="sm:col-span-2">
                    Teacher / author
                    <input name="teacherName" defaultValue="AVS Faculty" />
                  </label>
                  <label className="sm:col-span-2 flex flex-col gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <span className="flex items-center gap-2">
                      <Upload size={16} /> Upload MP4 (max 50 MB)
                    </span>
                    <input
                      type="file"
                      accept="video/mp4"
                      disabled={busy}
                      onChange={(e) => void upload(e.target.files?.[0])}
                    />
                    <span className="text-xs font-normal leading-5 text-slate-500">
                      For longer videos, use a YouTube or hosted MP4 link. File
                      uploads require Supabase Storage.
                    </span>
                  </label>
                </>
              )}
              <label className="sm:col-span-2">
                {notes ? "File URL (or use upload above)" : "Video / share URL"}
                <input
                  type="url"
                  required
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  placeholder="https://…"
                />
                <span className="mt-2 block text-xs font-normal text-slate-500">
                  {notes
                    ? "Use a direct HTTPS link to your own file."
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
