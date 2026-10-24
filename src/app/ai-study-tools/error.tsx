"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="p-10">
      <h1 className="text-xl font-bold">Study tools could not load</h1>
      <button
        onClick={reset}
        className="mt-4 rounded-xl bg-blue-700 px-5 py-3 text-white"
      >
        Try again
      </button>
    </section>
  );
}
