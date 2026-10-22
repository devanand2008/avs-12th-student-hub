import Link from "next/link";
import { notFound } from "next/navigation";
import { studyResources } from "@/lib/study-resources";
import ResourcePlayer from "@/components/resources/ResourcePlayer";
export default async function ResourceDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params,
    { returnTo } = await searchParams,
    r = studyResources.find((r) => r.id === id && r.status !== "retired");
  if (!r) notFound();
  const back =
    returnTo &&
    /^\/resources\/(?:question-papers|learning-materials|video-lessons|temporary)(?:\?[^#]*)?$/.test(
      returnTo,
    )
      ? returnTo
      : `/resources/${r.category}`;
  const external = (url: string, label: string) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-800 hover:bg-blue-50"
    >
      {label} ↗
    </a>
  );
  return (
    <main className="mx-auto w-full max-w-5xl space-y-7 px-4 py-8 pb-28 sm:px-8">
      <Link href={back} className="text-sm font-bold text-blue-700">
        ← Back to resources and filters
      </Link>
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
          {r.resourceType} {r.year ? `· ${r.year}` : ""}
        </p>
        <h1 className="mt-3 break-words text-3xl font-black leading-tight text-slate-900">
          {r.title}
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          {r.publisher} · {r.mediums.join(" / ")}
        </p>
      </header>
      {r.status === "temporary_unverified" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          Temporary learning resource. Source relevance and availability may not
          yet be fully verified. Opens an external educational service.
        </div>
      )}
      {r.status === "unavailable" || r.availability === "unavailable" ? (
        <p role="alert" className="rounded-2xl bg-amber-50 p-5 text-amber-950">
          This source could not be reached during its last check. Try the
          original publisher or return to the resource list.
        </p>
      ) : r.category === "video-lessons" ? (
        <ResourcePlayer
          url={r.originalUrl}
          title={r.title}
          supported={r.embedding === "oembed_supported"}
        />
      ) : r.pdfUrl ? (
        <section className="rounded-3xl border border-blue-100 bg-white p-7">
          <h2 className="text-xl font-bold">Open the original PDF</h2>
          <p className="my-4 text-sm leading-6 text-slate-600">
            This PDF opens at its original source in a new tab. If your browser
            supports it, use its Save or Download control. If the PDF cannot
            open, use the publisher page below.
          </p>
          {external(r.pdfUrl, "Open Original PDF")}
        </section>
      ) : null}
      <section className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8">
        <h2 className="text-lg font-bold">About this resource</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">{r.description}</p>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          {Object.entries({
            Subjects: r.subjects.join(", "),
            Medium: r.mediums.join(" / "),
            Year: r.year ?? "Not specified",
            Session: r.session ?? "Not specified",
            Board: r.board ?? "Not specified",
            Source: r.publisher,
            "Last source check": r.checkedAt.slice(0, 10),
            "Source status":
              r.status === "listed"
                ? "Source checked; no teacher endorsement implied"
                : r.status === "temporary_unverified"
                  ? "Temporary; verification pending"
                  : "Unavailable",
            "Rights / licence": r.licence ?? r.rights.replaceAll("_", " "),
            "Copying permission":
              r.redistribution === "permitted"
                ? "Permitted under recorded terms"
                : r.redistribution === "unclear"
                  ? "Not confirmed for this use"
                  : "Not permitted",
            "Video player":
              r.embedding === "oembed_supported"
                ? "Available through YouTube; source restrictions may apply"
                : r.embedding === "not_applicable"
                  ? "Not applicable"
                  : "Open the original video or check availability",
            Accessibility: r.accessibilityNotes,
          }).map(([label, value]) => (
            <div key={label}>
              <dt className="font-semibold text-slate-800">{label}</dt>
              <dd className="mt-1 break-words leading-6 text-slate-600">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          {external(
            r.originalUrl,
            r.category === "video-lessons"
              ? "Open on YouTube"
              : "Open original resource",
          )}
          {r.sourceUrl !== r.originalUrl &&
            external(r.sourceUrl, "Original publisher page")}
          {r.licenceUrl && external(r.licenceUrl, "Read licence terms")}
          {r.localAsset && r.redistribution === "permitted" && (
            <a
              download
              href={r.localAsset}
              className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
            >
              Download permitted copy
            </a>
          )}
        </div>
      </section>
      {r.issues.length > 0 && (
        <section className="rounded-2xl bg-blue-50 p-6">
          <h2 className="font-bold">Source notes</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            {r.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </section>
      )}
      <Link
        href={back}
        className="inline-block font-bold text-blue-700 underline"
      >
        Return to resource list
      </Link>
    </main>
  );
}
