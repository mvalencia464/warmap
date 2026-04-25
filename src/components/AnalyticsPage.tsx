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

  const safeByDay = data?.byDay ?? [];
  const safeTopByProject = data?.topByProject ?? [];

  const maxDayMinutes = useMemo(() => {
    if (safeByDay.length === 0) return 1;
    return Math.max(1, ...safeByDay.map((d) => d.minutes));
  }, [safeByDay]);

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
        </header>

        {!data ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-500 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-400">
            Loading analytics...
          </div>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-xl border border-rose-200/70 bg-rose-50/50 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
                <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase dark:text-stone-400">
                  Today
                </p>
                <p className="mt-2 text-2xl font-semibold text-rose-700 dark:text-rose-300">
                  {data.today.minutes}m
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{data.today.sessions} sessions</p>
              </article>
              <article className="rounded-xl border border-rose-200/70 bg-rose-50/50 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
                <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase dark:text-stone-400">
                  Last 7 days
                </p>
                <p className="mt-2 text-2xl font-semibold text-rose-700 dark:text-rose-300">
                  {data.week.minutes}m
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{data.week.sessions} sessions</p>
              </article>
              <article className="rounded-xl border border-rose-200/70 bg-rose-50/50 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
                <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase dark:text-stone-400">
                  Last 30 days
                </p>
                <p className="mt-2 text-2xl font-semibold text-rose-700 dark:text-rose-300">
                  {data.month.minutes}m
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{data.month.sessions} sessions</p>
              </article>
            </section>

            <section className="rounded-xl border border-rose-200/70 bg-white p-4 dark:border-rose-900/60 dark:bg-stone-900/40">
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Weekly activity</h3>
              <div className="mt-3 flex h-40 items-end gap-2">
                {safeByDay.map((d) => {
                  const h = Math.max(8, Math.round((d.minutes / maxDayMinutes) * 120));
                  return (
                    <div key={d.day} className="group relative flex min-w-0 flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-md bg-rose-200/80 transition group-hover:bg-rose-500/80 dark:bg-rose-900/60 dark:group-hover:bg-rose-500/70"
                        style={{ height: `${h}px` }}
                      />
                      <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-10 -translate-x-1/2 rounded-md border border-rose-200 bg-white px-2 py-1 text-[10px] opacity-0 shadow-sm transition group-hover:opacity-100 dark:border-rose-900/60 dark:bg-stone-900">
                        <p className="font-semibold text-stone-700 dark:text-stone-200">{d.day}</p>
                        <p className="text-stone-500 dark:text-stone-400">{d.minutes} minutes focused</p>
                      </div>
                      <span className="text-[10px] font-semibold tracking-wide text-stone-500 dark:text-stone-400">
                        {dayShort(d.day)}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400">{d.minutes}m</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-rose-200/70 bg-white p-4 dark:border-rose-900/60 dark:bg-stone-900/40">
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Top projects</h3>
              {safeTopByProject.length === 0 ? (
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">No completed sessions yet.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {safeTopByProject.map((row) => (
                    <li key={row.projectTitle} className="flex items-center justify-between text-sm">
                      <span className="truncate text-stone-700 dark:text-stone-200">{row.projectTitle}</span>
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
