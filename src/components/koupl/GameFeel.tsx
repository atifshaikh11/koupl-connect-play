import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Flame, Sparkles } from "lucide-react";

import { HapticManager, SoundManager, type HapticCue, type SoundCue } from "@/lib/koupl/feedback";
import { useApp } from "@/lib/koupl/store";
import type { Player, PlayerSlot } from "@/lib/koupl/types";
import { cn } from "@/lib/utils";

type FxKind = "tap" | "win" | "fail";
type GameProfile = { tap: SoundCue; win: SoundCue; fail: SoundCue; tapHaptic?: boolean };

const DEFAULT_PROFILE: GameProfile = { tap: "select", win: "win-round", fail: "lose-round", tapHaptic: true };
const COOPERATIVE_GAMES = new Set(["never-have-i-ever", "whos-more-likely", "this-or-that", "pillow-talk"]);
const GAME_PROFILES: Record<string, GameProfile> = {
  "air-hockey-duel": { tap: "impact", win: "goal", fail: "miss" },
  "basketball-rivalry": { tap: "kick", win: "goal", fail: "miss", tapHaptic: true },
  "battleship-blitz": { tap: "miss", win: "hit", fail: "miss" },
  "bowling-roll": { tap: "roll", win: "streak", fail: "miss" },
  "box-wars": { tap: "select", win: "match-found", fail: "miss", tapHaptic: true },
  "bubble-pop-panic": { tap: "pop", win: "win-round", fail: "miss" },
  "couple-quiz": { tap: "select", win: "match-found", fail: "lose-round", tapHaptic: true },
  "echo-sequence": { tap: "reaction", win: "match-found", fail: "lose-round" },
  "emoji-decode": { tap: "reveal", win: "match-found", fail: "lose-round", tapHaptic: true },
  "four-in-a-row": { tap: "select", win: "win-round", fail: "lose-round", tapHaptic: true },
  "grid-clash": { tap: "select", win: "win-round", fail: "lose-round", tapHaptic: true },
  "guess-the-word": { tap: "reveal", win: "match-found", fail: "miss", tapHaptic: true },
  "last-stick": { tap: "impact", win: "win-round", fail: "lose-round", tapHaptic: true },
  "memory-match-duel": { tap: "flip", win: "match-found", fail: "miss", tapHaptic: true },
  "mini-golf-duel": { tap: "kick", win: "sink", fail: "miss", tapHaptic: true },
  "never-have-i-ever": { tap: "reveal", win: "match-found", fail: "lose-round", tapHaptic: true },
  "number-hunt": { tap: "reaction", win: "match-found", fail: "miss", tapHaptic: true },
  "odd-one-out": { tap: "reaction", win: "match-found", fail: "miss", tapHaptic: true },
  "penalty-shootout": { tap: "kick", win: "goal", fail: "miss", tapHaptic: true },
  "pillow-talk": { tap: "reveal", win: "match-found", fail: "lose-round", tapHaptic: true },
  "rate-my-guess": { tap: "reveal", win: "match-found", fail: "lose-round", tapHaptic: true },
  "reaction-clash": { tap: "reaction", win: "win-round", fail: "lose-round" },
  "sumo-tug": { tap: "tension", win: "win-round", fail: "lose-round" },
  "tap-race-dash": { tap: "tap", win: "win-round", fail: "lose-round" },
  "this-or-that": { tap: "reveal", win: "match-found", fail: "lose-round", tapHaptic: true },
  "truth-or-dare": { tap: "reveal", win: "win-round", fail: "lose-round", tapHaptic: true },
  "two-truths": { tap: "reveal", win: "match-found", fail: "lose-round", tapHaptic: true },
  "whos-more-likely": { tap: "reveal", win: "match-found", fail: "lose-round", tapHaptic: true },
};

type GameFeelApi = {
  gameId: string;
  players: [Player, Player];
  mySlot: PlayerSlot | null;
  cue: (kind: FxKind, streak?: number) => void;
  result: (scores: [number, number], scored: boolean) => { winner: PlayerSlot | null; streak: number };
};

const GameFeelContext = createContext<GameFeelApi | null>(null);

