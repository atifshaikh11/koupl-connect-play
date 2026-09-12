import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChevronLeft,
  Gamepad2,
  Heart,
  History,
  Home,
  Play,
  User,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { GameThumb } from "@/components/koupl/GameThumb";
import type { GameDef, Player } from "@/lib/koupl/types";
import { moodLabelOf } from "@/lib/koupl/games";
import { useApp } from "@/lib/koupl/store";
import { AnimatedCounter } from "@/components/koupl/GameFeel";

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
  { to: "/room", label: "Room", icon: UsersRound },
  { to: "/activity", label: "Activity", icon: History },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-[var(--kb-inset)] z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
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
                "press flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
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
          className="press mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card"
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

/** Every game tile shares one artwork component, so the style never drifts. */
export function GameArtwork({
  game,
  className,
  plain,
}: {
  game: GameDef;
  className?: string | undefined;
  plain?: boolean | undefined;
}) {
  return <GameThumb game={game} className={className} plain={plain} />;
}

export function FavoriteButton({ gameId, inverse = false }: { gameId: string; inverse?: boolean }) {
  const app = useApp();
  const active = app.favorites.includes(gameId);
  return (
    <button
      type="button"
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={active}
      onClick={() => {
        app.toggleFavorite(gameId);
        app.buzz(10);
      }}
      className={cn(
        "press grid h-11 w-11 place-items-center rounded-full border",
        inverse ? "border-night-foreground/15 bg-night-soft text-night-foreground" : "border-border bg-card",
        active && "border-primary bg-primary text-primary-foreground",
      )}
    >
      <Heart className={cn("h-5 w-5", active && "fill-current")} aria-hidden />
    </button>
  );
}

/** Small pill that names the game's mood — the only category label on a card. */
export function MoodBadge({ game, inverse }: { game: GameDef; inverse?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold leading-tight",
        inverse ? "bg-night-foreground/12 text-night-muted" : "bg-muted text-muted-foreground",
      )}
    >
      {moodLabelOf(game)}
    </span>
  );
}

/**
 * Horizontal row card: big thumbnail, name, one-line description, mood badge
 * and a clear play affordance on the right.
 */
export function GameCard({ game, compact }: { game: GameDef; compact?: boolean }) {
  return (
    <Link
      to="/game/$gameId"
      params={{ gameId: game.id }}
      className={cn(
        "press surface group relative flex overflow-hidden",
        compact ? "w-44 shrink-0 flex-col gap-2 p-4" : "items-center gap-3.5 p-3.5",
      )}
    >
      <GameArtwork game={game} className={compact ? "h-16 w-16" : "h-16 w-16"} />
      <span className="min-w-0 flex-1">
        <span className="font-display block truncate text-[15px] font-bold leading-tight">
          {game.title}
        </span>
        <span className="mt-1 block truncate text-xs leading-snug text-muted-foreground">
          {game.tagline}
        </span>
        <span className="mt-2 flex items-center gap-1.5">
          <MoodBadge game={game} />
          <span className="truncate text-[11px] font-bold text-muted-foreground">
            {game.minutes}
          </span>
        </span>
      </span>
      {!compact ? (
        <span
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/12 text-primary"
        >
          <Play className="h-4 w-4 fill-current" />
        </span>
      ) : null}
    </Link>
  );
}

const ACCENT_DOT: Record<GameDef["accent"], string> = {
  primary: "bg-primary",
  berry: "bg-berry",
  sunny: "bg-sunny",
  mint: "bg-mint",
  sky: "bg-sky",
};

