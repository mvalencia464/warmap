import { clsx, type ClassValue } from "clsx";

const keys = [
  "rose",
  "amber",
  "emerald",
  "sky",
  "violet",
  "fuchsia",
  "slate",
] as const;

export type ColorKey = (typeof keys)[number];

/** All palette swatches, in display order. */
export const ALL_COLOR_KEYS: readonly ColorKey[] = keys;

export const DEFAULT_COLOR: ColorKey = "slate";

const bg: Record<ColorKey, string> = {
  rose: "bg-rose-100/80",
  amber: "bg-amber-100/80",
  emerald: "bg-emerald-100/80",
  sky: "bg-sky-100/80",
  violet: "bg-violet-100/80",
  fuchsia: "bg-fuchsia-100/80",
  slate: "bg-stone-200/60",
};

const text: Record<ColorKey, string> = {
  rose: "text-rose-800",
  amber: "text-amber-900",
  emerald: "text-emerald-900",
  sky: "text-sky-900",
  violet: "text-violet-900",
  fuchsia: "text-fuchsia-900",
  slate: "text-stone-700",
};

const ring: Record<ColorKey, string> = {
  rose: "ring-rose-200",
  amber: "ring-amber-200",
  emerald: "ring-emerald-200",
  sky: "ring-sky-200",
  violet: "ring-violet-200",
  fuchsia: "ring-fuchsia-200",
  slate: "ring-stone-300",
};

const cellTint: Record<ColorKey, string> = {
  rose: "bg-rose-100/50",
  amber: "bg-amber-100/50",
  emerald: "bg-emerald-100/50",
  sky: "bg-sky-100/50",
  violet: "bg-violet-100/50",
  fuchsia: "bg-fuchsia-100/50",
  slate: "bg-stone-200/40",
};

/** Obvious on year dashboard: cell wash + full-width color bars. */
const dashboardCellWash: Record<ColorKey, string> = {
  rose: "bg-rose-200/50",
  amber: "bg-amber-200/50",
  emerald: "bg-emerald-200/50",
  sky: "bg-sky-200/50",
  violet: "bg-violet-200/50",
  fuchsia: "bg-fuchsia-200/50",
  slate: "bg-stone-300/50",
};

const dashboardPlanBar: Record<ColorKey, string> = {
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  fuchsia: "bg-fuchsia-500",
  slate: "bg-stone-500",
};

/**
 * Month day cells: barely-there fill + 2px inset line at the bottom of the cell
 * (suggests a “span” without washing the whole day or the grid lines).
 */
const monthPlanHint: Record<ColorKey, string> = {
  rose:
    "bg-rose-50/20 shadow-[inset_0_-2px_0_0_rgb(244_63_94_/_0.28)] dark:bg-rose-900/8 dark:shadow-[inset_0_-2px_0_0_rgb(251_113_133_/_0.18)]",
  amber:
    "bg-amber-50/20 shadow-[inset_0_-2px_0_0_rgb(245_158_11_/_0.28)] dark:bg-amber-900/8 dark:shadow-[inset_0_-2px_0_0_rgb(251_191_36_/_0.18)]",
  emerald:
    "bg-emerald-50/20 shadow-[inset_0_-2px_0_0_rgb(16_185_129_/_0.28)] dark:bg-emerald-900/8 dark:shadow-[inset_0_-2px_0_0_rgb(52_211_153_/_0.18)]",
  sky:
    "bg-sky-50/20 shadow-[inset_0_-2px_0_0_rgb(14_165_233_/_0.28)] dark:bg-sky-900/8 dark:shadow-[inset_0_-2px_0_0_rgb(56_189_248_/_0.18)]",
  violet:
    "bg-violet-50/20 shadow-[inset_0_-2px_0_0_rgb(139_92_246_/_0.28)] dark:bg-violet-900/8 dark:shadow-[inset_0_-2px_0_0_rgb(167_139_250_/_0.18)]",
  fuchsia:
    "bg-fuchsia-50/20 shadow-[inset_0_-2px_0_0_rgb(192_38_211_/_0.28)] dark:bg-fuchsia-900/8 dark:shadow-[inset_0_-2px_0_0_rgb(217_70_239_/_0.18)]",
  slate:
    "bg-stone-100/30 shadow-[inset_0_-2px_0_0_rgb(120_113_108_/_0.28)] dark:bg-stone-800/12 dark:shadow-[inset_0_-2px_0_0_rgb(168_162_158_/_0.16)]",
};

const keySwatch: Record<ColorKey, string> = {
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  fuchsia: "bg-fuchsia-500",
  slate: "bg-stone-500",
};

export function dashboardCellWashFor(key: ColorKey) {
  return dashboardCellWash[key];
}

export function dashboardBarFor(key: ColorKey) {
  return dashboardPlanBar[key];
}

export function monthPlanHintClass(key: ColorKey) {
  return monthPlanHint[key];
}

export function keySwatchClass(key: ColorKey) {
  return keySwatch[key];
}

export function categoryPill(
  key: ColorKey,
  className?: ClassValue,
) {
  return clsx("rounded-full px-2 py-0.5 text-xs font-medium", bg[key], text[key], className);
}

export function dayCellTint(key: ColorKey) {
  return cellTint[key];
}

export function categoryRing(key: ColorKey) {
  return ring[key];
}

export function isColorKey(s: string): s is ColorKey {
  return (keys as readonly string[]).includes(s);
}
