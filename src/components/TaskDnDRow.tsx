import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "clsx";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { dayCellTint, type ColorKey } from "../lib/colors";
import type { DayDropId } from "../lib/taskDndIds";
import { useCallback, useEffect, useRef, useState } from "react";

export function TaskDragPreview({
  title,
  done = false,
}: {
  title: string;
  done?: boolean;
}) {
  return (
    <div
      className={clsx(
        "pointer-events-none box-border flex h-8 w-60 shrink-0 select-none",
        "items-center rounded-md border border-stone-200/90 bg-white px-2.5",
        "text-xs text-stone-800 shadow-[0_10px_28px_-6px_rgba(0,0,0,0.18),0_4px_10px_-4px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.04)]",
        "-translate-y-0.5 -rotate-2 ring-1 ring-stone-200/50",
        "origin-center",
        done && "text-stone-400 line-through decoration-stone-300/80",
      )}
    >
      <span className="min-w-0 flex-1 truncate text-left leading-tight">
        {title}
      </span>
    </div>
  );
}

export function SortableTaskRow({
  id,
  task,
  categoryName,
  colorKey,
}: {
  id: string;
  task: Doc<"tasks">;
  categoryName: (id: Id<"categories"> | undefined) => string;
  colorKey: (id: Id<"categories"> | undefined) => ColorKey;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const editInputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: editing });

  const setRef = useCallback(
    (el: HTMLLIElement | null) => {
      setNodeRef(el);
      setActivatorNodeRef(el);
    },
    [setNodeRef, setActivatorNodeRef],
  );

  const style: React.CSSProperties = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    opacity: isDragging ? 0.3 : 1,
  };

  const toggle = useMutation(api.tasks.toggle);
  const setTitle = useMutation(api.tasks.setTitle);
  const defer = useMutation(api.tasks.defer);
  const remove = useMutation(api.tasks.remove);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEditValue(task.title);
  }, [task.title]);

  useEffect(() => {
    if (!editing) return;
    const raf = requestAnimationFrame(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    });
    return () => cancelAnimationFrame(raf);
  }, [editing]);

  const stopDrag: React.PointerEventHandler = (e) => e.stopPropagation();

  const endEdit = useCallback(async () => {
    setEditing(false);
    const t = editValue.trim();
    if (t && t !== task.title) {
      try {
        await setTitle({ id: task._id, title: t });
      } catch (e) {
        alert(e instanceof Error ? e.message : "Update failed");
        setEditValue(task.title);
      }
    } else {
      setEditValue(task.title);
    }
  }, [editValue, task._id, task.title, setTitle]);

  return (
    <li
      ref={setRef}
      style={style}
      className={clsx(
        "pointer-events-auto group relative z-10 mb-0.5 flex w-full min-w-0 items-center rounded-sm",
        "border border-stone-200/85 bg-stone-50/75 text-[0.7rem] leading-tight shadow-[0_1px_0_0_rgba(255,255,255,0.8)]",
        "transition-colors hover:bg-white",
        "sm:text-xs",
      )}
      data-no-new
      data-task-row
      {...attributes}
      {...listeners}
    >
      <div className="flex h-7 min-w-0 flex-1 items-center">
        <label
          className="flex h-full w-4 shrink-0 cursor-default items-center justify-center pl-0.5"
          onPointerDown={stopDrag}
        >
          <input
            type="checkbox"
            className="size-3.5 cursor-pointer rounded border-stone-300"
            checked={task.done}
            onChange={() => void toggle({ id: task._id })}
          />
          <span className="sr-only">Mark done</span>
        </label>
        {editing ? (
          <input
            ref={editInputRef}
            className="h-7 min-w-0 flex-1 self-center border-0 bg-amber-50/40 pl-1.5 pr-0.5 text-stone-800 outline-none ring-0"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onPointerDown={stopDrag}
            onBlur={() => void endEdit()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void endEdit();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setEditValue(task.title);
                setEditing(false);
              }
            }}
            maxLength={200}
          />
        ) : (
          <span
            role="button"
            tabIndex={0}
            className={clsx(
              "flex h-7 min-w-0 flex-1 items-center pl-1.5 pr-1.5 text-left",
              "cursor-text touch-manipulation",
              task.done
                ? "text-stone-400 line-through decoration-stone-300/80"
                : "text-stone-800",
            )}
            title="Double-click to edit; drag the row to move"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.stopPropagation();
                e.preventDefault();
                setEditing(true);
              }
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setEditing(true);
            }}
          >
            <span className="min-w-0 flex-1 truncate text-left leading-tight">
              {task.title}
            </span>
          </span>
        )}
        {task.categoryId && !editing && (
          <span
            className="flex w-1.5 shrink-0 self-center"
            title={categoryName(task.categoryId)}
            aria-hidden
          >
            <span
              className={clsx(
                "inline-block h-1.5 w-1.5 rounded-full",
                dayCellTint(colorKey(task.categoryId)),
              )}
            />
          </span>
        )}
        <div
          className="flex h-7 w-[2.1rem] shrink-0 items-center justify-end gap-0.5 self-stretch pl-0.5 pr-0.5"
          onPointerDown={stopDrag}
        >
          {!task.done && (
            <button
              type="button"
              className="shrink-0 cursor-pointer rounded px-0.5 text-[0.6rem] leading-none text-stone-400 transition hover:text-stone-800"
              title="Next day"
              onClick={async (e) => {
                e.stopPropagation();
                if (busy) return;
                setBusy(true);
                try {
                  await defer({ id: task._id });
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Move failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              →
            </button>
          )}
          <button
            type="button"
            className="shrink-0 cursor-pointer rounded p-0.5 text-base leading-none text-stone-300 transition hover:text-rose-500"
            title="Remove"
            onClick={(e) => {
              e.stopPropagation();
              void remove({ id: task._id });
            }}
          >
            ×
          </button>
        </div>
      </div>
    </li>
  );
}

export function DayEndDrop({ id }: { id: DayDropId }) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "dayEnd" } });
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "pointer-events-auto z-10 h-0.5 min-h-1.5 w-full shrink-0",
        isOver && "h-1 min-h-2 ring-1 ring-inset ring-stone-300/60",
      )}
    />
  );
}
