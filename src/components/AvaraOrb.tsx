import { CSSProperties, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";

export type AvaraOrbState = "active" | "thinking" | "preparing" | "streaming" | "ready";

interface AvaraOrbProps {
  state?: AvaraOrbState;
  size?: number | string;
  className?: string;
  layoutId?: string;
  decorative?: boolean;
  label?: string;
  hovered?: boolean;
  pressed?: boolean;
  animate?: boolean;
}

type Vec3 = [number, number, number];

const PHI = (1 + Math.sqrt(5)) / 2;
const RAW_VERTS: Vec3[] = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [-1, -PHI, 0],
  [1, -PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [0, -1, -PHI],
  [0, 1, -PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
  [-PHI, 0, -1],
  [-PHI, 0, 1],
];

const ICO_FACES: [number, number, number][] = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
];

const VERTS: Vec3[] = RAW_VERTS.map(([x, y, z]) => {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
});

type Face = {
  centroid: Vec3;
  yawDeg: number;
  pitchDeg: number;
  local: { x: number; y: number }[];
  breathPeriod: number;
  breathPhase: number;
  jitterPeriod: number;
  jitterPhase: number;
};

type Inclusion = {
  ax: number;
  ay: number;
  az: number;
  px: number;
  py: number;
  pz: number;
  phx: number;
  phy: number;
  phz: number;
  size: number;
  color: string;
};

const CORAL_PRIMARY = "#F26D5B";
const CORAL_LIGHT = "#FF7A6B";
const CORAL_DEEP = "#C95F53";
const ESPRESSO = "#2A1F1A";
const GRAPHITE = "#453B36";
const SMOKY_BROWN = "#665246";
const WARM_TAUPE = "#9A8572";
const MUTED_PLUM = "#77596A";
const PLUM_SHADOW = "#604756";
const DUSTY_ROSE = "#C9A29A";
const WARM_STONE = "#B59E86";
const SOFT_STONE = "#C6AE99";
const ROSE_REFLECTION = "#E8B89A";
const CORAL_FACETS = new Set([3, 14]);
const SIGNAL_FACET = 14;

const motionProfiles: Record<
  AvaraOrbState,
  {
    spinMs: number;
    tiltMs: number;
    keyDriftMs: number;
    breathMs: number;
    nextBloomMs: number;
    bloomVarianceMs: number;
    bloomDurationMs: number;
    frameMs: number;
  }
> = {
  active: {
    spinMs: 72000,
    tiltMs: 120000,
    keyDriftMs: 30000,
    breathMs: 28000,
    nextBloomMs: 9000,
    bloomVarianceMs: 3600,
    bloomDurationMs: 1800,
    frameMs: 50,
  },
  thinking: {
    spinMs: 48000,
    tiltMs: 84000,
    keyDriftMs: 22000,
    breathMs: 22000,
    nextBloomMs: 5000,
    bloomVarianceMs: 2600,
    bloomDurationMs: 1500,
    frameMs: 40,
  },
  preparing: {
    spinMs: 44000,
    tiltMs: 78000,
    keyDriftMs: 20000,
    breathMs: 20000,
    nextBloomMs: 4600,
    bloomVarianceMs: 2400,
    bloomDurationMs: 1400,
    frameMs: 40,
  },
  streaming: {
    spinMs: 40000,
    tiltMs: 72000,
    keyDriftMs: 18000,
    breathMs: 18000,
    nextBloomMs: 4200,
    bloomVarianceMs: 2200,
    bloomDurationMs: 1300,
    frameMs: 34,
  },
  ready: {
    spinMs: 64000,
    tiltMs: 104000,
    keyDriftMs: 26000,
    breathMs: 24000,
    nextBloomMs: 7600,
    bloomVarianceMs: 3200,
    bloomDurationMs: 1700,
    frameMs: 50,
  },
};

const buildFaces = (radius: number): Face[] =>
  ICO_FACES.map(([a, b, c], idx) => {
    const p1 = VERTS[a];
    const p2 = VERTS[b];
    const p3 = VERTS[c];
    const cx = (p1[0] + p2[0] + p3[0]) / 3;
    const cy = (p1[1] + p2[1] + p3[1]) / 3;
    const cz = (p1[2] + p2[2] + p3[2]) / 3;
    const centroidLength = Math.hypot(cx, cy, cz);
    const centroid: Vec3 = [cx / centroidLength, cy / centroidLength, cz / centroidLength];
    const yaw = (Math.atan2(centroid[0], centroid[2]) * 180) / Math.PI;
    const pitch = (Math.asin(centroid[1]) * 180) / Math.PI;
    const normal = centroid;
    const upRef: Vec3 = Math.abs(normal[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
    const ux = upRef[1] * normal[2] - upRef[2] * normal[1];
    const uy = upRef[2] * normal[0] - upRef[0] * normal[2];
    const uz = upRef[0] * normal[1] - upRef[1] * normal[0];
    const uLength = Math.hypot(ux, uy, uz);
    const u: Vec3 = [ux / uLength, uy / uLength, uz / uLength];
    const v: Vec3 = [
      normal[1] * u[2] - normal[2] * u[1],
      normal[2] * u[0] - normal[0] * u[2],
      normal[0] * u[1] - normal[1] * u[0],
    ];
    const project = (point: Vec3) => {
      const dx = point[0] - centroid[0];
      const dy = point[1] - centroid[1];
      const dz = point[2] - centroid[2];
      const lx = dx * u[0] + dy * u[1] + dz * u[2];
      const ly = -(dx * v[0] + dy * v[1] + dz * v[2]);
      return { x: lx * radius, y: ly * radius };
    };
    const rnd = (seed: number) => {
      const value = Math.sin(seed * 9301 + idx * 49297) * 233280;
      return value - Math.floor(value);
    };

    return {
      centroid,
      yawDeg: yaw,
      pitchDeg: pitch,
      local: [project(p1), project(p2), project(p3)],
      breathPeriod: 9000 + rnd(1) * 6000,
      breathPhase: rnd(2) * Math.PI * 2,
      jitterPeriod: 12000 + rnd(3) * 7000,
      jitterPhase: rnd(4) * Math.PI * 2,
    };
  });

const buildInclusions = (radius: number): Inclusion[] => {
  const palette = [CORAL_PRIMARY, MUTED_PLUM, ROSE_REFLECTION];

  return Array.from({ length: 3 }, (_, i) => {
    const rnd = (seed: number) => {
      const value = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
      return value - Math.floor(value);
    };
    const size = Math.max(5, radius * (0.13 + rnd(11) * 0.08));

    return {
      ax: radius * (0.12 + rnd(2) * 0.22),
      ay: radius * (0.12 + rnd(3) * 0.22),
      az: radius * (0.12 + rnd(4) * 0.22),
      px: 10000 + rnd(5) * 7000,
      py: 11000 + rnd(6) * 7000,
      pz: 12000 + rnd(7) * 7000,
      phx: rnd(8) * Math.PI * 2,
      phy: rnd(9) * Math.PI * 2,
      phz: rnd(10) * Math.PI * 2,
      size,
      color: palette[i % palette.length],
    };
  });
};

const lightFace = (
  face: Face,
  cy: number,
  sy: number,
  cx: number,
  sx: number,
  keyLx: number,
  keyLy: number,
  keyLz: number,
) => {
  const normal = face.centroid;
  const nx = normal[0] * cy + normal[2] * sy;
  let ny = normal[1];
  let nz = -normal[0] * sy + normal[2] * cy;
  const ny2 = ny * cx - nz * sx;
  const nz2 = ny * sx + nz * cx;
  ny = ny2;
  nz = nz2;

  const keyDot = Math.max(0, nx * keyLx + ny * keyLy + nz * keyLz);
  const front = (nz + 1) / 2;

  return {
    brightness: 0.35 + keyDot * 0.52 + front * 0.18,
    opacity: Math.min(1, 0.28 + front * 0.72),
    front,
  };
};

const createRaf = () => {
  if (typeof window === "undefined") {
    return {
      request: (_callback: FrameRequestCallback) => 0,
      cancel: (_handle: number) => undefined,
    };
  }

  const request =
    typeof window.requestAnimationFrame === "function"
      ? (callback: FrameRequestCallback) => window.requestAnimationFrame(callback)
      : (callback: FrameRequestCallback) => window.setTimeout(() => callback(window.performance.now()), 33);
  const cancel =
    typeof window.cancelAnimationFrame === "function"
      ? (handle: number) => window.cancelAnimationFrame(handle)
      : (handle: number) => window.clearTimeout(handle);

  return { request, cancel };
};

export const AvaraOrb = ({
  state = "active",
  size = 64,
  className = "",
  layoutId,
  decorative = true,
  label = "Avara assistant crystal",
  hovered = false,
  pressed = false,
  animate = true,
}: AvaraOrbProps) => {
  const [reduced, setReduced] = useState(false);
  const [readyBurst, setReadyBurst] = useState(false);
  const [active, setActive] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const breathRef = useRef<HTMLDivElement>(null);
  const previousStateRef = useRef<AvaraOrbState>(state);
  const elapsedRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastPaintTimeRef = useRef<number | null>(null);
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const geometrySize = typeof size === "number" ? size : 64;
  const cssSize = typeof size === "number" ? `${size}px` : size;
  const radius = geometrySize * 0.42;
  const depth = Math.max(1.25, radius * 0.075);
  const faces = useMemo(() => buildFaces(radius), [radius]);
  const inclusions = useMemo(() => buildInclusions(radius), [radius]);
  const profile = motionProfiles[state];
  const shouldAnimate = animate && active && geometrySize >= 32;
  const rootStyle = {
    width: cssSize,
    height: cssSize,
    "--avara-crystal-orb-size": cssSize,
  } as CSSProperties;

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mediaQuery.matches);
    const onChange = () => setReduced(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    }

    mediaQuery.addListener(onChange);
    return () => mediaQuery.removeListener(onChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = rootRef.current;
    if (!root) return;

    let intersecting = true;
    let documentVisible = typeof document !== "undefined" ? !document.hidden : true;
    const update = () => setActive(intersecting && documentVisible);

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          intersecting = entry.isIntersecting;
          update();
        },
        { threshold: 0 },
      );
      observer.observe(root);
    }

    const onVisibilityChange = () => {
      documentVisible = !document.hidden;
      update();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const previousState = previousStateRef.current;
    previousStateRef.current = state;

    if (previousState === state || reduced || state !== "ready") return;

    setReadyBurst(true);
    const timer = window.setTimeout(() => setReadyBurst(false), 920);
    return () => window.clearTimeout(timer);
  }, [reduced, state]);

  useEffect(() => {
    const rotor = rotorRef.current;
    const breath = breathRef.current;
    if (!rotor) return;

    const shards = Array.from(rotor.querySelectorAll<HTMLElement>("[data-shard]"));
    const applyStaticPose = () => {
      const yaw = (-25 * Math.PI) / 180;
      const tilt = (-14 * Math.PI) / 180;
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cx = Math.cos(tilt);
      const sx = Math.sin(tilt);
      const lxBase = -0.38;
      const lyBase = 0.78;
      const lzBase = 0.5;
      const lightLength = Math.hypot(lxBase, lyBase, lzBase);
      const lx = lxBase / lightLength;
      const ly = lyBase / lightLength;
      const lz = lzBase / lightLength;

      rotor.style.transform = "rotateX(-14deg) rotateY(-25deg)";
      if (breath) breath.style.transform = "scale(1)";

      faces.forEach((face, index) => {
        const { brightness, opacity } = lightFace(face, cy, sy, cx, sx, lx, ly, lz);
        const shard = shards[index];
        if (!shard) return;

        shard.style.opacity = opacity.toFixed(3);
        shard.style.setProperty("--b", brightness.toFixed(3));
        shard.style.setProperty("--z-offset", "0px");
        shard.style.setProperty("--rz", "0deg");
        shard.style.setProperty("--bloom-z", "0px");
        shard.style.setProperty("--bloom-brightness", "0");
      });
    };

    if (reduced || !shouldAnimate) {
      applyStaticPose();
      return;
    }

    const inclusionsNodes = breath
      ? Array.from(breath.querySelectorAll<HTMLElement>("[data-inclusion]"))
      : [];
    const raf = createRaf();
    const blooms: { idx: number; startElapsed: number; duration: number }[] = [];
    let nextBloomAtElapsed = elapsedRef.current + (readyBurst ? 120 : 2000);

    rotor.style.transform = "rotateX(-14deg) rotateY(0deg)";

    const tick = (time: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = time;
        lastPaintTimeRef.current = time - profile.frameMs;
      }

      const dt = Math.min(Math.max(0, time - lastFrameTimeRef.current), 90);
      lastFrameTimeRef.current = time;
      elapsedRef.current += dt;

      if (lastPaintTimeRef.current !== null && time - lastPaintTimeRef.current < profile.frameMs) {
        frame = raf.request(tick);
        return;
      }
      lastPaintTimeRef.current = time;

      const elapsed = elapsedRef.current;
      const yawDeg = (elapsed / profile.spinMs) * 360;
      const tiltDeg = -14 + Math.sin((elapsed / profile.tiltMs) * Math.PI * 2) * 8;

      rotor.style.transform = `rotateX(${tiltDeg.toFixed(2)}deg) rotateY(${yawDeg.toFixed(2)}deg)`;

      if (breath) {
        const clusterBreath = Math.sin((elapsed / profile.breathMs) * Math.PI * 2);
        const scale = 1 + clusterBreath * (readyBurst ? 0.012 : 0.005);
        breath.style.transform = `scale(${scale.toFixed(4)})`;
      }

      const drift = (elapsed / profile.keyDriftMs) * Math.PI * 2;
      const baseAngle = Math.atan2(0.78, -0.38);
      const angle = baseAngle + Math.sin(drift) * ((readyBurst ? 3 : 1.25) * Math.PI / 180);
      const lxy = Math.hypot(-0.38, 0.78);
      const lxBase = Math.cos(angle) * lxy;
      const lyBase = Math.sin(angle) * lxy;
      const lzBase = 0.5;
      const lightLength = Math.hypot(lxBase, lyBase, lzBase);
      const lx = lxBase / lightLength;
      const ly = lyBase / lightLength;
      const lz = lzBase / lightLength;
      const yawRadians = (yawDeg * Math.PI) / 180;
      const tiltRadians = (tiltDeg * Math.PI) / 180;
      const cy = Math.cos(yawRadians);
      const sy = Math.sin(yawRadians);
      const cx = Math.cos(tiltRadians);
      const sx = Math.sin(tiltRadians);

      if (elapsed >= nextBloomAtElapsed && blooms.length === 0) {
        const visibleCoral = Array.from(CORAL_FACETS).filter((index) => {
          const face = faces[index];
          if (!face) return false;
          return lightFace(face, cy, sy, cx, sx, lx, ly, lz).front > 0.35;
        });
        const visibleFaces = faces
          .map((face, index) => ({ index, front: lightFace(face, cy, sy, cx, sx, lx, ly, lz).front }))
          .filter(({ front }) => front > 0.4);
        const useCoral = visibleCoral.length > 0 && Math.random() < 0.68;
        const idx = useCoral
          ? (visibleCoral.includes(SIGNAL_FACET) ? SIGNAL_FACET : visibleCoral[0])
          : visibleFaces[Math.floor(Math.random() * visibleFaces.length)]?.index;

        if (idx !== undefined) {
          blooms.push({ idx, startElapsed: elapsed, duration: profile.bloomDurationMs });
        }

        nextBloomAtElapsed = elapsed + profile.nextBloomMs + Math.random() * profile.bloomVarianceMs;
      }

      for (let i = blooms.length - 1; i >= 0; i -= 1) {
        if (elapsed - blooms[i].startElapsed > blooms[i].duration) blooms.splice(i, 1);
      }

      faces.forEach((face, index) => {
        const { brightness, opacity } = lightFace(face, cy, sy, cx, sx, lx, ly, lz);
        const breathOsc = Math.sin((elapsed / face.breathPeriod) * Math.PI * 2 + face.breathPhase);
        const jitterOsc = Math.sin((elapsed / face.jitterPeriod) * Math.PI * 2 + face.jitterPhase);
        let bloom = 0;

        blooms.forEach((activeBloom) => {
          if (activeBloom.idx !== index) return;
          const progress = (elapsed - activeBloom.startElapsed) / activeBloom.duration;
          bloom = Math.sin(progress * Math.PI);
        });

        const shard = shards[index];
        if (!shard) return;

        const isCoral = CORAL_FACETS.has(index);
        const bloomBoost = readyBurst ? bloom * 1.1 : bloom;
        shard.style.opacity = opacity.toFixed(3);
        shard.style.setProperty("--b", brightness.toFixed(3));
        shard.style.setProperty("--z-offset", `${(breathOsc * 1.7).toFixed(2)}px`);
        shard.style.setProperty("--rz", `${(jitterOsc * 0.8).toFixed(2)}deg`);
        shard.style.setProperty("--bloom-z", `${(bloomBoost * (isCoral ? 7 : 5)).toFixed(2)}px`);
        shard.style.setProperty("--bloom-brightness", (bloomBoost * (isCoral ? 0.55 : 0.35)).toFixed(3));
      });

      inclusionsNodes.forEach((inclusionNode, index) => {
        const inclusion = inclusions[index];
        if (!inclusion) return;

        const x = Math.sin((elapsed / inclusion.px) * Math.PI * 2 + inclusion.phx) * inclusion.ax;
        const y = Math.sin((elapsed / inclusion.py) * Math.PI * 2 + inclusion.phy) * inclusion.ay;
        const z = Math.cos((elapsed / inclusion.pz) * Math.PI * 2 + inclusion.phz) * inclusion.az;
        inclusionNode.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px)`;
      });

      frame = raf.request(tick);
    };

    let frame = raf.request(tick);
    return () => {
      raf.cancel(frame);
      lastFrameTimeRef.current = null;
      lastPaintTimeRef.current = null;
    };
  }, [active, faces, inclusions, profile, readyBurst, reduced, shouldAnimate]);

  return (
    <motion.div
      ref={rootRef}
      className={`avara-orb ${className}`.trim()}
      style={rootStyle}
      data-state={state}
      data-reduced={reduced ? "true" : "false"}
      data-active={active ? "true" : "false"}
      data-hover={hovered ? "true" : undefined}
      data-pressed={pressed ? "true" : undefined}
      data-burst={readyBurst ? "ready" : undefined}
      data-performance={shouldAnimate && !reduced ? "throttled" : "static"}
      data-testid="avara-crystal-orb"
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : label}
      role={decorative ? undefined : "img"}
      layoutId={layoutId}
    >
      <div className="avara-contact" aria-hidden="true" />
      <div className="avara-aura" aria-hidden="true" />
      <div className="avara-aura-cool" aria-hidden="true" />

      <div className="avara-3d-scene" style={{ width: cssSize, height: cssSize }}>
        <div ref={breathRef} className="avara-cluster-breath">
          <div
            ref={rotorRef}
            className="avara-3d-rotor"
            style={{ width: cssSize, height: cssSize, transform: "rotateX(-14deg) rotateY(0deg)" }}
          >
            <div
              className="avara-core-glow"
              style={{
                width: radius * 1.55,
                height: radius * 1.55,
                left: geometrySize / 2 - radius * 0.775,
                top: geometrySize / 2 - radius * 0.775,
              }}
              aria-hidden="true"
            />

            <div
              className="avara-inclusion-layer"
              style={{ left: geometrySize / 2, top: geometrySize / 2 }}
              aria-hidden="true"
            >
              {inclusions.map((inclusion, index) => (
                <div
                  key={index}
                  data-inclusion
                  className="avara-inclusion"
                  style={{
                    width: inclusion.size,
                    height: inclusion.size,
                    marginLeft: -inclusion.size / 2,
                    marginTop: -inclusion.size / 2,
                    background: `radial-gradient(circle, ${inclusion.color} 0%, ${inclusion.color}00 70%)`,
                  }}
                />
              ))}
            </div>

            {faces.map((face, index) => {
              const xs = face.local.map((point) => point.x);
              const ys = face.local.map((point) => point.y);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);
              const width = maxX - minX;
              const height = maxY - minY;
              const pad = 2;
              const points = face.local
                .map((point) => `${(point.x - minX + pad).toFixed(2)},${(point.y - minY + pad).toFixed(2)}`)
                .join(" ");
              const centerX = (minX + maxX) / 2;
              const centerY = (minY + maxY) / 2;
              const inset = face.local
                .map((point) => {
                  const insetX = centerX + (point.x - centerX) * 0.62;
                  const insetY = centerY + (point.y - centerY) * 0.62;
                  return `${(insetX - minX + pad).toFixed(2)},${(insetY - minY + pad).toFixed(2)}`;
                })
                .join(" ");
              const isCoral = CORAL_FACETS.has(index);
              const isSignalFacet = index === SIGNAL_FACET;
              const palette = isCoral
                ? [isSignalFacet ? CORAL_LIGHT : ROSE_REFLECTION, CORAL_PRIMARY, CORAL_DEEP]
                : face.centroid[1] > 0.4
                  ? [WARM_STONE, MUTED_PLUM, SMOKY_BROWN]
                  : face.centroid[1] > -0.2
                    ? [SOFT_STONE, DUSTY_ROSE, SMOKY_BROWN]
                    : [MUTED_PLUM, PLUM_SHADOW, ESPRESSO];
              const gradId = `avara-shard-gradient-${rawId}-${index}`;
              const innerId = `avara-shard-inner-${rawId}-${index}`;
              const backId = `avara-shard-back-${rawId}-${index}`;
              const baseTransform =
                `translate(${geometrySize / 2}px, ${geometrySize / 2}px) ` +
                `rotateY(${face.yawDeg}deg) rotateX(${-face.pitchDeg}deg)`;

              return (
                <div
                  key={index}
                  data-shard
                  data-signal-shard={isSignalFacet ? "true" : undefined}
                  className="avara-shard"
                  style={
                    {
                      width: width + pad * 2,
                      height: height + pad * 2,
                      marginLeft: -(width + pad * 2) / 2,
                      marginTop: -(height + pad * 2) / 2,
                      transform:
                        `${baseTransform} ` +
                        `translateZ(calc(${radius}px + var(--z-offset, 0px) + var(--bloom-z, 0px))) ` +
                        "rotateZ(var(--rz, 0deg))",
                      filter: "brightness(calc(var(--b, 1) + var(--bloom-brightness, 0)))",
                    } as CSSProperties
                  }
                >
                  <svg
                    viewBox={`0 0 ${width + pad * 2} ${height + pad * 2}`}
                    width="100%"
                    height="100%"
                    className="avara-shard-back"
                    style={{ transform: `translateZ(${-depth}px)` }}
                    aria-hidden="true"
                    focusable="false"
                  >
                    <defs>
                      <linearGradient id={backId} x1="20%" y1="10%" x2="80%" y2="90%">
                        <stop offset="0%" stopColor="#3A2820" stopOpacity="0.55" />
                        <stop offset="100%" stopColor="#15100C" stopOpacity="0.45" />
                      </linearGradient>
                    </defs>
                    <polygon
                      points={points}
                      fill={`url(#${backId})`}
                      stroke="#3A2820"
                      strokeOpacity="0.7"
                      strokeWidth="0.6"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <svg
                    viewBox={`0 0 ${width + pad * 2} ${height + pad * 2}`}
                    width="100%"
                    height="100%"
                    className="avara-shard-front"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <defs>
                      <linearGradient id={gradId} x1="20%" y1="10%" x2="80%" y2="90%">
                        <stop offset="0%" stopColor={palette[0]} stopOpacity="0.92" />
                        <stop offset="55%" stopColor={palette[1]} stopOpacity="0.68" />
                        <stop offset="100%" stopColor={palette[2]} stopOpacity="0.55" />
                      </linearGradient>
                      <radialGradient id={innerId} cx="35%" cy="30%" r="70%">
                        <stop offset="0%" stopColor={isCoral ? ROSE_REFLECTION : "#F0DED3"} stopOpacity="0.88" />
                        <stop offset="60%" stopColor={palette[1]} stopOpacity="0.55" />
                        <stop offset="100%" stopColor={palette[2]} stopOpacity="0.38" />
                      </radialGradient>
                    </defs>
                    <polygon
                      points={points}
                      fill={`url(#${gradId})`}
                      stroke="#C9A29A"
                      strokeOpacity="0.7"
                      strokeWidth="0.7"
                      strokeLinejoin="round"
                    />
                    <polygon
                      points={inset}
                      fill={`url(#${innerId})`}
                      stroke="#FFF7EA"
                      strokeOpacity="0.55"
                      strokeWidth="0.4"
                      strokeLinejoin="round"
                    />
                    {isCoral && (
                      <circle
                        cx={face.local[1].x - minX + pad}
                        cy={face.local[1].y - minY + pad}
                        r={isSignalFacet ? "1.35" : "0.95"}
                        fill={isSignalFacet ? "#FFD0B8" : ROSE_REFLECTION}
                        opacity={isSignalFacet ? "0.92" : "0.68"}
                      />
                    )}
                    <circle
                      cx={face.local[0].x - minX + pad}
                      cy={face.local[0].y - minY + pad}
                      r="0.9"
                      fill="#FFFFFF"
                      opacity="0.9"
                    />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
