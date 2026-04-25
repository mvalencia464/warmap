import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./authHelpers";

const MAX_VISION_IMAGES = 6;

export const list = query({
  args: {},
  async handler(ctx) {
    const identity = await requireAuth(ctx);
    const userId = identity.subject;
    const rows = await ctx.db
      .query("visionImages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const add = mutation({
  args: {
    r2Key: v.string(),
    publicUrl: v.string(),
  },
  async handler(ctx, { r2Key, publicUrl }) {
    const identity = await requireAuth(ctx);
    const userId = identity.subject;
    const prefix = `vision/${userId}/`;
    if (!r2Key.startsWith(prefix) || r2Key.length > 500) {
      throw new Error("Invalid image key");
    }
    if (!publicUrl.startsWith("http")) {
      throw new Error("Invalid image URL");
    }
    const existing = await ctx.db
      .query("visionImages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (existing.length >= MAX_VISION_IMAGES) {
      throw new Error(
        `At most ${MAX_VISION_IMAGES} vision images—remove one to add another`,
      );
    }
    const sortOrder =
      existing.length === 0
        ? 0
        : Math.max(...existing.map((r) => r.sortOrder)) + 1;
    return await ctx.db.insert("visionImages", {
      userId,
      r2Key,
      publicUrl,
      sortOrder,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("visionImages") },
  async handler(ctx, { id }) {
    const identity = await requireAuth(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.userId !== identity.subject) {
      return;
    }
    await ctx.db.delete(id);
  },
});
