import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const colorKey = v.union(
  v.literal("rose"),
  v.literal("amber"),
  v.literal("emerald"),
  v.literal("sky"),
  v.literal("violet"),
  v.literal("fuchsia"),
  v.literal("slate"),
);

export default defineSchema({
  categories: defineTable({
    name: v.string(),
    colorKey,
    sort: v.number(),
  }).index("by_sort", ["sort"]),

  plans: defineTable({
    title: v.string(),
    categoryId: v.id("categories"),
    startDate: v.string(),
    endDate: v.string(),
  })
    .index("by_start", ["startDate"])
    .index("by_category", ["categoryId"]),

  tasks: defineTable({
    day: v.string(),
    title: v.string(),
    sortOrder: v.number(),
    done: v.boolean(),
    categoryId: v.optional(v.id("categories")),
    planId: v.optional(v.id("plans")),
  })
    .index("by_day", ["day"])
    .index("by_day_order", ["day", "sortOrder"]),

  monthNotes: defineTable({
    yearMonth: v.string(),
    mainObjectives: v.string(),
    notes: v.string(),
  }).index("by_ym", ["yearMonth"]),

  /** Per-user vision board images (R2 public URLs, prefix `vision/` in bucket) */
  visionImages: defineTable({
    userId: v.string(),
    r2Key: v.string(),
    publicUrl: v.string(),
    sortOrder: v.number(),
  }).index("by_user", ["userId"]),

  focusSessions: defineTable({
    userId: v.string(),
    completedAt: v.number(),
    seconds: v.number(),
    label: v.string(),
    projectTitle: v.string(),
  }).index("by_user_and_completedAt", ["userId", "completedAt"]),
});
