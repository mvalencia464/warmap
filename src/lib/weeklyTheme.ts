import weeklyRaw from "../../weekly.txt?raw";

export type WeeklyTheme = {
  week: number;
  title: string;
  idea: string;
  quote: string;
  author: string;
};

function parseWeeklyThemes(raw: string): WeeklyTheme[] {
  const lines = raw.split(/\r?\n/);
  const themes: WeeklyTheme[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const header = lines[i]?.trim().match(/^Week\s+(\d+):\s*(.+)$/i);
    if (!header) continue;

    const week = Number(header[1]);
    const title = header[2].trim();
    let idea = "";
    let quote = "";
    let author = "";

    for (let j = i + 1; j < lines.length; j += 1) {
      const line = lines[j].trim();
      if (!line) continue;
      if (/^Week\s+\d+:/i.test(line)) break;
      if (/^\+\d+$/.test(line)) continue;

      if (!idea && line.startsWith("The Idea:")) {
        idea = line.slice("The Idea:".length).trim();
        continue;
      }

      if (!quote && line.startsWith("\"")) {
        const quoteMatch = line.match(/^"(.+)"\s+—\s+(.+)$/);
        if (quoteMatch) {
          quote = quoteMatch[1].trim();
          author = quoteMatch[2].trim();
        }
      }
    }

    if (Number.isFinite(week) && title && idea && quote && author) {
      themes.push({ week, title, idea, quote, author });
    }
  }

  return themes.sort((a, b) => a.week - b.week);
}

const WEEKLY_THEMES = parseWeeklyThemes(weeklyRaw);

function getIsoWeekNumber(date: Date): number {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function getCurrentWeekTheme(date: Date): WeeklyTheme | null {
  if (WEEKLY_THEMES.length === 0) return null;
  const isoWeek = getIsoWeekNumber(date);
  const direct = WEEKLY_THEMES.find((t) => t.week === isoWeek);
  if (direct) return direct;
  const normalizedIndex = (isoWeek - 1) % WEEKLY_THEMES.length;
  return WEEKLY_THEMES[normalizedIndex] ?? null;
}
