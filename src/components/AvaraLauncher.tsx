import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AvaraOrb } from "@/components/AvaraOrb";

export type AvaraLauncherState = "active" | "thinking" | "ready";

interface AvaraLauncherProps {
  state?: AvaraLauncherState;
  actionCount?: number;
  onOpen: () => void;
  ariaLabel?: string;
  lensLayoutId?: string;
}

export const AvaraLauncher = ({
  state = "active",
  actionCount = 0,
  onOpen,
  ariaLabel = "Open Avara",
  lensLayoutId,
}: AvaraLauncherProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);

  const releasePress = () => {
    if (pressed) setPressed(false);
  };

  const showLabel = hovered || focused;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      className="avara-orb-button"
      data-state={state}
      aria-label={ariaLabel}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => {
        setHovered(false);
        releasePress();
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        releasePress();
      }}
      onTapStart={() => setPressed(true)}
      onTap={releasePress}
      onTapCancel={releasePress}
    >
      <AvaraOrb
        state={state}
        size="100%"
        className="avara-launcher-orb"
        layoutId={lensLayoutId}
        hovered={hovered}
        pressed={pressed}
      />
      <AnimatePresence>
        {showLabel && (
          <motion.span
            key="ask-avara-pill"
            className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-sage/30 bg-card px-3 py-1.5 text-xs text-ink shadow-rest"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 6 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 6 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: "easeOut" }}
          >
            Ask Avara
          </motion.span>
        )}
      </AnimatePresence>
      {actionCount > 0 && (
        <motion.span
          className="avara-orb-count"
          aria-label={`${actionCount} action${actionCount === 1 ? "" : "s"} ready`}
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 520, damping: 20 }
          }
        >
          {actionCount} ready
        </motion.span>
      )}
    </motion.button>
  );
};
