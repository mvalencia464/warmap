import { NavLink } from "react-router-dom";
import { clsx } from "clsx";
import { pathForToday } from "../lib/todayPath";

const ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

const tab = clsx(
  "shrink-0 snap-center rounded-md px-2.5 py-1.5 text-xs font-medium tracking-tight",
  "text-stone-500 transition",
  "hover:bg-stone-100 hover:text-stone-800",
);

const tabActive = clsx(
  "shrink-0 snap-center rounded-md px-2.5 py-1.5 text-xs font-semibold tracking-tight",
  "bg-stone-800 text-white",
);

type Props = {
  year: number;
};

/**
 * Bottom strip: DASH (year) + 12 month tabs, like spreadsheet tab bar.
 */
export function YearMonthNav({ year }: Props) {
  const todayPath = pathForToday();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200/90 bg-stone-50/95 py-1.5 backdrop-blur-sm supports-[padding:max(0px)]:pb-[max(0.4rem,env(safe-area-inset-bottom,0px))]"
      aria-label="Year and month navigation"
    >
      <div className="no-scrollbar mx-auto flex max-w-6xl snap-x items-center justify-start gap-0.5 overflow-x-auto px-3 sm:justify-center sm:px-4">
        <NavLink
          to={todayPath}
          className={({ isActive }) => (isActive ? tabActive : tab)}
        >
          TODAY
        </NavLink>
        <NavLink
          to={`/?year=${year}`}
          end
          className={({ isActive }) => (isActive ? tabActive : tab)}
        >
          DASH
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
