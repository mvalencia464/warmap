import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";

const STORAGE_KEY = "war-map-pomodoro-v1";
const MIN_MINUTES = 1;
const MAX_MINUTES = 240;

type SessionLog = {
  completedAt: number;
  seconds: number;
  label: string;
};

type Persisted = {
  minutesDraft: string;
  labelDraft: string;
  projectDraftTitle: string;
  soundEnabled: boolean;
  running: {
    startedAt: number;
    endsAt: number;
    totalSeconds: number;
    label: string;
    projectTitle: string;
  } | null;
  logs: SessionLog[];
};

function loadPersisted(): Persisted {
  if (typeof window === "undefined") {
    return {
      minutesDraft: "25",
      labelDraft: "",
      projectDraftTitle: "",
      soundEnabled: true,
      running: null,
      logs: [],
    };
  }
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Persisted | null;
    if (!parsed) throw new Error("empty");
    return {
      minutesDraft: parsed.minutesDraft || "25",
      labelDraft: parsed.labelDraft || "",
      projectDraftTitle: parsed.projectDraftTitle || "",
      soundEnabled: parsed.soundEnabled ?? true,
      running: parsed.running ?? null,
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    };
  } catch {
    return {
      minutesDraft: "25",
      labelDraft: "",
      projectDraftTitle: "",
      soundEnabled: true,
      running: null,
      logs: [],
    };
  }
}

function savePersisted(data: Persisted) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clampMinutes(input: number): number {
  return Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, input));
}

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function formatMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

function isToday(ts: number): boolean {
  const d = new Date(ts);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear()
    && d.getMonth() === n.getMonth()
    && d.getDate() === n.getDate()
  );
}

function playDoneTone() {
  const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const now = ctx.currentTime;
  const beep = (offset: number, freq: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.04, now + offset + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.24);
  };
  beep(0, 880);
  beep(0.28, 1174.66);
  void ctx.resume();
}

