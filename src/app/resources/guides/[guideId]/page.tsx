import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { openPdfGuides } from "@/lib/open-pdf-guides";
import OpenGuideReader from "@/components/learning/OpenGuideReader";
export default async function Page({
  params,
}: {
  params: Promise<{ guideId: string }>;
}) {
  const { guideId } = await params,
    g = openPdfGuides.find((g) => g.id === guideId);
  if (!g) notFound();
  const session = await getSession();
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 pb-28">
      <Link href="/resources/guides" className="font-bold text-blue-700">
        ← Open PDF references
      </Link>
      <h1 className="text-3xl font-black">{g.title}</h1>
      <p>
        {g.subjects.join(" · ")} · {g.medium} · {g.pages} pages
      </p>
      <section
        aria-label="Source and licence"
        className="space-y-3 rounded-2xl border bg-white p-5 text-sm leading-6"
      >
        <p>{g.attribution}</p>
        <p>
          <a
            href={g.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-blue-700"
          >
            Original publisher
          </a>{" "}
          ·{" "}
          <a
            href={g.sourcePdf}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-blue-700"
          >
            Original PDF
          </a>{" "}
          ·{" "}
          <a
            href={g.licenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-blue-700"
          >
            {g.licence}
          </a>
        </p>
        <p>
          Licence checked in this exact PDF, page {g.licencePdfPage}. Unmodified
          file; original notices retained. {g.limitations}
        </p>
        <details>
          <summary className="cursor-pointer">File verification</summary>
          <p className="break-all">SHA-256: {g.sha256}</p>
          <p>
            {g.sizeBytes.toLocaleString()} bytes · Checked{" "}
            {g.checkedAt.slice(0, 10)}
          </p>
        </details>
      </section>
      {session ? (
        <>
          <a
            className="inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
            href={`/resources/guides/${g.id}/download`}
          >
            Download complete PDF
          </a>
          <OpenGuideReader id={g.id} title={g.title} />
        </>
      ) : (
        <Link
          className="inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
          href={`/login?redirect=${encodeURIComponent(`/resources/guides/${g.id}`)}`}
        >
          Sign in to read or download
        </Link>
      )}
    </main>
  );
}
