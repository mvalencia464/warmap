import { YearMonthNav } from "./YearMonthNav";
import { NavActions } from "./NavActions";

type DailyQuote = {
  label: string;
  text: string;
  author: string;
};

type Props = { children: React.ReactNode; year: number; quote?: DailyQuote | null };

function ShellFrame({ children, year, quote }: Props) {
  return (
    <div className="min-h-svh text-stone-800 dark:text-stone-200">
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-sm dark:border-stone-800/80 dark:bg-stone-900/80">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl dark:text-stone-50">
              PLAN
            </h1>
            <NavActions />
          </div>
          {quote ? (
            <div className="mx-auto mt-3 max-w-4xl text-center">
              <p className="text-sm leading-relaxed text-stone-700 sm:text-base dark:text-stone-300">
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {quote.label}:
                </span>{" "}
                "{quote.text}"{" "}
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  - {quote.author}
                </span>
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

export function Layout(props: Props) {
  return <ShellFrame {...props} />;
}

export function AppShell(props: Props) {
  return <ShellFrame {...props} />;
}
