"use client";

export default function CategoryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="text-2xl font-bold text-slate-800">Products could not be loaded</h1>
      <p className="mt-2 text-sm text-slate-500">Please try again in a moment.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </section>
  );
}
