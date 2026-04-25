import { Link } from "react-router-dom";
import { clsx } from "clsx";
import { isTodayStr, monthGridCells, monthNameLong } from "../lib/calendar";
import { dashboardBarFor, dashboardCellWashFor } from "../lib/colors";
import type { ColorKey } from "../lib/colors";
import { planHintsForDay } from "../lib/planHints";
import type { Doc } from "../../convex/_generated/dataModel";

type Plan = Doc<"plans">;

type Props = {
  year: number;
  month: number;
  plans: Plan[];
  categoryById: Map<string, { colorKey: string }>;
  /**
   * In-flight first day for paint selection — comes from the parent (year) so
   * ranges can cross mini-months without a second spurious “first click”.
   */
  rangePaintAnchor: string | null;
  /** In-month day click: parent decides first day vs. completing the range. */
  onRangeDayClick?: (iso: string) => void;
};

const weekday = ["M", "T", "W", "T", "F", "S", "S"] as const;

export function MiniMonth({
  year,
  month,
  plans,
  categoryById,
  rangePaintAnchor,
  onRangeDayClick,
}: Props) {
  const days = monthGridCells(year, month);
  const label = monthNameLong(month);

  return (
    <div className="flex min-w-0 flex-col gap-1.5" dir="ltr">
      <div className="flex items-baseline justify-between gap-2 px-0.5">
        <h2 className="text-sm font-medium tracking-tight text-stone-700 dark:text-stone-200">
          {label}
        </h2>
        <Link
          to={`/${year}/${String(month).padStart(2, "0")}`}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-xs font-medium text-stone-400 transition hover:text-stone-700 dark:hover:text-stone-200"
        >
          open
        </Link>
      </div>
      <div className="grid grid-cols-7 text-center text-[0.6rem] font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">
        {weekday.map((d) => (
          <div key={d} className="py-0.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid min-w-0 auto-rows-min grid-cols-7 select-none border-t border-l border-stone-200/50 dark:border-stone-700/50">
        {days.map((cell) => {
          const pfd = planHintsForDay(cell.iso, plans, categoryById);
          const isToday = isTodayStr(cell.iso);
          const primary: ColorKey | null =
            pfd[0]?.key != null
              ? (pfd[0]!.key as ColorKey)
              : null;
          const anchorHi =
            Boolean(onRangeDayClick) &&
            Boolean(rangePaintAnchor) &&
            cell.inMonth &&
            cell.iso === rangePaintAnchor;
          return (
            <div
              key={cell.iso}
              className={clsx(
                "flex min-h-7 flex-col justify-between p-0.5 text-left text-[0.7rem] font-medium tabular-nums",
                "border-b border-r border-stone-200/50 dark:border-stone-700/50",
                cell.inMonth
                  ? "bg-white/90 dark:bg-stone-900/50"
                  : "bg-stone-100/80 text-stone-300 dark:bg-stone-900/20 dark:text-stone-500",
                cell.inMonth &&
                  pfd.length > 0 &&
                  primary &&
                  dashboardCellWashFor(primary),
                cell.inMonth
                  && isToday
                  && "z-[1] bg-amber-50/80 ring-2 ring-inset ring-amber-500/80",
                anchorHi && "z-[1] ring-1 ring-inset ring-sky-400/80",
              )}
              title={pfd.map((x) => x.plan.title).join(", ")}
              onClick={(e) => {
                e.stopPropagation();
                if (!cell.inMonth || !onRangeDayClick) return;
                if ((e.target as HTMLElement).closest("[data-plan-bar]")) return;
                onRangeDayClick(cell.iso);
              }}
            >
              <div
                className={clsx(
                  "pl-0.5 leading-none",
                  cell.inMonth ? "text-stone-500" : "text-stone-300",
                  cell.inMonth
                    && isToday
                    && "font-bold text-amber-900",
                )}
              >
                {cell.day}
              </div>
              {cell.inMonth && pfd.length > 0 && (
                <div className="mt-auto flex w-full flex-col gap-px">
                  {pfd.slice(0, 3).map(({ key, plan }) => (
                    <div
                      key={plan._id}
                      data-plan-bar
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={clsx(
                        "h-1 w-full cursor-default rounded-[1px] shadow-sm",
                        dashboardBarFor(key as ColorKey),
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
