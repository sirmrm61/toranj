import { toPersianDigits } from "@/lib/phone";

export const fa = (n: number | string) => toPersianDigits(typeof n === "number" ? n.toLocaleString("en-US").replace(/,/g, "٬") : n);

export function toman(amountIrr: number) {
  return `${fa(Math.round(amountIrr / 10))} تومان`;
}

export function whatsappLink(phone: string, text?: string) {
  return `https://wa.me/${phone}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
