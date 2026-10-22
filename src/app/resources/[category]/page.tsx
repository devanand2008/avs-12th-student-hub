import Link from "next/link";
import { notFound } from "next/navigation";
import ResourceCard from "@/components/resources/ResourceCard";
import {
  resourceCategories,
  resourceSubjects,
  visibleResources,
} from "@/lib/study-resources";
import { resourceMatches } from "@/lib/study-resource-schema";

export default async function ResourceList({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category } = await params,
    query = await searchParams,
    temporary = category === "temporary",
    definition = resourceCategories.find((c) => c.id === category);
  if (!temporary && !definition) notFound();
  const filters = Object.fromEntries(
    ["q", "subject", "medium", "year", "type", "source"].map((key) => [
      key,
      typeof query[key] === "string" ? query[key] : "",
    ]),
  ) as Record<string, string>;
  const scope = visibleResources.filter((r) =>
      temporary
        ? r.status === "temporary_unverified"
        : r.category === category && r.status === "listed",
    ),
    filtered = scope.filter((r) => resourceMatches(r, filters));
  const url = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)),
    returnTo = `/resources/${category}${url.size ? "?" + url : ""}`;
  const choices = (key: "mediums" | "resourceType" | "publisher") =>
    [
      ...new Set(
        scope.flatMap((r) => (key === "mediums" ? r.mediums : [r[key]])),
      ),
    ].sort();
  const select = (key: string, label: string, values: (string | number)[]) => (
    <label className="space-y-2 text-xs font-bold text-slate-700" key={key}>
      <span>{label}</span>
      <select
        aria-label={label}
        name={key}
        defaultValue={filters[key]}
        className="w-full min-w-0 rounded-xl border border-slate-300 bg-white p-3 text-sm font-normal"
      >
        <option value="">All {label.toLowerCase()}</option>
        {values.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-8 pb-28 sm:px-8">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap gap-2 text-sm text-blue-700"
      >
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/resources">Study Resources</Link>
        <span>/</span>
        <span className="text-slate-600">
          {temporary ? "Temporary" : definition!.title}
        </span>
      </nav>
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
          Skill Up library
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          {temporary ? "Temporary Learning Resources" : definition!.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {temporary
            ? "Temporary learning resource. Source relevance and availability may not yet be fully verified. Opens an external educational service."
            : definition!.description}
        </p>
        {category === "question-papers" && (
          <p className="mt-2 text-sm text-slate-600">
            Official PDFs contain multiple papers. A collection is counted once;
            subject and medium filters do not mean each paper has been
            separately verified.
          </p>
        )}
      </header>
      <form
        action={`/resources/${category}`}
        className="grid gap-4 rounded-3xl border border-blue-100 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="space-y-2 text-xs font-bold text-slate-700 sm:col-span-2">
          <span>Search resources</span>
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Search titles, தமிழ், source or topic"
            className="w-full rounded-xl border border-slate-300 p-3 text-sm font-normal"
          />
        </label>
        {select("subject", "Subjects", resourceSubjects)}
        {select("medium", "Mediums", choices("mediums"))}
        {category === "question-papers" &&
          select(
            "year",
            "Years",
            [...new Set(scope.flatMap((r) => (r.year ? [r.year] : [])))].sort(
              (a, b) => b - a,
            ),
          )}
        {select("type", "Types", choices("resourceType"))}
        {select("source", "Sources", choices("publisher"))}
        <div className="flex items-end gap-4">
          <button className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800">
            Apply filters
          </button>
          <Link
            href={`/resources/${category}`}
            className="py-3 text-sm font-semibold text-blue-700 underline"
          >
            Clear filters
          </Link>
        </div>
      </form>
      <p role="status" className="text-sm text-slate-600">
        {filtered.length}{" "}
        {category === "question-papers" ? "collections" : "resources"} found
        {filters.subject ? ` for ${filters.subject}` : ""}
      </p>
      {filtered.length ? (
        <section
          aria-label="Resource results"
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} returnTo={returnTo} />
          ))}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-blue-200 bg-white px-6 py-14 text-center">
          <h2 className="text-xl font-bold">No matching resources yet</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
            Try clearing a filter. This subject or medium may still need source
            verification; unavailable material is not replaced with sample
            content.
          </p>
          <Link
            href={`/resources/${category}`}
            className="mt-5 inline-block font-bold text-blue-700 underline"
          >
            Clear filters
          </Link>
        </section>
      )}
      {!temporary && (
        <Link
          href="/resources/temporary"
          className="inline-block text-sm font-semibold text-amber-900 underline"
        >
          See separately labelled temporary resources →
        </Link>
      )}
    </main>
  );
}
