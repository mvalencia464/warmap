import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./authHelpers";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isoDay(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function identityKey(identity: { tokenIdentifier?: string; subject?: string }): string {
  const key = identity.tokenIdentifier ?? identity.subject;
  if (!key) {
    throw new Error("Missing authenticated identity key");
  }
  return key;
}

export const logSession = mutation({
  args: {
    completedAt: v.number(),
    seconds: v.number(),
    label: v.string(),
  },
  handler: async (ctx, { completedAt, seconds, label }) => {
    const identity = await requireAuth(ctx);
    const userId = identityKey(identity);
    if (!Number.isFinite(completedAt) || !Number.isFinite(seconds) || seconds <= 0) {
      return null;
    }
    await ctx.db.insert("focusSessions", {
      userId,
      completedAt,
      seconds: Math.max(1, Math.round(seconds)),
      label: label.trim().slice(0, 120),
    });
    return null;
  },
});

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx);
    const userId = identityKey(identity);
    const now = Date.now();
    const todayStart = startOfDay(now);
    const weekStart = todayStart - 6 * DAY_MS;
    const monthStart = todayStart - 29 * DAY_MS;

    const rows = await ctx.db
      .query("focusSessions")
      .withIndex("by_user_and_completedAt", (q) => q.eq("userId", userId).gte("completedAt", monthStart))
      .take(2000);

    const todayRows = rows.filter((r) => r.completedAt >= todayStart);
    const weekRows = rows.filter((r) => r.completedAt >= weekStart);
    const monthRows = rows;

    const dayMap = new Map<string, number>();
    for (let i = 0; i < 7; i += 1) {
      dayMap.set(isoDay(weekStart + i * DAY_MS), 0);
    }
    for (const row of weekRows) {
      const key = isoDay(row.completedAt);
      dayMap.set(key, (dayMap.get(key) ?? 0) + row.seconds);
    }

    const topLabels = new Map<string, number>();
    for (const row of monthRows) {
      const key = row.label.trim() || "Unlabeled";
      topLabels.set(key, (topLabels.get(key) ?? 0) + row.seconds);
    }
    const topFocus = Array.from(topLabels.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, seconds]) => ({
        label,
        minutes: Math.round(seconds / 60),
      }));

    return {
      today: {
        sessions: todayRows.length,
        minutes: Math.round(todayRows.reduce((acc, r) => acc + r.seconds, 0) / 60),
      },
      week: {
        sessions: weekRows.length,
        minutes: Math.round(weekRows.reduce((acc, r) => acc + r.seconds, 0) / 60),
      },
      month: {
        sessions: monthRows.length,
        minutes: Math.round(monthRows.reduce((acc, r) => acc + r.seconds, 0) / 60),
      },
      byDay: Array.from(dayMap.entries()).map(([day, seconds]) => ({
        day,
        minutes: Math.round(seconds / 60),
      })),
      topFocus,
    };
  },
});
