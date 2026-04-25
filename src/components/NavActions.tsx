import { UserButton } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { useHelp } from "../HelpContext";
import { PomodoroTimer } from "./PomodoroTimer";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6M12 7h.01" />
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </svg>
  );
}

export function NavActions() {
  const { theme, toggleTheme } = useTheme();
  const { setHelpOpen } = useHelp();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center justify-end gap-1.5 sm:gap-2">
      <PomodoroTimer />
      <UserButton appearance={{ elements: { userButtonBox: "ring-0" } }}>
        <UserButton.MenuItems>
          <UserButton.Action
            label="How it works + shortcuts (?)"
            labelIcon={<InfoIcon className="h-4 w-4" />}
            onClick={() => setHelpOpen(true)}
          />
          <UserButton.Action
            label="Inspiration"
            labelIcon={<SparkIcon className="h-4 w-4" />}
            onClick={() => navigate("/inspiration")}
          />
          <UserButton.Action
            label={isDark ? "Light mode" : "Dark mode"}
            labelIcon={
              isDark ? (
                <SunIcon className="h-4 w-4" />
              ) : (
                <MoonIcon className="h-4 w-4" />
              )
            }
            onClick={toggleTheme}
          />
        </UserButton.MenuItems>
      </UserButton>
    </div>
  );
}
