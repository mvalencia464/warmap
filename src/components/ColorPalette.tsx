import { clsx } from "clsx";
import { createPortal } from "react-dom";
import { useLayoutEffect, useRef, useState, useId } from "react";
import { ALL_COLOR_KEYS, isColorKey, keySwatchClass, type ColorKey } from "../lib/colors";
import { firstCategoryIdByColor } from "../lib/firstCategoryByColor";
import type { Id } from "../../convex/_generated/dataModel";

type Cat = { _id: Id<"categories">; colorKey: string; name: string };

type Props = {
  /** Selected category id, or `autoToken` for automatic. */
  value: string;
  onChange: (value: string) => void;
  categories: readonly Cat[];
  showAuto: boolean;
  autoToken?: string;
  className?: string;
  size?: "default" | "sm";
  /**
   * `compact` = single swatch + popover (default). `row` = all swatches inline
   * (e.g. wide layouts).
   */
  variant?: "compact" | "row";
  /**
   * When `variant` is `compact`, `minimal` = tiny square to the left of a title
   * (Key panel). `default` = small button with chevron.
   */
  compactStyle?: "default" | "minimal";
};

const swatchSize: Record<NonNullable<Props["size"]>, string> = {
  default: "h-7 w-7",
  sm: "h-5 w-5",
};

function selectedInfo(
  value: string,
  showAuto: boolean,
  autoToken: string,
  categories: readonly Cat[],
): { kind: "auto" } | { kind: "color"; key: ColorKey; name: string } {
  if (showAuto && value === autoToken) return { kind: "auto" };
  const c = categories.find((x) => x._id === value);
  if (c && isColorKey(c.colorKey)) {
    return { kind: "color", key: c.colorKey, name: c.name };
  }
  return { kind: "color", key: "slate", name: "Other" };
}

/**
 * Tappable swatches; default `compact` = one control + full palette in a
 * popover (portal) so it isn’t clipped in scroll areas.
 */
