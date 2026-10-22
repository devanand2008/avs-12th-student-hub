"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main role="alert" className="mx-auto max-w-3xl space-y-5 p-10">
      <h1 className="text-2xl font-bold">Study resources could not load</h1>
      <p>Please retry or return to the hub.</p>
      <button
        onClick={reset}
        className="rounded-xl bg-blue-700 px-5 py-3 text-white"
      >
        Try again
      </button>
      <Link href="/resources" className="ml-5 text-blue-700 underline">
        Resource hub
      </Link>
    </main>
  );
}
