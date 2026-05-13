import { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

type Accent =
  | "overview"
  | "leads"
  | "intake"
  | "import"
  | "avara"
  | "projects"
  | "settings";

const ACCENT_CLASSES: Record<Accent, string> = {
  overview: "bg-sage",
  leads: "bg-pine",
  intake: "bg-sage",
  import: "bg-stone/50",
  avara: "bg-[var(--avara-rose-warm)]",
  projects: "bg-sage",
  settings: "bg-stone/50",
};

const REVEAL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const REVEAL_DURATION = 0.48;

export const PageHeader = ({
  eyebrow,
  title,
  subtitle,
  actions,
  leading,
  accent,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  leading?: ReactNode;
  accent?: Accent;
}) => {
  const prefersReducedMotion = useReducedMotion();

  const reveal = (delay: number) =>
    prefersReducedMotion
      ? undefined
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: REVEAL_DURATION, delay, ease: REVEAL_EASE },
        };

  return (
    <div className="flex items-end justify-between gap-6 pb-10 mb-10 border-b border-border bg-hairline bg-bottom bg-no-repeat bg-[length:100%_1px]">
      <div className="flex items-end gap-5 min-w-0">
        {leading && <div className="shrink-0 pb-1">{leading}</div>}
        <div className="min-w-0">
          {accent && (
            <motion.div
              {...reveal(0)}
              aria-hidden
              className={`h-px w-6 mb-3 ${ACCENT_CLASSES[accent]}`}
            />
          )}
          {eyebrow && (
            <motion.div {...reveal(0.08)} className="micro-label mb-4">
              {eyebrow}
            </motion.div>
          )}
          <motion.h1
            {...reveal(0.16)}
            className="font-serif text-5xl text-pine leading-none"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              {...reveal(0.24)}
              className="mt-4 text-stone max-w-xl text-[15px] leading-relaxed"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>
      {actions && (
        <motion.div
          {...reveal(0.24)}
          className="flex items-center gap-3"
        >
          {actions}
        </motion.div>
      )}
    </div>
  );
};
