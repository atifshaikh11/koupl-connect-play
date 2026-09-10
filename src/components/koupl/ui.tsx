import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, Gamepad2, History, Home, User } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { GameDef, Player } from "@/lib/koupl/types";

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

export function Screen({
  children,
  className,
  withNav = true,
}: {
  children: ReactNode;
  className?: string;
  withNav?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <div
        className={cn(
          "mx-auto w-full max-w-md px-4 pt-5",
          withNav ? "pb-28" : "pb-8",
          className,
        )}
      >
        {children}
      </div>
      {withNav ? <BottomNav /> : null}
    </div>
  );
}

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/activity", label: "Activity", icon: History },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-md items-stretch justify-between px-3 py-2">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "press flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-14 items-center justify-center rounded-full transition-colors",
                  active && "bg-primary/12",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function PageHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  right?: ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start gap-3">
      {back ? (
        <Link
          to={back}
          aria-label="Go back"
          className="press mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-2xl font-bold leading-tight">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Bits                                                                */
/* ------------------------------------------------------------------ */

export function AvatarBubble({
  emoji,
  size = "md",
  ring,
  className,
}: {
  emoji: string;
  size?: "sm" | "md" | "lg" | "xl";
  ring?: boolean;
  className?: string;
}) {
  const sizes = {
    sm: "h-9 w-9 text-lg",
    md: "h-12 w-12 text-2xl",
    lg: "h-16 w-16 text-3xl",
    xl: "h-24 w-24 text-5xl",
  } as const;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex select-none items-center justify-center rounded-full bg-secondary",
        sizes[size],
        ring && "ring-3 ring-primary ring-offset-2 ring-offset-background",
        className,
      )}
    >
      {emoji}
    </span>
  );
}

const ACCENT_BG: Record<GameDef["accent"], string> = {
  primary: "bg-primary/15 text-primary",
  berry: "bg-berry/15 text-berry",
  sunny: "bg-sunny/25 text-sunny-foreground",
  mint: "bg-mint/25 text-mint-foreground",
  sky: "bg-sky/20 text-sky-foreground",
};

export function GameCard({ game, compact }: { game: GameDef; compact?: boolean }) {
  return (
    <Link
      to="/play/$gameId"
      params={{ gameId: game.id }}
      className={cn(
        "press surface group relative flex overflow-hidden",
        compact ? "w-44 shrink-0 flex-col gap-2 p-4" : "items-center gap-4 p-4",
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-2xl",
          ACCENT_BG[game.accent],
          compact ? "h-14 w-14 text-3xl" : "h-14 w-14 shrink-0 text-3xl",
        )}
        aria-hidden
      >
        {game.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-display block truncate text-base font-semibold">{game.title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {game.tagline}
        </span>
        {!compact ? (
          <span className="mt-2 flex gap-1.5 text-[10px] font-bold text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5">{game.minutes}</span>
            <span className="rounded-full bg-muted px-2 py-0.5">{game.players}</span>
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export function Chip({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "primary" | "success";
}) {
  const tones = {
    muted: "bg-muted text-muted-foreground",
    primary: "bg-primary/12 text-primary",
    success: "bg-success/15 text-success",
  } as const;
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", tones[tone])}>
      {children}
    </span>
  );
}

export function ProgressDots({ total, index }: { total: number; index: number }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.min(index + 1, total)}
      aria-label="Round progress"
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300"
        style={{ width: `${Math.min(((index + 1) / total) * 100, 100)}%` }}
      />
    </div>
  );
}

export function ScoreBar({
  players,
  scores,
  activeSlot,
}: {
  players: [Player, Player];
  scores: [number, number];
  activeSlot?: 0 | 1 | null;
}) {
  return (
    <div className="flex items-center gap-2">
      {players.map((p, i) => (
        <div
          key={i}
          className={cn(
            "surface flex flex-1 items-center gap-2 px-3 py-2 transition-all",
            activeSlot === i && "ring-2 ring-primary",
          )}
        >
          <AvatarBubble emoji={p.avatar} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold">{p.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {activeSlot === i ? "Their turn" : "Waiting"}
            </p>
          </div>
          <span className="font-display text-xl font-bold tabular-nums">{scores[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function TurnBanner({ player, action }: { player: Player; action: string }) {
  return (
    <div
      className="flex items-center justify-center gap-2 rounded-full bg-primary/12 px-4 py-2 text-sm font-bold text-primary"
      aria-live="polite"
    >
      <AvatarBubble emoji={player.avatar} size="sm" className="h-7 w-7 text-base" />
      <span className="truncate">
        {player.name} — {action}
      </span>
    </div>
  );
}

export function EmptyState({
  emoji,
  title,
  body,
  action,
}: {
  emoji: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="text-5xl" aria-hidden>
        {emoji}
      </span>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="max-w-xs text-sm text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
      <span className="animate-float text-5xl" aria-hidden>
        💞
      </span>
      <p className="text-sm font-bold text-muted-foreground">Loading Koupl…</p>
    </div>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-2xl font-bold tracking-tight", className)}>
      Koupl<span className="text-primary">.</span>
    </span>
  );
}
