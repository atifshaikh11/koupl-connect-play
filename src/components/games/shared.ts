import { useCallback, useState } from "react";

import { useApp } from "@/lib/koupl/store";
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
  const { buzz } = useApp();
  return {
    tap: useCallback(() => buzz(8), [buzz]),
    win: useCallback(() => {
      buzz(18);
      window.setTimeout(() => buzz(26), 120);
    }, [buzz]),
    fail: useCallback(() => buzz(30), [buzz]),
  };
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
