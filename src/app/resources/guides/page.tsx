import OpenGuideLibrary from "@/components/learning/OpenGuideLibrary";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/resources/guides");
export default function Page() {
  return <OpenGuideLibrary />;
}
