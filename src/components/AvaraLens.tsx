import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";

export type AvaraLensState = "active" | "thinking" | "preparing" | "ready";
export type AvaraLensSize = "sm" | "md" | "lg" | "xl";
export type AvaraLensVariant = "faceted" | "pearl";

interface AvaraLensProps {
  state?: AvaraLensState;
  size?: AvaraLensSize;
  variant?: AvaraLensVariant;
  className?: string;
  layoutId?: string;
}

const motionMap = (definition: Record<AvaraLensState, any>) => definition;

const lensMotion = motionMap({
  active: {
    y: [0, -1.4, 0.6, 0],
    rotate: [0, 1.2, -0.6, 0],
    scale: [1, 1.012, 1.004, 1],
    transition: { duration: 8.2, repeat: Infinity, ease: "easeInOut" },
  },
  thinking: {
    y: [0, -1, 1, 0],
    rotate: [0, 2.2, -1.2, 0],
    scale: [1, 1.028, 1.012, 1],
    transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
  },
  preparing: {
    y: [0, -2, 0],
    rotate: [0, -2.4, 1.4, 0],
    scale: [1, 1.036, 1],
    transition: { duration: 2.35, repeat: Infinity, ease: "easeInOut" },
  },
  ready: {
    y: [0, -1.5, 0],
    rotate: [0, 2.5, 0],
    scale: [1, 1.08, 1],
    transition: { duration: 0.92, ease: [0.22, 1, 0.36, 1] },
  },
});

