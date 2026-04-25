/** Path to the month view for “today” (current local year + month). */
export function pathForToday() {
  const d = new Date();
  return `/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
