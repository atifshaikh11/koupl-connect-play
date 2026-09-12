import { useCallback, useMemo, useState } from "react";

import { useGameFeel } from "@/components/koupl/GameFeel";
import type { GameDef, GameResult, Player, PlayerSlot } from "@/lib/koupl/types";
import type { RoomApi } from "@/lib/koupl/useRoom";

export type GameProps = {
  game: GameDef;
  players: [Player, Player];
  /** null = both players share this device (pass-and-play). */
  mySlot: PlayerSlot | null;
  room: RoomApi | null;
  onFinish: (result: GameResult) => void;
  onExit: () => void;
};

export const REACTIONS = ["😂", "😍", "😳", "🔥", "🙄"] as const;

/**
 * Tiny feedback layer on top of the global haptics/sound setting.
 * Every call routes through the user's settings, so muting still works.
 */
export function useGameFx() {
  const { cue } = useGameFeel();
  const tap = useCallback(() => cue("tap"), [cue]);
  const win = useCallback((streak = 1) => cue("win", streak), [cue]);
  const fail = useCallback(() => cue("fail"), [cue]);
  return useMemo(() => ({ tap, win, fail }), [tap, win, fail]);
}

/**
 * Shows the rules card once at the start of a session, and skips it when the
 * player is resuming a game that already has progress.
 */
export function useIntro(fresh: boolean) {
  const [dismissed, setDismissed] = useState(false);
  return {
    showIntro: fresh && !dismissed,
    startPlaying: useCallback(() => setDismissed(true), []),
  };
}