export function PomodoroTimer() {
  const logFocusSession = useMutation(api.focusAnalytics.logSession);
  const navigate = useNavigate();
  const persisted = useMemo(loadPersisted, []);
  const currentYear = new Date().getFullYear();
  const plans = useQuery(api.plans.listInYear, { year: currentYear });
  const [open, setOpen] = useState(false);
  const [minutesDraft, setMinutesDraft] = useState(persisted.minutesDraft);
  const [labelDraft, setLabelDraft] = useState(persisted.labelDraft);
  const [projectDraftTitle, setProjectDraftTitle] = useState(persisted.projectDraftTitle);
  const [soundEnabled, setSoundEnabled] = useState(persisted.soundEnabled);
  const [logs, setLogs] = useState<SessionLog[]>(persisted.logs);
  const [running, setRunning] = useState<Persisted["running"]>(persisted.running);
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!persisted.running) return 0;
    return Math.max(0, Math.ceil((persisted.running.endsAt - Date.now()) / 1000));
  });
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleBeforeTimerRef = useRef<string | null>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const completedRunRef = useRef<number | null>(null);

  useEffect(() => {
    savePersisted({ minutesDraft, labelDraft, projectDraftTitle, soundEnabled, running, logs });
  }, [minutesDraft, labelDraft, projectDraftTitle, soundEnabled, running, logs]);

  useEffect(() => {
    if (running) {
      completedRunRef.current = null;
    }
  }, [running?.startedAt]);

  useEffect(() => {
    if (!running) {
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((running.endsAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        if (completedRunRef.current === running.startedAt) return;
        completedRunRef.current = running.startedAt;
        const completedAt = Date.now();
        setRunning(null);
        setLogs((prev) => [
          ...prev.slice(-199),
          {
            completedAt,
            seconds: running.totalSeconds,
            label: running.label.trim(),
          },
        ]);
        void logFocusSession({
          completedAt,
          seconds: running.totalSeconds,
          label: running.label.trim(),
          projectTitle: running.projectTitle.trim(),
        });
        if (soundEnabled) {
          playDoneTone();
        }
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [running, soundEnabled, logFocusSession]);

  useEffect(() => {
    if (running) {
      if (titleBeforeTimerRef.current === null) {
        titleBeforeTimerRef.current = document.title;
      }
      document.title = `${formatClock(secondsLeft)} - PLAN`;
      return;
    }
    if (titleBeforeTimerRef.current !== null) {
      document.title = titleBeforeTimerRef.current;
      titleBeforeTimerRef.current = null;
    }
  }, [running, secondsLeft]);

  useEffect(
    () => () => {
      if (titleBeforeTimerRef.current !== null) {
        document.title = titleBeforeTimerRef.current;
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const recalc = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      const panelWidth = 320;
      const maxLeft = typeof window !== "undefined" ? Math.max(12, window.innerWidth - panelWidth - 12) : 12;
      setPanelPos({
        top: r.bottom + 8,
        left: Math.min(maxLeft, Math.max(12, r.right - panelWidth)),
      });
    };
    recalc();
    const onRecalc = () => recalc();
    window.addEventListener("scroll", onRecalc, true);
    window.addEventListener("resize", onRecalc);
    const onMouse = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (wrapRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouse, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("scroll", onRecalc, true);
      window.removeEventListener("resize", onRecalc);
      document.removeEventListener("mousedown", onMouse, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const todayStats = useMemo(() => {
    const today = logs.filter((l) => isToday(l.completedAt));
    const seconds = today.reduce((acc, l) => acc + l.seconds, 0);
    const byLabel = new Map<string, number>();
    for (const l of today) {
      const k = l.label.trim() || "Unlabeled";
      byLabel.set(k, (byLabel.get(k) ?? 0) + l.seconds);
    }
    const top = Array.from(byLabel.entries()).sort((a, b) => b[1] - a[1])[0];
    return {
      sessions: today.length,
      minutes: Math.round(seconds / 60),
      topLabel: top?.[0] ?? null,
    };
  }, [logs]);

  const isRunning = Boolean(running);
  const activeLabel = running?.label.trim() || "Focus";
  const activeProject = running?.projectTitle.trim() || projectDraftTitle.trim() || "No project";
  const draftMinutes = clampMinutes(Number.parseInt(minutesDraft, 10) || 25);
  const totalForDisplay = running ? running.totalSeconds : draftMinutes * 60;
  const displaySeconds = isRunning ? secondsLeft : totalForDisplay;
  const progressRatio = totalForDisplay > 0 ? Math.max(0, Math.min(1, displaySeconds / totalForDisplay)) : 0;

  const start = () => {
    const parsed = Number.parseInt(minutesDraft, 10);
    if (Number.isNaN(parsed)) return;
    const mins = clampMinutes(parsed);
    const totalSeconds = mins * 60;
    const now = Date.now();
    setMinutesDraft(String(mins));
    setRunning({
      startedAt: now,
      endsAt: now + totalSeconds * 1000,
      totalSeconds,
      label: labelDraft.trim(),
      projectTitle: projectDraftTitle.trim() || "No project",
    });
  };

  const stop = () => {
    setRunning(null);
    setSecondsLeft(0);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        className={clsx(
          "rounded-md border border-stone-200/90 bg-white px-2 py-1 text-xs font-medium text-stone-600 shadow-sm transition",
          "hover:border-stone-300 hover:bg-stone-50",
          "dark:border-stone-600/90 dark:bg-stone-800/90 dark:text-stone-300 dark:hover:border-stone-500 dark:hover:bg-stone-800",
          isRunning
            && "border-emerald-300/80 text-emerald-700 dark:border-emerald-600/60 dark:text-emerald-300",
        )}
        onClick={() => setOpen((o) => !o)}
        title="Focus timer"
      >
        {isRunning ? formatClock(secondsLeft) : "Focus"}
      </button>

      {open && panelPos && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          className="fixed z-260 w-80 rounded-2xl border border-stone-200 bg-white p-4 shadow-xl dark:border-stone-600/90 dark:bg-stone-900 dark:shadow-black/30"
          style={{ top: panelPos.top, left: panelPos.left }}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-stone-200 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-stone-500 uppercase dark:border-stone-700 dark:text-stone-400">
              Focus
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              {activeLabel} - {activeProject}
            </span>
          </div>
          <div className="relative mt-3 flex items-center justify-center">
            <svg viewBox="0 0 120 120" className="h-44 w-44">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-stone-200 dark:text-stone-700"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-rose-500"
                style={{
                  strokeDasharray: `${2 * Math.PI * 52}`,
                  strokeDashoffset: `${2 * Math.PI * 52 * (1 - progressRatio)}`,
                  transformOrigin: "50% 50%",
                  transform: "rotate(-90deg)",
                  transition: "stroke-dashoffset 220ms ease",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-light tabular-nums text-5xl tracking-tight text-stone-900 dark:text-stone-100">
                {formatClock(displaySeconds)}
              </p>
              <p className="mt-1 text-[10px] font-semibold tracking-[0.16em] text-stone-500 uppercase dark:text-stone-400">
                Minutes remaining
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={stop}
              disabled={!isRunning}
              className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800/70"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={isRunning ? stop : start}
              className={clsx(
                "rounded-full px-6 py-2 text-sm font-semibold transition",
                isRunning
                  ? "bg-stone-200 text-stone-700 hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600"
                  : "bg-rose-600 text-white shadow-[0_12px_30px_-14px_rgba(225,29,72,0.8)] hover:bg-rose-500",
              )}
            >
              {isRunning ? "Stop" : "Start"}
            </button>
          </div>
          <div className="mt-4 space-y-3 rounded-xl border border-stone-200/80 bg-stone-50/70 p-3 dark:border-stone-700/80 dark:bg-stone-950/50">
            <label className="block text-xs text-stone-600 dark:text-stone-400">
              Focus length:{" "}
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                {draftMinutes} min
              </span>
              <input
                type="range"
                min={MIN_MINUTES}
                max={90}
                value={draftMinutes}
                onChange={(e) => setMinutesDraft(e.target.value)}
                className="mt-2 w-full accent-rose-600"
                disabled={isRunning}
              />
            </label>
            <label className="block text-xs text-stone-600 dark:text-stone-400">
              Task (optional)
              <input
                type="text"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                placeholder="What are you focusing on?"
                className="mt-1 w-full rounded-md border border-stone-200 bg-white px-2 py-1.5 text-sm text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
                disabled={isRunning}
                maxLength={120}
              />
            </label>
            <label className="block text-xs text-stone-600 dark:text-stone-400">
              Project
              <select
                value={projectDraftTitle}
                onChange={(e) => setProjectDraftTitle(e.target.value)}
                className="mt-1 w-full rounded-md border border-stone-200 bg-white px-2 py-1.5 text-sm text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
                disabled={isRunning}
              >
                <option value="">No project</option>
                {(plans ?? []).map((p) => (
                  <option key={p._id} value={p.title}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
              <input
                type="checkbox"
                className="size-3.5 rounded border-stone-300 dark:border-stone-500"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
              Completion sound
            </label>
          </div>
          <div className="mt-3 rounded-md border border-stone-200/80 bg-stone-50/70 px-2.5 py-2 text-xs text-stone-600 dark:border-stone-700/80 dark:bg-stone-950/50 dark:text-stone-300">
            <p>
              Today:{" "}
              <span className="font-semibold text-stone-800 dark:text-stone-100">
                {todayStats.minutes}m
              </span>{" "}
              across{" "}
              <span className="font-semibold text-stone-800 dark:text-stone-100">
                {todayStats.sessions}
              </span>{" "}
              sessions
            </p>
            {todayStats.topLabel ? (
              <p className="mt-0.5 truncate">
                Top focus:{" "}
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {todayStats.topLabel}
                </span>
              </p>
            ) : null}
            <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
              Synced to analytics after each completed session ({formatMinutes(totalForDisplay)}m target).
            </p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/analytics");
              }}
              className="mt-2 text-[11px] font-medium text-stone-600 underline underline-offset-2 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100"
            >
              View analytics
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
