"use client";
import { useState } from "react";
import {
  accessLabels,
  aiStudyTools,
  aiSubjects,
  matchesTool,
  promptTemplates,
  studyPrompt,
  toolCategories,
} from "@/lib/ai-study-tools";
import chapters from "@/lib/ai-study-chapters.json";

export default function AiStudyDirectory({
  initialSubject = "",
  initialChapter = "",
}: {
  initialSubject?: string;
  initialChapter?: string;
}) {
  const startingSubject = aiSubjects.some((s) => s.id === initialSubject)
    ? initialSubject
    : "";
  const initial = {
    q: "",
    subject: startingSubject,
    task: "",
    type: "",
    category: "",
    language: "",
    access: "",
    account: "",
  };
  const [filters, setFilters] = useState(initial),
    [chapter, setChapter] = useState(
      chapters.some(
        (c) => c.id === initialChapter && c.subjectId === startingSubject,
      )
        ? initialChapter
        : "",
    ),
    [topic, setTopic] = useState(""),
    [language, setLanguage] = useState("English"),
    [template, setTemplate] = useState<keyof typeof promptTemplates>("concept"),
    [edited, setEdited] = useState<string | null>(null),
    [message, setMessage] = useState("");
  const selected = aiSubjects.find((s) => s.id === filters.subject),
    selectedChapter = chapters.find(
      (c) => c.id === chapter && c.subjectId === filters.subject,
    );
  const generated = studyPrompt(
      template,
      selected?.label || "my subject",
      selectedChapter?.title || "",
      topic,
      language,
    ),
    prompt = edited ?? generated;
  const results = aiStudyTools.filter((t) => matchesTool(t, filters));
  const change = (key: keyof typeof initial, value: string) => {
    setFilters({ ...filters, [key]: value });
    if (key === "subject") {
      setChapter("");
      setEdited(null);
    }
    setMessage("");
  };
  const reset = () => {
    setEdited(null);
    setMessage("Prompt reset to the selected template.");
  };
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setMessage("Study prompt copied. Paste it into your chosen tool.");
    } catch {
      setMessage(
        "Copy is unavailable. Select the prompt text and copy it manually.",
      );
      document.querySelector<HTMLTextAreaElement>("#study-prompt")?.select();
    }
  }
  const select = (
    key: keyof typeof initial,
    label: string,
    choices: { value: string; label: string }[],
  ) => (
    <label className="min-w-0 space-y-2 text-sm font-semibold" key={key}>
      <span>{label}</span>
      <select
        aria-label={label}
        value={filters[key]}
        onChange={(e) => change(key, e.target.value)}
        className="w-full min-w-0 rounded-xl border border-slate-300 bg-white p-3 font-normal"
      >
        <option value="">All {label.toLowerCase()}</option>
        {choices.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
  const options = (values: string[]) =>
    [...new Set(values)].sort().map((v) => ({ value: v, label: v }));
  return (
    <>
      <section
        aria-label="Find study tools"
        className="grid gap-4 rounded-3xl border border-blue-100 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <label className="space-y-2 text-sm font-semibold">
          <span>Search tools</span>
          <input
            aria-label="Search tools"
            type="search"
            value={filters.q}
            onChange={(e) => change("q", e.target.value)}
            placeholder="Tool, task or subject"
            className="w-full rounded-xl border border-slate-300 p-3 font-normal"
          />
        </label>
        {select(
          "subject",
          "Subject",
          aiSubjects.map((s) => ({ value: s.id, label: s.label })),
        )}
        {select("category", "Category", options([...toolCategories]))}
        {select(
          "task",
          "Learning task",
          options(aiStudyTools.flatMap((t) => t.tasks)),
        )}
        {select("type", "Tool type", options(aiStudyTools.map((t) => t.type)))}
        {select(
          "language",
          "Verified language",
          options(aiStudyTools.flatMap((t) => t.languages)),
        )}
        {select("access", "Free access", [
          {
            value: "free-tools",
            label: "Free Tools (including limited tiers)",
          },
          ...Object.entries(accessLabels).map(([value, label]) => ({
            value,
            label,
          })),
        ])}
        {select(
          "account",
          "Account requirement",
          options(aiStudyTools.map((t) => t.account)),
        )}
        <button
          onClick={() => {
            setFilters({ ...initial, subject: "" });
            setChapter("");
            setEdited(null);
          }}
          className="self-end rounded-xl border border-blue-200 p-3 font-bold text-blue-800"
        >
          Clear filters
        </button>
      </section>
      <p role="status" className="text-sm text-slate-600">
        {results.length} tools found ·{" "}
        {aiStudyTools.filter((t) => t.verification === "Source checked").length}{" "}
        with product/access sources checked ·{" "}
        {aiStudyTools.filter((t) => t.verification !== "Source checked").length}{" "}
        partially verified. General tutoring links do not establish syllabus
        coverage.
      </p>
      <section
        aria-label="Study prompt builder"
        className="space-y-5 rounded-3xl border border-blue-200 bg-blue-50 p-5 sm:p-8"
      >
        <h2 className="text-2xl font-black text-blue-950">
          Build your study prompt
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          Choose a subject above to use its actual textbook chapter inventory.
          Detected chapter labels are retained as recorded; they do not certify
          complete extraction. Your edits stay only on this page. Changing
          subject, chapter or template starts a fresh prompt.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-2 text-sm font-semibold">
            Prompt template
            <select
              aria-label="Prompt template"
              value={template}
              onChange={(e) => {
                setTemplate(e.target.value as typeof template);
                setEdited(null);
                setMessage("");
              }}
              className="w-full rounded-xl border bg-white p-3"
            >
              {Object.entries(promptTemplates).map(([id, t]) => (
                <option key={id} value={id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold">
            Textbook chapter
            <select
              aria-label="Textbook chapter"
              disabled={!selected}
              value={chapter}
              onChange={(e) => {
                setChapter(e.target.value);
                setEdited(null);
                setMessage("");
              }}
              className="w-full rounded-xl border bg-white p-3 disabled:opacity-60"
            >
              <option value="">
                {selected
                  ? "Choose a chapter (optional)"
                  : "Choose a subject first"}
              </option>
              {chapters
                .filter((c) => c.subjectId === filters.subject)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.number}. {c.title}
                  </option>
                ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold">
            Topic or problem
            <input
              aria-label="Topic or problem"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setEdited(null);
                setMessage("");
              }}
              className="w-full rounded-xl border bg-white p-3"
            />
          </label>
          <label className="space-y-2 text-sm font-semibold">
            Prompt response language
            <select
              aria-label="Prompt response language"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setEdited(null);
              }}
              className="w-full rounded-xl border bg-white p-3"
            >
              <option>English</option>
              <option>Tamil</option>
            </select>
          </label>
        </div>
        <label htmlFor="study-prompt" className="block text-sm font-bold">
          Editable study prompt
        </label>
        <textarea
          id="study-prompt"
          value={prompt}
          onChange={(e) => {
            setEdited(e.target.value);
            setMessage("");
          }}
          rows={10}
          className="w-full rounded-2xl border border-blue-200 bg-white p-4 text-sm leading-7"
        />
        <div className="flex flex-wrap gap-4">
          <button
            onClick={copy}
            className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
          >
            Copy Study Prompt
          </button>
          <button
            onClick={reset}
            className="rounded-xl border border-blue-300 bg-white px-5 py-3 font-bold text-blue-800"
          >
            Reset Prompt
          </button>
        </div>
        <p aria-live="polite" className="text-sm text-blue-900">
          {message}
        </p>
        <p className="text-xs leading-5 text-slate-600">
          A requested Tamil answer does not guarantee a provider supports Tamil
          well. Verify translations, formulas, code and diagram labels. Copying
          sends nothing to a provider.
        </p>
      </section>
      {results.length ? (
        <section
          aria-label="Tool results"
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {results.map((t) => (
            <article
              key={t.id}
              className="flex min-w-0 flex-col space-y-4 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-800">
                  {t.type}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-900">
                  {accessLabels[t.access]}
                </span>
              </div>
              <h2 className="break-words text-xl font-black text-slate-900">
                {t.name}
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                {t.provider} · Checked {t.checkedAt} · {t.verification}
              </p>
              <p className="text-sm leading-6 text-slate-600">
                {t.description}
              </p>
              <dl className="space-y-3 text-sm leading-6">
                <div>
                  <dt className="font-bold">Useful for</dt>
                  <dd>{t.tasks.join(" · ")}</dd>
                </div>
                <div>
                  <dt className="font-bold">Subjects</dt>
                  <dd>
                    {t.subjectIds.length === aiSubjects.length
                      ? "All registered subjects — general tutoring support only"
                      : [
                          ...new Set(
                            aiSubjects
                              .filter((s) => t.subjectIds.includes(s.id))
                              .map((s) => s.name),
                          ),
                        ].join(", ")}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold">Limits and eligibility</dt>
                  <dd>
                    {t.limitations} {t.eligibility}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold">Account / language evidence</dt>
                  <dd>
                    {t.account} · {t.languages.join(" / ")} checked; other
                    languages unverified.
                  </dd>
                </div>
                <div>
                  <dt className="font-bold">Privacy and availability</dt>
                  <dd>
                    {t.availability}. Privacy and terms not independently
                    reviewed; check the provider before sharing information.
                  </dd>
                </div>
              </dl>
              <div className="mt-auto flex flex-wrap gap-3 pt-3 text-sm font-bold">
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-blue-700 px-4 py-3 text-white"
                >
                  Open Tool ↗
                </a>
                <a
                  href={t.accessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-blue-200 px-4 py-3 text-blue-800"
                >
                  Official access details ↗
                </a>
              </div>
              <details className="text-xs leading-6 text-slate-600">
                <summary className="cursor-pointer font-bold">
                  Verification sources
                </summary>
                {t.privacyUrl && (
                  <a
                    href={t.privacyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mr-4 underline"
                  >
                    Provider privacy policy
                  </a>
                )}
                {t.termsUrl && (
                  <a
                    href={t.termsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Provider terms
                  </a>
                )}
                <ul className="list-disc break-words pl-4">
                  {t.sources.map((s) => (
                    <li key={s}>
                      <a
                        href={s}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {new URL(s).hostname}
                        {new URL(s).pathname}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed p-10 text-center">
          <h2 className="text-xl font-bold">No matching tools</h2>
          <p className="mt-3 text-slate-600">
            Clear a filter or try a broader task. Missing coverage is not
            replaced with example tools.
          </p>
        </section>
      )}
    </>
  );
}
