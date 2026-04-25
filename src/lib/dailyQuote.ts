import quotesRaw from "../../daily-quotes.txt?raw";

const MONTH_ABBR_TO_NUMBER: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

type Quote = {
  label: string;
  text: string;
  author: string;
};

function parseQuotes(raw: string): Map<string, Quote> {
  const byDate = new Map<string, Quote>();
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith("*")) continue;

    const matched = t.match(
      /^\*\s+(?:\*\*)?([A-Za-z]{3})\s+(\d{1,2})(?::\*\*|:)\s+"(.+)"\s+—\s+\*\*(.+?)\*\*/,
    );
    if (!matched) continue;

    const monthAbbr = matched[1].toLowerCase();
    const day = String(Number(matched[2])).padStart(2, "0");
    const month = MONTH_ABBR_TO_NUMBER[monthAbbr];
    if (!month) continue;

    const key = `${month}-${day}`;
    const label = `${matched[1]} ${Number(matched[2])}`;
    byDate.set(key, {
      label,
      text: matched[3].trim(),
      author: matched[4].trim(),
    });
  }

  return byDate;
}

const QUOTES_BY_DATE = parseQuotes(quotesRaw);

function keyForDate(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getQuoteForDate(date: Date): Quote | null {
  return QUOTES_BY_DATE.get(keyForDate(date)) ?? null;
}
