"use client";
import dynamic from "next/dynamic";
const PdfPages = dynamic(
  () => import("@/app/textbooks/TextbookReader").then((m) => m.PdfPages),
  {
    ssr: false,
    loading: () => (
      <p className="p-8" role="status">
        Loading PDF reader…
      </p>
    ),
  },
);
export default function OpenGuideReader({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return <PdfPages url={`/api/guides/${id}/pdf`} title={title} />;
}
