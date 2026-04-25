import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useHelp } from "../HelpContext";
import { pathForToday } from "../lib/todayPath";

function isInEditableField(t: EventTarget | null) {
  if (!t || !(t instanceof Element)) return false;
  const el = t as HTMLElement;
  if (el.closest("[data-skip-global-shortcuts]")) return true;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.type !== "button" && el.type !== "submit" && el.type !== "reset";
  }
  if (el instanceof HTMLSelectElement) return true;
  return false;
}

/**
 * `?` opens / toggles help (when not in a text field), `G` `T` jumps to
 * the current month view.
 */
export function GlobalShortcuts() {
  const { setHelpOpen } = useHelp();
  const nav = useNavigate();
  const location = useLocation();
  const gPending = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearG = () => {
    gPending.current = false;
    if (gTimer.current) {
      clearTimeout(gTimer.current);
      gTimer.current = null;
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.repeat) return;

      if (isInEditableField(e.target)) {
        clearG();
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen((h) => !h);
        clearG();
        return;
      }

      if (e.key === "g" || e.key === "G") {
        gPending.current = true;
        if (gTimer.current) clearTimeout(gTimer.current);
        gTimer.current = setTimeout(clearG, 1200);
        return;
      }
      if (gPending.current && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        const p = pathForToday();
        if (location.pathname !== p) {
          nav(p);
        }
        clearG();
        return;
      }
      if (gPending.current && e.key.length === 1) {
        clearG();
      }
    };
    document.addEventListener("keydown", onKey, { capture: true });
    return () => document.removeEventListener("keydown", onKey, { capture: true });
  }, [setHelpOpen, nav, location]);

  return null;
}
