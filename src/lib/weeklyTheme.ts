import weeklyRaw from "../../weekly.txt?raw";

export type WeeklyTheme = {
  week: number;
  title: string;
  idea: string;
  quote: string;
  author: string;
};

export type WeekDateRange = {
  startIso: string;
  endIso: string;
  label: string;
};

function parseWeeklyThemes(raw: string): WeeklyTheme[] {
  const themes: WeeklyTheme[] = [];
  const blocks = raw.matchAll(/WEEK\s+(\d+):\s*([\s\S]*?)(?=WEEK\s+\d+:|$)/gi);

  for (const block of blocks) {
    const week = Number(block[1]);
    const body = (block[2] ?? "").replace(/\r/g, "").trim();
    if (!Number.isFinite(week) || !body) continue;

    const lines = body
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 3) continue;

    const title = lines[0];
    const ideaLine = lines.find((line) => line.startsWith("The Idea:"));
    const quoteLine = lines.find((line) => line.startsWith("Quote:"));
    if (!ideaLine || !quoteLine) continue;

    const idea = ideaLine.slice("The Idea:".length).trim();
    const quoteMatch = quoteLine.match(/^Quote:\s*"(.+)"\s+—\s+(.+)$/);
    if (!quoteMatch) continue;
    const quote = quoteMatch[1].trim();
    const author = quoteMatch[2].trim();

    if (title && idea && quote && author) {
      themes.push({ week, title, idea, quote, author });
    }
  }

  return themes.sort((a, b) => a.week - b.week);
}

const WEEKLY_THEMES = parseWeeklyThemes(weeklyRaw);
const TOTAL_WEEKS = 52;

function getIsoWeekNumber(date: Date): number {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function toIsoDateFromUtc(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function formatRangeLabelFromUtc(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}

export function getWeekDateRange(week: number, year: number): WeekDateRange {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Weekday = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Weekday + 1);
  const start = new Date(week1Monday);
  start.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  return {
    startIso: toIsoDateFromUtc(start),
    endIso: toIsoDateFromUtc(end),
    label: formatRangeLabelFromUtc(start, end),
  };
}

export function getWeeklyThemes(): WeeklyTheme[] {
  const themes: WeeklyTheme[] = [];
  for (let week = 1; week <= TOTAL_WEEKS; week += 1) {
    const theme = getThemeForWeek(week);
    if (theme) themes.push(theme);
  }
  return themes;
}

export function getThemeForWeek(week: number): WeeklyTheme | null {
  if (!Number.isFinite(week) || week < 1 || week > TOTAL_WEEKS || WEEKLY_THEMES.length === 0) {
    return null;
  }
  const direct = WEEKLY_THEMES.find((t) => t.week === week);
  if (direct) return direct;
  const normalizedIndex = (week - 1) % WEEKLY_THEMES.length;
  const source = WEEKLY_THEMES[normalizedIndex];
  return source ? { ...source, week } : null;
}

export function getCurrentWeekTheme(date: Date): WeeklyTheme | null {
  const isoWeek = getIsoWeekNumber(date);
  return getThemeForWeek(isoWeek);
}
