import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const themeOptions = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

type ThemeValue = (typeof themeOptions)[number]["value"];
type ResolvedTheme = "light" | "dark";

const segmentSizePx = 32;
const themeTransitionMs = 620;
const themeApplyDelayMs = 120;
const reevaluateIntervalMs = 60_000;

// Daytime is 06:00–17:59 local; outside that → dark.
const dayStartHour = 6;
const dayEndHour = 18;

export const THEME_PREFERENCE_KEY = "avitus-theme-preference";

const isThemeValue = (value: string | null | undefined): value is ThemeValue =>
  value === "system" || value === "light" || value === "dark";

const getTimeBasedTheme = (): ResolvedTheme => {
  const hour = new Date().getHours();
  return hour >= dayStartHour && hour < dayEndHour ? "light" : "dark";
};

const resolvePreference = (preference: ThemeValue): ResolvedTheme =>
  preference === "system" ? getTimeBasedTheme() : preference;

export const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const [preference, setPreference] = useState<ThemeValue>("system");
  const themeApplyTimer = useRef<number | null>(null);
  const { setTheme } = useTheme();

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_PREFERENCE_KEY);
    const initial: ThemeValue = isThemeValue(stored) ? stored : "system";
    setPreference(initial);
    setTheme(resolvePreference(initial));
    setMounted(true);
  }, [setTheme]);

  useEffect(() => {
    if (preference !== "system") return;

    const apply = () => setTheme(getTimeBasedTheme());
    const interval = window.setInterval(apply, reevaluateIntervalMs);
    const onVisibilityChange = () => {
      if (!document.hidden) apply();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [preference, setTheme]);

  useEffect(() => {
    return () => {
      if (themeApplyTimer.current) {
        window.clearTimeout(themeApplyTimer.current);
      }
    };
  }, []);

  const activeTheme = mounted ? preference : "system";
  const activeIndex = Math.max(
    themeOptions.findIndex((option) => option.value === activeTheme),
    0,
  );
  const handleThemeSelect = (value: ThemeValue) => {
    if (themeApplyTimer.current) {
      window.clearTimeout(themeApplyTimer.current);
    }

    setPreference(value);
    window.localStorage.setItem(THEME_PREFERENCE_KEY, value);

    const resolved = resolvePreference(value);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setTheme(resolved);
      return;
    }

    themeApplyTimer.current = window.setTimeout(() => {
      setTheme(resolved);
      themeApplyTimer.current = null;
    }, themeApplyDelayMs);
  };

  return (
    <div
      role="group"
      aria-label="Theme"
      className="relative inline-grid select-none grid-cols-3 items-center rounded-full border border-border bg-card/85 p-1 shadow-sm backdrop-blur-md"
    >
      <div
        aria-hidden="true"
        className="absolute left-1 top-1 h-8 w-8 rounded-full border border-border bg-background shadow-sm transition-transform will-change-transform motion-reduce:transition-none"
        style={{
          transform: `translate3d(${activeIndex * segmentSizePx}px, 0, 0)`,
          transitionDuration: `${themeTransitionMs}ms`,
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      {themeOptions.map(({ value, label, icon: Icon }) => {
        const isActive = activeTheme === value;
        return (
          <button
            key={value}
            type="button"
            aria-label={`Use ${label.toLowerCase()} theme`}
            aria-pressed={isActive}
            title={label}
            onClick={() => handleThemeSelect(value)}
            className={`relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
              isActive
                ? "text-ink"
                : "text-stone hover:text-ink"
            }`}
          >
            <Icon size={15} strokeWidth={1.6} />
          </button>
        );
      })}
    </div>
  );
};
