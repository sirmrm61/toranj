import { site } from "@/content/site";
import { whatsappLink } from "@/lib/format";

/** Always-visible quick contact (PRD: WhatsApp / call buttons on every page). */
export function ContactFab() {
  return (
    <div className="fixed bottom-5 left-5 z-30 flex flex-col gap-3">
      <a
        href={whatsappLink(site.whatsapp, "سلام، برای رزرو وقت پرو لباس عروس پیام می‌دهم.")}
        target="_blank"
        rel="noopener"
        aria-label="گفتگو در واتس‌اپ"
        className="grid h-12 w-12 place-items-center rounded-full bg-[#25d366] text-white shadow-lg transition hover:scale-105"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.2Z" />
        </svg>
      </a>
      <a
        href={`tel:${site.phone}`}
        aria-label="تماس تلفنی"
        className="grid h-12 w-12 place-items-center rounded-full bg-espresso text-white shadow-lg transition hover:scale-105"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
        </svg>
      </a>
    </div>
  );
}
