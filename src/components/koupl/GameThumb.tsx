import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { GameDef } from "@/lib/koupl/types";

/**
 * Original, hand-built thumbnails for every Koupl game.
 *
 * One shared style: a 64×64 line-art scene drawn in the tile's own colour
 * (`currentColor`), bold rounded strokes, one or two soft filled shapes for
 * depth. No bitmaps, no external artwork — they scale from 40px list rows up
 * to the 96px detail hero and stay crisp on any screen.
 */

const S = {
  stroke: "currentColor",
  fill: "none",
  strokeWidth: 3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const soft = "currentColor";

function Art({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 64 64" className="relative h-[70%] w-[70%]" aria-hidden focusable="false">
      {children}
    </svg>
  );
}

/* Each entry is one original scene. Keep them simple — they must read at 40px. */
const SCENES: Record<string, ReactNode> = {
  /* ---- conversation / party ---- */
  "never-have-i-ever": (
    <Art>
      <rect x="8" y="16" width="30" height="38" rx="6" fill={soft} opacity={0.2} />
      <rect x="8" y="16" width="30" height="38" rx="6" {...S} />
      <rect x="26" y="10" width="30" height="38" rx="6" fill={soft} opacity={0.35} />
      <rect x="26" y="10" width="30" height="38" rx="6" {...S} />
      <path d="M34 24h14M34 32h14M34 40h8" {...S} />
    </Art>
  ),
  "whos-more-likely": (
    <Art>
      <circle cx="16" cy="20" r="8" {...S} />
      <path d="M6 50c0-7 5-12 10-12s10 5 10 12" {...S} />
      <circle cx="48" cy="20" r="8" fill={soft} opacity={0.3} />
      <circle cx="48" cy="20" r="8" {...S} />
      <path d="M38 50c0-7 5-12 10-12s10 5 10 12" {...S} />
      <path d="M27 34h10m0 0-4-4m4 4-4 4" {...S} />
    </Art>
  ),
  "pillow-talk": (
    <Art>
      <path d="M44 10a20 20 0 1 0 10 37A22 22 0 0 1 44 10Z" fill={soft} opacity={0.3} />
      <path d="M44 10a20 20 0 1 0 10 37A22 22 0 0 1 44 10Z" {...S} />
      <path d="M14 16l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" {...S} />
      <path d="M52 54l1.5 3.5L57 59l-3.5 1.5L52 64l-1.5-3.5L47 59l3.5-1.5z" {...S} />
    </Art>
  ),
  "this-or-that": (
    <Art>
      <rect x="6" y="14" width="22" height="36" rx="6" fill={soft} opacity={0.3} />
      <rect x="6" y="14" width="22" height="36" rx="6" {...S} />
      <rect x="36" y="14" width="22" height="36" rx="6" {...S} />
      <path d="M34 8 30 56" {...S} />
    </Art>
  ),
  "truth-or-dare": (
    <Art>
      <circle cx="32" cy="32" r="22" fill={soft} opacity={0.2} />
      <circle cx="32" cy="32" r="22" {...S} />
      <path d="M32 32 46 22" {...S} />
      <circle cx="32" cy="32" r="4" fill={soft} />
      <path d="M32 6v4M32 54v4M6 32h4M54 32h4" {...S} />
    </Art>
  ),
  "two-truths": (
    <Art>
      <rect x="8" y="12" width="48" height="12" rx="6" {...S} />
      <rect x="8" y="28" width="48" height="12" rx="6" {...S} />
      <rect x="8" y="44" width="48" height="12" rx="6" fill={soft} opacity={0.3} />
      <rect x="8" y="44" width="48" height="12" rx="6" {...S} />
      <path d="M44 46.5 51 53.5M51 46.5 44 53.5" {...S} />
      <path d="M14 16.5l4 4 6-6" {...S} />
    </Art>
  ),
  "couple-quiz": (
    <Art>
      <rect x="10" y="8" width="44" height="48" rx="8" fill={soft} opacity={0.22} />
      <rect x="10" y="8" width="44" height="48" rx="8" {...S} />
      <path d="M25 24a7 7 0 1 1 9 7v4" {...S} />
      <circle cx="34" cy="44" r="2.5" fill={soft} />
    </Art>
  ),
  "rate-my-guess": (
    <Art>
      <path d="M8 40h48" {...S} />
      <circle cx="38" cy="40" r="8" fill={soft} opacity={0.35} />
      <circle cx="38" cy="40" r="8" {...S} />
      <path d="M12 26v-6M24 26v-10M36 26v-6M48 26v-10" {...S} />
    </Art>
  ),

  /* ---- arcade / reflex ---- */
  "air-hockey-duel": (
    <Art>
      <rect x="10" y="6" width="44" height="52" rx="8" fill={soft} opacity={0.18} />
      <rect x="10" y="6" width="44" height="52" rx="8" {...S} />
      <path d="M10 32h44" {...S} />
      <circle cx="32" cy="32" r="5" fill={soft} />
      <circle cx="32" cy="16" r="6" {...S} />
      <circle cx="32" cy="48" r="6" {...S} />
    </Art>
  ),
  "reaction-clash": (
    <Art>
      <circle cx="32" cy="32" r="24" {...S} opacity={0.45} />
      <circle cx="32" cy="32" r="15" fill={soft} opacity={0.25} />
      <circle cx="32" cy="32" r="15" {...S} />
      <path d="M34 20 24 35h8l-2 10 10-15h-8z" fill={soft} />
    </Art>
  ),
  "tap-race-dash": (
    <Art>
      <circle cx="24" cy="32" r="13" fill={soft} opacity={0.3} />
      <circle cx="24" cy="32" r="13" {...S} />
      <path d="M42 20h14M40 32h18M42 44h14" {...S} />
      <path d="M24 25v14M17 32h14" {...S} />
    </Art>
  ),
  "bubble-pop-panic": (
    <Art>
      <circle cx="22" cy="24" r="12" fill={soft} opacity={0.28} />
      <circle cx="22" cy="24" r="12" {...S} />
      <circle cx="44" cy="42" r="9" {...S} />
      <circle cx="45" cy="18" r="6" {...S} strokeDasharray="4 5" />
      <circle cx="17" cy="47" r="5" fill={soft} opacity={0.5} />
    </Art>
  ),
  "echo-sequence": (
    <Art>
      <rect x="8" y="8" width="22" height="22" rx="6" fill={soft} opacity={0.45} />
      <rect x="8" y="8" width="22" height="22" rx="6" {...S} />
      <rect x="34" y="8" width="22" height="22" rx="6" {...S} />
      <rect x="8" y="34" width="22" height="22" rx="6" {...S} />
      <rect x="34" y="34" width="22" height="22" rx="6" fill={soft} opacity={0.2} />
      <rect x="34" y="34" width="22" height="22" rx="6" {...S} />
    </Art>
  ),

  /* ---- board / strategy ---- */
  "four-in-a-row": (
    <Art>
      <rect x="8" y="14" width="48" height="42" rx="8" {...S} />
      <circle cx="20" cy="26" r="5" {...S} />
      <circle cx="32" cy="26" r="5" {...S} />
      <circle cx="44" cy="26" r="5" fill={soft} opacity={0.4} />
      <circle cx="20" cy="44" r="5" fill={soft} />
      <circle cx="32" cy="44" r="5" fill={soft} opacity={0.4} />
      <circle cx="44" cy="44" r="5" fill={soft} />
      <path d="M32 6v4" {...S} />
    </Art>
  ),
  "grid-clash": (
    <Art>
      <path d="M24 8v48M40 8v48M8 24h48M8 40h48" {...S} />
      <circle cx="16" cy="16" r="5" {...S} />
      <path d="M34 34l12 12M46 34 34 46" {...S} />
      <circle cx="48" cy="16" r="5" fill={soft} opacity={0.4} />
    </Art>
  ),
  "box-wars": (
    <Art>
      <rect x="16" y="16" width="16" height="16" fill={soft} opacity={0.35} />
      <path d="M16 16h16M16 32h16M16 16v16M32 16v16M32 32h16M32 48h16" {...S} />
      {[16, 32, 48].map((x) =>
        [16, 32, 48].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill={soft} />),
      )}
    </Art>
  ),
  "battleship-blitz": (
    <Art>
      <rect x="8" y="8" width="48" height="48" rx="6" {...S} />
      <path d="M24 8v48M40 8v48M8 24h48M8 40h48" {...S} opacity={0.45} />
      <rect x="11" y="27" width="26" height="10" rx="5" fill={soft} opacity={0.5} />
      <path d="M44 12l8 8M52 12l-8 8" {...S} />
    </Art>
  ),
  "last-stick": (
    <Art>
      <path d="M14 12v40M26 12v40M38 12v40M50 12v40" {...S} />
      <path d="M44 20l12 12M56 20 44 32" {...S} opacity={0.55} />
      <circle cx="14" cy="56" r="3" fill={soft} />
    </Art>
  ),
  "memory-match-duel": (
    <Art>
      <rect x="8" y="8" width="22" height="26" rx="5" fill={soft} opacity={0.3} />
      <rect x="8" y="8" width="22" height="26" rx="5" {...S} />
      <rect x="34" y="8" width="22" height="26" rx="5" {...S} />
      <rect x="21" y="38" width="22" height="18" rx="5" {...S} />
      <path d="M19 18c2-3 6-1 6 2s-6 6-6 6-6-3-6-6 4-5 6-2z" fill={soft} />
      <path d="M42 16v10M37 21h10" {...S} />
    </Art>
  ),

  /* ---- sports ---- */
  "basketball-rivalry": (
    <Art>
      <path d="M18 12h28M22 12v8a10 10 0 0 0 20 0v-8" {...S} />
      <circle cx="32" cy="44" r="13" fill={soft} opacity={0.28} />
      <circle cx="32" cy="44" r="13" {...S} />
      <path d="M19 44h26M32 31v26M23 35c6 5 6 13 0 18M41 35c-6 5-6 13 0 18" {...S} opacity={0.7} />
    </Art>
  ),
  "penalty-shootout": (
    <Art>
      <path d="M8 34V14h48v20" {...S} />
      <path d="M20 14v20M32 14v20M44 14v20M8 24h48" {...S} opacity={0.45} />
      <circle cx="32" cy="48" r="9" fill={soft} opacity={0.3} />
      <circle cx="32" cy="48" r="9" {...S} />
      <path d="M32 42l5 4-2 6h-6l-2-6z" fill={soft} />
    </Art>
  ),
  "mini-golf-duel": (
    <Art>
      <path d="M20 52c8-14 20-16 30-10" {...S} strokeDasharray="2 6" />
      <path d="M46 44V12l-16 6 16 6" fill={soft} opacity={0.35} />
      <path d="M46 44V12l-16 6 16 6" {...S} />
      <ellipse cx="46" cy="48" rx="10" ry="4" {...S} />
      <circle cx="16" cy="52" r="5" fill={soft} />
    </Art>
  ),
  "bowling-roll": (
    <Art>
      <path d="M40 12c4 0 6 4 5 8s-2 6-1 10 2 8 2 12-3 6-6 6-6-2-6-6 1-8 2-12 1-6 0-10 0-8 4-8Z" fill={soft} opacity={0.3} />
      <path d="M40 12c4 0 6 4 5 8s-2 6-1 10 2 8 2 12-3 6-6 6-6-2-6-6 1-8 2-12 1-6 0-10 0-8 4-8Z" {...S} />
      <circle cx="18" cy="40" r="13" {...S} />
      <circle cx="14" cy="36" r="2" fill={soft} />
      <circle cx="21" cy="35" r="2" fill={soft} />
      <circle cx="17" cy="43" r="2" fill={soft} />
    </Art>
  ),
  "sumo-tug": (
    <Art>
      <path d="M6 32h52" {...S} />
      <circle cx="32" cy="32" r="7" fill={soft} opacity={0.45} />
      <circle cx="32" cy="32" r="7" {...S} />
      <path d="M10 22v20M54 22v20" {...S} />
      <path d="M18 26l-6 6 6 6M46 26l6 6-6 6" {...S} opacity={0.6} />
    </Art>
  ),

  /* ---- puzzle / word ---- */
  "odd-one-out": (
    <Art>
      <circle cx="18" cy="18" r="9" {...S} />
      <circle cx="46" cy="18" r="9" {...S} />
      <circle cx="18" cy="46" r="9" {...S} />
      <rect x="36" y="36" width="20" height="20" rx="5" fill={soft} opacity={0.45} />
      <rect x="36" y="36" width="20" height="20" rx="5" {...S} />
    </Art>
  ),
  "number-hunt": (
    <Art>
      <rect x="8" y="8" width="48" height="48" rx="8" {...S} />
      <path d="M32 8v48M8 32h48" {...S} opacity={0.4} />
      <circle cx="20" cy="44" r="9" fill={soft} opacity={0.35} />
      <text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="700" fill={soft}>
        3
      </text>
      <text x="44" y="25" textAnchor="middle" fontSize="14" fontWeight="700" fill={soft}>
        7
      </text>
      <text x="20" y="49" textAnchor="middle" fontSize="14" fontWeight="700" fill={soft}>
        1
      </text>
      <text x="44" y="49" textAnchor="middle" fontSize="14" fontWeight="700" fill={soft}>
        5
      </text>
    </Art>
  ),
  "guess-the-word": (
    <Art>
      <path d="M8 46h12M26 46h12M44 46h12" {...S} />
      <text x="14" y="36" textAnchor="middle" fontSize="20" fontWeight="700" fill={soft}>
        W
      </text>
      <text x="32" y="36" textAnchor="middle" fontSize="20" fontWeight="700" fill={soft} opacity={0.35}>
        ?
      </text>
      <text x="50" y="36" textAnchor="middle" fontSize="20" fontWeight="700" fill={soft}>
        D
      </text>
    </Art>
  ),
  "emoji-decode": (
    <Art>
      <circle cx="18" cy="22" r="10" fill={soft} opacity={0.3} />
      <circle cx="18" cy="22" r="10" {...S} />
      <path d="M38 12h16v16H38z" {...S} />
      <path d="M14 46h36" {...S} />
      <text x="32" y="60" textAnchor="middle" fontSize="16" fontWeight="700" fill={soft}>
        ?
      </text>
    </Art>
  ),
};

