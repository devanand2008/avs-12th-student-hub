import Link from "next/link";
import { ArrowRight, BookOpen, FileText, Play, Library } from "lucide-react";
import { resourceCategories, visibleResources } from "@/lib/study-resources";
export const metadata = { title: "Study Resources | Skill Up" };
export default function ResourcesPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-10 px-4 py-10 pb-28 sm:px-8">
      <nav aria-label="Breadcrumb" className="text-sm text-blue-700">
        <Link href="/">Home</Link>
        <span className="mx-2 text-slate-400">/</span>Study Resources
      </nav>
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#183773] via-blue-700 to-cyan-700 p-8 text-white sm:p-14">
        <Library className="mb-6" size={34} />
        <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-200">
          Your next study session starts here
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
          Study Resources
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50">
          Past papers, useful reading and video lessons — together in your
          learning space. Choose a resource, explore its source and study at
          your own pace.
        </p>
        <p lang="ta" className="mt-4 text-sm text-blue-100">
          வினாத்தாள்கள் · கற்றல் வளங்கள் · காணொளிப் பாடங்கள்
        </p>
      </section>
      <section
        aria-label="Resource categories"
        className="grid gap-6 md:grid-cols-3"
      >
        {resourceCategories.map((category, i) => {
          const Icon = [FileText, BookOpen, Play][i];
          const count = visibleResources.filter(
            (r) => r.category === category.id && r.status === "listed",
          ).length;
          return (
            <Link
              key={category.id}
              href={`/resources/${category.id}`}
              className="group rounded-3xl border border-blue-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-7 flex items-center justify-between">
                <span className="rounded-2xl bg-blue-50 p-4 text-blue-700">
                  <Icon size={26} />
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {count} source-checked{" "}
                  {category.id === "question-papers"
                    ? "collections"
                    : "resources"}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {category.title}
              </h2>
              <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">
                {category.description}
              </p>
              <span className="mt-7 inline-flex items-center gap-3 text-sm font-bold text-blue-700">
                Explore <ArrowRight size={17} />
              </span>
            </Link>
          );
        })}
      </section>
      <section className="flex flex-wrap items-center justify-between gap-5 rounded-3xl border border-amber-200 bg-amber-50 p-7">
        <div>
          <h2 className="text-lg font-bold text-amber-950">
            Temporary Learning Resources
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
            Temporary learning resource. Source relevance and availability may
            not yet be fully verified. Opens an external educational service.
          </p>
        </div>
        <Link
          href="/resources/temporary"
          className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-amber-950 shadow-sm"
        >
          Browse pending checks (
          {
            visibleResources.filter((r) => r.status === "temporary_unverified")
              .length
          }
          )
        </Link>
      </section>
      <div className="flex flex-wrap gap-5 text-sm font-semibold text-blue-700">
        <Link href="/textbooks">Textbook library →</Link>
        <Link href="/subjects">My subjects →</Link>
        <Link href="/textbook-practice">Book-back MCQ practice →</Link>
      </div>
    </main>
  );
}
