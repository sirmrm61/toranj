"use client";

import { useMemo, useState } from "react";
import { JALALI_MONTHS, jalaliMonthLength, todayJalali } from "@/lib/jalali";
import { fa } from "@/lib/format";

/** Three selects (day / month / year) producing "YYYY/MM/DD" in the Jalali calendar. */
export function JalaliDateInput({ name, label, yearsAhead = 2, id }: { name: string; label: string; yearsAhead?: number; id?: string }) {
  const today = useMemo(() => todayJalali(), []);
  const [y, setY] = useState("");
  const [m, setM] = useState("");
  const [d, setD] = useState("");
  const days = y && m ? jalaliMonthLength(Number(y), Number(m)) : 31;
  const value = y && m && d ? `${y}/${m.padStart(2, "0")}/${d.padStart(2, "0")}` : "";
  const years = Array.from({ length: yearsAhead + 1 }, (_, i) => today.jy + i);

  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-3 gap-2" id={id}>
        <select aria-label="روز" className="input px-2" value={d} onChange={(e) => setD(e.target.value)}>
          <option value="">روز</option>
          {Array.from({ length: days }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {fa(n)}
            </option>
          ))}
        </select>
        <select aria-label="ماه" className="input px-2" value={m} onChange={(e) => setM(e.target.value)}>
          <option value="">ماه</option>
          {JALALI_MONTHS.map((n, i) => (
            <option key={n} value={i + 1}>
              {n}
            </option>
          ))}
        </select>
        <select aria-label="سال" className="input px-2" value={y} onChange={(e) => setY(e.target.value)}>
          <option value="">سال</option>
          {years.map((n) => (
            <option key={n} value={n}>
              {fa(String(n))}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}
