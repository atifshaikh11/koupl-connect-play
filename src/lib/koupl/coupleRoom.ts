import { useCallback, useMemo, useRef } from "react";
import type { useNavigate } from "@tanstack/react-router";

import type { RoomApi, RoomRow } from "./useRoom";

type NavigateFn = ReturnType<typeof useNavigate>;

/**
 * One persistent room per couple. Every game is played inside this room, so the
 * invite code and link stay the same no matter which game is chosen.
 */
export const COUPLE_ROOM_KEY = "couple";
export const PENDING_JOIN_KEY = "koupl.pendingJoin";

/**
 * Where to land after signing in: straight into the Couple Room when an invite
 * was tapped before sign-in, otherwise home.
 */
export function postAuthTarget(): "/room" | "/" {
  if (typeof window === "undefined") return "/";
  return window.localStorage.getItem(PENDING_JOIN_KEY) ? "/room" : "/";
}

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

function origin() {
  return typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "https://koupl-connect-play.lovable.app";
}

/**
 * Stable invite link for the couple session. Uses the room's opaque invite
 * token (never the short code), so the URL can't be guessed.
 */
export function inviteLink(token: string) {
  return `${origin()}/join/${token}`;
}

/** Friendly one-tap invite message. The code stays as a typed fallback. */
export function inviteMessage(link: string, code: string) {
  return `❤️ Join me on Koupl\nLet's play together\nTap to join our Couple Room: ${link}\nRoom code: ${code}`;
}

/* ------------------------------------------------------------------ *
 * One-tap game invitations (Zoom-style temporary links)
 * ------------------------------------------------------------------ */

/** Raw invite token kept only until the recipient finishes signing in. */
export const PENDING_INVITE_KEY = "koupl.pendingInvite";

/** Short, unguessable, URL-safe bearer token (~71 bits of entropy). */
export function newInviteToken(len = 12) {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

/** Public app address: invites must open for the partner, never a private preview. */
export const PUBLIC_ORIGIN = "https://koupl-connect-play.lovable.app";

/** Clean, opaque invitation URL: nothing but the ticket. */
export function gameInviteUrl(token: string) {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const base = host === "localhost" || host === "127.0.0.1" ? origin() : PUBLIC_ORIGIN;
  return `${base}/i/${token}`;
}

/** Share text that names the game while the URL stays opaque. */
export function gameInviteMessage(opts: {
  link: string;
  gameTitle: string;
  gameEmoji: string;
  code: string;
}) {
  return `❤️ Join me on Koupl\n${opts.gameEmoji} Let's play ${opts.gameTitle} together!\nTap to join:\n${opts.link}\n\n(Backup room code: ${opts.code})`;
}

export function pendingInvite(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PENDING_INVITE_KEY);
}

export function rememberInvite(token: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(PENDING_INVITE_KEY, token);
}

export function forgetInvite() {
  if (typeof window !== "undefined") window.localStorage.removeItem(PENDING_INVITE_KEY);
}

/**
 * Send a freshly signed-in player where they meant to go: back to a tapped
 * game invitation first, then a pending room invite, then home.
 */
export function goPostAuth(navigate: NavigateFn, replace = false) {
  const token = pendingInvite();
  if (token) {
    void navigate({ to: "/i/$token", params: { token }, replace });
    return;
  }
  void navigate({ to: postAuthTarget(), replace });
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
