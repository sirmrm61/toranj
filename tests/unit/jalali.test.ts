import { describe, expect, it } from "vitest";
import { gregorianToJalali, jalaliMonthLength, jalaliToGregorian, parseJalaliDate } from "@/lib/jalali";

describe("jalali calendar", () => {
  it("converts Nowruz dates", () => {
    expect(jalaliToGregorian(1403, 1, 1)).toEqual({ gy: 2024, gm: 3, gd: 20 });
    expect(jalaliToGregorian(1404, 1, 1)).toEqual({ gy: 2025, gm: 3, gd: 21 });
    expect(gregorianToJalali(2026, 10, 4)).toEqual({ jy: 1405, jm: 7, jd: 12 });
  });

  it("knows leap Esfand", () => {
    expect(jalaliMonthLength(1403, 12)).toBe(30);
    expect(jalaliMonthLength(1404, 12)).toBe(29);
  });

  it("parses Persian and Latin digits and rejects invalid days", () => {
    expect(parseJalaliDate("۱۴۰۵/۰۷/۱۲")?.toISOString().slice(0, 10)).toBe("2026-10-04");
    expect(parseJalaliDate("1405-7-12")?.toISOString().slice(0, 10)).toBe("2026-10-04");
    expect(parseJalaliDate("1404/12/30")).toBeNull();
    expect(parseJalaliDate("1405/13/01")).toBeNull();
    expect(parseJalaliDate("hello")).toBeNull();
  });
});
