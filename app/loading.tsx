// App-shell fallback shown while app/page.tsx's server-side data fetch
// (getStages/getAllergens/...) is in flight, so the very first launch shows
// a minimal branded loading state instead of a blank screen.
export default function Loading() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-2 py-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" width={72} height={72} className="rounded-2xl" />
      <div
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-warm)] border-t-[var(--olive-600)]"
      />
    </div>
  );
}
