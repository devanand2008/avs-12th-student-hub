import Link from "next/link";
import AiStudyDirectory from "@/components/learning/AiStudyDirectory";
export const metadata = { title: "AI Study Tools | Skill Up" };
export default async function AiStudyToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; chapter?: string }>;
}) {
  const query = await searchParams;
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 pb-28 sm:px-8">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap gap-4 text-sm font-semibold text-blue-700"
      >
        <Link href="/">Home</Link>
        <Link href="/resources">Study Resources</Link>
        <Link href="/models">3D Learning Lab</Link>
        <Link href="/textbook-practice">Book-back Practice</Link>
      </nav>
      <header className="rounded-[2rem] bg-gradient-to-br from-blue-950 via-blue-800 to-cyan-700 p-8 text-white sm:p-12">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
          Your study companion toolkit
        </p>
        <h1 className="mt-4 text-4xl font-black sm:text-5xl">AI Study Tools</h1>
        <p className="mt-4 text-lg font-semibold">
          Learn Smarter. Understand Better. Practice with Confidence.
        </p>
        <p className="mt-4 max-w-3xl leading-7 text-blue-50">
          Discover useful AI assistants, maths tools, science simulations and
          study resources to help you understand Class 12 concepts, revise
          lessons and prepare for examinations.
        </p>
        <p lang="ta" className="mt-4 text-blue-100">
          புரிந்து கற்போம் · பயிற்சி செய்வோம் · விடைகளைச் சரிபார்ப்போம்
        </p>
      </header>
      <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
        AI tools can make mistakes. Check important answers with your textbook
        or teacher. Review each provider&apos;s age and privacy rules before
        using it. Do not upload passwords, personal IDs, private school records
        or other sensitive information. External tools open in a new tab. Skill
        Up does not send your prompts or files to these services.
      </aside>
      <AiStudyDirectory
        initialSubject={typeof query.subject === "string" ? query.subject : ""}
        initialChapter={typeof query.chapter === "string" ? query.chapter : ""}
      />
    </main>
  );
}
