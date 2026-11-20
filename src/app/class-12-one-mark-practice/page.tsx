import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/class-12-one-mark-practice");

const revisionLinks = [
  {
    title: "Samacheer Kalvi Class 12 textbooks",
    href: "/textbooks",
    detail:
      "Find the textbook and volume for your subject in Tamil or English.",
  },
  {
    title: "Previous-year Class 12 question papers",
    href: "/resources/question-papers",
    detail:
      "Use the public examination collections for timed revision after chapter practice.",
  },
  {
    title: "Class 12 Maths and Science revision games",
    href: "/math-game",
    detail:
      "Revisit formulas and key concepts in Maths, Physics, Chemistry and Biology.",
  },
];

export default function OneMarkPracticeGuide() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="max-w-3xl">
        <Link
          href="/"
          className="text-sm font-semibold text-blue-800 hover:underline"
        >
          joshuaskillup
        </Link>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-[#142B63] sm:text-5xl">
          Tamil Nadu Class 12 Book-Back One-Mark Practice
        </h1>
        <p className="mt-4 leading-relaxed text-slate-700">
          Revise the one-mark multiple-choice questions at the end of your
          Samacheer Kalvi textbook chapters. On Skill Up, you can choose a
          subject and chapter, answer an available quiz, and revisit questions
          you missed.
        </p>
        <p lang="ta" className="mt-3 leading-relaxed text-slate-700">
          தமிழ்நாடு 12ஆம் வகுப்பு சமச்சீர் கல்விப் பாடநூல்களின் பாட இறுதியில்
          உள்ள ஒரு மதிப்பெண் வினாக்களைப் பாடவாரியாகப் பயிற்சி செய்யலாம்.
        </p>
        <Link
          href="/textbook-practice"
          className="mt-6 inline-flex rounded-xl bg-[#142B63] px-5 py-3 font-semibold text-white hover:bg-blue-900"
        >
          Sign in to start book-back practice
        </Link>
      </header>

      <section
        aria-labelledby="revision-steps"
        className="mt-10 rounded-2xl border border-blue-100 bg-white p-5 sm:p-8"
      >
        <h2 id="revision-steps" className="text-xl font-bold text-[#142B63]">
          How to revise a chapter
        </h2>
        <ol className="mt-4 list-decimal space-y-4 pl-5 leading-relaxed text-slate-700">
          <li>
            Select your medium, textbook and chapter. Check the available
            question count before starting. Coverage varies by chapter and
            medium.
          </li>
          <li>
            Try a short set from memory. For a formula question, write down the
            formula and check the sign or units before selecting an answer.
          </li>
          <li>
            Review missed questions against the textbook. Note whether the
            mistake came from a definition, a calculation or a misread option,
            then retry the chapter.
          </li>
        </ol>
      </section>

      <section aria-labelledby="more-revision" className="mt-10">
        <h2 id="more-revision" className="text-xl font-bold text-[#142B63]">
          More Class 12 revision resources
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {revisionLinks.map(({ title, href, detail }) => (
            <li
              key={href}
              className="rounded-xl border border-blue-100 bg-white p-4"
            >
              <Link
                href={href}
                className="font-semibold text-blue-800 hover:underline"
              >
                {title}
              </Link>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {detail}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
