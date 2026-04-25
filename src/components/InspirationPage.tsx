import { Link } from "react-router-dom";
import { AppShell } from "./Layout";
import { getQuoteForDate } from "../lib/dailyQuote";

const SAM_OVENS_WARMAP_EMBED = "https://www.youtube.com/embed/l6lV30ds3XI";
const SAM_OVENS_8020_EMBED = "https://www.youtube.com/embed/xm2cA5Y5Ru4";
const POWER_GRID_SHEET_URL = "https://docs.google.com/spreadsheets/d/1P36m-AoSMh7_lScrWRS5cHGFQnV1aehrUTOiSHNKl9g/edit?usp=sharing";
const POWER_GRID_SHOT_URL = "https://media.stokeleads.com/vision/SCR-20260425-hwxd.png";

export function InspirationPage() {
  const year = new Date().getFullYear();
  const quote = getQuoteForDate(new Date());

  return (
    <AppShell year={year} quote={quote}>
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase dark:text-stone-400">
            Inspiration
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Why this tool exists
          </h2>
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            War map is designed to turn vision into weekly direction and daily action. It combines
            long-horizon planning with ruthless prioritization so your calendar reflects your strategy.
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Tip: press <kbd className="rounded border border-stone-300 bg-stone-100 px-1 font-mono dark:border-stone-600 dark:bg-stone-800">?</kbd> anywhere outside text inputs to open the shortcut menu.
          </p>
        </header>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Core inspiration video
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Sam Ovens on the thinking behind building a war map and operating from vision first.
          </p>
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-black shadow-sm dark:border-stone-700">
            <iframe
              className="aspect-video w-full"
              src={SAM_OVENS_WARMAP_EMBED}
              title="War map inspiration"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            80/20 Power Grid lesson
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            How to apply 80/20 leverage to your weekly execution and remove low-value work.
          </p>
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-black shadow-sm dark:border-stone-700">
            <iframe
              className="aspect-video w-full"
              src={SAM_OVENS_8020_EMBED}
              title="80/20 power grid lesson"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-900/50">
            <a
              href={POWER_GRID_SHEET_URL}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100"
            >
              Open the 80/20 Power Grid spreadsheet
            </a>
            <a href={POWER_GRID_SHEET_URL} target="_blank" rel="noreferrer">
              <img
                src={POWER_GRID_SHOT_URL}
                alt="80/20 Power Grid spreadsheet preview"
                className="mt-3 w-full rounded-lg border border-stone-200 dark:border-stone-700"
                loading="lazy"
                decoding="async"
              />
            </a>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Quick start with this app
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-stone-600 dark:text-stone-300">
            <li>Set yearly direction in PLAN, then assign ranges across months.</li>
            <li>Drop tasks into month days and protect maker blocks.</li>
            <li>Review weekly themes each Monday and pick your one key leverage move.</li>
            <li>Use shortcuts often: <kbd className="rounded border border-stone-300 bg-stone-100 px-1 font-mono dark:border-stone-600 dark:bg-stone-800">?</kbd>, <kbd className="rounded border border-stone-300 bg-stone-100 px-1 font-mono dark:border-stone-600 dark:bg-stone-800">G</kbd> then <kbd className="rounded border border-stone-300 bg-stone-100 px-1 font-mono dark:border-stone-600 dark:bg-stone-800">T</kbd>, and <kbd className="rounded border border-stone-300 bg-stone-100 px-1 font-mono dark:border-stone-600 dark:bg-stone-800">Esc</kbd>.</li>
          </ul>
        </section>

        <footer className="pt-2">
          <Link
            to={`/?year=${year}`}
            className="text-sm font-medium text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline dark:text-stone-400 dark:hover:text-stone-200"
          >
            Back to PLAN
          </Link>
        </footer>
      </article>
    </AppShell>
  );
}
