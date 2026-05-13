import { useEffect, useRef, useState } from "react";
import { Clock, ChevronDown } from "lucide-react";

const OPTIONS = [
  { d: 1, l: "In 1 day" },
  { d: 3, l: "In 3 days" },
  { d: 7, l: "In 1 week" },
  { d: 14, l: "In 2 weeks" },
];

export const ReminderMenu = ({ onPick }: { onPick: (days: number) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 px-3.5 py-2.5 border border-border bg-card text-[10px] uppercase tracking-[0.18em] text-ink shadow-rest-lit transition-all duration-200 hover:bg-secondary hover:shadow-hover-lit"
      >
        <Clock size={13} strokeWidth={1.5} /> Reminder
        <ChevronDown size={12} strokeWidth={1.5} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full mt-2 left-0 bg-background border border-border shadow-hover-lit z-10 min-w-[180px]"
        >
          {OPTIONS.map(({ d, l }) => (
            <button
              key={d}
              type="button"
              role="menuitem"
              onClick={() => {
                onPick(d);
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-sage-soft/60 hover:text-sage-deep transition-colors"
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
