import Link from "next/link";
import { ArrowUpRight, BookOpen, FileText, Play } from "lucide-react";
import type { StudyResource } from "@/lib/study-resource-schema";

export default function ResourceCard({
  resource: r,
  returnTo,
}: {
  resource: StudyResource;
  returnTo: string;
}) {
  const Icon =
    r.category === "video-lessons"
      ? Play
      : r.category === "question-papers"
        ? FileText
        : BookOpen;
  return (
    <article className="flex min-w-0 flex-col rounded-3xl border border-blue-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="rounded-2xl bg-blue-50 p-3 text-blue-700">
          <Icon size={22} />
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${r.status === "temporary_unverified" ? "bg-amber-50 text-amber-900" : "bg-blue-50 text-blue-800"}`}
        >
          {r.status === "temporary_unverified"
            ? "Temporary · check pending"
            : "Source checked"}
        </span>
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
        {r.resourceType}
        {r.year ? ` · ${r.year}` : ""}
      </p>
      <h3 className="mt-2 break-words text-lg font-bold leading-snug text-slate-900">
        {r.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{r.description}</p>
      <dl className="my-5 space-y-2 text-xs leading-5 text-slate-600">
        <div>
          <dt className="inline font-semibold">Subject: </dt>
          <dd className="inline">
            {r.subjects.length > 4
              ? `${r.subjects.slice(0, 3).join(", ")} + ${r.subjects.length - 3} more`
              : r.subjects.join(", ")}
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold">Medium: </dt>
          <dd className="inline">{r.mediums.join(" / ")}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Source: </dt>
          <dd className="inline">{r.publisher}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Rights: </dt>
          <dd className="inline">
            {r.licence ??
              (r.rights === "official_access_terms_unclear"
                ? "Official access; reuse terms unclear"
                : "External link only")}
          </dd>
        </div>
      </dl>
      <Link
        href={`/resources/item/${r.id}?returnTo=${encodeURIComponent(returnTo)}`}
        className="mt-auto inline-flex items-center gap-2 font-bold text-blue-700 hover:underline"
      >
        {r.category === "video-lessons"
          ? "Watch lesson"
          : r.pdfUrl
            ? "View paper / PDF"
            : "View resource"}
        <ArrowUpRight size={16} />
      </Link>
    </article>
  );
}
