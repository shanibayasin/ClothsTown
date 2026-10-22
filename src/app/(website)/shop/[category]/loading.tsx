export default function LoadingCategoryProducts() {
  return (
    <main className="mx-auto max-w-[1440px] animate-pulse px-4 py-8 sm:px-6 lg:px-10">
      <div className="h-36 rounded-xl bg-slate-100" />
      <div className="mt-6 h-16 rounded-xl bg-slate-100" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-slate-100 p-3">
            <div className="aspect-[4/4.5] rounded-lg bg-slate-100" />
            <div className="mt-3 h-3 w-3/4 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </main>
  );
}
