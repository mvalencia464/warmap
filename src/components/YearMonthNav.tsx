import { NavLink } from "react-router-dom";
import { clsx } from "clsx";

const ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

const tab = clsx(
  "shrink-0 snap-center rounded-md px-2.5 py-1.5 text-xs font-medium tracking-tight",
  "text-stone-500 transition dark:text-stone-400",
  "hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-stone-800/80 dark:hover:text-stone-100",
);

const tabActive = clsx(
  "shrink-0 snap-center rounded-md px-2.5 py-1.5 text-xs font-semibold tracking-tight",
  "bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900",
);

type Props = {
  year: number;
};

/**
 * Top strip: PLAN (year) + 12 month tabs.
 */
export function YearMonthNav({ year }: Props) {
  return (
    <nav
      className="border-b border-stone-200/90 bg-stone-50/95 py-1.5 backdrop-blur-sm dark:border-stone-800/90 dark:bg-stone-950/95"
      aria-label="Year and month navigation"
    >
      <div className="no-scrollbar mx-auto flex max-w-6xl snap-x items-center justify-start gap-0.5 overflow-x-auto px-3 sm:justify-center sm:px-4">
        <NavLink
          to={`/?year=${year}`}
          end
          className={({ isActive }) => (isActive ? tabActive : tab)}
        >
          PLAN
        </NavLink>
        {ABBR.map((label, i) => {
          const m = i + 1;
          return (
            <NavLink
              key={label}
              to={`/${year}/${String(m).padStart(2, "0")}`}
              className={({ isActive }) => (isActive ? tabActive : tab)}
            >
              {label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
