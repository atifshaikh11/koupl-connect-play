import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** Runs a callback every animation frame with a clamped delta (seconds). */
export function useRaf(cb: (dt: number) => void, active: boolean) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      ref.current(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

/**
 * Measures a board element so physics can run in real pixels.
 * Uses a state-backed ref callback so boards that mount later (after an intro
 * screen, for example) are still measured.
 */
export function useBoardSize<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const ref = useCallback((node: T | null) => setEl(node), []);
  useLayoutEffect(() => {
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [el]);
  return { ref, size };
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const dist = (ax: number, ay: number, bx: number, by: number) =>
  Math.hypot(ax - bx, ay - by);

/** Small deterministic-ish helper for varied but fair round setups. */
export const randBetween = (min: number, max: number) => min + Math.random() * (max - min);

export function pickSome<T>(items: readonly T[], count: number): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < count && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]!);
  }
  return out;
}

export type Rect = { x: number; y: number; w: number; h: number };

/** Circle vs axis-aligned rectangle resolution. Returns the corrected state. */
export function bounceOffRect(
  p: { x: number; y: number; vx: number; vy: number },
  r: Rect,
  radius: number,
  restitution = 0.8,
) {
  const nx = clamp(p.x, r.x, r.x + r.w);
  const ny = clamp(p.y, r.y, r.y + r.h);
  const dx = p.x - nx;
  const dy = p.y - ny;
  if (dx * dx + dy * dy > radius * radius) return false;
  // Push out along the shallowest axis.
  const overlapX = Math.min(Math.abs(p.x - r.x), Math.abs(r.x + r.w - p.x));
  const overlapY = Math.min(Math.abs(p.y - r.y), Math.abs(r.y + r.h - p.y));
  if (overlapX < overlapY) {
    p.x = p.x < r.x + r.w / 2 ? r.x - radius : r.x + r.w + radius;
    p.vx = -p.vx * restitution;
  } else {
    p.y = p.y < r.y + r.h / 2 ? r.y - radius : r.y + r.h + radius;
    p.vy = -p.vy * restitution;
  }
  return true;
}
