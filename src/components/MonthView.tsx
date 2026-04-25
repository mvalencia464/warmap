import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Layout } from "./Layout";
import {
  monthGridCells,
  isTodayStr,
  monthNameLong,
  rangeOverlapsMonth,
  formatRangeLabel,
} from "../lib/calendar";
import { isColorKey, DEFAULT_COLOR, type ColorKey, keySwatchClass, monthPlanHintClass } from "../lib/colors";
import { planHintsForDay } from "../lib/planHints";
import { clsx } from "clsx";
import { dayCellDropId, endDropId } from "../lib/taskDndIds";
import { DayEndDrop, SortableTaskRow, TaskDragPreview } from "./TaskDnDRow";
import { getQuoteForDate } from "../lib/dailyQuote";

/** Aligned to five `h-7` (1.75rem) task rows in `SortableTaskRow` */
const DAY_TASK_AREA_MIN = "min-h-[8.75rem]";

export function MonthView() {
  const { year: y, month: m } = useParams<{ year: string; month: string }>();
  const year = y ? Number(y) : NaN;
  const month = m ? Number(m) : NaN;
  const valid =
    !Number.isNaN(year) && !Number.isNaN(month) && month >= 1 && month <= 12;

  const tasks = useQuery(
    api.tasks.byMonth,
    valid ? { year, month } : "skip",
  );
  const monthMeta = useQuery(
    api.monthNotes.get,
    valid ? { year, month } : "skip",
  );
  const categories = useQuery(api.categories.list, {});
  const plans = useQuery(api.plans.listInYear, { year });

  const categoryById = useMemo(() => {
    const map = new Map<string, { colorKey: string; name: string }>();
    for (const c of categories ?? []) {
      map.set(c._id, { colorKey: c.colorKey, name: c.name });
    }
    return map;
  }, [categories]);

  const byDay = useMemo(() => {
    const map = new Map<string, Doc<"tasks">[]>();
    for (const t of tasks ?? []) {
      const arr = map.get(t.day) ?? [];
      arr.push(t);
      map.set(t.day, arr);
    }
    for (const [day, list] of map) {
      list.sort((a, b) => a.sortOrder - b.sortOrder);
      map.set(day, list);
    }
    return map;
  }, [tasks]);

  const taskToDay = useMemo(() => {
    const m = new Map<string, string>();
    for (const [d, list] of byDay) {
      for (const t of list) {
        m.set(t._id, d);
      }
    }
    return m;
  }, [byDay]);

  const reorderInDay = useMutation(api.tasks.reorderInDay);
  const moveToDay = useMutation(api.tasks.moveToDay);

  const [composingDay, setComposingDay] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<Doc<"tasks"> | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const onDragStart = useCallback(
    (e: DragStartEvent) => {
      const id = String(e.active.id);
      for (const list of byDay.values()) {
        const t = list.find((x) => String(x._id) === id);
        if (t) {
          setActiveDrag(t);
          return;
        }
      }
      setActiveDrag(null);
    },
    [byDay],
  );

  const onDragOver = useCallback(
    (e: DragOverEvent) => {
      const o = e.over;
      if (!o) {
        setHoveredDay(null);
        return;
      }
      const id = String(o.id);
      if (id.startsWith("day-end:")) {
        setHoveredDay(id.slice(8));
        return;
      }
      if (id.startsWith("day-cell:")) {
        setHoveredDay(id.slice(9));
        return;
      }
      setHoveredDay(taskToDay.get(id) ?? null);
    },
    [taskToDay],
  );

  const onDragCancel = useCallback(() => {
    setActiveDrag(null);
    setHoveredDay(null);
  }, []);

  const onDragEnd = useCallback(
    async (e: DragEndEvent) => {
      setActiveDrag(null);
      setHoveredDay(null);

      const { active, over } = e;
      if (!over) return;
      const a = String(active.id);
      const o = String(over.id);
      if (a === o) return;
      const fromDay = taskToDay.get(a);
      if (!fromDay) return;

      if (o.startsWith("day-end:") || o.startsWith("day-cell:")) {
        const toDay = o.startsWith("day-end:") ? o.slice(8) : o.slice(9);
        if (fromDay === toDay) {
          const full = (byDay.get(fromDay) ?? [])
            .sort((x, y) => x.sortOrder - y.sortOrder)
            .map((t) => t._id);
          const oldI = full.indexOf(a as Id<"tasks">);
          if (oldI < 0) return;
          const next = arrayMove(full, oldI, full.length - 1) as Id<"tasks">[];
          try {
            await reorderInDay({ day: fromDay, orderedIds: next });
          } catch (err) {
            alert(err instanceof Error ? err.message : "Reorder failed");
          }
        } else {
          const toLen = (byDay.get(toDay) ?? []).filter((t) => t._id !== a)
            .length;
          try {
            await moveToDay({ id: a as Id<"tasks">, toDay, toIndex: toLen });
          } catch (err) {
            alert(err instanceof Error ? err.message : "Move failed");
          }
        }
        return;
      }

      const toDay = taskToDay.get(o);
      if (!toDay) return;

      if (fromDay === toDay) {
        const full = (byDay.get(fromDay) ?? [])
          .sort((x, y) => x.sortOrder - y.sortOrder)
          .map((t) => t._id);
        const oldI = full.indexOf(a as Id<"tasks">);
        const newI = full.indexOf(o as Id<"tasks">);
        if (oldI < 0 || newI < 0) return;
        const next = arrayMove(full, oldI, newI) as Id<"tasks">[];
        try {
          await reorderInDay({ day: fromDay, orderedIds: next });
        } catch (err) {
          alert(err instanceof Error ? err.message : "Reorder failed");
        }
        return;
      }

      const target = (byDay.get(toDay) ?? [])
        .filter((t) => t._id !== a)
        .sort((x, y) => x.sortOrder - y.sortOrder);
      const toIndex = target.findIndex((t) => t._id === o);
      if (toIndex < 0) return;
      try {
        await moveToDay({ id: a as Id<"tasks">, toDay, toIndex });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Move failed");
      }
    },
    [byDay, moveToDay, reorderInDay, taskToDay],
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const catMap = useMemo(
    () =>
      new Map(
        Array.from(categoryById, ([id, v]) => [id, { colorKey: v.colorKey }]),
      ),
    [categoryById],
  );

  const dayPlanHints = useMemo(() => {
    if (!valid) {
      return new Map<string, ReturnType<typeof planHintsForDay>>();
    }
    const m = new Map<string, ReturnType<typeof planHintsForDay>>();
    const plansList = plans ?? [];
    for (const c of monthGridCells(year, month)) {
      if (!c.inMonth) continue;
      m.set(c.iso, planHintsForDay(c.iso, plansList, catMap));
    }
    return m;
  }, [catMap, year, month, plans, valid]);

  const monthProjectLegend = useMemo(() => {
    if (!valid) {
      return [] as Doc<"plans">[];
    }
    return (plans ?? [])
      .filter((p) => rangeOverlapsMonth(year, month, p.startDate, p.endDate))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [plans, year, month, valid]);
  const dailyQuote = useMemo(() => getQuoteForDate(new Date()), []);

  if (!valid) {
    return (
      <Layout year={new Date().getFullYear()} quote={dailyQuote}>
        <p className="text-sm text-stone-500">Invalid month</p>
      </Layout>
    );
  }

  const monthLabel = monthNameLong(month);

  if (
    tasks === undefined ||
    monthMeta === undefined ||
    categories === undefined ||
    plans === undefined
  ) {
    return (
      <Layout year={year} quote={dailyQuote}>
        <p className="text-sm text-stone-500">Loading…</p>
      </Layout>
    );
  }

  return (
    <Layout year={year} quote={dailyQuote}>
      <div className="mb-4 sm:mb-5">
        <Link
          to={`/?year=${year}`}
          className="text-sm font-medium text-stone-400 transition hover:text-stone-600"
        >
          ← {year} overview
        </Link>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          {monthLabel}
        </h2>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        autoScroll
      >
        <div className="w-full min-w-0 px-2.5 sm:px-0">
          <div className="space-y-3.5 sm:hidden">
            {monthGridCells(year, month)
              .filter((cell) => cell.inMonth)
              .map((cell) => (
                <DayColumn
                  key={cell.iso}
                  day={cell.iso}
                  inMonth
                  stacked
                  isToday={isTodayStr(cell.iso)}
                  dayNum={cell.day}
                  items={byDay.get(cell.iso) ?? []}
                  categories={categories}
                  isComposing={composingDay === cell.iso}
                  isDropTarget={hoveredDay === cell.iso}
                  onOpenCompose={() => {
                    if ((byDay.get(cell.iso) ?? []).length < 5) {
                      setComposingDay(cell.iso);
                    }
                  }}
                  onCloseCompose={() => setComposingDay(null)}
                  planHints={dayPlanHints.get(cell.iso) ?? []}
                />
              ))}
          </div>

          <div className="hidden sm:block">
            <div className="mb-2 grid min-w-0 grid-cols-7 border-b border-stone-200/80 pb-1 text-center text-xs font-medium uppercase tracking-wider text-stone-400">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid w-full min-w-0 auto-rows-min grid-cols-7 overflow-hidden rounded-md border border-stone-200/50">
              {monthGridCells(year, month).map((cell) => (
                <DayColumn
                  key={cell.iso}
                  day={cell.iso}
                  inMonth={cell.inMonth}
                  isToday={isTodayStr(cell.iso)}
                  dayNum={cell.day}
                  items={cell.inMonth ? byDay.get(cell.iso) ?? [] : []}
                  categories={categories}
                  isComposing={composingDay === cell.iso}
                  isDropTarget={cell.inMonth && hoveredDay === cell.iso}
                  onOpenCompose={() => {
                    if ((byDay.get(cell.iso) ?? []).length < 5) {
                      setComposingDay(cell.iso);
                    }
                  }}
                  onCloseCompose={() => setComposingDay(null)}
                  planHints={dayPlanHints.get(cell.iso) ?? []}
                />
              ))}
            </div>
          </div>
        </div>
        <DragOverlay
          adjustScale={false}
          dropAnimation={null}
          className="z-50 cursor-grabbing"
        >
          {activeDrag ? (
            <TaskDragPreview
              title={activeDrag.title}
              done={activeDrag.done}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <section
        className="mt-6 border-t border-stone-200 pt-5"
        aria-labelledby="month-projects-legend"
      >
        <h3
          id="month-projects-legend"
          className="text-xs font-semibold uppercase tracking-widest text-stone-400"
        >
          Project ranges (this month)
        </h3>
        {monthProjectLegend.length === 0 ? (
          <p className="mt-1.5 text-sm text-stone-500">
            No project ranges in this month.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2.5 text-sm text-stone-600">
            {monthProjectLegend.map((p) => {
              const c = categoryById.get(p.categoryId);
              const k: ColorKey =
                c?.colorKey && isColorKey(c.colorKey) ? c.colorKey : DEFAULT_COLOR;
              return (
                <li key={p._id} className="flex min-w-0 max-w-full items-center gap-2">
                  <span
                    className={clsx(
                      "h-3 w-3 shrink-0 rounded-sm border border-stone-900/10 shadow-sm",
                      keySwatchClass(k),
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-stone-800">{p.title}</span>
                    <span className="ml-1.5 text-stone-500">
                      {formatRangeLabel(p.startDate, p.endDate)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="mt-8 grid gap-6 border-t border-stone-200 pt-8 sm:grid-cols-2">
        <MonthNotes
          key={`${year}-${month}`}
          year={year}
          month={month}
          mainObjectives={monthMeta.mainObjectives}
          notes={monthMeta.notes}
        />
      </footer>
    </Layout>
  );
}

function DayColumn({
  day,
  inMonth,
  stacked = false,
  isToday,
  dayNum,
  items,
  categories,
  isComposing,
  isDropTarget,
  onOpenCompose,
  onCloseCompose,
  planHints,
}: {
  day: string;
  inMonth: boolean;
  stacked?: boolean;
  isToday: boolean;
  dayNum: number;
  items: Doc<"tasks">[];
  categories: Doc<"categories">[];
  isComposing: boolean;
  isDropTarget: boolean;
  onOpenCompose: () => void;
  onCloseCompose: () => void;
  planHints: { plan: Doc<"plans">; key: ColorKey }[];
}) {
  const { setNodeRef: setCellDropRef } = useDroppable({
    id: dayCellDropId(day),
    disabled: !inMonth,
    data: { type: "dayCell" },
  });

  const [draft, setDraft] = useState("");
  const add = useMutation(api.tasks.add);
  const sorted = items;
  const ids = sorted.map((t) => t._id);
  const canAdd = items.length < 5;
  const firstPlanKey = planHints[0]?.key;
  const planTitle = planHints.map((h) => h.plan.title).join(", ");
  const empty = sorted.length === 0;

  const catName = (id: Id<"categories"> | undefined) =>
    categories.find((c) => c._id === id)?.name ?? "—";
  const catKey = (id: Id<"categories"> | undefined) => {
    const k = id ? categories.find((c) => c._id === id)?.colorKey : undefined;
    return (isColorKey(String(k)) ? k : DEFAULT_COLOR) as ColorKey;
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef("");
  const addFlushRef = useRef(false);

  const trySaveNewTask = useCallback(async (keepComposingAfterSave = false) => {
    if (addFlushRef.current) return;
    const t = draftRef.current.trim();
    if (!t) {
      onCloseCompose();
      return;
    }
    addFlushRef.current = true;
    setDraft("");
    draftRef.current = "";
    try {
      await add({ day, title: t });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Add failed");
    } finally {
      addFlushRef.current = false;
    }
    if (!keepComposingAfterSave) {
      onCloseCompose();
    }
  }, [add, day, onCloseCompose]);

  useEffect(() => {
    if (isComposing && !canAdd) onCloseCompose();
  }, [isComposing, canAdd, onCloseCompose]);

  useEffect(() => {
    if (!isComposing || !canAdd) return;
    const r = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(r);
  }, [isComposing, canAdd, day]);

  useEffect(() => {
    if (!isComposing) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setDraft("");
        draftRef.current = "";
        onCloseCompose();
      }
    };
    document.addEventListener("keydown", h, { capture: true });
    return () => document.removeEventListener("keydown", h, { capture: true });
  }, [isComposing, onCloseCompose]);

  if (!inMonth) {
    return (
      <div
        className={clsx(
          "min-h-10",
          isToday
            && "z-1 border border-amber-400/80 bg-amber-50/90 ring-2 ring-inset ring-amber-500/70",
          !isToday && "bg-stone-100/90",
        )}
        title={isToday ? "Today" : undefined}
        aria-label={isToday ? "Today (in adjacent month)" : undefined}
      />
    );
  }

  const dayTip = isToday
    ? planTitle
        ? `Today (local) — ${planTitle}`
        : "Today (local time)"
    : (planTitle || undefined);

  return (
    <div
      className={clsx(
        "group/d relative flex h-full min-h-0 min-w-0 flex-col p-0",
        stacked
          ? "overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          : "border-b border-r border-stone-200/60",
        isToday
          && "z-1 bg-amber-50/55 ring-2 ring-inset ring-amber-500/80 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.2)]",
        !isToday && (firstPlanKey ? monthPlanHintClass(firstPlanKey) : "bg-white"),
        isDropTarget
          && "z-2 scale-[1.01] ring-2 ring-sky-500/45 ring-inset",
      )}
      title={dayTip}
      aria-current={isToday ? "date" : undefined}
    >
      <div
        className={clsx(
          "flex w-full shrink-0 items-center justify-end gap-1",
          stacked
            ? "px-3.5 py-2.5 text-sm font-semibold tabular-nums"
            : "px-1.5 py-0.5 text-[0.65rem] font-medium tabular-nums",
          isToday && (stacked ? "bg-amber-100/50" : "bg-amber-100/40"),
          isToday ? "text-amber-950" : stacked ? "text-stone-500" : "text-stone-400",
        )}
      >
        {isToday ? (
          <>
            <span
              className={clsx(
                "min-w-0 font-bold leading-none text-amber-950 tabular-nums",
                stacked ? "text-xl" : "text-base",
              )}
            >
              {dayNum}
            </span>
            <span
              className={clsx(
                "text-left font-extrabold leading-tight text-amber-800 uppercase",
                stacked ? "max-w-[2.2rem] text-xs" : "max-w-[1.8rem] text-[0.5rem]",
              )}
            >
              Today
            </span>
          </>
        ) : stacked ? (
          <span className="text-lg text-stone-500 tabular-nums">{dayNum}</span>
        ) : (
          dayNum
        )}
      </div>
      <div
        className={clsx(
          "relative flex w-full min-w-0 flex-1 flex-col",
          stacked ? "min-h-32 px-0.5 pb-1" : DAY_TASK_AREA_MIN,
        )}
      >
        {empty && (
          <div
            className="pointer-events-none absolute right-0.5 bottom-1.5 z-1 text-lg font-extralight text-stone-200 opacity-0 transition group-hover/d:opacity-100"
            aria-hidden
          >
            +
          </div>
        )}
        <div
          ref={setCellDropRef}
          className="absolute inset-0 z-0 cursor-text"
          aria-hidden
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            e.stopPropagation();
            if (canAdd) onOpenCompose();
          }}
        />
        <div className="pointer-events-none relative z-10 flex min-h-0 w-full flex-1 flex-col">
          <SortableContext
            id={day}
            items={ids}
            strategy={verticalListSortingStrategy}
          >
            {sorted.length > 0 && (
              <ul className="pointer-events-auto m-0 w-full list-none p-0" data-no-new>
                {sorted.map((t) => (
                  <SortableTaskRow
                    key={t._id}
                    id={String(t._id)}
                    task={t}
                    categoryName={catName}
                    colorKey={catKey}
                    comfortable={stacked}
                  />
                ))}
              </ul>
            )}
            {canAdd && <DayEndDrop id={endDropId(day)} />}
          </SortableContext>

          {isComposing && canAdd && (
            <form
              data-no-new
              className="pointer-events-auto w-full"
              onSubmit={(e) => {
                e.preventDefault();
                void trySaveNewTask(true);
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                ref={inputRef}
                className={clsx(
                  "w-full min-w-0 border-0 border-t border-stone-200/80 bg-amber-50/50 text-stone-800 focus:ring-0",
                  stacked
                    ? "h-11 px-3 py-2 text-sm"
                    : "h-7 px-2 text-[0.7rem] sm:text-xs",
                )}
                placeholder="Add task"
                value={draft}
                autoFocus
                onChange={(e) => {
                  const v = e.target.value;
                  setDraft(v);
                  draftRef.current = v;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void trySaveNewTask(!e.shiftKey);
                  }
                }}
                onBlur={() => {
                  void trySaveNewTask();
                }}
                maxLength={200}
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function MonthNotes({
  year,
  month,
  mainObjectives,
  notes,
}: {
  year: number;
  month: number;
  mainObjectives: string;
  notes: string;
}) {
  const [m, setM] = useState(mainObjectives);
  const [n, setN] = useState(notes);
  const upsert = useMutation(api.monthNotes.upsert);
  return (
    <>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400">
          Main objectives
        </h3>
        <textarea
          className="mt-1 min-h-24 w-full rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-sm text-stone-800"
          value={m}
          onChange={(e) => setM(e.target.value)}
          onBlur={async () => {
            if (m === mainObjectives) return;
            await upsert({ year, month, mainObjectives: m, notes: n });
          }}
          rows={3}
        />
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400">
          Notes
        </h3>
        <textarea
          className="mt-1 min-h-24 w-full rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-sm text-stone-800"
          value={n}
          onChange={(e) => setN(e.target.value)}
          onBlur={async () => {
            if (n === notes) return;
            await upsert({ year, month, mainObjectives: m, notes: n });
          }}
          rows={3}
        />
      </div>
    </>
  );
}