export function GameFeelProvider({
  gameId,
  players,
  mySlot,
  children,
}: {
  gameId: string;
  players: [Player, Player];
  mySlot: PlayerSlot | null;
  children: ReactNode;
}) {
  const app = useApp();
  const profile = GAME_PROFILES[gameId] ?? DEFAULT_PROFILE;

  const cue = useCallback(
    (kind: FxKind, streak = 1) => {
      const sound = profile[kind];
      SoundManager.play(sound, streak);
      let haptic: HapticCue | null = null;
      if (kind === "win") haptic = streak >= 3 ? "streak" : "success";
      else if (kind === "fail") haptic = "loss";
      else if (profile.tapHaptic) haptic = "selection";
      if (haptic) void HapticManager.play(haptic);
    },
    [profile],
  );

  const result = useCallback(
    (scores: [number, number], scored: boolean) => {
      const lowerWins = gameId === "mini-golf-duel";
      const winner: PlayerSlot | null = !scored || scores[0] === scores[1]
        ? null
        : lowerWins
          ? scores[0] < scores[1] ? 0 : 1
          : scores[0] > scores[1] ? 0 : 1;
      const sharedWin = COOPERATIVE_GAMES.has(gameId) && (scored || scores[0] > 0 || scores[1] > 0);
      const next = !scored && !sharedWin
        ? app.coupleStreak
        : app.recordCoupleResult(
            sharedWin
              ? { id: "koupl-couple", name: `${players[0].name} & ${players[1].name}`, avatar: "💞" }
              : winner === null
                ? null
                : players[winner],
          );
      const wonHere = winner !== null && (mySlot === null || winner === mySlot);
      if (winner === null) SoundManager.play("match-found");
      else if (wonHere) {
        SoundManager.play(next.current >= 3 ? "streak" : "game-win");
        void HapticManager.play(next.current >= 3 ? "streak" : "game-win");
      } else {
        SoundManager.play("game-lose");
        void HapticManager.play("loss");
      }
      return { winner, streak: next.current };
    },
    [app, gameId, mySlot, players],
  );

  const value = useMemo(() => ({ gameId, players, mySlot, cue, result }), [gameId, players, mySlot, cue, result]);
  return <GameFeelContext.Provider value={value}>{children}</GameFeelContext.Provider>;
}

export function useGameFeel() {
  const value = useContext(GameFeelContext);
  if (!value) throw new Error("useGameFeel must be used inside GameFeelProvider");
  return value;
}

export function AnimatedCounter({ value, className, fromZero = false }: { value: number; className?: string; fromZero?: boolean }) {
  const [shown, setShown] = useState(fromZero ? 0 : value);
  const previous = useRef(fromZero ? 0 : value);
  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (from === value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - started) / 360, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span className={cn("inline-block min-w-[1ch] tabular-nums", className)}>{shown}</span>;
}

const PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  x: ((index * 47) % 100) - 50,
  y: -30 - ((index * 31) % 90),
  delay: (index % 6) * 35,
}));

export function ParticleBurst({ strong = false }: { strong?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {PARTICLES.slice(0, strong ? 18 : 10).map((particle, index) => (
        <span
          key={index}
          className={cn("particle absolute left-1/2 top-1/2 h-2 w-2 rounded-full", index % 3 === 0 ? "bg-sunny" : index % 3 === 1 ? "bg-primary" : "bg-mint")}
          style={{ "--particle-x": `${particle.x}px`, "--particle-y": `${particle.y}px`, animationDelay: `${particle.delay}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export function WinCelebration({ streak = 1 }: { streak?: number }) {
  return <ParticleBurst strong={streak >= 3} />;
}

export function StreakBadge({ current, best, name, compact = false }: { current: number; best: number; name?: string | null; compact?: boolean }) {
  return (
    <div className={cn("streak-glow flex items-center gap-2 rounded-2xl bg-sunny/18 text-sunny-foreground", compact ? "px-3 py-2" : "px-4 py-3")}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sunny/30" aria-hidden>
        {current >= 3 ? <Flame className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold">{current > 0 && name ? `${name} is on a ${current}-win streak` : "Your next playful run starts here"}</p>
        <p className="text-[11px] opacity-75">Current Streak {current} · Best Streak Together {best}</p>
      </div>
    </div>
  );
}