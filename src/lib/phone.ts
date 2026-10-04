const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC = "٠١٢٣٤٥٦٧٨٩";

export function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (d) => {
    const p = PERSIAN.indexOf(d);
    return String(p >= 0 ? p : ARABIC.indexOf(d));
  });
}

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => PERSIAN[Number(d)]);
}

/** Normalizes Iranian mobile numbers to the 09xxxxxxxxx form; returns null when invalid. */
export function normalizeIranMobile(input: string): string | null {
  let s = toLatinDigits(input).replace(/[\s\-()]/g, "");
  if (s.startsWith("+98")) s = "0" + s.slice(3);
  else if (s.startsWith("0098")) s = "0" + s.slice(4);
  else if (s.startsWith("98") && s.length === 12) s = "0" + s.slice(2);
  else if (s.startsWith("9") && s.length === 10) s = "0" + s;
  return /^09\d{9}$/.test(s) ? s : null;
}

export function maskPhone(phone: string): string {
  return phone.length === 11 ? `${phone.slice(0, 4)}***${phone.slice(7)}` : phone;
}
