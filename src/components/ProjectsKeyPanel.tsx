import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatRangeLabel } from "../lib/calendar";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { ColorPalette } from "./ColorPalette";

type Plan = Doc<"plans">;
type Category = Doc<"categories">;

type Props = {
  plans: Plan[];
  categories: Category[];
  year: number;
};

function KeyPlanRow({
  plan,
  categories,
  range,
}: {
  plan: Plan;
  categories: Category[];
  range: string;
}) {
  const update = useMutation(api.plans.update);
  const [title, setTitle] = useState(plan.title);
  const [start, setStart] = useState(plan.startDate);
  const [end, setEnd] = useState(plan.endDate);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(plan.title);
    setStart(plan.startDate);
    setEnd(plan.endDate);
    setErr("");
  }, [plan._id, plan.title, plan.startDate, plan.endDate, plan.categoryId]);

  const persist = useCallback(
    async (patch: {
      title?: string;
      startDate?: string;
      endDate?: string;
      categoryId?: Id<"categories">;
    }) => {
      setErr("");
      const nextTitle = (patch.title ?? title).trim();
      const nextStart = patch.startDate ?? start;
      const nextEnd = patch.endDate ?? end;
      const nextCat = patch.categoryId ?? plan.categoryId;
      if (!nextTitle) {
        setErr("Title required.");
        return;
      }
      if (nextEnd < nextStart) {
        setErr("End must be on or after start.");
        return;
      }
      if (
        nextTitle === plan.title
        && nextStart === plan.startDate
        && nextEnd === plan.endDate
        && nextCat === plan.categoryId
      ) {
        return;
      }
      setSaving(true);
      try {
        await update({
          id: plan._id,
          title: nextTitle,
          startDate: nextStart,
          endDate: nextEnd,
          categoryId: nextCat,
        });
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not save");
        setTitle(plan.title);
        setStart(plan.startDate);
        setEnd(plan.endDate);
      } finally {
        setSaving(false);
      }
    },
    [title, start, end, plan, update],
  );

  const onTitleBlur = () => {
    if (title.trim() === plan.title) return;
    void persist({ title });
  };
  const onDateBlur = () => {
    if (start === plan.startDate && end === plan.endDate) return;
    void persist({ startDate: start, endDate: end });
  };
  const onColorChange = (categoryId: string) => {
    if (categoryId === plan.categoryId) return;
    void persist({ categoryId: categoryId as Id<"categories"> });
  };

  return (
    <li className="flex items-stretch gap-0.5 px-2 py-1.5">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <ColorPalette
            value={plan.categoryId}
            onChange={onColorChange}
            categories={categories}
            showAuto={false}
            size="sm"
            compactStyle="minimal"
            className="shrink-0"
          />
          <input
            className="min-w-0 flex-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-sm font-medium text-stone-800"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={onTitleBlur}
            maxLength={200}
            disabled={saving}
            aria-label="Project name"
          />
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-1.5 sm:grid-cols-2">
          <input
            type="date"
            className="w-full min-w-0 rounded-md border border-stone-200 bg-stone-50/50 px-1.5 py-1 text-xs text-stone-900"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            onBlur={onDateBlur}
            disabled={saving}
            aria-label="Start date"
          />
          <input
            type="date"
            className="w-full min-w-0 rounded-md border border-stone-200 bg-stone-50/50 px-1.5 py-1 text-xs text-stone-900"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            onBlur={onDateBlur}
            disabled={saving}
            aria-label="End date"
          />
        </div>
        <p
          className="text-xs tabular-nums text-stone-400"
          title="Same range, compact label"
        >
          {range}
        </p>
        {err ? (
          <p className="text-xs text-rose-600">{err}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-stretch justify-center">
        <KeyDeleteButton plan={plan} />
      </div>
    </li>
  );
}

function KeyDeleteButton({ plan }: { plan: Plan }) {
  const remove = useMutation(api.plans.remove);
  return (
    <button
      type="button"
      className="cursor-pointer rounded px-1.5 py-1 text-stone-300 transition hover:bg-stone-100 hover:text-rose-600"
      title="Delete this range"
      aria-label={`Delete “${plan.title}”`}
      onClick={async (e) => {
        e.stopPropagation();
        if (!confirm("Delete this project range from the calendar?")) {
          return;
        }
        try {
          await remove({ id: plan._id });
        } catch (e) {
          alert(e instanceof Error ? e.message : "Could not delete");
        }
      }}
    >
      <span className="sr-only">Delete</span>
      <span className="text-base leading-none" aria-hidden>×</span>
    </button>
  );
}

export function ProjectsKeyPanel({
  plans,
  year,
  categories,
}: Props) {
  const rows = useMemo(() => {
    return plans
      .slice()
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map((p) => ({
        plan: p,
        range: formatRangeLabel(p.startDate, p.endDate),
      }));
  }, [plans]);

  return (
    <section
      className="w-full shrink-0 border border-stone-200 bg-white shadow-sm xl:sticky xl:top-4 xl:max-w-xs xl:self-start"
      aria-labelledby="project-key-heading"
    >
      <h2
        id="project-key-heading"
        className="bg-stone-900 px-3 py-2 text-sm font-semibold tracking-wide text-white"
      >
        Key
      </h2>
      {rows.length === 0 ? (
        <p className="p-3 text-sm text-stone-500">
          No project ranges in {year} yet. Add one with + date range or by painting
          a range on a month.
        </p>
      ) : (
        <ul className="max-h-[min(60vh,28rem)] divide-y divide-stone-200 overflow-y-auto text-sm">
          {rows.map(({ plan, range }) => (
            <KeyPlanRow
              key={plan._id}
              plan={plan}
              categories={categories}
              range={range}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
