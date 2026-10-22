export default function Loading() {
  return (
    <main role="status" className="mx-auto w-full max-w-7xl space-y-5 p-8">
      <p className="font-bold text-blue-800">Loading study resources…</p>
      <div className="h-52 animate-pulse rounded-3xl bg-blue-100" />
    </main>
  );
}
