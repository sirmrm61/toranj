import type { Metadata } from "next";
import { FaqList } from "@/components/site/faq-list";
import { JsonLd } from "@/components/site/json-ld";
import { faqLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "سوالات متداول",
  description: "پاسخ سوالات رایج درباره زمان دوخت، اجاره، بیعانه، رزرو و پرو آنلاین لباس عروس در مزون ترنج.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <div className="container-x max-w-3xl py-12">
      <JsonLd data={faqLd()} />
      <p className="eyebrow">راهنما</p>
      <h1 className="section-title mt-2 mb-8">سوالات متداول</h1>
      <FaqList />
    </div>
  );
}
