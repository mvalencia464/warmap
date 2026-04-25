import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";

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
  soundEnabled: boolean;
  running: {
    startedAt: number;
    endsAt: number;
    totalSeconds: number;
    label: string;
  } | null;
  logs: SessionLog[];
};

function loadPersisted(): Persisted {
  if (typeof window === "undefined") {
    return {
      minutesDraft: "25",
      labelDraft: "",
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
      soundEnabled: parsed.soundEnabled ?? true,
      running: parsed.running ?? null,
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    };
  } catch {
    return {
      minutesDraft: "25",
      labelDraft: "",
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
  const persisted = useMemo(loadPersisted, []);
  const [open, setOpen] = useState(false);
  const [minutesDraft, setMinutesDraft] = useState(persisted.minutesDraft);
  const [labelDraft, setLabelDraft] = useState(persisted.labelDraft);
  const [soundEnabled, setSoundEnabled] = useState(persisted.soundEnabled);
  const [logs, setLogs] = useState<SessionLog[]>(persisted.logs);
  const [running, setRunning] = useState<Persisted["running"]>(persisted.running);
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!persisted.running) return 0;
    return Math.max(0, Math.ceil((persisted.running.endsAt - Date.now()) / 1000));
  });
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const titleBeforeTimerRef = useRef<string | null>(null);

  useEffect(() => {
    savePersisted({ minutesDraft, labelDraft, soundEnabled, running, logs });
  }, [minutesDraft, labelDraft, soundEnabled, running, logs]);

  useEffect(() => {
    if (!running) {
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((running.endsAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        setRunning(null);
        setLogs((prev) => [
          ...prev.slice(-199),
          {
            completedAt: Date.now(),
            seconds: running.totalSeconds,
            label: running.label.trim(),
          },
        ]);
        if (soundEnabled) {
          playDoneTone();
        }
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [running, soundEnabled]);

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
    const onMouse = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (wrapRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouse, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
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
        className={clsx(
          "rounded-md border border-stone-200/90 bg-white px-2 py-1 text-xs font-medium text-stone-600 shadow-sm transition",
          "hover:border-stone-300 hover:bg-stone-50",
          isRunning && "border-emerald-300/80 text-emerald-700",
        )}
        onClick={() => setOpen((o) => !o)}
        title="Focus timer"
      >
        {isRunning ? formatClock(secondsLeft) : "Focus"}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-stone-200 bg-white p-3 shadow-xl">
          <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Pomodoro</p>
          <div className="mt-2 flex items-end gap-2">
            <label className="flex-1 text-xs text-stone-600">
              Minutes
              <input
                type="number"
                min={MIN_MINUTES}
                max={MAX_MINUTES}
                value={minutesDraft}
                onChange={(e) => setMinutesDraft(e.target.value)}
                className="mt-1 w-full rounded-md border border-stone-200 bg-stone-50 px-2 py-1.5 text-sm text-stone-900"
                disabled={isRunning}
              />
            </label>
            <button
              type="button"
              onClick={isRunning ? stop : start}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                isRunning
                  ? "bg-stone-200 text-stone-700 hover:bg-stone-300"
                  : "bg-stone-800 text-white hover:bg-stone-700",
              )}
            >
              {isRunning ? "Stop" : "Start"}
            </button>
          </div>

          <label className="mt-2 block text-xs text-stone-600">
            Task (optional)
            <input
              type="text"
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              placeholder="What are you focusing on?"
              className="mt-1 w-full rounded-md border border-stone-200 bg-stone-50 px-2 py-1.5 text-sm text-stone-900"
              disabled={isRunning}
              maxLength={120}
            />
          </label>

          <div className="mt-2 flex items-center justify-between">
            <label className="inline-flex items-center gap-1.5 text-xs text-stone-600">
              <input
                type="checkbox"
                className="size-3.5 rounded border-stone-300"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
              Alert sound
            </label>
            {isRunning ? (
              <span className="text-xs text-stone-500">{activeLabel}</span>
            ) : null}
          </div>

          <div className="mt-3 rounded-md border border-stone-200/80 bg-stone-50/70 px-2.5 py-2 text-xs text-stone-600">
            <p>Today: <span className="font-semibold text-stone-800">{todayStats.minutes}m</span> across <span className="font-semibold text-stone-800">{todayStats.sessions}</span> sessions</p>
            {todayStats.topLabel ? (
              <p className="mt-0.5 truncate">Top focus: <span className="font-medium text-stone-800">{todayStats.topLabel}</span></p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
