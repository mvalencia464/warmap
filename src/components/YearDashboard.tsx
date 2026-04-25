import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { AppShell } from "./Layout";
import { MiniMonth } from "./MiniMonth";
import { ProjectsKeyPanel } from "./ProjectsKeyPanel";
import { PlanRangeModal } from "./PlanRangeModal";
import { getQuoteForDate } from "../lib/dailyQuote";

const MONTHS: readonly [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
];

export function YearDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const yParam = searchParams.get("year");
  const year = useMemo(() => {
    if (yParam && /^\d{4}$/.test(yParam)) {
      const n = Number(yParam);
      if (n >= 1970 && n <= 2100) return n;
    }
    return new Date().getFullYear();
  }, [yParam]);

  const yearParamOk = Boolean(
    yParam && /^\d{4}$/.test(yParam) && Number(yParam) === year,
  );
  useEffect(() => {
    if (yearParamOk) return;
    setSearchParams({ year: String(year) }, { replace: true });
  }, [yearParamOk, year, setSearchParams]);
  const [planModal, setPlanModal] = useState<{
    prefill: { start: string; end: string } | null;
  } | null>(null);
  /** First picked day for paint-a-range; shared across all mini-months. */
  const [rangePaintAnchor, setRangePaintAnchor] = useState<string | null>(null);

  const onPaintRange = useCallback((start: string, end: string) => {
    setRangePaintAnchor(null);
    setPlanModal({ prefill: { start, end } });
  }, []);

  const handleRangeDayClick = useCallback(
    (iso: string) => {
      if (rangePaintAnchor === null) {
        setRangePaintAnchor(iso);
      } else {
        const a = rangePaintAnchor;
        const b = iso;
        onPaintRange(a < b ? a : b, a < b ? b : a);
      }
    },
    [rangePaintAnchor, onPaintRange],
  );

  useEffect(() => {
    if (rangePaintAnchor === null) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRangePaintAnchor(null);
    };
    document.addEventListener("keydown", h, true);
    return () => document.removeEventListener("keydown", h, true);
  }, [rangePaintAnchor]);
  const categories = useQuery(api.categories.list, {});
  const plans = useQuery(api.plans.listInYear, { year });
  const bootstrap = useMutation(api.categories.bootstrap);
  const ensureColorPalette = useMutation(api.categories.ensureColorPalette);

  useEffect(() => {
    void bootstrap();
    void ensureColorPalette();
  }, [bootstrap, ensureColorPalette]);

  const categoryById = useMemo(() => {
    const m = new Map<string, { colorKey: string; name: string }>();
    for (const c of categories ?? []) {
      m.set(c._id, { colorKey: c.colorKey, name: c.name });
    }
    return m;
  }, [categories]);
  const dailyQuote = useMemo(() => getQuoteForDate(new Date()), []);

  if (categories === undefined || plans === undefined) {
    return (
      <AppShell year={year} quote={dailyQuote}>
        <p className="text-sm text-stone-500">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell year={year} quote={dailyQuote}>
      <div className="mb-4 flex flex-wrap items-end justify-end gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-600">
            Year
            <select
              className="ml-1.5 rounded-md border border-stone-200 bg-white px-2 py-1 text-stone-900"
              value={year}
              onChange={(e) => {
                const n = Number(e.target.value);
                setSearchParams({ year: String(n) }, { replace: true });
              }}
            >
              {Array.from({ length: 21 }, (_, i) => 2015 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {planModal && (
        <PlanRangeModal
          key={
            planModal.prefill
              ? `c-${planModal.prefill.start}|${planModal.prefill.end}`
              : "c-new"
          }
          year={year}
          prefill={planModal.prefill}
          plansInYear={plans}
          categories={categories}
          onClose={() => {
            setPlanModal(null);
            setRangePaintAnchor(null);
          }}
        />
      )}

      <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <div className="grid auto-rows-min grid-cols-1 grid-flow-row gap-8 [direction:ltr] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {MONTHS.map((m) => (
              <MiniMonth
                key={`${year}-${m}`}
                year={year}
                month={m}
                plans={plans}
                categoryById={categoryById}
                rangePaintAnchor={rangePaintAnchor}
                onRangeDayClick={handleRangeDayClick}
              />
            ))}
          </div>
        </div>
        <ProjectsKeyPanel
          year={year}
          plans={plans}
          categories={categories}
        />
      </div>
    </AppShell>
  );
}
