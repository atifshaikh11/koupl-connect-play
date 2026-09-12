import { useCallback, useMemo, useRef } from "react";

import type { RoomApi, RoomRow } from "./useRoom";

/**
 * One persistent room per couple. Every game is played inside this room, so the
 * invite code and link stay the same no matter which game is chosen.
 */
export const COUPLE_ROOM_KEY = "couple";
export const PENDING_JOIN_KEY = "koupl.pendingJoin";

export type CoupleRoomState = {
  /** Game currently selected in the hub, or null when nobody picked one. */
  activeGame?: string | null;
  /** True once the pair started the selected game together. */
  started?: boolean;
  /** Shared shuffle seed so both phones see the same deck. */
  seed?: number;
  hostReady?: boolean;
  guestReady?: boolean;
  /** State of the game currently being played. Reset when the game changes. */
  game?: Record<string, unknown>;
};

export function coupleState(room: RoomRow | null): CoupleRoomState {
  return (room?.state ?? {}) as CoupleRoomState;
}

/** Stable invite link for the couple session. */
export function inviteLink(code: string) {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://koupl-connect-play.lovable.app";
  return `${origin}/join/${code}`;
}

/**
 * Presents the couple room to a game as if it were that game's own room: the
 * game reads and writes `state.game` only, so switching games never touches the
 * couple session itself.
 */
export function useScopedGameRoom(room: RoomApi): RoomApi {
  const gameState = useMemo(
    () => (coupleState(room.room).game ?? {}) as Record<string, unknown>,
    [room.room],
  );
  const gameRef = useRef(gameState);
  gameRef.current = gameState;

  const scopedRow: RoomRow | null = useMemo(
    () => (room.room ? { ...room.room, state: gameState } : null),
    [room.room, gameState],
  );

  const patchState = useCallback(
    async (patch: Record<string, unknown>) => {
      await room.patchState({ game: { ...gameRef.current, ...patch } });
    },
    [room],
  );

  return useMemo(
    () => ({ ...room, room: scopedRow, patchState }),
    [room, scopedRow, patchState],
  );
}
