import Link from "next/link";
export default function ResourceNotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 px-6 py-16 pb-28">
      <p className="text-sm font-bold text-blue-700">Study Resources</p>
      <h1 className="text-3xl font-black">Resource not available</h1>
      <p className="text-slate-600">
        This resource may have been retired, or the address is incorrect. Browse
        the current library to find another source.
      </p>
      <Link
        href="/resources"
        className="inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
      >
        Return to Study Resources
      </Link>
    </main>
  );
}
