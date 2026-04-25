import { useEffect, useId } from "react";
import { useHelp } from "../HelpContext";

const rows: { label: string; keys: string[]; detail?: string }[] = [
  { label: "Open this help", keys: ["?"] },
  { label: "Go to today (current month view)", keys: ["G", "T"], detail: "Press G, then T (like Gmail)" },
  { label: "Close this panel, cancel new task, exit title edit", keys: ["Esc"] },
  { label: "Use year navigation", keys: ["DASH"], detail: "Bottom bar: DASH = year, months = that month" },
  { label: "Save a task name while editing", keys: ["Enter"] },
  { label: "Move a task to another day or row", keys: ["Drag"] },
  { label: "Edit a task’s title", keys: ["Double-click"] },
  {
    label: "Paint a project range (year view)",
    keys: ["2 clicks"],
    detail:
      "Click a day in one mini-month, then a second day in any month on the year (order doesn’t matter). Press Esc to cancel the first pick.",
  },
  { label: "Add a project with a date picker (year view)", keys: ["+ range"] },
  {
    label: "Jump to today (same as G then T)",
    keys: ["Today", "TODAY"],
    detail: "“Today” in the header, or the TODAY tab first in the bottom bar.",
  },
];

function Kb({ k }: { k: string }) {
  if (
    k.length > 3
    && k !== "Drag"
    && k !== "Double-click"
    && k !== "DASH"
    && k !== "+ range"
    && k !== "2 clicks"
    && k !== "Today"
    && k !== "TODAY"
  ) {
    return <span className="whitespace-nowrap text-stone-500">{k}</span>;
  }
  return (
    <kbd
      className="inline-block min-w-[1.1rem] rounded border border-stone-300/90 bg-stone-100/90 px-1.5 py-0.5 text-center font-mono text-xs font-medium text-stone-800 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]"
    >
      {k}
    </kbd>
  );
}

export function HelpModal() {
  const { helpOpen, setHelpOpen } = useHelp();
  const id = useId();
  const titleId = `help-title-${id}`;

  useEffect(() => {
    if (!helpOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setHelpOpen(false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [helpOpen, setHelpOpen]);

  if (!helpOpen) return null;

  return (
    <div
      className="fixed inset-0 z-220 flex items-end justify-center bg-stone-900/25 p-4 pt-20 backdrop-blur-[2px] sm:items-center sm:pt-4"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && setHelpOpen(false)}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-0 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-stone-200 px-5 py-4 sm:px-6 sm:py-5">
          <h2
            id={titleId}
            className="text-lg font-semibold text-stone-900"
          >
            Shortcuts
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            A quick reference. With focus outside a text field, press{" "}
            <kbd className="rounded border border-stone-300/90 bg-stone-100/90 px-1 font-mono text-xs">?</kbd>{" "}
            to toggle this panel.
          </p>
        </div>
        <ul
          className="max-h-[min(50vh,22rem)] list-none space-y-0 overflow-y-auto px-5 py-2 sm:px-6"
        >
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex flex-col gap-1.5 border-b border-stone-100 py-2.5 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-stone-800">{row.label}</span>
                {row.keys.length > 0 ? (
                  <span className="flex flex-shrink-0 flex-wrap items-center justify-end gap-1">
                    {row.keys.map((k) => (
                      <Kb key={`${row.label}-${k}`} k={k} />
                    ))}
                  </span>
                ) : null}
              </div>
              {row.detail ? (
                <p className="text-xs leading-snug text-stone-500">
                  {row.detail}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="px-5 pb-3 text-xs leading-relaxed text-stone-500 sm:px-6">
          In a text field, single-key shortcuts (like{" "}
          <kbd className="rounded border border-stone-300/80 bg-stone-100/80 px-1 font-mono text-[0.7rem]">?</kbd>{" "}
          or the G+T go-today pair) are disabled so you can type normally.
        </p>
        <div className="flex items-center justify-end border-t border-stone-200 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setHelpOpen(false)}
            className="rounded-lg bg-stone-800 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
