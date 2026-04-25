import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AppShell } from "./Layout";
import { getQuoteForDate } from "../lib/dailyQuote";

function dayShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();
}

export function AnalyticsPage() {
  const year = new Date().getFullYear();
  const quote = getQuoteForDate(new Date());
  const data = useQuery(api.focusAnalytics.summary, {});

  const maxDayMinutes = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, ...data.byDay.map((d) => d.minutes));
  }, [data]);

  return (
    <AppShell year={year} quote={quote}>
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase dark:text-stone-400">
            Analytics
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Focus insights
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Simple signal from your Pomodoro sessions, synced through Convex.
          </p>
        </header>

        {!data ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-500 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-400">
            Loading analytics...
          </div>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-900/40">
                <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase dark:text-stone-400">
                  Today
                </p>
                <p className="mt-2 text-2xl font-semibold text-stone-900 dark:text-stone-50">
                  {data.today.minutes}m
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{data.today.sessions} sessions</p>
              </article>
              <article className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-900/40">
                <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase dark:text-stone-400">
                  Last 7 days
                </p>
                <p className="mt-2 text-2xl font-semibold text-stone-900 dark:text-stone-50">
                  {data.week.minutes}m
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{data.week.sessions} sessions</p>
              </article>
              <article className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-900/40">
                <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase dark:text-stone-400">
                  Last 30 days
                </p>
                <p className="mt-2 text-2xl font-semibold text-stone-900 dark:text-stone-50">
                  {data.month.minutes}m
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{data.month.sessions} sessions</p>
              </article>
            </section>

            <section className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900/40">
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Weekly activity</h3>
              <div className="mt-3 flex h-40 items-end gap-2">
                {data.byDay.map((d) => {
                  const h = Math.max(8, Math.round((d.minutes / maxDayMinutes) * 120));
                  return (
                    <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded-md bg-stone-200/90 dark:bg-stone-700/90" style={{ height: `${h}px` }} />
                      <span className="text-[10px] font-semibold tracking-wide text-stone-500 dark:text-stone-400">
                        {dayShort(d.day)}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400">{d.minutes}m</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900/40">
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Top focus labels</h3>
              {data.topFocus.length === 0 ? (
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">No completed sessions yet.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {data.topFocus.map((row) => (
                    <li key={row.label} className="flex items-center justify-between text-sm">
                      <span className="truncate text-stone-700 dark:text-stone-200">{row.label}</span>
                      <span className="text-stone-500 dark:text-stone-400">{row.minutes}m</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
