import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./authHelpers";

function overlapYear(
  start: string,
  end: string,
  year: number,
): { start: string; end: string } | null {
  const y = String(year);
  const min = `${y}-01-01`;
  const max = `${y}-12-31`;
  if (end < min || start > max) return null;
  return {
    start: start < min ? min : start,
    end: end > max ? max : end,
  };
}

export const get = query({
  args: { id: v.id("plans") },
  async handler(ctx, { id }) {
    await requireAuth(ctx);
    return await ctx.db.get(id);
  },
});

export const listInYear = query({
  args: { year: v.number() },
  async handler(ctx, { year }) {
    await requireAuth(ctx);
    const all = await ctx.db.query("plans").collect();
    return all
      .map((p) => {
        const range = overlapYear(p.startDate, p.endDate, year);
        if (!range) return null;
        return { ...p, startDate: range.start, endDate: range.end };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    categoryId: v.id("categories"),
    startDate: v.string(),
    endDate: v.string(),
  },
  async handler(ctx, args) {
    await requireAuth(ctx);
    if (args.endDate < args.startDate) {
      throw new Error("endDate must be on or after startDate");
    }
    return await ctx.db.insert("plans", {
      title: args.title,
      categoryId: args.categoryId,
      startDate: args.startDate,
      endDate: args.endDate,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("plans"),
    title: v.string(),
    categoryId: v.id("categories"),
    startDate: v.string(),
    endDate: v.string(),
  },
  async handler(ctx, { id, ...p }) {
    await requireAuth(ctx);
    if (p.endDate < p.startDate) {
      throw new Error("endDate must be on or after startDate");
    }
    await ctx.db.patch(id, p);
  },
});

export const remove = mutation({
  args: { id: v.id("plans") },
  async handler(ctx, { id }) {
    await requireAuth(ctx);
    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("planId"), id))
      .collect();
    for (const t of tasks) {
      await ctx.db.patch(t._id, { planId: undefined });
    }
    await ctx.db.delete(id);
  },
});
