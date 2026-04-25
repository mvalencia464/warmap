import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { pickCategoryIdForNewPlan } from "../lib/pickCategoryForNewPlan";
import { ColorPalette } from "./ColorPalette";

const AUTO = "__auto__" as const;

type Props = {
  year: number;
  prefill: { start: string; end: string } | null;
  plansInYear: Doc<"plans">[];
  categories: Doc<"categories">[];
  onClose: () => void;
};

export function PlanRangeModal({
  year,
  prefill,
  plansInYear,
  categories,
  onClose,
}: Props) {
  const addPlan = useMutation(api.plans.add);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState(
    prefill ? prefill.start : `${year}-01-01`,
  );
  const [end, setEnd] = useState(
    prefill ? prefill.end : `${year}-01-07`,
  );
  const [colorChoice, setColorChoice] = useState<string>(AUTO);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!title.trim()) {
      setErr("Add a title.");
      return;
    }
    if (categories.length === 0) {
      setErr("No categories — refresh the page and try again.");
      return;
    }
    if (end < start) {
      setErr("End must be on or after start.");
      return;
    }
    const categoryId =
      colorChoice === AUTO
        ? pickCategoryIdForNewPlan(categories, plansInYear)
        : (colorChoice as Id<"categories">);
    setSaving(true);
    try {
      await addPlan({
        title: title.trim(),
        categoryId,
        startDate: start,
        endDate: end,
      });
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="New project range" onBackdropMouseDown={onClose}>
      <p className="mt-0.5 text-sm text-stone-500">
        Shown on the year grid and in the Key. Use A to pick a less-used
        color automatically, or choose a swatch.
      </p>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(e) => void handleSubmit(e)}
      >
        <label className="block text-sm text-stone-600">
          Title
          <input
            className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2 text-stone-900"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Q2 launch, vacation, course…"
          />
        </label>
        <div className="text-sm text-stone-600">
          <p className="mb-1.5 font-medium">Color</p>
          <p className="mb-1.5 text-xs font-normal text-stone-500">
            Tap a swatch, or A for automatic balance.
          </p>
          <ColorPalette
            value={colorChoice}
            onChange={setColorChoice}
            categories={categories}
            showAuto
            autoToken={AUTO}
            className="mt-0.5"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <DateField
            label="Start"
            value={start}
            onChange={setStart}
          />
          <DateField
            label="End"
            value={end}
            onChange={setEnd}
          />
        </div>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <Actions saving={saving} onClose={onClose} submitLabel="Add range" />
      </form>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onBackdropMouseDown,
  children,
}: {
  title: string;
  onBackdropMouseDown: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/20 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal
      onMouseDown={(e) => e.target === e.currentTarget && onBackdropMouseDown()}
    >
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
        <h3 className="text-base font-semibold text-stone-900">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <label className="text-sm text-stone-600">
      {label}
      <input
        type="date"
        className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50/50 px-2 py-2 text-stone-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Actions({
  saving,
  onClose,
  submitLabel,
}: {
  saving: boolean;
  onClose: () => void;
  submitLabel: string;
}) {
  return (
    <div className="mt-2 flex justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-stone-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}
