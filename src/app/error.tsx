"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold text-espresso">مشکلی پیش آمد</h1>
        <p className="mt-2 text-muted">لطفاً دوباره تلاش کنید.</p>
        <button onClick={reset} className="btn-primary mt-6">تلاش دوباره</button>
      </div>
    </main>
  );
}
