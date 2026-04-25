import { Link } from "react-router-dom";
import { YearMonthNav } from "./YearMonthNav";
import { NavActions } from "./NavActions";

type Props = { children: React.ReactNode; year: number };

export function Layout({ children, year }: Props) {
  return (
    <div className="min-h-svh pb-20 text-stone-800">
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-6">
          <Link
            to={`/?year=${year}`}
            className="text-sm font-medium tracking-tight text-stone-500 transition hover:text-stone-800"
          >
            ← Year
          </Link>
          <h1 className="text-lg font-semibold tracking-tight text-stone-900 sm:text-xl">
            {year}
          </h1>
          <NavActions />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      <YearMonthNav year={year} />
    </div>
  );
}

export function AppShell({
  children,
  year,
}: {
  children: React.ReactNode;
  year: number;
}) {
  return (
    <div className="min-h-svh pb-20 text-stone-800">
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">
              Plan
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Year ranges and daily to-dos — minimal, at a glance.
            </p>
          </div>
          <NavActions />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      <YearMonthNav year={year} />
    </div>
  );
}
