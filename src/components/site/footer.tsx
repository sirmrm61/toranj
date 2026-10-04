import Link from "next/link";
import { site } from "@/content/site";
import { whatsappLink } from "@/lib/format";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="mt-auto bg-espresso text-white/80">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-md text-sm leading-7">{site.description}</p>
          <p className="mt-4 text-xs text-white/50">{site.aiDisclosure}</p>
        </div>
        <div>
          <h3 className="mb-4 font-semibold text-white">دسترسی سریع</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/gowns?type=BRIDAL" className="hover:text-gold-light">لباس عروس</Link></li>
            <li><Link href="/gowns?type=ENGAGEMENT" className="hover:text-gold-light">لباس نامزدی</Link></li>
            <li><Link href="/gowns?type=EVENING" className="hover:text-gold-light">لباس مجلسی</Link></li>
            <li><Link href="/gowns?mode=RENT" className="hover:text-gold-light">اجاره لباس</Link></li>
            <li><Link href="/tryon" className="hover:text-gold-light">پرو آنلاین</Link></li>
            <li><Link href="/privacy" className="hover:text-gold-light">حریم خصوصی</Link></li>
            <li><Link href="/terms" className="hover:text-gold-light">قوانین و شرایط</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-semibold text-white">تماس با ما</h3>
          <address className="space-y-2 text-sm not-italic leading-7">
            <p>{site.address}</p>
            <p>
              <a href={`tel:${site.phone}`} className="hover:text-gold-light" dir="ltr">{site.phoneDisplay}</a>
            </p>
            <p className="flex gap-4">
              <a href={whatsappLink(site.whatsapp)} target="_blank" rel="noopener" className="hover:text-gold-light">واتس‌اپ</a>
              <a href={`https://t.me/${site.telegram}`} target="_blank" rel="noopener" className="hover:text-gold-light">تلگرام</a>
              <a href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noopener" className="hover:text-gold-light">اینستاگرام</a>
            </p>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {site.name} — همه حقوق محفوظ است.
      </div>
    </footer>
  );
}