export function ColorPalette({
  value,
  onChange,
  categories,
  showAuto,
  autoToken = "__auto__",
  className,
  size = "default",
  variant = "compact",
  compactStyle = "default",
}: Props) {
  const byColor = firstCategoryIdByColor(categories);
  const s = swatchSize[size];
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const labelId = useId();

  const recalc = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: r.bottom + 6,
      left: r.left,
      width: Math.max(176, r.width + 4),
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    recalc();
    const onRe = () => {
      if (!open) return;
      recalc();
    };
    window.addEventListener("scroll", onRe, true);
    window.addEventListener("resize", onRe);
    return () => {
      window.removeEventListener("scroll", onRe, true);
      window.removeEventListener("resize", onRe);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", h, true);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("mousedown", h, true);
      document.removeEventListener("keydown", key, true);
    };
  }, [open]);

  const select = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const showCompact = variant === "compact";
  const sel = selectedInfo(value, showAuto, autoToken, categories);
  const minimalCompact = showCompact && compactStyle === "minimal";
  const triggerH = size === "sm" ? "h-6" : "h-7";
  const triggerW = size === "sm" ? "min-w-[1.9rem] px-1.5" : "min-w-[2.2rem] px-1.5";

  if (!showCompact) {
    return (
      <div className={clsx("flex flex-wrap items-center gap-1.5", className)}>
        {showAuto && (
          <button
            type="button"
            onClick={() => onChange(autoToken)}
            className={clsx(
              "shrink-0 cursor-pointer rounded-full border-2 text-[0.55rem] font-semibold",
              s,
              "inline-flex items-center justify-center",
              "border-dashed border-stone-300 bg-stone-50/80 text-stone-500",
              "hover:border-stone-400 hover:bg-stone-100/80",
              value === autoToken
                && "ring-2 ring-sky-400/70 ring-offset-1 ring-offset-white",
            )}
            title="Automatic: balance across less-used colors"
          >
            A
          </button>
        )}
        {ALL_COLOR_KEYS.map((k) => {
          const id = byColor.get(k);
          if (!id) {
            return (
              <div
                key={k}
                className={clsx(
                  s,
                  "shrink-0 rounded-full border border-dashed border-stone-200/90 bg-stone-50/50",
                  "opacity-40",
                )}
                title="No category for this color yet (refresh or try again later)"
              />
            );
          }
          const c = categories.find((x) => x._id === id);
          const name = c?.name ?? k;
          const active = value === id;
          return (
            <button
              key={k}
              type="button"
              onClick={() => onChange(id)}
              className={clsx(
                s,
                "shrink-0 cursor-pointer rounded-full border border-black/10 shadow-sm",
                "transition",
                "hover:brightness-110",
                "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-500",
                keySwatchClass(k),
                active
                  && "ring-2 ring-stone-700/90 ring-offset-1 ring-offset-white",
              )}
              title={name}
              aria-label={`${name} (${k})${active ? " — selected" : ""}`}
              aria-pressed={active}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        ref={triggerRef}
        id={labelId}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "cursor-pointer transition",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-500",
          minimalCompact
            ? "inline-flex shrink-0 items-center justify-center rounded-md p-0.5 hover:opacity-90"
            : clsx(
                "inline-flex items-center justify-center rounded-md border border-stone-300/90 bg-white text-[0.65rem] font-semibold shadow-sm",
                "hover:border-stone-400 hover:bg-stone-50/90",
                triggerH,
                triggerW,
                sel.kind === "auto" && "border-dashed text-stone-500",
              ),
        )}
        title={sel.kind === "auto" ? "Change color (auto)" : `Color: ${sel.name} — click to change`}
        aria-label={
          sel.kind === "auto"
            ? "Color: automatic. Open color options."
            : `Color: ${sel.name}. Open color options.`
        }
      >
        {minimalCompact ? (
          sel.kind === "auto" ? (
            <span
              className="flex h-4 w-4 items-center justify-center rounded-sm border border-dashed border-stone-400/80 bg-stone-50 text-[0.5rem] font-bold text-stone-500"
              aria-hidden
            >
              A
            </span>
          ) : (
            <span
              className={clsx(
                "block h-4 w-4 rounded-sm border border-stone-900/10 shadow-sm",
                keySwatchClass(sel.key),
              )}
            />
          )
        ) : sel.kind === "auto" ? (
          "A"
        ) : (
          <span
            className={clsx("block h-3 w-8 max-w-full rounded-sm", keySwatchClass(sel.key))}
            aria-hidden
          />
        )}
        {!minimalCompact && (
          <span className="ml-0.5 text-[0.5rem] text-stone-500" aria-hidden>▾</span>
        )}
      </button>
      {open
        && pos
        && typeof document !== "undefined"
        && createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-labelledby={labelId}
              className="fixed z-200 w-[min(92vw,14.5rem)] overflow-hidden rounded-xl border border-stone-200/90 bg-white p-2.5 shadow-xl"
              style={{
                top: pos.top,
                left: pos.left,
                minWidth: pos.width,
              }}
            >
              <p className="mb-1.5 text-xs font-medium text-stone-600">
                {showAuto ? "Color (or automatic)" : "Color"}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {showAuto && (
                  <button
                    type="button"
                    onClick={() => select(autoToken)}
                    className={clsx(
                      s,
                      "col-span-4 min-h-8 w-full max-w-full cursor-pointer justify-self-stretch rounded-lg border-2",
                      "border-dashed border-stone-300 bg-stone-50/90 text-center text-xs font-medium text-stone-600",
                      "hover:border-stone-400 hover:bg-stone-100/80",
                      value === autoToken
                        && "ring-2 ring-sky-500/50 ring-inset",
                    )}
                  >
                    Automatic
                  </button>
                )}
                {ALL_COLOR_KEYS.map((k) => {
                  const id = byColor.get(k);
                  if (!id) {
                    return (
                      <div
                        key={k}
                        className={clsx(
                          s,
                          "rounded-full border border-dashed border-stone-200/80 opacity-40",
                        )}
                      />
                    );
                  }
                  const c = categories.find((x) => x._id === id);
                  const name = c?.name ?? k;
                  const active = value === id;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => select(id)}
                      className={clsx(
                        s,
                        "shrink-0 cursor-pointer rounded-full border border-black/10 shadow-sm",
                        "transition hover:brightness-110",
                        "focus-visible:outline-2 focus-visible:outline-offset-1",
                        "focus-visible:outline-stone-500",
                        keySwatchClass(k),
                        active
                          && "ring-2 ring-stone-800/80 ring-offset-1 ring-offset-white",
                      )}
                      title={name}
                    />
                  );
                })}
              </div>
            </div>,
            document.body,
          )}
    </div>
  );
}
