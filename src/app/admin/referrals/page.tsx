import { approveReferral, revokeReferral } from "@/app/admin/actions";
import { prisma } from "@/lib/db";
import { formatFaDate } from "@/lib/jalali";

const STATUS = { registered: "ثبت‌نام", charged: "خرید (بدون هدیه)", rewarded: "هدیه داده شد", revoked: "لغو", rejected: "مشکوک / رد" } as const;
const REASONS: Record<string, string> = { shared_ip: "IP مشترک", shared_device: "دستگاه مشترک", cap_reached: "سقف دعوت پر شده", approved_by_admin: "تأیید مدیر" };

export default async function AdminReferrals() {
  const referrals = await prisma.referral.findMany({
    include: { inviter: { select: { phone: true } }, invitee: { select: { phone: true, signupIp: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-espresso">دعوت‌ها</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream text-right text-xs text-muted">
            <tr><th className="p-3">تاریخ</th><th className="p-3">دعوت‌کننده</th><th className="p-3">دعوت‌شده</th><th className="p-3">IP</th><th className="p-3">وضعیت</th><th className="p-3">علت</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {referrals.map((r) => (
              <tr key={r.id} className={r.status === "rejected" ? "bg-amber-50/60" : ""}>
                <td className="p-3 text-xs text-muted">{formatFaDate(r.createdAt, true)}</td>
                <td className="p-3" dir="ltr">{r.inviter.phone}</td>
                <td className="p-3" dir="ltr">{r.invitee.phone}</td>
                <td className="p-3 text-xs" dir="ltr">{r.invitee.signupIp}</td>
                <td className="p-3">{STATUS[r.status]}</td>
                <td className="p-3 text-xs">{r.flagReason ? (REASONS[r.flagReason] ?? r.flagReason) : ""}</td>
                <td className="flex gap-1 p-3">
                  {r.status === "rejected" && (
                    <form action={approveReferral}><input type="hidden" name="id" value={r.id} /><button className="btn-outline px-2 py-1 text-xs">تأیید</button></form>
                  )}
                  {r.status !== "revoked" && r.status !== "rejected" && (
                    <form action={revokeReferral}><input type="hidden" name="id" value={r.id} /><button className="btn px-2 py-1 text-xs text-red-700 hover:bg-red-50">لغو</button></form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
