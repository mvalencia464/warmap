import { dayInRange } from "./calendar";
import { isColorKey, DEFAULT_COLOR, type ColorKey } from "./colors";
import type { Doc } from "../../convex/_generated/dataModel";

type Plan = Doc<"plans">;

export function planHintsForDay(
  day: string,
  plans: Plan[],
  categoryById: Map<string, { colorKey: string }>,
): { plan: Plan; key: ColorKey }[] {
  return plans
    .filter((p) => dayInRange(day, p.startDate, p.endDate))
    .map((p) => {
      const c = categoryById.get(p.categoryId);
      const k =
        c?.colorKey && isColorKey(c.colorKey) ? c.colorKey : DEFAULT_COLOR;
      return { plan: p, key: k };
    });
}