const pearlCoreMotion = motionMap({
  active: {
    rotate: [0, 3, -1, 0],
    scale: [1, 1.015, 1.006, 1],
    transition: { duration: 10, repeat: Infinity, ease: "easeInOut" },
  },
  thinking: {
    rotate: [0, 7, -3, 0],
    scale: [1, 1.035, 1.012, 1],
    transition: { duration: 4.4, repeat: Infinity, ease: "easeInOut" },
  },
  preparing: {
    rotate: [0, -8, 4, 0],
    scale: [1, 1.045, 1],
    transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
  },
  ready: {
    rotate: [0, 5, 0],
    scale: [1, 1.06, 1],
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
});

const lavenderMotion = motionMap({
  active: {
    x: [0, 0.8, -0.4, 0],
    y: [0, -0.7, 0.3, 0],
    opacity: [0.52, 0.74, 0.6, 0.52],
    transition: { duration: 9.4, repeat: Infinity, ease: "easeInOut" },
  },
  thinking: {
    x: [0, 2.1, -0.8, 0],
    y: [0, -1.8, 0.8, 0],
    opacity: [0.52, 0.9, 0.68, 0.52],
    transition: { duration: 3.1, repeat: Infinity, ease: "easeInOut" },
  },
  preparing: {
    x: [0, -1.8, 1.4, 0],
    y: [0, 1.4, -1.2, 0],
    opacity: [0.5, 0.88, 0.62, 0.5],
    transition: { duration: 2.65, repeat: Infinity, ease: "easeInOut" },
  },
  ready: {
    x: [0, 1.4, 0],
    y: [0, -1.2, 0],
    opacity: [0.48, 0.92, 0.58],
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
});

const roseMotion = motionMap({
  active: {
    x: [0, -0.9, 0.5, 0],
    y: [0, 0.6, -0.3, 0],
    opacity: [0.5, 0.68, 0.56, 0.5],
    transition: { duration: 11, repeat: Infinity, ease: "easeInOut" },
  },
  thinking: {
    x: [0, -1.9, 0.9, 0],
    y: [0, 1.7, -0.7, 0],
    opacity: [0.5, 0.88, 0.62, 0.5],
    transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
  },
  preparing: {
    x: [0, 1.8, -1.1, 0],
    y: [0, -1.2, 1.2, 0],
    opacity: [0.48, 0.84, 0.6, 0.48],
    transition: { duration: 2.9, repeat: Infinity, ease: "easeInOut" },
  },
  ready: {
    x: [0, -1.4, 0],
    y: [0, 1, 0],
    opacity: [0.48, 0.9, 0.58],
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
});

const apertureMotion = motionMap({
  active: {
    opacity: [0.16, 0.42, 0.18],
    rotate: [0, 90, 180],
    transition: { duration: 9.8, repeat: Infinity, ease: "easeInOut" },
  },
  thinking: {
    opacity: [0.2, 0.78, 0.26],
    rotate: [0, 220, 440],
    transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
  },
  preparing: {
    opacity: [0.18, 0.84, 0.34],
    rotate: [0, -190, -380],
    transition: { duration: 1.85, repeat: Infinity, ease: "easeInOut" },
  },
  ready: {
    opacity: [0, 0.9, 0],
    rotate: [0, 50, 90],
    scale: [0.95, 1.15, 1.02],
    transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
  },
});

const causticMotion = motionMap({
  active: {
    x: [0, 1.1, -0.8, 0],
    y: [0, -0.9, 0.5, 0],
    rotate: [-8, 12, -4, -8],
    opacity: [0.34, 0.62, 0.42, 0.34],
    transition: { duration: 8.8, repeat: Infinity, ease: "easeInOut" },
  },
  thinking: {
    x: [-1.2, 2.4, -0.8, 1.2],
    y: [0.6, -1.8, 1.2, 0.6],
    rotate: [-16, 28, -10, -16],
    opacity: [0.42, 0.84, 0.56, 0.42],
    transition: { duration: 2.75, repeat: Infinity, ease: "easeInOut" },
  },
  preparing: {
    x: [1.2, -2.2, 1.6, 1.2],
    y: [-0.8, 1.7, -1, -0.8],
    rotate: [18, -26, 8, 18],
    opacity: [0.44, 0.9, 0.62, 0.44],
    transition: { duration: 2.25, repeat: Infinity, ease: "easeInOut" },
  },
  ready: {
    x: [0, 1.6, 0],
    y: [0, -1.2, 0],
    rotate: [-6, 14, 0],
    opacity: [0.34, 0.9, 0.5],
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
});

const traceMotion = motionMap({
  active: {
    pathLength: [0.16, 0.62, 0.22],
    rotate: [-20, 80, 150],
    opacity: [0.08, 0.42, 0.14],
    transition: { duration: 8.4, repeat: Infinity, ease: "easeInOut" },
  },
  thinking: {
    pathLength: [0.18, 0.82, 0.26],
    rotate: [-30, 170, 340],
    opacity: [0.16, 0.72, 0.2],
    transition: { duration: 2.05, repeat: Infinity, ease: "easeInOut" },
  },
  preparing: {
    pathLength: [0.12, 0.88, 0.3],
    rotate: [24, -180, -330],
    opacity: [0.16, 0.78, 0.24],
    transition: { duration: 1.7, repeat: Infinity, ease: "easeInOut" },
  },
  ready: {
    pathLength: [0, 1, 0.18],
    rotate: [-18, 24, 42],
    opacity: [0, 0.86, 0],
    transition: { duration: 0.92, ease: [0.22, 1, 0.36, 1] },
  },
});

const threadLineMotion = motionMap({
  active: {
    pathLength: [0.08, 0.36, 0.12],
    opacity: [0, 0.24, 0],
    transition: { duration: 7.2, repeat: Infinity, ease: "easeInOut" },
  },
  thinking: {
    pathLength: [0.08, 0.82, 0.22],
    opacity: [0, 0.72, 0.1],
    transition: { duration: 1.35, repeat: Infinity, ease: "easeInOut" },
  },
  preparing: {
    pathLength: [0.12, 0.9, 0.28],
    opacity: [0.04, 0.78, 0.12],
    transition: { duration: 1.05, repeat: Infinity, ease: "easeInOut" },
  },
  ready: {
    pathLength: [0, 1, 0],
    opacity: [0, 0.72, 0],
    transition: { duration: 0.82, ease: [0.22, 1, 0.36, 1] },
  },
});

const facetMotion = motionMap({
  active: {
    x: [0, -0.7, 0.5, 0],
    y: [0, 0.8, -0.4, 0],
    rotate: [0, -3, 2, 0],
    opacity: [0.58, 0.78, 0.64, 0.58],
    transition: { duration: 10.5, repeat: Infinity, ease: "easeInOut" },
  },
  thinking: {
    x: [0.4, -1.8, 1.4, 0.4],
    y: [-0.4, 1.6, -1.1, -0.4],
    rotate: [0, -8, 5, 0],
    opacity: [0.64, 0.92, 0.7, 0.64],
    transition: { duration: 2.9, repeat: Infinity, ease: "easeInOut" },
  },
  preparing: {
    x: [-0.5, 1.8, -1.2, -0.5],
    y: [0.3, -1.4, 1.1, 0.3],
    rotate: [0, 9, -4, 0],
    opacity: [0.66, 0.95, 0.72, 0.66],
    transition: { duration: 2.25, repeat: Infinity, ease: "easeInOut" },
  },
  ready: {
    x: [0, 1.1, 0],
    y: [0, -0.8, 0],
    rotate: [0, 5, 0],
    opacity: [0.58, 0.98, 0.68],
    transition: { duration: 0.86, ease: [0.22, 1, 0.36, 1] },
  },
});

const signalMotion = motionMap({
  active: {
    x: [0, 1.2, -0.5, 0],
    y: [0, -0.8, 0.5, 0],
    scale: [1, 1.18, 0.96, 1],
    opacity: [0.48, 0.86, 0.62, 0.48],
    transition: { duration: 6.8, repeat: Infinity, ease: "easeInOut" },
  },
  thinking: {
    x: [-0.8, 1.8, -1.2, -0.8],
    y: [0.4, -1.4, 1, 0.4],
    scale: [0.95, 1.38, 1.08, 0.95],
    opacity: [0.64, 1, 0.7, 0.64],
    transition: { duration: 1.65, repeat: Infinity, ease: "easeInOut" },
  },
  preparing: {
    x: [0.6, -1.6, 1, 0.6],
    y: [-0.4, 1.2, -0.8, -0.4],
    scale: [0.96, 1.34, 1.06, 0.96],
    opacity: [0.62, 0.98, 0.68, 0.62],
    transition: { duration: 1.3, repeat: Infinity, ease: "easeInOut" },
  },
  ready: {
    x: [0, 0.8, 0],
    y: [0, -0.6, 0],
    scale: [1, 1.58, 1.08],
    opacity: [0.42, 1, 0.62],
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
});

export const AvaraLens = ({
  state = "active",
  size = "md",
  variant = "faceted",
  className = "",
  layoutId,
}: AvaraLensProps) => {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const shouldReduceMotion = useReducedMotion();
  const pearlCoreId = `avara-pearl-core-${rawId}`;
  const pearlBlushId = `avara-pearl-blush-${rawId}`;
  const pearlRoseId = `avara-pearl-rose-${rawId}`;
  const pearlLavenderId = `avara-pearl-lavender-${rawId}`;
  const pearlRimId = `avara-pearl-rim-${rawId}`;
  const pearlFacetId = `avara-pearl-facet-${rawId}`;
  const pearlSignalId = `avara-pearl-signal-${rawId}`;
  const pearlClipId = `avara-pearl-clip-${rawId}`;
  const pearlSoftId = `avara-pearl-soft-${rawId}`;

  return (
    <motion.span
      className={`avara-lens avara-lens-${size} ${className}`.trim()}
      data-state={state}
      data-variant={variant}
      aria-hidden="true"
      layoutId={layoutId}
      animate={shouldReduceMotion ? { scale: 1, rotate: 0, y: 0 } : lensMotion[state]}
    >
      {variant === "pearl" ? (
        <motion.svg
          className="avara-pearl-svg"
          viewBox="0 0 100 100"
          role="img"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <clipPath id={pearlClipId}>
              <circle cx="50" cy="50" r="43" />
            </clipPath>
            <filter id={pearlSoftId} x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur stdDeviation="1.15" />
            </filter>
            <radialGradient id={pearlCoreId} cx="61%" cy="43%" r="68%">
              <stop offset="0%" stopColor="#FFF7EA" stopOpacity="0.98" />
              <stop offset="31%" stopColor="#F5E9D5" stopOpacity="0.9" />
              <stop offset="58%" stopColor="#D9BFA2" stopOpacity="0.78" />
              <stop offset="82%" stopColor="#A98258" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#4F3F2F" stopOpacity="0.76" />
            </radialGradient>
            <radialGradient id={pearlBlushId} cx="45%" cy="12%" r="70%">
              <stop offset="0%" stopColor="#F4A7B9" stopOpacity="0.72" />
              <stop offset="50%" stopColor="#F4A7B9" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#F4A7B9" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={pearlRoseId} cx="20%" cy="84%" r="65%">
              <stop offset="0%" stopColor="#E8B89A" stopOpacity="0.52" />
              <stop offset="58%" stopColor="#E8B89A" stopOpacity="0.13" />
              <stop offset="100%" stopColor="#E8B89A" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={pearlLavenderId} cx="80%" cy="22%" r="55%">
              <stop offset="0%" stopColor="#77596A" stopOpacity="0.54" />
              <stop offset="56%" stopColor="#77596A" stopOpacity="0.13" />
              <stop offset="100%" stopColor="#77596A" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={pearlRimId} x1="14" y1="16" x2="86" y2="86">
              <stop offset="0%" stopColor="#FFF7EA" stopOpacity="0.72" />
              <stop offset="22%" stopColor="#E8B89A" stopOpacity="0.86" />
              <stop offset="55%" stopColor="#F4A7B9" stopOpacity="0.44" />
              <stop offset="100%" stopColor="#C9A29A" stopOpacity="0.82" />
            </linearGradient>
            <linearGradient id={pearlFacetId} x1="18" y1="18" x2="84" y2="88">
              <stop offset="0%" stopColor="#FFF7EA" stopOpacity="0.6" />
              <stop offset="48%" stopColor="#E8B89A" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#2D241B" stopOpacity="0.18" />
            </linearGradient>
            <radialGradient id={pearlSignalId} cx="48%" cy="42%" r="62%">
              <stop offset="0%" stopColor="#F4EFE6" stopOpacity="1" />
              <stop offset="34%" stopColor="#F26D5B" stopOpacity="0.72" />
              <stop offset="100%" stopColor="#E8B89A" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle className="avara-pearl-drop-shadow" cx="50" cy="53" r="42" />
          <g clipPath={`url(#${pearlClipId})`}>
            <motion.g
              className="avara-pearl-core-layer"
              animate={shouldReduceMotion ? undefined : pearlCoreMotion[state]}
            >
              <circle cx="50" cy="50" r="43" fill={`url(#${pearlCoreId})`} />
              <motion.path
                className="avara-pearl-blush"
                d="M19 13C34 5 63 0 77 23C64 18 50 18 39 28C29 37 21 48 10 51C8 34 10 21 19 13Z"
                fill={`url(#${pearlBlushId})`}
                animate={shouldReduceMotion ? undefined : {
                  opacity: state === "ready" ? [0.62, 0.86, 0.68] : [0.58, 0.8, 0.62],
                  transition: {
                    duration: state === "ready" ? 0.9 : 7.2,
                    repeat: state === "ready" ? 0 : Infinity,
                    ease: "easeInOut",
                  },
                }}
              />
              <motion.ellipse
                className="avara-pearl-lavender"
                cx="70"
                cy="31"
                rx="25"
                ry="34"
                fill={`url(#${pearlLavenderId})`}
                transform="rotate(18 70 31)"
                animate={shouldReduceMotion ? undefined : lavenderMotion[state]}
              />
              <motion.ellipse
                className="avara-pearl-rose"
                cx="32"
                cy="72"
                rx="26"
                ry="20"
                fill={`url(#${pearlRoseId})`}
                transform="rotate(-19 32 72)"
                animate={shouldReduceMotion ? undefined : roseMotion[state]}
              />
              <motion.g
                className="avara-pearl-facets"
                animate={shouldReduceMotion ? undefined : facetMotion[state]}
              >
                <path d="M18 22L41 12L60 28L39 42Z" fill={`url(#${pearlFacetId})`} />
                <path d="M39 42L60 28L83 46L58 59Z" fill={`url(#${pearlFacetId})`} />
                <path d="M22 67L39 42L58 59L47 86Z" fill={`url(#${pearlFacetId})`} />
                <path d="M58 59L83 46L77 76L47 86Z" fill={`url(#${pearlFacetId})`} />
              </motion.g>
              <path
                className="avara-pearl-depth-shadow"
                d="M15 54C26 71 47 85 72 78C63 91 37 95 20 78C12 69 9 61 15 54Z"
              />
              <motion.g
                className="avara-pearl-caustics"
                animate={shouldReduceMotion ? undefined : causticMotion[state]}
              >
                <path d="M18 59C32 47 47 45 61 51C72 56 78 66 88 70" />
                <path d="M14 39C28 31 47 29 61 35C72 40 80 49 89 52" />
                <path d="M29 78C43 70 58 68 73 73" />
              </motion.g>
              <motion.path
                className="avara-pearl-thread-line"
                d="M18 56C33 49 47 50 60 57C72 64 82 62 90 54"
                animate={shouldReduceMotion ? undefined : threadLineMotion[state]}
              />
              <motion.g
                className="avara-pearl-signal-seed"
                animate={shouldReduceMotion ? undefined : signalMotion[state]}
              >
                <circle cx="67" cy="63" r="5.8" fill={`url(#${pearlSignalId})`} />
                <circle cx="67" cy="63" r="1.25" />
                <path d="M57 61C62 57 70 56 76 60" />
                <path d="M59 69C64 72 70 72 75 68" />
              </motion.g>
              <path
                className="avara-pearl-veil"
                d="M31 4C55 18 70 42 91 55C75 58 53 52 35 36C23 25 22 12 31 4Z"
              />
            </motion.g>
          </g>
          <circle className="avara-pearl-inner-rim" cx="50" cy="50" r="41.8" />
          <circle className="avara-pearl-rim" cx="50" cy="50" r="44.2" stroke={`url(#${pearlRimId})`} />
          <motion.circle
            className="avara-pearl-orbit-trace"
            cx="50"
            cy="50"
            r="35.6"
            animate={shouldReduceMotion ? undefined : traceMotion[state]}
          />
          <motion.circle
            className="avara-pearl-aperture"
            cx="50"
            cy="50"
            r="38.4"
            animate={shouldReduceMotion ? undefined : apertureMotion[state]}
          />
          <motion.circle
            className="avara-pearl-aperture avara-pearl-aperture-secondary"
            cx="50"
            cy="50"
            r="32.8"
            animate={shouldReduceMotion ? undefined : {
              ...apertureMotion[state],
              rotate: state === "preparing" ? [0, 210, 420] : [0, -180, -360],
            }}
          />
          <motion.circle
            className="avara-pearl-ready-halo"
            cx="50"
            cy="50"
            r="47"
            animate={shouldReduceMotion ? undefined : {
              opacity: state === "ready" ? [0, 0.9, 0] : 0,
              scale: state === "ready" ? [0.94, 1.14, 1.03] : 1,
            }}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.ellipse
            className="avara-pearl-top-glint"
            cx="35"
            cy="17"
            rx="18"
            ry="9"
            filter={`url(#${pearlSoftId})`}
            animate={shouldReduceMotion ? undefined : {
              x: state === "thinking" || state === "preparing" ? [-3, 5, -1] : [-1, 2, -1],
              opacity: state === "ready" ? [0.5, 0.96, 0.72] : [0.58, 0.86, 0.62],
            }}
            transition={{
              duration: state === "ready" ? 0.8 : 5.4,
              repeat: state === "ready" ? 0 : Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.svg>
      ) : (
        <>
          <span className="avara-lens-glass" />
          <span className="avara-lens-halo" />
          <span className="avara-lens-nebula" />
          <span className="avara-lens-trail" data-trail="2" />
          <span className="avara-lens-trail" data-trail="0" />
          <span className="avara-lens-trail" data-trail="1" />
          <span className="avara-lens-reflection avara-lens-reflection-violet" />
          <span className="avara-lens-reflection avara-lens-reflection-rose" />
          <span className="avara-lens-core" />
        </>
      )}
    </motion.span>
  );
};
