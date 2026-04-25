import { isColorKey, type ColorKey } from "./colors";
import type { Id } from "../../convex/_generated/dataModel";

type Cat = { _id: Id<"categories">; colorKey: string };

/**
 * Picks the first category for each palette color (stable order: category list / sort from Convex).
 * Used to map a swatch tap to a `categoryId` for plans.
 */
export function firstCategoryIdByColor(
  categories: readonly Cat[],
): Map<ColorKey, Id<"categories">> {
  const m = new Map<ColorKey, Id<"categories">>();
  for (const c of categories) {
    if (!isColorKey(c.colorKey)) continue;
    if (!m.has(c.colorKey)) m.set(c.colorKey, c._id);
  }
  return m;
}
