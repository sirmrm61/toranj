import { describe, expect, it } from "vitest";
import { maskPhone, normalizeIranMobile, toLatinDigits } from "@/lib/phone";

describe("Iranian mobile normalization", () => {
  it.each([
    ["09121234567", "09121234567"],
    ["+989121234567", "09121234567"],
    ["00989121234567", "09121234567"],
    ["989121234567", "09121234567"],
    ["9121234567", "09121234567"],
    ["۰۹۱۲ ۱۲۳ ۴۵۶۷", "09121234567"],
    ["٠٩١٢١٢٣٤٥٦٧", "09121234567"],
  ])("%s → %s", (input, out) => expect(normalizeIranMobile(input)).toBe(out));

  it.each(["0912123456", "08121234567", "abc", "", "091212345678"])("rejects %s", (v) => expect(normalizeIranMobile(v)).toBeNull());

  it("converts digits and masks", () => {
    expect(toLatinDigits("۱۲۳")).toBe("123");
    expect(maskPhone("09121234567")).toBe("0912***4567");
  });
});
