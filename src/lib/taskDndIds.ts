export type DayDropId = `day-end:${string}`;
export type DayCellDropId = `day-cell:${string}`;

export function endDropId(iso: string): DayDropId {
  return `day-end:${iso}` as DayDropId;
}

/** Full day cell (background) — same drop behavior as `endDropId` (append / same-day to-end). */
export function dayCellDropId(iso: string): DayCellDropId {
  return `day-cell:${iso}` as DayCellDropId;
}
