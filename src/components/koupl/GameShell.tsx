import { Crown, RotateCcw, Sparkles, X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AvatarBubble, GameArtwork, ProgressDots } from "@/components/koupl/ui";
import { cn } from "@/lib/utils";
import type { GameDef, Player } from "@/lib/koupl/types";

export function GameFrame({
  game,
  onExit,
  step,
  total,
  stepNoun = "Round",
  children,
  header,
}: {
  game: GameDef;
  onExit: () => void;
  step?: number;
  total?: number;
  stepNoun?: string;
  children: ReactNode;
  header?: ReactNode;
}) {
  const hasProgress = typeof step === "number" && !!total;
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5">
        <div className="mb-3 flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                aria-label="Leave game"
                className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[calc(100%-2rem)] rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Leave this game?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your progress stays saved for one-phone games, so you can pick it back up.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="min-h-11 rounded-2xl">Keep playing</AlertDialogCancel>
                <AlertDialogAction className="min-h-11 rounded-2xl" onClick={onExit}>
                  Leave game
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <GameArtwork game={game} className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display truncate text-base font-bold leading-tight">
              {game.title}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {hasProgress
                ? `${stepNoun} ${Math.min(step! + 1, total!)} of ${total}`
                : game.tagline}
            </p>
          </div>
        </div>
        {hasProgress ? <ProgressDots total={total!} index={step!} /> : null}
        {header ? <div className="mt-3">{header}</div> : null}
        <div className="mt-4 flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

export function PromptCard({
  children,
  tone = "primary",
  animateKey,
  className,
}: {
  children: ReactNode;
  tone?: "primary" | "berry" | "sunny" | "mint" | "sky" | "card";
  animateKey?: string | number;
  className?: string;
}) {
  const tones = {
    primary: "bg-primary text-primary-foreground",
    berry: "bg-berry text-berry-foreground",
    sunny: "bg-sunny text-sunny-foreground",
    mint: "bg-mint text-mint-foreground",
    sky: "bg-sky text-sky-foreground",
    card: "bg-card text-card-foreground border border-border",
  } as const;

  return (
    <div
      key={animateKey}
      className={cn(
        "animate-pop-in relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-[1.75rem] px-6 py-10 text-center shadow-float",
        tones[tone],
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-current opacity-[0.08]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-current opacity-[0.06]"
      />
      <div className="relative flex flex-col items-center">{children}</div>
    </div>
  );
}

export function ChoiceButton({
  children,
  onClick,
  selected,
  disabled,
  tone = "card",
}: {
  children: ReactNode;
  onClick: () => void;
  selected?: boolean;
  disabled?: boolean;
  tone?: "card" | "primary" | "success";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "press min-h-14 w-full rounded-2xl border-2 px-4 py-3 text-base font-bold shadow-soft transition-all active:translate-y-px disabled:opacity-55 disabled:shadow-none",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : tone === "success"
            ? "border-success bg-success/10 text-foreground"
            : "border-border bg-card text-foreground hover:border-primary/50",
      )}
    >
      {children}
    </button>
  );
}

/** Small inline stat used above boards and prompts. */
export function StatPill({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: ReactNode;
  tone?: "muted" | "primary" | "success";
}) {
  const tones = {
    muted: "bg-muted text-muted-foreground",
    primary: "bg-primary/12 text-primary",
    success: "bg-success/15 text-success",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
        tones[tone],
      )}
    >
      <span className="opacity-70">{label}</span>
      <span className="tabular-nums">{value}</span>
    </span>
  );
}

export function GameSummary({
  players,
  scores,
  headline,
  detail,
  scored,
  onRematch,
  onExit,
  stats,
}: {
  players: [Player, Player];
  scores: [number, number];
  headline: string;
  detail?: string;
  scored: boolean;
  onRematch: () => void;
  onExit: () => void;
  stats?: { label: string; value: ReactNode }[];
}) {
  const max = Math.max(scores[0], scores[1], 1);
  return (
    <div className="animate-rise flex flex-1 flex-col justify-center gap-6">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-night px-6 py-8 text-center text-night-foreground shadow-float">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-primary opacity-30 blur-2xl"
        />
        <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground">
          {scored ? (
            <Crown className="h-8 w-8" aria-hidden />
          ) : (
            <Sparkles className="h-8 w-8" aria-hidden />
          )}
        </span>
        <h2 className="font-display relative mt-4 text-2xl font-bold text-balance-tight">
          {headline}
        </h2>
        {detail ? <p className="relative mt-2 text-sm text-night-muted">{detail}</p> : null}
      </div>

      {scored ? (
        <div className="space-y-2">
          {players.map((p, i) => {
            const leading = scores[i]! >= scores[1 - i]!;
            return (
              <div key={i} className="surface flex items-center gap-3 p-3">
                <AvatarBubble emoji={p.avatar} size="sm" ring={leading} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{p.name}</p>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-500",
                        leading ? "bg-primary" : "bg-muted-foreground/40",
                      )}
                      style={{ width: `${(scores[i]! / max) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="font-display text-2xl font-bold tabular-nums">{scores[i]}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {stats?.length ? (
        <div className="flex flex-wrap justify-center gap-2">
          {stats.map((s) => (
            <StatPill key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button size="lg" className="h-14 rounded-2xl text-base" onClick={onRematch}>
          <RotateCcw className="mr-1 h-5 w-5" aria-hidden /> Play again
        </Button>
        <Button size="lg" variant="ghost" className="h-12 rounded-2xl text-base" onClick={onExit}>
          Back to games
        </Button>
      </div>
    </div>
  );
}
