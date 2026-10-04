import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <p className="text-6xl font-black text-gold">۴۰۴</p>
        <h1 className="mt-4 text-2xl font-bold text-espresso">صفحه موردنظر پیدا نشد</h1>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-primary">صفحه اصلی</Link>
          <Link href="/gowns" className="btn-outline">گالری لباس‌ها</Link>
        </div>
      </div>
    </main>
  );
}
