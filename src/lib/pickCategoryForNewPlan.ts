import type { Id } from "../../convex/_generated/dataModel";
import type { Doc } from "../../convex/_generated/dataModel";

type Cat = { _id: Id<"categories"> };
type Plan = Pick<Doc<"plans">, "categoryId">;

/**
 * Picks a category so new project ranges get **spread across colors**:
 * chooses among categories with the fewest uses in `existingPlans`, random tie-break.
 */
export function pickCategoryIdForNewPlan(
  categories: Cat[],
  existingPlans: Plan[],
): Id<"categories"> {
  if (categories.length === 0) {
    throw new Error("pickCategoryIdForNewPlan: no categories");
  }
  const count = new Map<Id<"categories">, number>();
  for (const c of categories) {
    count.set(c._id, 0);
  }
  for (const p of existingPlans) {
    const n = count.get(p.categoryId) ?? 0;
    count.set(p.categoryId, n + 1);
  }
  let min = Infinity;
  for (const c of categories) {
    min = Math.min(min, count.get(c._id) ?? 0);
  }
  const candidates = categories.filter(
    (c) => (count.get(c._id) ?? 0) === min,
  );
  const i = Math.floor(Math.random() * candidates.length);
  return candidates[i]!._id;
}
