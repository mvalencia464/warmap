import { useEffect, useState } from "react";

/**
 * True when `window` width is at most `maxPx` (e.g. 639 matches Tailwind below `sm`).
 */
export function useMatchMaxWidth(maxPx: number) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${maxPx}px)`).matches;
  });
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxPx}px)`);
    setMatches(mq.matches);
    const h = () => setMatches(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [maxPx]);
  return matches;
}
