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
