import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listResources } from "@/lib/content";
import { mathsGoldenMaterial } from "@/lib/golden-materials";
import { privateMetadata } from "@/lib/seo";
import { PdfPages } from "@/app/textbooks/TextbookReader";

export const metadata = privateMetadata;

export default async function GoldenReader({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = await params;
  const session = await getSession();
  const isMaths = noteId === mathsGoldenMaterial.id;
  if (!session && !isMaths)
    redirect(
      "/login?redirect=" + encodeURIComponent("/golden-materials/" + noteId),
    );

  const note = session
    ? (await listResources("note")).find((item) => item.id === noteId)
    : null;
  if (
    (!note || !note.sourceFile?.split("/").includes("main formul sheet")) &&
    !(isMaths && !session)
  )
    notFound();

  const title = note?.title || "Mathematics Golden Formula Sheet";
  const pdfUrl = isMaths
    ? "/api/pdf/golden-formula-sheet"
    : `/api/notes/${encodeURIComponent(noteId)}/pdf`;
  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl space-y-5 px-3 py-6 pb-28 sm:px-6">
      <Link
        href="/notes"
        className="inline-flex min-h-11 items-center font-semibold text-blue-800"
      >
        Back to Golden Materials
      </Link>
      <header className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
        <p className="text-sm font-semibold">Skill Up · Golden Materials</p>
        <h1 className="mt-2 text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm">
          {note && "pageCount" in note
            ? note.pageCount
            : mathsGoldenMaterial.pages}{" "}
          pages · English
        </p>
      </header>
      <PdfPages url={pdfUrl} title={title} readerLabel="Golden PDF reader" />
    </main>
  );
}
