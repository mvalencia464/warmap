import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./authHelpers";

function ymKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export const get = query({
  args: { year: v.number(), month: v.number() },
  async handler(ctx, { year, month }) {
    await requireAuth(ctx);
    const y = ymKey(year, month);
    const row = await ctx.db
      .query("monthNotes")
      .withIndex("by_ym", (q) => q.eq("yearMonth", y))
      .first();
    if (!row) {
      return { mainObjectives: "", notes: "" as const, exists: false as const };
    }
    return {
      mainObjectives: row.mainObjectives,
      notes: row.notes,
      exists: true as const,
    };
  },
});

export const upsert = mutation({
  args: {
    year: v.number(),
    month: v.number(),
    mainObjectives: v.string(),
    notes: v.string(),
  },
  async handler(ctx, { year, month, mainObjectives, notes }) {
    await requireAuth(ctx);
    const yearMonth = ymKey(year, month);
    const existing = await ctx.db
      .query("monthNotes")
      .withIndex("by_ym", (q) => q.eq("yearMonth", yearMonth))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { mainObjectives, notes });
    } else {
      await ctx.db.insert("monthNotes", { yearMonth, mainObjectives, notes });
    }
  },
});
