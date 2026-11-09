import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/models");
export default function ModelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
