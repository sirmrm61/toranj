import Image from "next/image";
import type { Gown } from "@/generated/prisma/client";
import { deleteGown, saveGown } from "@/app/admin/actions";
import { MODE_LABELS, STATUS_LABELS, STYLE_LABELS, TYPE_LABELS } from "@/lib/gowns";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Options({ map }: { map: Record<string, string> }) {
  return Object.entries(map).map(([v, l]) => (
    <option key={v} value={v}>
      {l}
    </option>
  ));
}

export function GownForm({ gown }: { gown?: Gown }) {
  return (
    <div className="space-y-4">
      <form action={saveGown} className="card space-y-4 p-6">
        {gown && <input type="hidden" name="id" value={gown.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="نام *"><input name="name" required defaultValue={gown?.name} className="input" /></Field>
          <Field label="نامک URL * (مثلاً ترنج-مروارید)"><input name="slug" required defaultValue={gown?.slug} className="input" /></Field>
        </div>
        <Field label="توضیح کوتاه"><input name="tagline" defaultValue={gown?.tagline ?? ""} className="input" /></Field>
        <Field label="توضیحات *"><textarea name="description" required rows={4} defaultValue={gown?.description} className="input" /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="نوع"><select name="type" defaultValue={gown?.type ?? "BRIDAL"} className="input"><Options map={TYPE_LABELS} /></select></Field>
          <Field label="مدل"><select name="style" defaultValue={gown?.style ?? "A_LINE"} className="input"><Options map={STYLE_LABELS} /></select></Field>
          <Field label="فروش / اجاره"><select name="mode" defaultValue={gown?.mode ?? "SALE"} className="input"><Options map={MODE_LABELS} /></select></Field>
          <Field label="یقه"><input name="neckline" defaultValue={gown?.neckline ?? ""} className="input" /></Field>
          <Field label="آستین"><input name="sleeve" defaultValue={gown?.sleeve ?? ""} className="input" /></Field>
          <Field label="رنگ *"><input name="color" required defaultValue={gown?.color ?? ""} className="input" /></Field>
          <Field label="پارچه"><input name="fabric" defaultValue={gown?.fabric ?? ""} className="input" /></Field>
          <Field label="محدوده قیمت"><input name="priceRange" defaultValue={gown?.priceRange ?? ""} className="input" /></Field>
          <Field label="وضعیت"><select name="status" defaultValue={gown?.status ?? "AVAILABLE"} className="input"><Options map={STATUS_LABELS} /></select></Field>
          <Field label="ترتیب نمایش"><input name="sortOrder" type="number" defaultValue={gown?.sortOrder ?? 0} className="input" /></Field>
          <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" name="featured" defaultChecked={gown?.featured} /> نمایش در صفحه اصلی</label>
        </div>

        {gown && gown.images.length > 0 && (
          <fieldset>
            <legend className="label">تصاویر فعلی (تصویر مرجع پرو آنلاین را انتخاب کنید)</legend>
            <div className="flex flex-wrap gap-4">
              {gown.images.map((src) => (
                <div key={src} className="w-28 space-y-1 text-xs">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-cream"><Image src={src} alt="" fill sizes="112px" className="object-cover" /></div>
                  <label className="flex items-center gap-1"><input type="radio" name="tryonRef" value={src} defaultChecked={gown.tryonRefs.includes(src)} /> مرجع پرو</label>
                  <label className="flex items-center gap-1 text-red-700"><input type="checkbox" name="removeImage" value={src} /> حذف</label>
                </div>
              ))}
            </div>
          </fieldset>
        )}
        <Field label="افزودن تصویر (جلو، پشت، جزئیات)">
          <input type="file" name="images" multiple accept="image/jpeg,image/png,image/webp" className="input" />
        </Field>
        <button className="btn-primary">ذخیره</button>
      </form>
      {gown && (
        <form action={deleteGown}>
          <input type="hidden" name="id" value={gown.id} />
          <button className="btn text-red-700 hover:bg-red-50">حذف لباس (اگر پرو داشته باشد مخفی می‌شود)</button>
        </form>
      )}
    </div>
  );
}
