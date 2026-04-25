import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./authHelpers";

const MAX_PER_DAY = 5;

export const byMonth = query({
  args: { year: v.number(), month: v.number() },
  async handler(ctx, { year, month }) {
    await requireAuth(ctx);
    const m = String(month).padStart(2, "0");
    const y = String(year);
    const startD = `${y}-${m}-01`;
    const last = new Date(Date.UTC(year, month, 0));
    const endD = `${y}-${m}-${String(last.getUTCDate()).padStart(2, "0")}`;

    const inRange = await ctx.db
      .query("tasks")
      .withIndex("by_day", (q) => q.gte("day", startD).lte("day", endD))
      .collect();
    return inRange.sort(
      (a, b) => a.day.localeCompare(b.day) || a.sortOrder - b.sortOrder,
    );
  },
});

export const add = mutation({
  args: {
    day: v.string(),
    title: v.string(),
    categoryId: v.optional(v.id("categories")),
    planId: v.optional(v.id("plans")),
  },
  async handler(ctx, { day, title, categoryId, planId }) {
    await requireAuth(ctx);
    const onDay = await ctx.db
      .query("tasks")
      .withIndex("by_day", (q) => q.eq("day", day))
      .collect();
    if (onDay.length >= MAX_PER_DAY) {
      throw new Error(`At most ${MAX_PER_DAY} items per day`);
    }
    const order =
      onDay.length === 0
        ? 0
        : Math.max(...onDay.map((t) => t.sortOrder)) + 1;
    return await ctx.db.insert("tasks", {
      day,
      title: title.trim(),
      sortOrder: order,
      done: false,
      categoryId,
      planId,
    });
  },
});

export const toggle = mutation({
  args: { id: v.id("tasks") },
  async handler(ctx, { id }) {
    await requireAuth(ctx);
    const t = await ctx.db.get(id);
    if (!t) return;
    await ctx.db.patch(id, { done: !t.done });
  },
});

export const defer = mutation({
  args: { id: v.id("tasks") },
  async handler(ctx, { id }) {
    await requireAuth(ctx);
    const t = await ctx.db.get(id);
    if (!t) return;
    if (t.done) return;
    const [y, mo, d] = t.day.split("-").map(Number);
    const next = new Date(Date.UTC(y, mo - 1, d + 1));
    const ny = next.getUTCFullYear();
    const nm = String(next.getUTCMonth() + 1).padStart(2, "0");
    const nd = String(next.getUTCDate()).padStart(2, "0");
    const newDay = `${ny}-${nm}-${nd}`;

    const onNext = await ctx.db
      .query("tasks")
      .withIndex("by_day", (q) => q.eq("day", newDay))
      .collect();
    if (onNext.length >= MAX_PER_DAY) {
      throw new Error("Next day is full — make room or pick another day.");
    }
    const nextOrder =
      onNext.length === 0
        ? 0
        : Math.max(...onNext.map((x) => x.sortOrder)) + 1;
    await ctx.db.patch(id, { day: newDay, sortOrder: nextOrder });
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  async handler(ctx, { id }) {
    await requireAuth(ctx);
    await ctx.db.delete(id);
  },
});

export const setTitle = mutation({
  args: { id: v.id("tasks"), title: v.string() },
  async handler(ctx, { id, title }) {
    await requireAuth(ctx);
    const t = title.trim();
    if (!t) return;
    await ctx.db.patch(id, { title: t });
  },
});

export const setCategory = mutation({
  args: { id: v.id("tasks"), categoryId: v.union(v.id("categories"), v.null()) },
  async handler(ctx, { id, categoryId }) {
    await requireAuth(ctx);
    await ctx.db.patch(id, {
      categoryId: categoryId === null ? undefined : categoryId,
    });
  },
});

export const reorderInDay = mutation({
  args: { day: v.string(), orderedIds: v.array(v.id("tasks")) },
  async handler(ctx, { day, orderedIds }) {
    await requireAuth(ctx);
    const onDay = await ctx.db
      .query("tasks")
      .withIndex("by_day", (q) => q.eq("day", day))
      .collect();
    if (onDay.length !== orderedIds.length) {
      throw new Error("List must include every task for that day");
    }
    const set = new Set(onDay.map((t) => t._id));
    for (const id of orderedIds) {
      if (!set.has(id)) throw new Error("Invalid task id for this day");
    }
    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { sortOrder: i, day });
    }
  },
});

export const moveToDay = mutation({
  args: {
    id: v.id("tasks"),
    toDay: v.string(),
    toIndex: v.number(),
  },
  async handler(ctx, { id, toDay, toIndex }) {
    await requireAuth(ctx);
    const t = await ctx.db.get(id);
    if (!t) return;
    const fromDay = t.day;
    if (t.done) return;

    const source = (
      await ctx.db
        .query("tasks")
        .withIndex("by_day", (q) => q.eq("day", fromDay))
        .collect()
    )
      .filter((x) => x._id !== id)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const target = (
      await ctx.db
        .query("tasks")
        .withIndex("by_day", (q) => q.eq("day", toDay))
        .collect()
    )
      .filter((x) => x._id !== id)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (fromDay !== toDay && target.length >= MAX_PER_DAY) {
      throw new Error("That day is full");
    }

    const j = Math.max(0, Math.min(toIndex, target.length));
    const newTarget = [...target];
    newTarget.splice(j, 0, t);

    for (let i = 0; i < source.length; i++) {
      await ctx.db.patch(source[i]._id, { sortOrder: i, day: fromDay });
    }
    for (let i = 0; i < newTarget.length; i++) {
      await ctx.db.patch(newTarget[i]._id, { sortOrder: i, day: toDay });
    }
  },
});
