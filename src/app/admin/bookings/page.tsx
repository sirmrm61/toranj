import { setBookingStatus } from "@/app/admin/actions";
import { prisma } from "@/lib/db";
import { formatFaDate } from "@/lib/jalali";

const STATUS = { NEW: "جدید", CONFIRMED: "تأیید شده", DONE: "انجام شد", CANCELLED: "لغو" } as const;

export default async function AdminBookings({ searchParams }: PageProps<"/admin/bookings">) {
  const { status } = await searchParams;
  const filter = typeof status === "string" && status in STATUS ? (status as keyof typeof STATUS) : undefined;
  const bookings = await prisma.booking.findMany({
    where: filter ? { status: filter } : {},
    include: { gown: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-espresso">رزروهای پرو حضوری</h1>
      <nav className="mb-4 flex gap-2 text-sm">
        <a href="/admin/bookings" className="badge">همه</a>
        {Object.entries(STATUS).map(([k, l]) => (
          <a key={k} href={`/admin/bookings?status=${k}`} className={`badge ${filter === k ? "bg-espresso text-white" : ""}`}>{l}</a>
        ))}
      </nav>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream text-right text-xs text-muted">
            <tr><th className="p-3">ثبت</th><th className="p-3">نام</th><th className="p-3">موبایل</th><th className="p-3">تاریخ مراسم</th><th className="p-3">تاریخ/ساعت پرو</th><th className="p-3">لباس</th><th className="p-3">توضیح</th><th className="p-3">وضعیت</th></tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="p-3 text-xs text-muted">{formatFaDate(b.createdAt, true)}</td>
                <td className="p-3 font-semibold">{b.name}</td>
                <td className="p-3" dir="ltr"><a href={`tel:${b.phone}`}>{b.phone}</a></td>
                <td className="p-3">{formatFaDate(b.eventDate)}</td>
                <td className="p-3">{formatFaDate(b.preferredDate)} {b.preferredTime}</td>
                <td className="p-3">{b.gown?.name ?? "—"}</td>
                <td className="max-w-48 p-3 text-xs">{b.note}</td>
                <td className="p-3">
                  <form action={setBookingStatus} className="flex gap-1">
                    <input type="hidden" name="id" value={b.id} />
                    <select name="status" defaultValue={b.status} className="input py-1.5 text-xs">
                      {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                    <button className="btn-outline px-3 py-1 text-xs">ثبت</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