/** Fallback keeps every game covered even if an id is ever renamed. */
const FALLBACK = (
  <Art>
    <rect x="8" y="14" width="48" height="36" rx="10" fill={soft} opacity={0.25} />
    <rect x="8" y="14" width="48" height="36" rx="10" {...S} />
    <path d="M20 26v10M15 31h10" {...S} />
    <circle cx="44" cy="28" r="3" fill={soft} />
    <circle cx="38" cy="36" r="3" fill={soft} />
  </Art>
);

export const ACCENT_TILE: Record<GameDef["accent"], string> = {
  primary: "bg-primary/12 text-primary",
  berry: "bg-berry/12 text-berry",
  sunny: "bg-sunny/25 text-sunny-foreground",
  mint: "bg-mint/25 text-mint-foreground",
  sky: "bg-sky/20 text-sky-foreground",
};

/**
 * Game thumbnail. `plain` drops the tinted plate so the art can sit directly on
 * a dark poster background.
 */
export function GameThumb({
  game,
  className,
  plain = false,
}: {
  game: GameDef;
  className?: string | undefined;
  plain?: boolean | undefined;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid aspect-square shrink-0 place-items-center overflow-hidden rounded-2xl",
        plain ? "text-current" : ACCENT_TILE[game.accent],
        className,
      )}
    >
      <span className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-current opacity-[0.07]" />
      <span className="absolute -bottom-5 -left-5 h-14 w-14 rounded-full bg-current opacity-[0.05]" />
      {SCENES[game.id] ?? FALLBACK}
    </span>
  );
}
