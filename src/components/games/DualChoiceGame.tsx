import { useState } from "react";
import { Check, Hourglass, X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { AvatarBubble, ScoreBar, TurnBanner } from "@/components/koupl/ui";
import {
  ChoiceButton,
  FeedbackBanner,
  GameFrame,
  GameIntro,
  GameSummary,
  PromptCard,
  StatPill,
} from "@/components/koupl/GameShell";
import { useSharedState } from "@/lib/koupl/useRoom";
import { HOW_TO } from "@/lib/koupl/games";
import { cn } from "@/lib/utils";
import { REACTIONS, useGameFx, useIntro, type GameProps } from "./shared";

export type DualRound = {
  key: string;
  prompt: ReactNode;
  options: { label: string; value: string; hint?: string }[];
};

type State = {
  i: number;
  a0: string | null;
  a1: string | null;
  score: number;
  streak: number;
  best: number;
  done: boolean;
  reaction: string | null;
};

const initial: State = {
  i: 0,
  a0: null,
  a1: null,
  score: 0,
  streak: 0,
  best: 0,
  done: false,
  reaction: null,
};

/**
 * Engine for every "both players secretly choose, then reveal" game.
 * Works identically on one shared device and across a live room.
 * `layout` gives each game its own board personality.
 */
export function DualChoiceGame({
  game,
  players,
  mySlot,
  room,
  onFinish,
  onExit,
  rounds,
  tone = "primary",
  matchCopy,
  summaryNoun = "matches",
  layout = "list",
  objective,
}: GameProps & {
  rounds: DualRound[];
  tone?: "primary" | "berry" | "sunny" | "mint" | "sky";
  matchCopy: { hit: string; miss: string };
  summaryNoun?: string;
  layout?: "list" | "split" | "confess" | "point";
  objective: string;
}) {
  const { value: s, patch, reset } = useSharedState<State>(initial, room, game.id);
  const [passed, setPassed] = useState(false);
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(s.i === 0 && s.a0 === null && s.a1 === null);

  const round = rounds[Math.min(s.i, rounds.length - 1)]!;
  const bothIn = s.a0 !== null && s.a1 !== null;
  const matched = bothIn && s.a0 === s.a1;
  const shownScore = s.score + (matched ? 1 : 0);

  // Whose input is being collected right now.
  const pendingSlot: 0 | 1 | null = s.a0 === null ? 0 : s.a1 === null ? 1 : null;
  const localTurn = mySlot === null;
  const myAnswer = mySlot === null ? null : mySlot === 0 ? s.a0 : s.a1;
  const canAnswer = localTurn ? pendingSlot !== null : myAnswer === null;
  const answeringSlot: 0 | 1 = localTurn ? ((pendingSlot ?? 0) as 0 | 1) : (mySlot as 0 | 1);

  function choose(value: string) {
    if (!canAnswer) return;
    const key = answeringSlot === 0 ? "a0" : "a1";
    const other = answeringSlot === 0 ? s.a1 : s.a0;
    if (other !== null) {
      if (other === value) fx.win();
      else fx.fail();
    } else {
      fx.tap();
    }
    patch({ [key]: value } as Partial<State>);
    setPassed(false);
  }

  function next() {
    const gained = matched ? 1 : 0;
    const streak = matched ? s.streak + 1 : 0;
    const best = Math.max(s.best, streak);
    fx.tap();
    if (s.i + 1 >= rounds.length) {
      patch({ score: s.score + gained, streak, best, done: true });
      return;
    }
    patch({
      i: s.i + 1,
      a0: null,
      a1: null,
      score: s.score + gained,
      streak,
      best,
      reaction: null,
    });
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective={objective}
          steps={HOW_TO[game.id] ?? []}
          onStart={startPlaying}
          startLabel={`Play ${rounds.length} rounds`}
        />
      </GameFrame>
    );
  }

  if (s.done) {
    const total = rounds.length;
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={[s.score, s.score]}
          headline={`${s.score} of ${total} ${summaryNoun}`}
          detail={
            s.score / total > 0.66
              ? "Alarmingly in sync. Slightly suspicious, honestly."
              : s.score / total > 0.33
                ? "A solid amount of overlap, plus enough friction to stay interesting."
                : "Opposites, confirmed. That's what makes it fun."
          }
          scored
          stats={[
            { label: "Best run", value: s.best },
            { label: "Rounds", value: total },
          ]}
          onRematch={() => {
            reset(initial);
            setPassed(false);
          }}
          onExit={() =>
            onFinish({
              summary: `${s.score}/${total} ${summaryNoun}`,
              myScore: s.score,
              theirScore: s.score,
            })
          }
        />
      </GameFrame>
    );
  }

  const waitingForPartner = !localTurn && myAnswer !== null && !bothIn;
  const showPassScreen = localTurn && !passed && s.a0 !== null && s.a1 === null;

  function renderOptions() {
    if (layout === "split") {
      return (
        <div className="grid grid-cols-2 gap-3">
          {round.options.map((o, i) => (
            <button
              key={o.value}
              type="button"
              disabled={!canAnswer}
              onClick={() => choose(o.value)}
              className={cn(
                "press relative flex min-h-36 flex-col items-center justify-center overflow-hidden rounded-[1.5rem] p-4 text-center shadow-float disabled:opacity-55",
                i === 0
                  ? "bg-mint text-mint-foreground"
                  : "bg-sky text-sky-foreground",
              )}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-current opacity-10"
              />
              <span className="font-display relative text-[11px] font-bold uppercase tracking-widest opacity-70">
                {i === 0 ? "This" : "That"}
              </span>
              <span className="font-display relative mt-1 text-lg font-bold leading-snug">
                {o.label}
              </span>
            </button>
          ))}
        </div>
      );
    }
    if (layout === "confess") {
      return (
        <div className="grid grid-cols-2 gap-3">
          {round.options.map((o, i) => (
            <button
              key={o.value}
              type="button"
              disabled={!canAnswer}
              onClick={() => choose(o.value)}
              className={cn(
                "press flex min-h-32 flex-col items-center justify-center gap-2 rounded-[1.5rem] border-2 p-4 text-center shadow-soft disabled:opacity-55",
                i === 0
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-12 w-12 place-items-center rounded-full",
                  i === 0 ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {i === 0 ? (
                  <Check className="h-6 w-6" aria-hidden />
                ) : (
                  <X className="h-6 w-6" aria-hidden />
                )}
              </span>
              <span className="font-display text-base font-bold text-foreground">{o.label}</span>
            </button>
          ))}
        </div>
      );
    }
    if (layout === "point") {
      return (
        <div className="grid grid-cols-2 gap-3">
          {round.options.map((o, i) => (
            <button
              key={o.value}
              type="button"
              disabled={!canAnswer}
              onClick={() => choose(o.value)}
              className="press surface flex min-h-36 flex-col items-center justify-center gap-2 p-4 text-center disabled:opacity-55"
            >
              <AvatarBubble emoji={players[i]!.avatar} size="lg" />
              <span className="font-display truncate text-base font-bold">{o.label}</span>
              <span className="text-[11px] font-bold text-muted-foreground">Tap to point</span>
            </button>
          ))}
        </div>
      );
    }
    return (
      <div className="grid gap-3">
        {round.options.map((o) => (
          <ChoiceButton key={o.value} onClick={() => choose(o.value)} disabled={!canAnswer}>
            {o.label}
          </ChoiceButton>
        ))}
      </div>
    );
  }

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      step={s.i}
      total={rounds.length}
      header={
        <ScoreBar
          players={players}
          scores={[shownScore, shownScore]}
          activeSlot={bothIn ? null : answeringSlot}
        />
      }
    >
      {s.streak >= 2 ? (
        <div className="mt-3 flex justify-center">
          <StatPill label="In sync" value={`${s.streak} in a row`} tone="success" />
        </div>
      ) : null}

      <div className="mt-3 flex flex-1 flex-col">
        <PromptCard tone={tone} animateKey={round.key} className="min-h-40 flex-1 py-7">
          <p className="font-display text-xl font-bold leading-snug text-balance-tight">
            {round.prompt}
          </p>
        </PromptCard>
      </div>

      <div className="mt-4 flex flex-col justify-end gap-3">
        {bothIn ? (
          <div className="animate-rise space-y-4">
            <FeedbackBanner tone={matched ? "success" : "muted"} animateKey={round.key}>
              {matched ? matchCopy.hit : matchCopy.miss}
            </FeedbackBanner>
            <div className="flex gap-3">
              {([0, 1] as const).map((slot) => {
                const answer = slot === 0 ? s.a0 : s.a1;
                const label = round.options.find((o) => o.value === answer)?.label ?? "—";
                return (
                  <div
                    key={slot}
                    className={cn(
                      "surface animate-flip-in flex-1 p-3 text-center",
                      matched && "ring-2 ring-success",
                    )}
                    style={{ animationDelay: `${slot * 110}ms` }}
                  >
                    <AvatarBubble emoji={players[slot].avatar} size="sm" />
                    <p className="mt-1 truncate text-[11px] font-bold text-muted-foreground">
                      {players[slot].name}
                    </p>
                    <p className="font-display mt-1 text-sm font-bold">{label}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-2">
              {REACTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-label={`React ${r}`}
                  aria-pressed={s.reaction === r}
                  onClick={() => {
                    fx.tap();
                    patch({ reaction: r });
                  }}
                  className={cn(
                    "press h-11 w-11 rounded-full border border-border bg-card text-xl",
                    s.reaction === r && "animate-pop-in border-primary bg-primary/10",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <Button size="lg" className="h-14 w-full rounded-2xl text-base" onClick={next}>
              {s.i + 1 >= rounds.length ? "See results" : "Next round"}
            </Button>
          </div>
        ) : waitingForPartner ? (
          <div className="surface animate-pop-in p-6 text-center" aria-live="polite">
            <Hourglass className="animate-float mx-auto h-9 w-9 text-primary" aria-hidden />
            <p className="mt-2 text-sm font-bold">Locked in.</p>
            <p className="text-sm text-muted-foreground">
              Waiting for {players[mySlot === 0 ? 1 : 0].name} to choose…
            </p>
          </div>
        ) : showPassScreen ? (
          <div className="surface animate-pop-in p-6 text-center">
            <AvatarBubble emoji={players[1].avatar} size="lg" />
            <p className="font-display mt-3 text-lg font-bold">Pass to {players[1].name}</p>
            <p className="mt-1 text-sm text-muted-foreground">No peeking at the first answer.</p>
            <Button
              size="lg"
              className="mt-4 h-14 w-full rounded-2xl text-base"
              onClick={() => {
                fx.tap();
                setPassed(true);
              }}
            >
              I'm ready
            </Button>
          </div>
        ) : (
          <>
            <TurnBanner player={players[answeringSlot]} action="choose in secret" />
            {renderOptions()}
          </>
        )}
      </div>
    </GameFrame>
  );
}