/** Dark, poster-style tile used for the rails on Home. */
export function FeatureTile({ game }: { game: GameDef }) {
  return (
    <Link
      to="/game/$gameId"
      params={{ gameId: game.id }}
      className="press relative flex w-[10.5rem] shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-night p-3.5 text-night-foreground shadow-float"
    >
      <span
        aria-hidden
        className={cn(
          "absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-30 blur-2xl",
          ACCENT_DOT[game.accent],
        )}
      />
      <GameArtwork
        game={game}
        plain
        className="relative h-[5.75rem] w-full rounded-2xl bg-night-soft/70 text-night-foreground [aspect-ratio:auto]"
      />
      <span className="relative mt-3 block min-w-0">
        <span className="font-display block truncate text-[15px] font-bold leading-tight">
          {game.title}
        </span>
        <span className="mt-1 block truncate text-[11px] text-night-muted">{game.tagline}</span>
      </span>
      <span className="relative mt-2.5 flex items-center justify-between gap-2">
        <MoodBadge game={game} inverse />
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
        </span>
      </span>
    </Link>
  );
}

/** Compact card for two-column grids. */
export function MiniTile({ game }: { game: GameDef }) {
  return (
    <Link
      to="/game/$gameId"
      params={{ gameId: game.id }}
      className="press surface flex flex-col gap-2.5 overflow-hidden p-3"
    >
      <GameArtwork
        game={game}
        className="h-20 w-full rounded-2xl [aspect-ratio:auto]"
      />
      <span className="min-w-0">
        <span className="font-display block truncate text-sm font-bold leading-tight">
          {game.title}
        </span>
        <span className="mt-0.5 block truncate text-[11px] leading-snug text-muted-foreground">
          {game.tagline}
        </span>
      </span>
      <span className="flex items-center justify-between gap-2">
        <MoodBadge game={game} />
        <span className="truncate text-[11px] font-bold text-muted-foreground">{game.minutes}</span>
      </span>
    </Link>
  );
}

/** Tall artwork tile used in the games library grid. */
export function PosterTile({ game }: { game: GameDef }) {
  const app = useApp();
  const favorite = app.favorites.includes(game.id);
  return (
    <div className="surface relative overflow-hidden p-0">
      <Link
        to="/game/$gameId"
        params={{ gameId: game.id }}
        className="press flex flex-col"
      >
        <span className="relative block overflow-hidden rounded-t-[calc(var(--radius-2xl)-1px)] bg-night p-3 text-night-foreground">
          <span
            aria-hidden
            className={cn(
              "absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-30 blur-2xl",
              ACCENT_DOT[game.accent],
            )}
          />
          <GameArtwork
            game={game}
            plain
            className="relative h-24 w-full rounded-2xl bg-night-soft/60 text-night-foreground [aspect-ratio:auto]"
          />
        </span>
        <span className="block p-3">
          <span className="font-display block truncate text-sm font-bold leading-tight">
            {game.title}
          </span>
          <span className="mt-1 block truncate text-[11px] leading-snug text-muted-foreground">
            {game.tagline}
          </span>
          <span className="mt-2 flex items-center justify-between gap-2">
            <MoodBadge game={game} />
            <span className="truncate text-[11px] font-bold text-muted-foreground">
              {game.minutes}
            </span>
          </span>
        </span>
      </Link>
      <button
        type="button"
        aria-label={favorite ? `Remove ${game.title} from favorites` : `Add ${game.title} to favorites`}
        aria-pressed={favorite}
        onClick={() => app.toggleFavorite(game.id)}
        className={cn(
          "press absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-night-soft/90 text-night-foreground backdrop-blur",
          favorite && "bg-primary text-primary-foreground",
        )}
      >
        <Heart className={cn("h-4 w-4", favorite && "fill-current")} aria-hidden />
      </button>
    </div>
  );
}

export function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="font-display truncate text-base font-bold">{title}</h2>
      {action}
    </div>
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
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", tones[tone])}>
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
            <p
              className={cn(
                "text-[10px]",
                activeSlot === i ? "font-bold text-primary" : "text-muted-foreground",
              )}
            >
              {activeSlot === i ? "Playing now" : "Waiting"}
            </p>
          </div>
          <AnimatedCounter value={scores[i]!} className="font-display text-xl font-bold" />
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
