import { pageMetadata } from "@/lib/seo";
// This established alias shares the /models canonical rather than competing with it.
export const metadata = pageMetadata("/models");
export default function InteractiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
