import { Link } from "react-router-dom";
import { YearMonthNav } from "./YearMonthNav";
import { NavActions } from "./NavActions";

type DailyQuote = {
  label: string;
  text: string;
  author: string;
};

type Props = { children: React.ReactNode; year: number; quote?: DailyQuote | null };

export function Layout({ children, year }: Props) {
  return (
    <div className="min-h-svh text-stone-800">
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
      <YearMonthNav year={year} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

export function AppShell({
  children,
  year,
  quote,
}: {
  children: React.ReactNode;
  year: number;
  quote?: DailyQuote | null;
}) {
  return (
    <div className="min-h-svh text-stone-800">
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">
                PLAN
              </h1>
            </div>
            <NavActions />
          </div>
          {quote ? (
            <div className="mx-auto mt-3 max-w-4xl text-center">
              <p className="text-sm leading-relaxed text-stone-700 sm:text-base">
                <span className="font-semibold text-stone-900">{quote.label}:</span>{" "}
                "{quote.text}"{" "}
                <span className="font-semibold text-stone-900">- {quote.author}</span>
              </p>
            </div>
          ) : null}
        </div>
      </header>
      <YearMonthNav year={year} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
