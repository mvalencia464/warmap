import { UserButton } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { useHelp } from "../HelpContext";
import { pathForToday } from "../lib/todayPath";

const btn = clsx(
  "shrink-0 rounded-md border border-stone-200/90 bg-white px-2.5 py-1 text-xs font-medium",
  "text-stone-600 shadow-sm transition",
  "hover:border-stone-300 hover:bg-stone-50/90",
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-500",
);

export function NavActions() {
  const nav = useNavigate();
  const { setHelpOpen } = useHelp();

  return (
    <div className="flex items-center justify-end gap-1.5 sm:gap-2">
      <UserButton appearance={{ elements: { userButtonBox: "ring-0" } }} />
      <button
        type="button"
        className={btn}
        title="Open the month that contains today"
        onClick={() => nav(pathForToday())}
      >
        Today
      </button>
      <button
        type="button"
        className={clsx(btn, "w-8 min-w-8 px-0 font-semibold text-stone-500")}
        title="Keyboard shortcuts (press ?)"
        aria-label="Keyboard shortcuts"
        onClick={() => setHelpOpen(true)}
      >
        ?
      </button>
    </div>
  );
}
