import {
  addDays,
  addMonths,
  format,
  isSameMonth,
  startOfMonth,
  endOfMonth,
} from "date-fns";

export const ISO = (d: Date) => format(d, "yyyy-MM-dd");

/** English month name (avoids `format` + UTC midnight = wrong local day in US timezones). */
const MONTH_NAMES_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function monthNameLong(month1to12: number): string {
  if (month1to12 < 1 || month1to12 > 12) return "";
  return MONTH_NAMES_LONG[month1to12 - 1]!;
}

/**
 * Monday–Sunday grid for a calendar month, computed entirely in UTC so
 * `YYYY-MM-DD` and local/browser timezone do not desync the grid
 * (mixing `Date.UTC` with date-fns's local `startOfWeek` used to break this).
 */
export function monthGridCells(
  year: number,
  month1to12: number,
): { iso: string; inMonth: boolean; day: number }[] {
  const pad2 = (n: number) => n.toString().padStart(2, "0");
  const toIso = (y: number, m: number, d: number) =>
    `${y}-${pad2(m)}-${pad2(d)}`;
  const first = new Date(Date.UTC(year, month1to12 - 1, 1));
  const firstDow = first.getUTCDay();
  const fromMonday = firstDow === 0 ? 6 : firstDow - 1;
  const gridStart = new Date(first);
  gridStart.setUTCDate(gridStart.getUTCDate() - fromMonday);
  const lastDayN = new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
  const last = new Date(
    Date.UTC(year, month1to12 - 1, lastDayN),
  );
  const toSunday = (7 - last.getUTCDay()) % 7;
  const gridEnd = new Date(last);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + toSunday);
  const out: { iso: string; inMonth: boolean; day: number }[] = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) {
    const y = cur.getUTCFullYear();
    const m = cur.getUTCMonth() + 1;
    const d = cur.getUTCDate();
    const inMonth = y === year && m === month1to12;
    out.push({ iso: toIso(y, m, d), inMonth, day: d });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/** @deprecated use monthGridCells; kept for any external use */
export function monthGridDates(year: number, month1to12: number): Date[] {
  return monthGridCells(year, month1to12).map(
    ({ iso }) => new Date(`${iso}T00:00:00.000Z`),
  );
}

export function dayInRange(day: string, start: string, end: string) {
  return day >= start && day <= end;
}

/** Local calendar date (YYYY-MM-DD) for "today" comparisons. */
export function todayISODateLocal() {
  const t = new Date();
  const y = t.getFullYear();
  const m = t.getMonth() + 1;
  const d = t.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function rangeOverlapsMonth(
  year: number,
  month1to12: number,
  start: string,
  end: string,
) {
  const m = String(month1to12).padStart(2, "0");
  const first = `${year}-${m}-01`;
  const lastD = new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
  const last = `${year}-${m}-${String(lastD).padStart(2, "0")}`;
  return end >= first && start <= last;
}

/** e.g. "Jan 5 – Mar 20" for same year; includes years when they differ. */
export function formatRangeLabel(isoStart: string, isoEnd: string) {
  const p = (s: string) => s.split("-").map(Number) as [number, number, number];
  const [sy, sm, sd] = p(isoStart);
  const [ey, em, ed] = p(isoEnd);
  if (!sy || !sm || !sd || !ey || !em || !ed) return `${isoStart} – ${isoEnd}`;

  const sMon = monthNameLong(sm)!.slice(0, 3);
  const eMon = monthNameLong(em)!.slice(0, 3);
  if (isoStart === isoEnd) {
    if (ey !== sy) return `${sMon} ${sd}, ${sy}`;
    return `${sMon} ${sd}`;
  }
  if (sy === ey && sm === em) return `${sMon} ${sd} – ${ed}`;
  if (sy === ey) return `${sMon} ${sd} – ${eMon} ${ed}, ${ey}`;
  return `${sMon} ${sd}, ${sy} – ${eMon} ${ed}, ${ey}`;
}

/**
 * True when `day` is **today’s local calendar date** (YYYY-MM-DD).
 * String equality avoids timezone bugs from `Date.UTC` + `isToday` (only one
 * such day exists, so a single cell can match in the current grid).
 */
export function isTodayStr(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  return day === todayISODateLocal();
}

export function isSameMonthStr(
  day: string,
  year: number,
  month1to12: number,
) {
  const [y, m] = day.split("-").map(Number);
  return y === year && m === month1to12;
}

export { addDays, addMonths, format, isSameMonth, startOfMonth, endOfMonth };
