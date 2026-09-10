import { RotateCcw, X } from "lucide-react";
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
import { AvatarBubble, ProgressDots } from "@/components/koupl/ui";
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
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-8 pt-5">
        <div className="mb-3 flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                aria-label="Leave game"
                className="press flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[calc(100%-2rem)] rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Leave this game?</AlertDialogTitle>
                <AlertDialogDescription>Your progress stays saved for one-phone games, so you can resume later.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="min-h-11 rounded-xl">Keep playing</AlertDialogCancel>
                <AlertDialogAction className="min-h-11 rounded-xl" onClick={onExit}>Leave game</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-base font-bold">
              <span aria-hidden>{game.emoji}</span> {game.title}
            </p>
            {typeof step === "number" && total ? (
              <p className="text-[11px] text-muted-foreground">
                {stepNoun} {Math.min(step + 1, total)} of {total}
              </p>
            ) : null}
          </div>
        </div>
        {typeof step === "number" && total ? (
          <ProgressDots total={total} index={step} />
        ) : null}
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
        "animate-pop-in flex min-h-52 flex-col items-center justify-center rounded-3xl px-6 py-10 text-center shadow-float",
        tones[tone],
        className,
      )}
    >
      {children}
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
        "press min-h-14 w-full rounded-2xl border-2 px-4 py-3 text-base font-bold transition-colors disabled:opacity-55",
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

export function GameSummary({
  players,
  scores,
  headline,
  detail,
  scored,
  onRematch,
  onExit,
}: {
  players: [Player, Player];
  scores: [number, number];
  headline: string;
  detail?: string;
  scored: boolean;
  onRematch: () => void;
  onExit: () => void;
}) {
  return (
    <div className="animate-rise flex flex-1 flex-col justify-center gap-6 text-center">
      <div>
        <span className="animate-float inline-block text-6xl" aria-hidden>
          🎉
        </span>
        <h2 className="font-display mt-3 text-2xl font-bold text-balance-tight">{headline}</h2>
        {detail ? <p className="mt-2 text-sm text-muted-foreground">{detail}</p> : null}
      </div>

      {scored ? (
        <div className="flex items-stretch gap-3">
          {players.map((p, i) => (
            <div
              key={i}
              className={cn(
                "surface flex flex-1 flex-col items-center gap-1 p-4",
                scores[i]! >= scores[1 - i]! && "ring-2 ring-primary",
              )}
            >
              <AvatarBubble emoji={p.avatar} size="md" />
              <p className="truncate text-xs font-bold">{p.name}</p>
              <p className="font-display text-3xl font-bold tabular-nums">{scores[i]}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button size="lg" className="h-14 rounded-2xl text-base" onClick={onRematch}>
          <RotateCcw className="mr-1 h-5 w-5" aria-hidden /> Play again
        </Button>
        <Button
          size="lg"
          variant="ghost"
          className="h-12 rounded-2xl text-base"
          onClick={onExit}
        >
          Back to games
        </Button>
      </div>
    </div>
  );
}
