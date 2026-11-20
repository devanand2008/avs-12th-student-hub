import Link from "next/link";
import { BookOpen, FileText, Sparkles } from "lucide-react";
import {
  mathsGoldenMaterial,
  type GoldenMaterial,
} from "@/lib/golden-materials";

export default function GoldenMaterials({
  materials = [mathsGoldenMaterial],
}: {
  materials?: GoldenMaterial[];
}) {
  if (!materials.length) return null;
  return (
    <section
      aria-label="Golden Formula Sheets"
      className="overflow-hidden rounded-3xl border border-amber-300 bg-[#fffaf0] shadow-lg shadow-amber-900/5"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-[#38260c] via-[#684313] to-[#986316] px-5 py-6 text-white sm:px-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[32px] border-amber-200/10"
        />
        <div className="relative flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-amber-200/40 bg-amber-100/10 text-amber-200">
            <Sparkles size={24} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide text-amber-200">
              Skill Up · Class 12 revision
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Golden Formula Sheets
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-50">
              Keep key formulas close while you study. Read the revision PDF
              inside Skill Up.
            </p>
          </div>
        </div>
      </div>
      <div
        className={
          materials.length > 1
            ? "grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3"
            : "p-4 sm:p-6"
        }
      >
        {materials.map((material) => (
          <Link
            key={material.id}
            href={material.href}
            prefetch={false}
            aria-label={`Open ${material.subject} Golden Formula Sheet PDF (${material.pages} pages)`}
            className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-amber-200 bg-white p-5 text-slate-900 shadow-sm transition-shadow hover:shadow-lg hover:shadow-amber-900/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900">
                <FileText size={25} aria-hidden="true" />
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900">
                Golden PDF
              </span>
            </div>
            <h3 className="mt-5 text-xl font-bold">{material.subject}</h3>
            <p className="mt-1 text-sm text-slate-600">
              Formula & revision collection
            </p>
            <p className="mb-5 mt-3 text-sm font-medium text-slate-600">
              {material.pages} pages · English · PDF
            </p>
            <span className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-400 px-4 py-3 font-bold text-amber-950 group-hover:from-amber-400 group-hover:to-yellow-300">
              <BookOpen size={18} aria-hidden="true" /> Open PDF
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
