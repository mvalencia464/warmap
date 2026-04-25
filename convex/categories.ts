import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./authHelpers";

const colorKey = v.union(
  v.literal("rose"),
  v.literal("amber"),
  v.literal("emerald"),
  v.literal("sky"),
  v.literal("violet"),
  v.literal("fuchsia"),
  v.literal("slate"),
);

/** One default category per palette color; used for initial seed and for filling missing colors. */
const DEFAULTS = [
  { name: "Work", colorKey: "sky" as const, sort: 0 },
  { name: "Personal", colorKey: "emerald" as const, sort: 1 },
  { name: "Health", colorKey: "rose" as const, sort: 2 },
  { name: "Learning", colorKey: "violet" as const, sort: 3 },
  { name: "Other", colorKey: "slate" as const, sort: 4 },
  { name: "Focus", colorKey: "amber" as const, sort: 5 },
  { name: "Events", colorKey: "fuchsia" as const, sort: 6 },
] as const;

export const list = query({
  args: {},
  async handler(ctx) {
    await requireAuth(ctx);
    const all = await ctx.db.query("categories").collect();
    return all.sort((a, b) => a.sort - b.sort);
  },
});

export const bootstrap = mutation({
  args: {},
  async handler(ctx) {
    await requireAuth(ctx);
    const existing = await ctx.db.query("categories").first();
    if (existing) return;
    for (const c of DEFAULTS) {
      await ctx.db.insert("categories", c);
    }
  },
});

/**
 * For existing projects: add any default category rows that are missing
 * (e.g. new palette colors), so every swatch has a category to assign.
 */
export const ensureColorPalette = mutation({
  args: {},
  async handler(ctx) {
    await requireAuth(ctx);
    const all = await ctx.db.query("categories").collect();
    const present = new Set(all.map((c) => c.colorKey));
    let nextSort = all.length
      ? Math.max(...all.map((c) => c.sort), -1) + 1
      : 0;
    for (const row of DEFAULTS) {
      if (present.has(row.colorKey)) continue;
      await ctx.db.insert("categories", {
        name: row.name,
        colorKey: row.colorKey,
        sort: nextSort++,
      });
      present.add(row.colorKey);
    }
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    colorKey,
  },
  async handler(ctx, { name, colorKey: ck }) {
    await requireAuth(ctx);
    const all = await ctx.db.query("categories").collect();
    const last = all.length
      ? all.reduce((a, b) => (a.sort > b.sort ? a : b))
      : null;
    const sort = last ? last.sort + 1 : 0;
    return await ctx.db.insert("categories", { name, colorKey: ck, sort });
  },
});
